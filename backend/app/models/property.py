"""Property ORM model."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey

from app.database import Base


class Property(Base):
    """Rental property listing."""

    __tablename__ = "properties"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    state: Mapped[str | None] = mapped_column(String(50), nullable=True)
    zip_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    latitude: Mapped[float | None] = mapped_column(nullable=True)
    longitude: Mapped[float | None] = mapped_column(nullable=True)
    property_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # house | apartment | condo | commercial | townhome
    bedrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bathrooms: Mapped[float | None] = mapped_column(Numeric(3, 1), nullable=True)
    square_feet: Mapped[int | None] = mapped_column(Integer, nullable=True)
    monthly_rent: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True, index=True)
    deposit: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    available_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="available", nullable=False, index=True
    )  # available | coming_soon | leased | archived
    amenities: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    pet_policy: Mapped[str | None] = mapped_column(String(50), nullable=True)
    images: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ── Relationships ─────────────────────────────────────────────────────
    owner: Mapped["User"] = relationship("User", back_populates="properties")  # type: ignore[name-defined]  # noqa: F821
    applications: Mapped[list["Application"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Application", back_populates="property_listing"
    )
    maintenance_requests: Mapped[list["MaintenanceRequest"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "MaintenanceRequest", back_populates="property_listing"
    )
    payments: Mapped[list["Payment"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Payment", back_populates="property_listing"
    )

    def __repr__(self) -> str:
        return f"<Property id={self.id} title={self.title} status={self.status}>"
