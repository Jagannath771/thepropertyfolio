"""Audit service — structured event logging to the audit_logs table."""

from __future__ import annotations

import uuid
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog

logger = structlog.get_logger(__name__)


async def log_event(
    db: AsyncSession,
    action: str,
    *,
    user_id: uuid.UUID | None = None,
    resource_type: str | None = None,
    resource_id: uuid.UUID | None = None,
    metadata: dict[str, Any] | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> None:
    """
    Write an audit log entry to the database.

    Args:
        db: Async database session.
        action: Event identifier (e.g., 'user.login', 'property.created').
        user_id: UUID of the acting user (None for anonymous).
        resource_type: Type of resource affected (e.g., 'property', 'application').
        resource_id: UUID of the affected resource.
        metadata: Additional structured data to log.
        ip_address: Client IP address.
        user_agent: Client user agent string.
    """
    try:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            event_metadata=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(log_entry)
        # Don't flush — let the caller's transaction handle commit

        logger.info(
            "Audit event",
            action=action,
            user_id=str(user_id) if user_id else None,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
        )
    except Exception as e:
        # Never let audit logging break the main request
        logger.error("Failed to write audit log", action=action, error=str(e))
