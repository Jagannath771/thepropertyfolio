"""Maintenance request ORM model."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MaintenanceRequest(Base):
    """Tenant-submitted maintenance request for a property."""

    __tablename__ = "maintenance_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    property_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    urgency: Mapped[str] = mapped_column(
        String(20), default="medium", nullable=False
    )  # low | medium | high | emergency
    status: Mapped[str] = mapped_column(
        String(30), default="open", nullable=False, index=True
    )  # open | in_progress | scheduled | resolved | closed
    photos: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    assigned_to: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────
    property_listing: Mapped["Property"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Property", back_populates="maintenance_requests"
    )
    tenant: Mapped["User"] = relationship("User", back_populates="maintenance_requests")  # type: ignore[name-defined]  # noqa: F821

    def __repr__(self) -> str:
        return f"<MaintenanceRequest id={self.id} status={self.status} urgency={self.urgency}>"
