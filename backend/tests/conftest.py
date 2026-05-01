"""pytest conftest — shared fixtures for all tests."""

from __future__ import annotations

import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.services.auth_service import hash_password, create_access_token

TEST_DATABASE_URL = "postgresql+asyncpg://tpf_user:test_password@localhost:5432/thepropertyfolio_test"


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop scoped to the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create a test database engine and drop/create all tables."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Yield a test database session that rolls back after each test."""
    async_session = async_sessionmaker(test_engine, expire_on_commit=False)
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Yield an AsyncClient for FastAPI with the test DB session injected."""
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def tenant_user(db_session: AsyncSession) -> User:
    """Create and return a verified tenant user."""
    user = User(
        email="tenant@test.com",
        password_hash=hash_password("TestPassword123!"),
        full_name="Test Tenant",
        phone="555-0100",
        role="tenant",
        is_verified=True,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def owner_user(db_session: AsyncSession) -> User:
    """Create and return a verified owner user."""
    user = User(
        email="owner@test.com",
        password_hash=hash_password("TestPassword123!"),
        full_name="Test Owner",
        phone="555-0200",
        role="owner",
        is_verified=True,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest.fixture
def tenant_token(tenant_user: User) -> str:
    """Return a valid JWT access token for the tenant user."""
    return create_access_token(tenant_user.id, tenant_user.role)


@pytest.fixture
def owner_token(owner_user: User) -> str:
    """Return a valid JWT access token for the owner user."""
    return create_access_token(owner_user.id, owner_user.role)


@pytest.fixture
def tenant_headers(tenant_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {tenant_token}"}


@pytest.fixture
def owner_headers(owner_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {owner_token}"}
