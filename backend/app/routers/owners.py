"""Owner profile and portfolio KPI router."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import require_owner
from app.models.maintenance import MaintenanceRequest
from app.models.payment import Payment
from app.models.property import Property
from app.models.user import User

router = APIRouter()


def _property_to_dict(p: Property) -> dict[str, Any]:
    """Serialize a Property ORM object. Duplicated intentionally to avoid a
    circular import from `app.routers.properties`."""
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


@router.get("/me")
async def get_owner_profile(
    current_user: Annotated[User, Depends(require_owner)],
) -> dict[str, Any]:
    """Return the current owner's profile."""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role,
        "is_verified": current_user.is_verified,
        "totp_enabled": current_user.totp_secret is not None,
        "created_at": current_user.created_at.isoformat(),
    }


@router.get("/portfolio")
async def get_portfolio_kpis(
    current_user: Annotated[User, Depends(require_owner)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Return portfolio KPI summary for the owner dashboard.

    Includes period-over-period deltas (units added this year, monthly
    revenue change vs last month, etc.) so the UI never has to fake them.
    """
    props_result = await db.execute(
        select(Property).where(
            Property.owner_id == current_user.id,
            Property.status != "archived",
        )
    )
    properties = props_result.scalars().all()

    total = len(properties)
    occupied = sum(1 for p in properties if p.status == "leased")
    monthly_revenue = sum(
        float(p.monthly_rent or 0) for p in properties if p.status == "leased"
    )
    prop_ids = [p.id for p in properties]

    open_tickets = 0
    if prop_ids:
        maint_result = await db.execute(
            select(func.count(MaintenanceRequest.id)).where(
                MaintenanceRequest.property_id.in_(prop_ids),
                MaintenanceRequest.status.in_(("open", "in_progress", "scheduled")),
            )
        )
        open_tickets = maint_result.scalar_one() or 0

    # Period-over-period: units added this calendar year vs previous year.
    now = datetime.now(timezone.utc)
    start_of_year = datetime(now.year, 1, 1, tzinfo=timezone.utc)
    added_this_year_res = await db.execute(
        select(func.count(Property.id)).where(
            Property.owner_id == current_user.id,
            Property.created_at >= start_of_year,
        )
    )
    added_this_year = added_this_year_res.scalar_one() or 0

    # Revenue comparison: completed rent payments in the last 30 days vs the
    # 30 days before that. Falls back to 0 / None when there is not enough
    # history, so the UI renders "—" instead of "+NaN%".
    last_month_revenue = 0.0
    prev_month_revenue = 0.0
    if prop_ids:
        last_30 = now - timedelta(days=30)
        prev_60 = now - timedelta(days=60)
        last_res = await db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.property_id.in_(prop_ids),
                Payment.status == "completed",
                Payment.payment_type == "rent",
                Payment.paid_at >= last_30,
            )
        )
        last_month_revenue = float(last_res.scalar_one() or 0)
        prev_res = await db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.property_id.in_(prop_ids),
                Payment.status == "completed",
                Payment.payment_type == "rent",
                Payment.paid_at >= prev_60,
                Payment.paid_at < last_30,
            )
        )
        prev_month_revenue = float(prev_res.scalar_one() or 0)

    if prev_month_revenue > 0:
        revenue_change_pct = round(
            ((last_month_revenue - prev_month_revenue) / prev_month_revenue) * 100,
            1,
        )
    elif last_month_revenue > 0:
        revenue_change_pct = 100.0
    else:
        revenue_change_pct = None

    return {
        "total_units": total,
        "occupied_units": occupied,
        "occupancy_rate": round((occupied / total * 100) if total > 0 else 0, 1),
        "monthly_revenue": monthly_revenue,
        "open_maintenance_tickets": open_tickets,
        "available_units": sum(1 for p in properties if p.status == "available"),
        "units_added_this_year": added_this_year,
        "revenue_last_30d": last_month_revenue,
        "revenue_prev_30d": prev_month_revenue,
        "revenue_change_pct": revenue_change_pct,
    }


@router.get("/financials")
async def get_owner_financials(
    current_user: Annotated[User, Depends(require_owner)],
    db: AsyncSession = Depends(get_db),
    months: int = Query(default=12, ge=1, le=36),
) -> dict[str, Any]:
    """Return finance aggregates for the owner dashboard.

    Output is API-contract friendly:
      - `revenue_series`: [{month: "2026-05", revenue: 19200}, ...]
        covering the last `months` calendar months (including current).
      - `ytd_revenue` / `previous_ytd_revenue` / `ytd_change_pct` for
        period-over-period KPI badges.
      - `recent_transactions`: most recent 10 completed payments.

    Expense tracking is not yet modelled; the endpoint returns zeros
    in those fields with a `expenses_feature` hint so the UI can render
    a clear "coming soon" message instead of fabricated numbers.
    """
    prop_ids = await _owner_property_ids(db, current_user.id)

    now = datetime.now(timezone.utc)
    # Build list of (year, month) buckets starting `months-1` months back so
    # the current month is the last element.
    buckets: list[tuple[int, int]] = []
    y, m = now.year, now.month
    for _ in range(months):
        buckets.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    buckets.reverse()

    revenue_series: list[dict[str, Any]] = []
    if prop_ids:
        earliest_year, earliest_month = buckets[0]
        window_start = datetime(earliest_year, earliest_month, 1, tzinfo=timezone.utc)
        rows_res = await db.execute(
            select(
                func.date_trunc("month", Payment.paid_at).label("bucket"),
                func.coalesce(func.sum(Payment.amount), 0).label("revenue"),
            )
            .where(
                Payment.property_id.in_(prop_ids),
                Payment.status == "completed",
                Payment.payment_type == "rent",
                Payment.paid_at >= window_start,
            )
            .group_by("bucket")
        )
        by_bucket: dict[tuple[int, int], float] = {}
        for row in rows_res.all():
            bucket_dt: datetime = row.bucket
            by_bucket[(bucket_dt.year, bucket_dt.month)] = float(row.revenue or 0)
        for (by, bm) in buckets:
            revenue_series.append(
                {
                    "month": f"{by:04d}-{bm:02d}",
                    "revenue": by_bucket.get((by, bm), 0.0),
                }
            )
    else:
        for (by, bm) in buckets:
            revenue_series.append(
                {"month": f"{by:04d}-{bm:02d}", "revenue": 0.0}
            )

    # YTD totals + previous-year YTD for comparison.
    start_this = datetime(now.year, 1, 1, tzinfo=timezone.utc)
    start_prev = datetime(now.year - 1, 1, 1, tzinfo=timezone.utc)
    same_day_prev = datetime(
        now.year - 1, now.month, now.day, tzinfo=timezone.utc
    )
    ytd_revenue = 0.0
    prev_ytd_revenue = 0.0
    if prop_ids:
        this_res = await db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.property_id.in_(prop_ids),
                Payment.status == "completed",
                Payment.payment_type == "rent",
                Payment.paid_at >= start_this,
            )
        )
        ytd_revenue = float(this_res.scalar_one() or 0)
        prev_res = await db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.property_id.in_(prop_ids),
                Payment.status == "completed",
                Payment.payment_type == "rent",
                Payment.paid_at >= start_prev,
                Payment.paid_at < same_day_prev,
            )
        )
        prev_ytd_revenue = float(prev_res.scalar_one() or 0)

    if prev_ytd_revenue > 0:
        ytd_change_pct = round(
            ((ytd_revenue - prev_ytd_revenue) / prev_ytd_revenue) * 100, 1
        )
    elif ytd_revenue > 0:
        ytd_change_pct = 100.0
    else:
        ytd_change_pct = None

    recent_transactions: list[dict[str, Any]] = []
    if prop_ids:
        tx_res = await db.execute(
            select(Payment)
            .where(
                Payment.property_id.in_(prop_ids),
                Payment.status == "completed",
            )
            .order_by(Payment.paid_at.desc().nullslast())
            .limit(10)
        )
        for p in tx_res.scalars().all():
            recent_transactions.append(
                {
                    "id": str(p.id),
                    "property_id": str(p.property_id) if p.property_id else None,
                    "amount": float(p.amount),
                    "payment_type": p.payment_type,
                    "paid_at": p.paid_at.isoformat() if p.paid_at else None,
                    "created_at": p.created_at.isoformat(),
                }
            )

    return {
        "revenue_series": revenue_series,
        "ytd_revenue": ytd_revenue,
        "previous_ytd_revenue": prev_ytd_revenue,
        "ytd_change_pct": ytd_change_pct,
        # Expense tracking is not yet modelled. Keep the keys in the contract
        # so the frontend can render a "feature coming soon" state without
        # having to parse different shapes.
        "ytd_expenses": 0.0,
        "ytd_net_income": ytd_revenue,
        "expenses_feature": "unreleased",
        "recent_transactions": recent_transactions,
    }


async def _owner_property_ids(
    db: AsyncSession, owner_id: uuid.UUID
) -> list[uuid.UUID]:
    """Return the UUIDs of properties owned by this user."""
    result = await db.execute(select(Property.id).where(Property.owner_id == owner_id))
    return [row[0] for row in result.all()]


@router.get("/properties")
async def list_owner_properties(
    current_user: Annotated[User, Depends(require_owner)],
    db: AsyncSession = Depends(get_db),
    include_archived: bool = Query(
        default=False,
        description="If true, include archived listings in the response.",
    ),
) -> dict[str, Any]:
    """Return the current owner's full property catalog (scoped by owner_id)."""
    query = select(Property).where(Property.owner_id == current_user.id)
    if not include_archived:
        query = query.where(Property.status != "archived")
    query = query.order_by(Property.created_at.desc())

    result = await db.execute(query)
    properties = result.scalars().all()

    return {
        "items": [_property_to_dict(p) for p in properties],
        "total": len(properties),
    }
