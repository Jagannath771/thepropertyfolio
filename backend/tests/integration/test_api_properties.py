"""Integration tests for the properties API endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models.property import Property
from app.models.user import User


@pytest.mark.asyncio
class TestPropertiesAPI:
    async def test_list_properties_empty(self, client: AsyncClient):
        """Test listing properties when none exist."""
        response = await client.get("/api/properties")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_create_property_as_owner(
        self, client: AsyncClient, owner_headers: dict[str, str]
    ):
        """Test creating a property as an owner."""
        payload = {
            "title": "New Owner Listing",
            "address": "123 Main St",
            "city": "Metropolis",
            "monthly_rent": 2500.0,
            "property_type": "apartment",
            "status": "available",
            "is_featured": True
        }
        response = await client.post(
            "/api/properties",
            json=payload,
            headers=owner_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] is not None
        assert data["title"] == "New Owner Listing"
        assert data["monthly_rent"] == 2500.0

    async def test_create_property_as_tenant_forbidden(
        self, client: AsyncClient, tenant_headers: dict[str, str]
    ):
        """Test tenants cannot create properties."""
        payload = {
            "title": "Tenant Listing",
            "address": "456 Side St",
        }
        response = await client.post(
            "/api/properties",
            json=payload,
            headers=tenant_headers
        )
        assert response.status_code == 403

    async def test_get_single_property(
        self, client: AsyncClient, owner_headers: dict[str, str]
    ):
        """Test fetching a single property by ID."""
        # Create property first
        payload = {"title": "Test Prop", "address": "789 Test Ave"}
        create_res = await client.post("/api/properties", json=payload, headers=owner_headers)
        assert create_res.status_code == 201
        prop_id = create_res.json()["id"]

        # Fetch it
        response = await client.get(f"/api/properties/{prop_id}")
        assert response.status_code == 200
        assert response.json()["title"] == "Test Prop"
        assert response.json()["view_count"] == 1  # Should increment

    async def test_update_property(
        self, client: AsyncClient, owner_headers: dict[str, str]
    ):
        """Test updating a property as its owner."""
        payload = {"title": "Update Prop", "address": "111 Update St"}
        create_res = await client.post("/api/properties", json=payload, headers=owner_headers)
        prop_id = create_res.json()["id"]

        update_payload = {"title": "Updated Title", "monthly_rent": 3000.0}
        update_res = await client.put(f"/api/properties/{prop_id}", json=update_payload, headers=owner_headers)
        assert update_res.status_code == 200
        assert update_res.json()["title"] == "Updated Title"
        assert update_res.json()["monthly_rent"] == 3000.0

    async def test_archive_property(
        self, client: AsyncClient, owner_headers: dict[str, str]
    ):
        """Test soft-deleting a property."""
        payload = {"title": "Archive Prop", "address": "222 Archive St"}
        create_res = await client.post("/api/properties", json=payload, headers=owner_headers)
        prop_id = create_res.json()["id"]

        delete_res = await client.delete(f"/api/properties/{prop_id}", headers=owner_headers)
        assert delete_res.status_code == 204

        # Verify status is archived
        fetch_res = await client.get(f"/api/properties/{prop_id}")
        assert fetch_res.status_code == 200
        assert fetch_res.json()["status"] == "archived"
