"""Integration tests for auth API endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestRegisterEndpoint:
    async def test_register_tenant_success(self, client: AsyncClient):
        resp = await client.post("/api/auth/register", json={
            "email": "newuser@test.com",
            "password": "SecurePass123!",
            "full_name": "New User",
            "role": "tenant",
        })
        assert resp.status_code == 201
        assert "verify" in resp.json()["message"].lower()

    async def test_register_duplicate_email_returns_409(self, client: AsyncClient, tenant_user):
        resp = await client.post("/api/auth/register", json={
            "email": "tenant@test.com",
            "password": "SecurePass123!",
            "full_name": "Duplicate",
            "role": "tenant",
        })
        assert resp.status_code == 409

    async def test_register_invalid_role_returns_400(self, client: AsyncClient):
        resp = await client.post("/api/auth/register", json={
            "email": "bad@test.com",
            "password": "SecurePass123!",
            "full_name": "Bad Role",
            "role": "superadmin",
        })
        assert resp.status_code == 400

    async def test_register_short_password_returns_400(self, client: AsyncClient):
        resp = await client.post("/api/auth/register", json={
            "email": "short@test.com",
            "password": "abc",
            "full_name": "Short Pass",
            "role": "tenant",
        })
        assert resp.status_code == 400


@pytest.mark.asyncio
class TestLoginEndpoint:
    async def test_login_success(self, client: AsyncClient, tenant_user):
        resp = await client.post("/api/auth/login", json={
            "email": "tenant@test.com",
            "password": "TestPassword123!",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["role"] == "tenant"

    async def test_login_wrong_password_returns_401(self, client: AsyncClient, tenant_user):
        resp = await client.post("/api/auth/login", json={
            "email": "tenant@test.com",
            "password": "WrongPassword!",
        })
        assert resp.status_code == 401

    async def test_login_nonexistent_user_returns_401(self, client: AsyncClient):
        resp = await client.post("/api/auth/login", json={
            "email": "ghost@test.com",
            "password": "SomePassword123!",
        })
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestRefreshEndpoint:
    async def test_refresh_token_rotation(self, client: AsyncClient, tenant_user):
        # Login first
        login_resp = await client.post("/api/auth/login", json={
            "email": "tenant@test.com",
            "password": "TestPassword123!",
        })
        refresh_token = login_resp.json()["refresh_token"]

        # Exchange refresh token
        resp = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["refresh_token"] != refresh_token  # Token was rotated


@pytest.mark.asyncio
class TestProtectedEndpoints:
    async def test_access_protected_route_without_token(self, client: AsyncClient):
        resp = await client.get("/api/tenants/me")
        assert resp.status_code == 401

    async def test_access_tenant_route_with_token(self, client: AsyncClient, tenant_headers):
        resp = await client.get("/api/tenants/me", headers=tenant_headers)
        assert resp.status_code == 200
        assert resp.json()["role"] == "tenant"

    async def test_tenant_cannot_access_owner_route(self, client: AsyncClient, tenant_headers):
        resp = await client.get("/api/owners/me", headers=tenant_headers)
        assert resp.status_code == 403
