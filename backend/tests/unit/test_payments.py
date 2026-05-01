"""Unit tests for the Payment model."""

from __future__ import annotations

import uuid
from datetime import date, datetime

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment
from app.models.property import Property
from app.models.user import User


@pytest.mark.asyncio
class TestPaymentModel:
    async def test_create_payment_success(self, db_session: AsyncSession, tenant_user: User):
        """Test successful creation of a payment with minimal required fields."""
        payment = Payment(
            tenant_id=tenant_user.id,
            amount=1500.00,
            payment_type="rent",
            status="pending"
        )
        db_session.add(payment)
        await db_session.flush()

        assert payment.id is not None
        assert isinstance(payment.id, uuid.UUID)
        assert payment.tenant_id == tenant_user.id
        assert payment.property_id is None
        assert float(payment.amount) == 1500.0
        assert payment.payment_type == "rent"
        assert payment.status == "pending"
        assert isinstance(payment.created_at, datetime)

    async def test_create_payment_missing_tenant(self, db_session: AsyncSession):
        """Test creating a payment without tenant_id raises IntegrityError."""
        payment = Payment(
            amount=1500.00,
            payment_type="rent"
        )
        db_session.add(payment)
        
        with pytest.raises(IntegrityError):
            await db_session.flush()

    async def test_payment_full_fields(
        self, db_session: AsyncSession, tenant_user: User, owner_user: User
    ):
        """Test creation with all optional fields filled out."""
        prop = Property(
            owner_id=owner_user.id,
            title="Test Property",
            address="123 Test St",
        )
        db_session.add(prop)
        await db_session.flush()

        due = date(2026, 5, 1)
        paid = datetime.now()

        payment = Payment(
            tenant_id=tenant_user.id,
            property_id=prop.id,
            amount=2000.50,
            payment_type="deposit",
            payment_method="card",
            stripe_payment_id="pi_1234567890",
            status="completed",
            due_date=due,
            paid_at=paid,
        )
        db_session.add(payment)
        await db_session.flush()

        assert payment.property_id == prop.id
        assert float(payment.amount) == 2000.50
        assert payment.payment_type == "deposit"
        assert payment.payment_method == "card"
        assert payment.stripe_payment_id == "pi_1234567890"
        assert payment.status == "completed"
        assert payment.due_date == due
        assert payment.paid_at == paid

    async def test_payment_repr(self, db_session: AsyncSession, tenant_user: User):
        """Test the __repr__ method of the Payment model."""
        payment = Payment(
            tenant_id=tenant_user.id,
            amount=100.0,
            payment_type="late_fee",
            status="refunded"
        )
        db_session.add(payment)
        await db_session.flush()

        repr_str = repr(payment)
        assert repr_str == f"<Payment id={payment.id} amount=100.00 status=refunded>"
