"""Properties router — CRUD + filtering + image upload."""

from __future__ import annotations

import uuid
from typing import Annotated, Any

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_user, require_owner
from app.models.property import Property
from app.models.user import User
from app.services import audit_service, storage_service

logger = structlog.get_logger(__name__)
router = APIRouter()


# ── Pydantic Schemas ──────────────────────────────────────────────────────────
class PropertyCreate(BaseModel):
    title: str
    description: str | None = None
    address: str
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    property_type: str | None = None
    bedrooms: int | None = None
    bathrooms: float | None = None
    square_feet: int | None = None
    monthly_rent: float | None = None
    deposit: float | None = None
    available_date: str | None = None
    amenities: list[str] = []
    pet_policy: str | None = None
    is_featured: bool = False


class PropertyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    property_type: str | None = None
    bedrooms: int | None = None
    bathrooms: float | None = None
    square_feet: int | None = None
    monthly_rent: float | None = None
    deposit: float | None = None
    available_date: str | None = None
    amenities: list[str] | None = None
    pet_policy: str | None = None
    status: str | None = None
    is_featured: bool | None = None


class PresignedUploadRequest(BaseModel):
    filename: str
    content_type: str


def _property_to_dict(p: Property) -> dict[str, Any]:
    """Serialize a Property ORM object to a dict."""
    return {
        "id": str(p.id),
        "owner_id": str(p.owner_id),
        "title": p.title,
        "description": p.description,
        "address": p.address,
        "city": p.city,
        "state": p.state,
        "zip_code": p.zip_code,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "property_type": p.property_type,
        "bedrooms": p.bedrooms,
        "bathrooms": float(p.bathrooms) if p.bathrooms else None,
        "square_feet": p.square_feet,
        "monthly_rent": float(p.monthly_rent) if p.monthly_rent else None,
        "deposit": float(p.deposit) if p.deposit else None,
        "available_date": p.available_date.isoformat() if p.available_date else None,
        "status": p.status,
        "amenities": p.amenities or [],
        "pet_policy": p.pet_policy,
        "images": p.images or [],
        "is_featured": p.is_featured,
        "view_count": p.view_count,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat(),
    }


