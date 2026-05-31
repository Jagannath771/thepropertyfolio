"""In-process fan-out for tenant application updates (SSE).

Single-process only; swap for Redis pub/sub when running multiple API replicas."""

from __future__ import annotations

import asyncio
import uuid
from typing import Any

_lock = asyncio.Lock()
# tenant_id -> list of subscriber queues
_subscribers: dict[uuid.UUID, list[asyncio.Queue[dict[str, Any]]]] = {}


async def subscribe(tenant_id: uuid.UUID) -> asyncio.Queue[dict[str, Any]]:
    q: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=64)
    async with _lock:
        _subscribers.setdefault(tenant_id, []).append(q)
    return q


async def unsubscribe(tenant_id: uuid.UUID, q: asyncio.Queue[dict[str, Any]]) -> None:
    async with _lock:
        lst = _subscribers.get(tenant_id)
        if not lst:
            return
        if q in lst:
            lst.remove(q)
        if not lst:
            _subscribers.pop(tenant_id, None)


def publish_application_update(tenant_id: uuid.UUID, payload: dict[str, Any]) -> None:
    """Notify all SSE listeners for this tenant. Safe from async routes (put_nowait)."""
    lst = _subscribers.get(tenant_id)
    if not lst:
        return
    for q in list(lst):
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            pass
