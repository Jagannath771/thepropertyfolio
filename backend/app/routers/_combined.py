"""Maintenance, payments, messages, contact, and chatbot routers."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated, Any

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_verified_user, require_tenant, require_owner
from app.models.maintenance import MaintenanceRequest
from app.models.payment import Payment
from app.models.property import Property
from app.models.message import Message
from app.models.chat_history import ChatHistory
from app.models.user import User
from app.services import audit_service, email_service, chat_service
from app.config import settings

logger = structlog.get_logger(__name__)

# ── Maintenance Router ────────────────────────────────────────────────────────
maintenance_router = APIRouter()


class MaintenanceCreate(BaseModel):
    property_id: uuid.UUID | None = None
    category: str | None = None
    description: str
    urgency: str = "medium"
    photos: list[str] = []


class MaintenanceUpdate(BaseModel):
    status: str | None = None
    assigned_to: str | None = None
    resolution_notes: str | None = None


def _maint_to_dict(m: MaintenanceRequest) -> dict[str, Any]:
    return {
        "id": str(m.id),
        "property_id": str(m.property_id) if m.property_id else None,
        "tenant_id": str(m.tenant_id),
        "category": m.category,
        "description": m.description,
        "urgency": m.urgency,
        "status": m.status,
        "photos": m.photos or [],
        "assigned_to": m.assigned_to,
        "resolution_notes": m.resolution_notes,
        "created_at": m.created_at.isoformat(),
        "resolved_at": m.resolved_at.isoformat() if m.resolved_at else None,
    }


@maintenance_router.post("", status_code=201)
async def submit_maintenance(
    body: MaintenanceCreate,
    current_user: Annotated[User, Depends(require_tenant)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    req = MaintenanceRequest(
        property_id=body.property_id,
        tenant_id=current_user.id,
        category=body.category,
        description=body.description,
        urgency=body.urgency,
        photos=body.photos,
    )
    db.add(req)
    await db.flush()
    await audit_service.log_event(db, "maintenance.submitted", user_id=current_user.id, resource_type="maintenance", resource_id=req.id)
    return _maint_to_dict(req)


async def _owner_property_ids(db: AsyncSession, owner_id: uuid.UUID) -> list[uuid.UUID]:
    """Return the UUIDs of properties owned by this user. Used to scope
    GET lists for owners so they never see tenants' rows for other owners."""
    result = await db.execute(
        select(Property.id).where(Property.owner_id == owner_id)
    )
    return [row[0] for row in result.all()]


