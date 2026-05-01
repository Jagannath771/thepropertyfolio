"""Applications router — tenant applications lifecycle."""

from __future__ import annotations

import uuid
from typing import Annotated, Any

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_verified_user, require_tenant, require_owner
from app.models.application import Application
from app.models.property import Property
from app.models.user import User
from app.services import audit_service, email_service

logger = structlog.get_logger(__name__)
router = APIRouter()


class ApplicationSubmit(BaseModel):
    property_id: uuid.UUID
    personal_info: dict | None = None
    employment_info: dict | None = None
    rental_history: list | None = None
    references: list | None = None
    document_urls: list[str] = []
    e_signature: str | None = None
    background_check_consent: bool = False


class ApplicationStatusUpdate(BaseModel):
    status: str
    owner_notes: str | None = None


def _app_to_dict(a: Application) -> dict[str, Any]:
    return {
        "id": str(a.id),
        "property_id": str(a.property_id) if a.property_id else None,
        "tenant_id": str(a.tenant_id),
        "status": a.status,
        "personal_info": a.personal_info,
        "employment_info": a.employment_info,
        "rental_history": a.rental_history,
        "references": a.references,
        "document_urls": a.document_urls or [],
        "background_check_consent": a.background_check_consent,
        "owner_notes": a.owner_notes,
        "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
        "reviewed_at": a.reviewed_at.isoformat() if a.reviewed_at else None,
        "created_at": a.created_at.isoformat(),
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_application(
    body: ApplicationSubmit,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(require_tenant)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Submit a new rental application (tenant only)."""
    # Verify property exists and is available
    prop_result = await db.execute(
        select(Property).where(Property.id == body.property_id)
    )
    prop = prop_result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")
    if prop.status not in ("available", "coming_soon"):
        raise HTTPException(status_code=400, detail="This property is not accepting applications.")

    # Check for duplicate application
    existing = await db.execute(
        select(Application).where(
            Application.property_id == body.property_id,
            Application.tenant_id == current_user.id,
            Application.status.not_in(["denied", "withdrawn"]),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="You already have an active application for this property.")

    from datetime import datetime, timezone
    application = Application(
        property_id=body.property_id,
        tenant_id=current_user.id,
        personal_info=body.personal_info,
        employment_info=body.employment_info,
        rental_history=body.rental_history,
        references=body.references,
        document_urls=body.document_urls,
        e_signature=body.e_signature,
        background_check_consent=body.background_check_consent,
        status="pending",
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(application)
    await db.flush()

    background_tasks.add_task(
        email_service.send_application_confirmation,
        current_user.email,
        current_user.full_name,
        prop.address,
    )

    await audit_service.log_event(
        db, "application.submitted",
        user_id=current_user.id,
        resource_type="application",
        resource_id=application.id,
    )

    return _app_to_dict(application)


@router.get("")
async def list_applications(
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """List applications — tenants see own; owners see applications on their properties."""
    if current_user.role == "tenant":
        result = await db.execute(
            select(Application).where(Application.tenant_id == current_user.id)
            .order_by(Application.created_at.desc())
        )
    elif current_user.role == "owner":
        # Get owner's property IDs first
        prop_result = await db.execute(
            select(Property.id).where(Property.owner_id == current_user.id)
        )
        property_ids = [row[0] for row in prop_result.all()]
        result = await db.execute(
            select(Application)
            .where(Application.property_id.in_(property_ids))
            .order_by(Application.created_at.desc())
        )
    else:
        result = await db.execute(
            select(Application).order_by(Application.created_at.desc())
        )

    return [_app_to_dict(a) for a in result.scalars().all()]


@router.get("/{application_id}")
async def get_application(
    application_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Get a single application by ID."""
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    # Access control
    if current_user.role == "tenant" and app.tenant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    return _app_to_dict(app)


@router.patch("/{application_id}")
async def update_application_status(
    application_id: uuid.UUID,
    body: ApplicationStatusUpdate,
    current_user: Annotated[User, Depends(require_owner)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Update application status (owner only)."""
    valid_statuses = {"pending", "under_review", "background_check", "approved", "denied", "withdrawn"}
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    result = await db.execute(select(Application).where(Application.id == application_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    # Verify owner owns the property
    if app.property_id:
        prop_result = await db.execute(select(Property).where(Property.id == app.property_id))
        prop = prop_result.scalar_one_or_none()
        if prop and prop.owner_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="You don't own this property.")

    from datetime import datetime, timezone
    app.status = body.status
    if body.owner_notes:
        app.owner_notes = body.owner_notes
    app.reviewed_at = datetime.now(timezone.utc)
    await db.flush()

    await audit_service.log_event(
        db, f"application.{body.status}",
        user_id=current_user.id,
        resource_type="application",
        resource_id=app.id,
    )

    return _app_to_dict(app)
