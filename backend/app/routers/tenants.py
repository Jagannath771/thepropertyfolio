"""Tenant profile router."""

from __future__ import annotations

import structlog
from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import require_tenant
from app.models.tenant_document import TenantDocument
from app.models.user import User
from app.services import storage_service

logger = structlog.get_logger(__name__)
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


@router.get("/documents")
async def list_tenant_documents(
    current_user: Annotated[User, Depends(require_tenant)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """List portal documents for the tenant with optional presigned download URLs."""
    result = await db.execute(
        select(TenantDocument)
        .where(TenantDocument.tenant_id == current_user.id)
        .order_by(TenantDocument.created_at.desc())
    )
    rows = result.scalars().all()
    items: list[dict[str, Any]] = []
    s3_ok = storage_service.s3_credentials_configured()
    for d in rows:
        download_url: str | None = None
        if s3_ok:
            try:
                download_url = storage_service.generate_presigned_get_url(d.object_key)
            except Exception as e:  # noqa: BLE001 — return row without URL
                logger.warning("presign_get_failed", doc_id=str(d.id), error=str(e))
        items.append(
            {
                "id": str(d.id),
                "title": d.title,
                "byte_size": d.byte_size,
                "created_at": d.created_at.isoformat(),
                "download_url": download_url,
            }
        )
    return {"items": items}
