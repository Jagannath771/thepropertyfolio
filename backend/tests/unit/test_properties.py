"""Unit tests for the Property model."""

from __future__ import annotations

import uuid
from datetime import date, datetime

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.property import Property
from app.models.user import User


@pytest.mark.asyncio
class TestPropertyModel:
    async def test_create_property_success(self, db_session: AsyncSession, owner_user: User):
        """Test successful creation of a property with minimal required fields."""
        prop = Property(
            owner_id=owner_user.id,
            title="Test Property",
            address="123 Test St",
            city="Testville",
            status="available"
        )
        db_session.add(prop)
        await db_session.flush()

        assert prop.id is not None
        assert isinstance(prop.id, uuid.UUID)
        assert prop.title == "Test Property"
        assert prop.status == "available"
        assert prop.is_featured is False
        assert prop.view_count == 0
        assert isinstance(prop.created_at, datetime)
        assert isinstance(prop.updated_at, datetime)

    async def test_create_property_missing_owner(self, db_session: AsyncSession):
        """Test creating a property without an owner_id raises IntegrityError."""
        prop = Property(
            title="Test Property",
            address="123 Test St",
            city="Testville",
        )
        db_session.add(prop)
        
        with pytest.raises(IntegrityError):
            await db_session.flush()

    async def test_property_full_fields(self, db_session: AsyncSession, owner_user: User):
        """Test creation with all optional fields filled out."""
        avail_date = date(2026, 1, 1)
        prop = Property(
            owner_id=owner_user.id,
            title="Luxury Condo",
            description="A very nice place",
            address="456 Rich Ave",
            city="Metropolis",
            state="NY",
            zip_code="10001",
            latitude=40.7128,
            longitude=-74.0060,
            property_type="condo",
            bedrooms=3,
            bathrooms=2.5,
            square_feet=1500,
            monthly_rent=4000.00,
            deposit=4000.00,
            available_date=avail_date,
            status="coming_soon",
            amenities=["pool", "gym"],
            pet_policy="cats only",
            images=["https://example.com/image1.jpg"],
            is_featured=True,
        )
        db_session.add(prop)
        await db_session.flush()

        assert prop.latitude == 40.7128
        assert prop.bedrooms == 3
        assert prop.bathrooms == 2.5
        assert float(prop.monthly_rent) == 4000.0
        assert prop.available_date == avail_date
        assert "pool" in prop.amenities
        assert len(prop.images) == 1
        assert prop.is_featured is True

    async def test_property_repr(self, db_session: AsyncSession, owner_user: User):
        """Test the __repr__ method of the Property model."""
        prop = Property(
            owner_id=owner_user.id,
            title="Repr Property",
            address="789 Repr St",
            status="leased"
        )
        db_session.add(prop)
        await db_session.flush()

        repr_str = repr(prop)
        assert repr_str == f"<Property id={prop.id} title=Repr Property status=leased>"
