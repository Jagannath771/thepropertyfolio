"""Owner profile and portfolio KPI router."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import require_owner
from app.models.maintenance import MaintenanceRequest
from app.models.property import Property
from app.models.user import User

router = APIRouter()


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
