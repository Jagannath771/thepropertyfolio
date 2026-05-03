"""FastAPI dependency: extract and validate the current user from JWT."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

import structlog
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, get_db
from app.models.user import User
from app.services import auth_service

logger = structlog.get_logger(__name__)
bearer_scheme = HTTPBearer(auto_error=False)


def _credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def user_from_access_token(db: AsyncSession, token: str) -> User:
    """Resolve a user from a JWT access string (Bearer body or query param)."""
    credentials_exception = _credentials_exception()
    try:
        payload = auth_service.decode_access_token(token)
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    user = await auth_service.get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise credentials_exception

    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is temporarily locked. Please try again later.",
        )

    return user


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate JWT bearer token and return the current user."""
    credentials_exception = _credentials_exception()
    if not credentials:
        raise credentials_exception
    return await user_from_access_token(db, credentials.credentials)


async def get_current_user_sse(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    """JWT from Authorization header or `access_token` query (for browser EventSource)."""
    credentials_exception = _credentials_exception()
    token = credentials.credentials if credentials else request.query_params.get("access_token")
    if not token:
        raise credentials_exception
    async with AsyncSessionLocal() as db:
        return await user_from_access_token(db, token)


async def get_current_verified_user_sse(
    current_user: Annotated[User, Depends(get_current_user_sse)],
) -> User:
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address to access this resource.",
        )
    return current_user


async def get_current_verified_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Require a verified user account."""
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address to access this resource.",
        )
    return current_user


async def require_tenant(
    current_user: Annotated[User, Depends(get_current_verified_user)],
) -> User:
    """Require the current user to have the 'tenant' role."""
    if current_user.role not in ("tenant", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant access required.",
        )
    return current_user


async def require_owner(
    current_user: Annotated[User, Depends(get_current_verified_user)],
) -> User:
    """Require the current user to have the 'owner' role."""
    if current_user.role not in ("owner", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner access required.",
        )
    return current_user


async def require_admin(
    current_user: Annotated[User, Depends(get_current_verified_user)],
) -> User:
    """Require the current user to have the 'admin' role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user