# ── GET /api/properties ───────────────────────────────────────────────────────
@router.get("")
async def list_properties(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    property_type: str | None = None,
    city: str | None = None,
    min_rent: float | None = None,
    max_rent: float | None = None,
    bedrooms: int | None = None,
    bathrooms: float | None = None,
    min_sqft: int | None = None,
    max_sqft: int | None = None,
    amenities: list[str] = Query(default=[]),
    status: str = "available",
    sort_by: str = "created_at",
    sort_order: str = "desc",
    featured_only: bool = False,
    search: str | None = None,
) -> dict[str, Any]:
    """
    List properties with full filtering, sorting, and pagination.
    """
    conditions = []

    if status != "all":
        conditions.append(Property.status == status)
    if property_type:
        conditions.append(Property.property_type == property_type)
    if city:
        conditions.append(Property.city.ilike(f"%{city}%"))
    if min_rent is not None:
        conditions.append(Property.monthly_rent >= min_rent)
    if max_rent is not None:
        conditions.append(Property.monthly_rent <= max_rent)
    if bedrooms is not None:
        conditions.append(Property.bedrooms >= bedrooms)
    if bathrooms is not None:
        conditions.append(Property.bathrooms >= bathrooms)
    if min_sqft is not None:
        conditions.append(Property.square_feet >= min_sqft)
    if max_sqft is not None:
        conditions.append(Property.square_feet <= max_sqft)
    if featured_only:
        conditions.append(Property.is_featured == True)  # noqa: E712
    if search:
        conditions.append(
            or_(
                Property.title.ilike(f"%{search}%"),
                Property.address.ilike(f"%{search}%"),
                Property.city.ilike(f"%{search}%"),
                Property.description.ilike(f"%{search}%"),
            )
        )
    # Amenities filter (JSONB contains)
    for amenity in amenities:
        conditions.append(Property.amenities.contains([amenity]))

    query = select(Property).where(and_(*conditions) if conditions else True)  # type: ignore[arg-type]

    # Sorting
    sort_col = getattr(Property, sort_by, Property.created_at)
    query = query.order_by(sort_col.desc() if sort_order == "desc" else sort_col.asc())

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    properties = result.scalars().all()

    return {
        "items": [_property_to_dict(p) for p in properties],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


# ── GET /api/properties/{id} ──────────────────────────────────────────────────
@router.get("/{property_id}")
async def get_property(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Get a single property by ID. Increments view count."""
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    # Serialize BEFORE mutating the row.  Bumping `view_count` and flushing
    # expires `updated_at` (it has `onupdate=func.now()`); accessing it again
    # in the dict comprehension would trigger an implicit lazy-reload that
    # blows up on the async session with `MissingGreenlet`.
    data = _property_to_dict(prop)
    prop.view_count += 1
    data["view_count"] = prop.view_count
    return data


# ── POST /api/properties ──────────────────────────────────────────────────────
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_property(
    body: PropertyCreate,
    current_user: Annotated[User, Depends(require_owner)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Create a new property listing (owner only)."""
    from datetime import date as date_type
    available_date = None
    if body.available_date:
        try:
            available_date = date_type.fromisoformat(body.available_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid available_date format. Use YYYY-MM-DD.")

    prop = Property(
        owner_id=current_user.id,
        title=body.title,
        description=body.description,
        address=body.address,
        city=body.city,
        state=body.state,
        zip_code=body.zip_code,
        latitude=body.latitude,
        longitude=body.longitude,
        property_type=body.property_type,
        bedrooms=body.bedrooms,
        bathrooms=body.bathrooms,
        square_feet=body.square_feet,
        monthly_rent=body.monthly_rent,
        deposit=body.deposit,
        available_date=available_date,
        amenities=body.amenities,
        pet_policy=body.pet_policy,
        is_featured=body.is_featured,
    )
    db.add(prop)
    await db.flush()

    await audit_service.log_event(
        db, "property.created",
        user_id=current_user.id,
        resource_type="property",
        resource_id=prop.id,
    )

    logger.info("Property created", id=str(prop.id), owner=str(current_user.id))
    return _property_to_dict(prop)


# ── PUT /api/properties/{id} ──────────────────────────────────────────────────
@router.put("/{property_id}")
async def update_property(
    property_id: uuid.UUID,
    body: PropertyUpdate,
    current_user: Annotated[User, Depends(require_owner)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Update a property listing (owner must own the property)."""
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")
    if prop.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You don't own this property.")

    update_data = body.model_dump(exclude_none=True)
    if "available_date" in update_data and update_data["available_date"]:
        from datetime import date as date_type
        update_data["available_date"] = date_type.fromisoformat(update_data["available_date"])

    for field, value in update_data.items():
        setattr(prop, field, value)

    await db.flush()
    await audit_service.log_event(
        db, "property.updated", user_id=current_user.id,
        resource_type="property", resource_id=prop.id,
        event_metadata={"fields_updated": list(update_data.keys())},
    )

    return _property_to_dict(prop)


# ── DELETE /api/properties/{id} ───────────────────────────────────────────────
@router.delete("/{property_id}", status_code=status.HTTP_200_OK)
async def archive_property(
    property_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_owner)],
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Archive a property (soft delete — sets status to 'archived')."""
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")
    if prop.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You don't own this property.")

    prop.status = "archived"
    await db.flush()

    await audit_service.log_event(
        db, "property.archived", user_id=current_user.id,
        resource_type="property", resource_id=prop.id,
    )
    return {"message": "Property archived successfully."}


# ── POST /api/properties/{id}/images ──────────────────────────────────────────
@router.post("/{property_id}/images")
async def upload_property_images(
    property_id: uuid.UUID,
    body: PresignedUploadRequest,
    current_user: Annotated[User, Depends(require_owner)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Generate a presigned S3 URL for direct image upload from the browser."""
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")
    if prop.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You don't own this property.")

    try:
        presigned_url, public_url = storage_service.generate_presigned_upload_url(
            filename=body.filename,
            content_type=body.content_type,
            folder=f"properties/{property_id}",
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate upload URL.")

    # Add the public URL to the property's images list
    images: list = list(prop.images or [])
    images.append(public_url)
    prop.images = images
    await db.flush()

    return {"presigned_url": presigned_url, "public_url": public_url}
