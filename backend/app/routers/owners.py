"""Owner profile and portfolio KPI router."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import require_owner
from app.models.maintenance import MaintenanceRequest
from app.models.property import Property
from app.models.user import User

router = APIRouter()


def _property_to_dict(p: Property) -> dict[str, Any]:
    """Serialize a Property ORM object. Duplicated intentionally to avoid a
    circular import from `app.routers.properties`."""
    return {
        "id": str(p.id),
        "owner_id": str(p.owner_id),
        "title": p.title,
        "description": p.description,
        "address": p.address,
        "city": p.city,
        "state": p.state,
        "zip_code": p.zip_code,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "property_type": p.property_type,
        "bedrooms": p.bedrooms,
        "bathrooms": float(p.bathrooms) if p.bathrooms else None,
        "square_feet": p.square_feet,
        "monthly_rent": float(p.monthly_rent) if p.monthly_rent else None,
        "deposit": float(p.deposit) if p.deposit else None,
        "available_date": p.available_date.isoformat() if p.available_date else None,
        "status": p.status,
        "amenities": p.amenities or [],
        "pet_policy": p.pet_policy,
        "images": p.images or [],
        "is_featured": p.is_featured,
        "view_count": p.view_count,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat(),
    }


@router.get("/me")
async def get_owner_profile(
    current_user: Annotated[User, Depends(require_owner)],
) -> dict[str, Any]:
    """Return the current owner's profile."""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role,
        "is_verified": current_user.is_verified,
        "totp_enabled": current_user.totp_secret is not None,
        "created_at": current_user.created_at.isoformat(),
    }


@router.get("/portfolio")
async def get_portfolio_kpis(
    current_user: Annotated[User, Depends(require_owner)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Return portfolio KPI summary for the owner dashboard."""
    props_result = await db.execute(
        select(Property).where(
            Property.owner_id == current_user.id,
            Property.status != "archived",
        )
    )
    properties = props_result.scalars().all()

    total = len(properties)
    occupied = sum(1 for p in properties if p.status == "leased")
    monthly_revenue = sum(
        float(p.monthly_rent or 0) for p in properties if p.status == "leased"
    )
    prop_ids = [p.id for p in properties]

    open_tickets = 0
    if prop_ids:
        maint_result = await db.execute(
            select(func.count(MaintenanceRequest.id)).where(
                MaintenanceRequest.property_id.in_(prop_ids),
                MaintenanceRequest.status == "open",
            )
        )
        open_tickets = maint_result.scalar_one() or 0

    return {
        "total_units": total,
        "occupied_units": occupied,
        "occupancy_rate": round((occupied / total * 100) if total > 0 else 0, 1),
        "monthly_revenue": monthly_revenue,
        "open_maintenance_tickets": open_tickets,
        "available_units": sum(1 for p in properties if p.status == "available"),
    }


@router.get("/properties")
async def list_owner_properties(
    current_user: Annotated[User, Depends(require_owner)],
    db: AsyncSession = Depends(get_db),
    include_archived: bool = Query(
        default=False,
        description="If true, include archived listings in the response.",
    ),
) -> dict[str, Any]:
    """Return the current owner's full property catalog (scoped by owner_id)."""
    query = select(Property).where(Property.owner_id == current_user.id)
    if not include_archived:
        query = query.where(Property.status != "archived")
    query = query.order_by(Property.created_at.desc())

    result = await db.execute(query)
    properties = result.scalars().all()

    return {
        "items": [_property_to_dict(p) for p in properties],
        "total": len(properties),
    }
