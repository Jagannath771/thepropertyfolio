"""Application ORM model."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Text, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Application(Base):
    """Tenant application for a property."""

    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
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
    status: Mapped[str] = mapped_column(
        String(30), default="pending", nullable=False, index=True
    )  # pending | under_review | background_check | approved | denied | withdrawn
    personal_info: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    employment_info: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    rental_history: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    references: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    document_urls: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    e_signature: Mapped[str | None] = mapped_column(Text, nullable=True)
    background_check_consent: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    owner_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ── Relationships ─────────────────────────────────────────────────────
    property_listing: Mapped["Property"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Property", back_populates="applications"
    )
    tenant: Mapped["User"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "User", back_populates="applications", foreign_keys=[tenant_id]
    )

    def __repr__(self) -> str:
        return f"<Application id={self.id} status={self.status}>"
