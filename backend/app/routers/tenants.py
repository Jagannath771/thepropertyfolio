"""Tenant profile router."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends

from app.middleware.auth_middleware import require_tenant
from app.models.user import User

router = APIRouter()


@router.get("/me")
async def get_tenant_profile(
    current_user: Annotated[User, Depends(require_tenant)],
) -> dict[str, Any]:
    """Return the current tenant's profile."""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at.isoformat(),
    }