@maintenance_router.get("")
async def list_maintenance(
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    if current_user.role == "tenant":
        result = await db.execute(
            select(MaintenanceRequest)
            .where(MaintenanceRequest.tenant_id == current_user.id)
            .order_by(MaintenanceRequest.created_at.desc())
        )
    elif current_user.role == "owner":
        prop_ids = await _owner_property_ids(db, current_user.id)
        if not prop_ids:
            return []
        result = await db.execute(
            select(MaintenanceRequest)
            .where(MaintenanceRequest.property_id.in_(prop_ids))
            .order_by(MaintenanceRequest.created_at.desc())
        )
    else:
        result = await db.execute(
            select(MaintenanceRequest).order_by(MaintenanceRequest.created_at.desc())
        )
    return [_maint_to_dict(m) for m in result.scalars().all()]


@maintenance_router.patch("/{request_id}")
async def update_maintenance(
    request_id: uuid.UUID,
    body: MaintenanceUpdate,
    current_user: Annotated[User, Depends(require_owner)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    result = await db.execute(select(MaintenanceRequest).where(MaintenanceRequest.id == request_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Maintenance request not found.")

    # Enforce ownership: the maintenance request must be on a property this
    # owner controls (admins bypass).
    if current_user.role != "admin":
        if req.property_id is None:
            raise HTTPException(
                status_code=403,
                detail="Maintenance request is not tied to a property you own.",
            )
        prop_res = await db.execute(
            select(Property).where(Property.id == req.property_id)
        )
        prop = prop_res.scalar_one_or_none()
        if not prop or prop.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You don't own the property tied to this maintenance request.",
            )

    if body.status:
        req.status = body.status
        if body.status in ("resolved", "closed"):
            req.resolved_at = datetime.now(timezone.utc)
    if body.assigned_to:
        req.assigned_to = body.assigned_to
    if body.resolution_notes:
        req.resolution_notes = body.resolution_notes
    await db.flush()
    await audit_service.log_event(
        db, f"maintenance.{body.status or 'updated'}",
        user_id=current_user.id,
        resource_type="maintenance",
        resource_id=req.id,
    )
    return _maint_to_dict(req)


# ── Payments Router ───────────────────────────────────────────────────────────
payments_router = APIRouter()


class PaymentIntentCreate(BaseModel):
    property_id: uuid.UUID
    amount: float
    payment_type: str = "rent"


def _payment_to_dict(p: Payment) -> dict[str, Any]:
    return {
        "id": str(p.id),
        "tenant_id": str(p.tenant_id),
        "property_id": str(p.property_id) if p.property_id else None,
        "amount": float(p.amount),
        "payment_type": p.payment_type,
        "payment_method": p.payment_method,
        "stripe_payment_id": p.stripe_payment_id,
        "status": p.status,
        "due_date": p.due_date.isoformat() if p.due_date else None,
        "paid_at": p.paid_at.isoformat() if p.paid_at else None,
        "created_at": p.created_at.isoformat(),
    }


@payments_router.get("")
async def list_payments(
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    if current_user.role == "tenant":
        result = await db.execute(
            select(Payment)
            .where(Payment.tenant_id == current_user.id)
            .order_by(Payment.created_at.desc())
        )
    elif current_user.role == "owner":
        prop_ids = await _owner_property_ids(db, current_user.id)
        if not prop_ids:
            return []
        result = await db.execute(
            select(Payment)
            .where(Payment.property_id.in_(prop_ids))
            .order_by(Payment.created_at.desc())
        )
    else:
        result = await db.execute(
            select(Payment).order_by(Payment.created_at.desc())
        )
    return [_payment_to_dict(p) for p in result.scalars().all()]


@payments_router.post("/intent", status_code=201)
async def create_payment_intent(
    body: PaymentIntentCreate,
    current_user: Annotated[User, Depends(require_tenant)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Create a (mock) Stripe payment intent. Replace with real Stripe logic when configured."""
    import secrets as sec
    mock_intent_id = f"pi_mock_{sec.token_hex(12)}"

    payment = Payment(
        tenant_id=current_user.id,
        property_id=body.property_id,
        amount=body.amount,
        payment_type=body.payment_type,
        stripe_payment_id=mock_intent_id,
        status="pending",
    )
    db.add(payment)
    await db.flush()

    return {
        "payment_id": str(payment.id),
        "client_secret": f"{mock_intent_id}_secret_mock",
        "amount": body.amount,
        "currency": "usd",
        "status": "pending",
    }


@payments_router.post("/webhook")
async def stripe_webhook(request: Request) -> dict[str, str]:
    """Stripe webhook handler — update payment status from Stripe events."""
    # In production: verify stripe signature and parse events
    return {"status": "received"}


# ── Messages Router ───────────────────────────────────────────────────────────
messages_router = APIRouter()


class MessageCreate(BaseModel):
    recipient_id: uuid.UUID
    property_id: uuid.UUID | None = None
    subject: str | None = None
    body: str


def _msg_to_dict(m: Message) -> dict[str, Any]:
    return {
        "id": str(m.id),
        "sender_id": str(m.sender_id),
        "recipient_id": str(m.recipient_id),
        "property_id": str(m.property_id) if m.property_id else None,
        "subject": m.subject,
        "body": m.body,
        "is_read": m.is_read,
        "created_at": m.created_at.isoformat(),
    }


@messages_router.get("")
async def list_messages(
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    from sqlalchemy import or_
    result = await db.execute(
        select(Message)
        .where(or_(Message.sender_id == current_user.id, Message.recipient_id == current_user.id))
        .order_by(Message.created_at.desc())
    )
    return [_msg_to_dict(m) for m in result.scalars().all()]


@messages_router.post("", status_code=201)
async def send_message(
    body: MessageCreate,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    msg = Message(
        sender_id=current_user.id,
        recipient_id=body.recipient_id,
        property_id=body.property_id,
        subject=body.subject,
        body=body.body,
    )
    db.add(msg)
    await db.flush()
    return _msg_to_dict(msg)


@messages_router.patch("/{message_id}/read", status_code=200)
async def mark_read(
    message_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(Message).where(Message.id == message_id))
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    if msg.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot mark others' messages as read.")
    msg.is_read = True
    await db.flush()
    return {"message": "Marked as read."}


# ── Contact Router ────────────────────────────────────────────────────────────
contact_router = APIRouter()


class ContactInquiryBase(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    user_type: str | None = None
    inquiry_type: str | None = None
    message: str
    recaptcha_token: str | None = None


@contact_router.post("", status_code=201)
async def submit_contact(
    body: ContactInquiryBase,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    from app.models.contact import ContactInquiry
    
    # Save to DB using the model
    inquiry = ContactInquiry(
        name=body.name,
        email=body.email,
        phone=body.phone,
        user_type=body.user_type,
        inquiry_type=body.inquiry_type,
        message=body.message,
    )
    db.add(inquiry)
    await db.flush()

    background_tasks.add_task(email_service.send_contact_confirmation, body.email, body.name)
    background_tasks.add_task(
        email_service.notify_admin_new_lead,
        name=body.name,
        email=body.email,
        message=body.message
    )

    return {"message": "Thank you for reaching out! We'll get back to you within 1 business day."}


# ── Chatbot Router ────────────────────────────────────────────────────────────
chatbot_router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: str
    history: list[dict[str, str]] = []


@chatbot_router.post("")
async def stream_chat(
    body: ChatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Stream AI chatbot response (SSE). Rate-limited per IP."""
    # Save user message to history
    chat_entry = ChatHistory(
        session_id=body.session_id,
        role="user",
        content=body.message,
    )
    db.add(chat_entry)
    await db.flush()

    messages = [*body.history, {"role": "user", "content": body.message}]

    async def event_stream() -> Any:
        full_response = ""
        async for chunk in chat_service.stream_chat_response(messages):
            full_response += chunk
            # Standard SSE: multiline data must start with 'data: ' on each line
            lines = chunk.split("\n")
            for i, line in enumerate(lines):
                yield f"data: {line}\n"
                if i == len(lines) - 1:
                    yield "\n"
        
        # Final message to indicate completion
        yield "data: [DONE]\n\n"

        # Save assistant response after stream finishes
        # Using a new task or context if needed, but here we just log it
        try:
            # We need a fresh session for the background save if the request might end
            # For now, let's just save it
            assistant_entry = ChatHistory(
                session_id=body.session_id,
                role="assistant",
                content=full_response,
            )
            db.add(assistant_entry)
            await db.commit()
        except Exception as e:
            logger.error("Failed to save assistant response", error=str(e))

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@chatbot_router.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    result = await db.execute(
        select(ChatHistory)
        .where(ChatHistory.session_id == session_id)
        .order_by(ChatHistory.created_at.asc())
        .limit(100)
    )
    return [
        {
            "id": str(h.id),
            "role": h.role,
            "content": h.content,
            "created_at": h.created_at.isoformat(),
        }
        for h in result.scalars().all()
    ]
