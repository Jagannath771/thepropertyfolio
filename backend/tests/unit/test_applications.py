"""Unit tests for the Application model."""

from __future__ import annotations

import uuid
from datetime import datetime

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application
from app.models.property import Property
from app.models.user import User


@pytest.mark.asyncio
class TestApplicationModel:
    async def test_create_application_success(self, db_session: AsyncSession, tenant_user: User):
        """Test successful creation of an application with minimal required fields."""
        app = Application(
            tenant_id=tenant_user.id,
            status="pending"
        )
        db_session.add(app)
        await db_session.flush()

        assert app.id is not None
        assert isinstance(app.id, uuid.UUID)
        assert app.tenant_id == tenant_user.id
        assert app.status == "pending"
        assert app.background_check_consent is False
        assert app.document_urls == []
        assert isinstance(app.created_at, datetime)

    async def test_create_application_missing_tenant(self, db_session: AsyncSession):
        """Test creating an application without tenant_id raises IntegrityError."""
        app = Application(
            status="pending"
        )
        db_session.add(app)
        
        with pytest.raises(IntegrityError):
            await db_session.flush()

    async def test_application_full_fields(
        self, db_session: AsyncSession, tenant_user: User, owner_user: User
    ):
        """Test creation with all optional fields filled out."""
        # Create a property first
        prop = Property(
            owner_id=owner_user.id,
            title="Test Property for App",
            address="123 Test St",
        )
        db_session.add(prop)
        await db_session.flush()

        sub_time = datetime.now()
        rev_time = datetime.now()

        app = Application(
            property_id=prop.id,
            tenant_id=tenant_user.id,
            status="approved",
            personal_info={"name": "John Doe", "ssn": "000-00-0000"},
            employment_info={"employer": "Tech Corp", "income": 5000},
            rental_history=[{"landlord": "Jane Doe", "phone": "555-0101"}],
            references=[{"name": "Friend", "relationship": "Friend"}],
            document_urls=["https://example.com/doc1.pdf"],
            e_signature="John Doe",
            background_check_consent=True,
            owner_notes="Looks good",
            submitted_at=sub_time,
            reviewed_at=rev_time,
        )
        db_session.add(app)
        await db_session.flush()

        assert app.property_id == prop.id
        assert app.personal_info["name"] == "John Doe"  # type: ignore
        assert app.employment_info["income"] == 5000  # type: ignore
        assert len(app.rental_history) == 1  # type: ignore
        assert len(app.references) == 1  # type: ignore
        assert "doc1.pdf" in app.document_urls[0]
        assert app.e_signature == "John Doe"
        assert app.background_check_consent is True
        assert app.owner_notes == "Looks good"
        assert app.submitted_at == sub_time
        assert app.reviewed_at == rev_time

    async def test_application_repr(self, db_session: AsyncSession, tenant_user: User):
        """Test the __repr__ method of the Application model."""
        app = Application(
            tenant_id=tenant_user.id,
            status="under_review"
        )
        db_session.add(app)
        await db_session.flush()

        repr_str = repr(app)
        assert repr_str == f"<Application id={app.id} status=under_review>"
