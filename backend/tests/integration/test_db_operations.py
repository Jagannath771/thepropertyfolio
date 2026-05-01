"""Integration tests for database cascading and constraints."""

from __future__ import annotations

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application
from app.models.payment import Payment
from app.models.property import Property
from app.models.user import User


@pytest.mark.asyncio
class TestDatabaseOperations:
    async def test_cascade_delete_user_deletes_property(
        self, db_session: AsyncSession, owner_user: User
    ):
        """Test that deleting an owner cascade-deletes their properties."""
        prop = Property(
            owner_id=owner_user.id,
            title="Cascade Prop",
            address="Cascade St",
        )
        db_session.add(prop)
        await db_session.flush()

        prop_id = prop.id

        # Delete owner
        await db_session.delete(owner_user)
        await db_session.flush()

        # Check property is deleted
        result = await db_session.execute(select(Property).where(Property.id == prop_id))
        assert result.scalar_one_or_none() is None

    async def test_cascade_delete_user_deletes_application(
        self, db_session: AsyncSession, tenant_user: User
    ):
        """Test that deleting a tenant cascade-deletes their applications."""
        app = Application(
            tenant_id=tenant_user.id,
        )
        db_session.add(app)
        await db_session.flush()

        app_id = app.id

        # Delete tenant
        await db_session.delete(tenant_user)
        await db_session.flush()

        # Check app is deleted
        result = await db_session.execute(select(Application).where(Application.id == app_id))
        assert result.scalar_one_or_none() is None

    async def test_cascade_delete_user_deletes_payment(
        self, db_session: AsyncSession, tenant_user: User
    ):
        """Test that deleting a tenant cascade-deletes their payments."""
        payment = Payment(
            tenant_id=tenant_user.id,
            amount=500.0,
            payment_type="rent",
        )
        db_session.add(payment)
        await db_session.flush()

        payment_id = payment.id

        # Delete tenant
        await db_session.delete(tenant_user)
        await db_session.flush()

        # Check payment is deleted
        result = await db_session.execute(select(Payment).where(Payment.id == payment_id))
        assert result.scalar_one_or_none() is None

    async def test_delete_property_nullifies_application_property_id(
        self, db_session: AsyncSession, owner_user: User, tenant_user: User
    ):
        """Test that deleting a property sets property_id to null on applications (SET NULL)."""
        prop = Property(
            owner_id=owner_user.id,
            title="Nullify Prop",
            address="Nullify St",
        )
        db_session.add(prop)
        await db_session.flush()

        app = Application(
            tenant_id=tenant_user.id,
            property_id=prop.id,
        )
        db_session.add(app)
        await db_session.flush()

        app_id = app.id

        # Delete property
        await db_session.delete(prop)
        await db_session.flush()

        # Check app property_id is null
        result = await db_session.execute(select(Application).where(Application.id == app_id))
        fetched_app = result.scalar_one()
        assert fetched_app.property_id is None
