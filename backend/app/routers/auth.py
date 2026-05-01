"""Authentication router — register, login, refresh, 2FA, email verification."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.services import auth_service, email_service, audit_service
from app.config import settings

logger = structlog.get_logger(__name__)
router = APIRouter()


# ── Pydantic Schemas (inline for router clarity) ──────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None
    role: str = "tenant"  # tenant | owner


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: str | None = None  # Required for owner 2FA


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    full_name: str


class RefreshRequest(BaseModel):
    refresh_token: str


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class TotpSetupResponse(BaseModel):
    secret: str
    provisioning_uri: str


class TotpVerifyRequest(BaseModel):
    code: str


# ── POST /api/auth/register ───────────────────────────────────────────────────
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Register a new tenant or owner account."""
    if body.role not in ("tenant", "owner"):
        raise HTTPException(status_code=400, detail="Role must be 'tenant' or 'owner'.")

    # Check duplicate email
    existing = await auth_service.get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    verify_token = auth_service.create_email_verify_token()
    user = User(
        email=body.email,
        password_hash=auth_service.hash_password(body.password),
        full_name=body.full_name,
        phone=body.phone,
        role=body.role,
        is_verified=False,
        email_verify_token=auth_service.hash_token(verify_token),
    )
    db.add(user)
    await db.flush()

    background_tasks.add_task(
        email_service.send_email_verification,
        body.email,
        body.full_name,
        verify_token,
    )

    # Notify admin about new signup
    background_tasks.add_task(
        email_service.notify_admin_new_lead,
        name=body.full_name,
        email=body.email,
        role=body.role,
    )

    await audit_service.log_event(db, "user.register", user_id=user.id, resource_type="user", resource_id=user.id)

    logger.info("User registered", email=body.email, role=body.role)
    return {"message": "Account created. Please check your email to verify your account."}


# ── POST /api/auth/login ──────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Login with email + password. Owners also require TOTP code."""
    user = await auth_service.get_user_by_email(db, body.email)

    def _fail_login(msg: str = "Invalid email or password.") -> None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)

    if not user or not user.password_hash:
        _fail_login()

    # Check lockout
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account locked. Try again after {user.locked_until.strftime('%H:%M UTC')}.",
        )

    if not auth_service.verify_password(body.password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.LOGIN_MAX_ATTEMPTS:
            from datetime import timedelta
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
            await db.flush()
            await audit_service.log_event(
                db, "user.locked", user_id=user.id,
                ip_address=request.client.host if request.client else None,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Too many failed attempts. Account locked for {settings.LOGIN_LOCKOUT_MINUTES} minutes.",
            )
        await db.flush()
        _fail_login()

    if not user.is_active:
        _fail_login("This account has been deactivated.")

    # Owner 2FA check
    if user.role in ("owner", "admin") and user.totp_secret:
        if not body.totp_code:
            raise HTTPException(
                status_code=status.HTTP_200_OK,
                detail="2FA_REQUIRED",
            )
        if not auth_service.verify_totp(user.totp_secret, body.totp_code):
            _fail_login("Invalid 2FA code.")

    # Reset failed attempts on success
    user.failed_login_attempts = 0
    user.locked_until = None

    # Issue tokens
    access_token = auth_service.create_access_token(user.id, user.role)
    refresh_token = auth_service.create_refresh_token(user.id)
    user.refresh_token_hash = auth_service.hash_token(refresh_token)
    await db.flush()

    await audit_service.log_event(
        db, "user.login", user_id=user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id),
        role=user.role,
        full_name=user.full_name,
    )


# ── POST /api/auth/refresh ────────────────────────────────────────────────────
@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Exchange a refresh token for a new access token (rotation)."""
    token_hash = auth_service.hash_token(body.refresh_token)
    result = await db.execute(
        select(User).where(User.refresh_token_hash == token_hash, User.is_active == True)  # noqa: E712
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    # Rotate: issue new tokens
    access_token = auth_service.create_access_token(user.id, user.role)
    new_refresh = auth_service.create_refresh_token(user.id)
    user.refresh_token_hash = auth_service.hash_token(new_refresh)
    await db.flush()

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        user_id=str(user.id),
        role=user.role,
        full_name=user.full_name,
    )


# ── POST /api/auth/logout ─────────────────────────────────────────────────────
@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Invalidate the refresh token (logout)."""
    current_user.refresh_token_hash = None
    await db.flush()
    return {"message": "Logged out successfully."}


# ── POST /api/auth/verify-email ───────────────────────────────────────────────
@router.post("/verify-email")
async def verify_email(
    body: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Verify email address using the token sent to the user's inbox."""
    token_hash = auth_service.hash_token(body.token)
    result = await db.execute(
        select(User).where(User.email_verify_token == token_hash)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token.")

    user.is_verified = True
    user.email_verify_token = None
    await db.flush()

    await audit_service.log_event(db, "user.email_verified", user_id=user.id)
    return {"message": "Email verified successfully. You can now log in."}


# ── POST /api/auth/forgot-password ───────────────────────────────────────────
@router.post("/forgot-password")
async def forgot_password(
    body: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Send a password reset email (always returns 200 to prevent enumeration)."""
    user = await auth_service.get_user_by_email(db, body.email)
    if user:
        token, expires = auth_service.create_password_reset_token()
        user.password_reset_token = auth_service.hash_token(token)
        user.password_reset_expires = expires
        await db.flush()
        background_tasks.add_task(
            email_service.send_password_reset, user.email, user.full_name, token
        )
    return {"message": "If that email is registered, you'll receive a reset link shortly."}


# ── POST /api/auth/reset-password ────────────────────────────────────────────
@router.post("/reset-password")
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Reset password using a valid reset token."""
    token_hash = auth_service.hash_token(body.token)
    result = await db.execute(
        select(User).where(
            User.password_reset_token == token_hash,
            User.password_reset_expires > datetime.now(timezone.utc),
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    user.password_hash = auth_service.hash_password(body.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.refresh_token_hash = None  # Invalidate all existing sessions
    await db.flush()

    await audit_service.log_event(db, "user.password_reset", user_id=user.id)
    return {"message": "Password reset successfully. Please log in with your new password."}


# ── POST /api/auth/2fa/setup ──────────────────────────────────────────────────
@router.post("/2fa/setup", response_model=TotpSetupResponse)
async def setup_2fa(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> TotpSetupResponse:
    """Generate and store a TOTP secret for owner 2FA setup."""
    if current_user.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="2FA is only available for owner accounts.")

    secret = auth_service.generate_totp_secret()
    current_user.totp_secret = secret
    await db.flush()

    return TotpSetupResponse(
        secret=secret,
        provisioning_uri=auth_service.get_totp_provisioning_uri(secret, current_user.email),
    )


# ── POST /api/auth/2fa/verify ─────────────────────────────────────────────────
@router.post("/2fa/verify")
async def verify_2fa(
    body: TotpVerifyRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    """Verify a TOTP code to confirm 2FA setup."""
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA not set up for this account.")

    if not auth_service.verify_totp(current_user.totp_secret, body.code):
        raise HTTPException(status_code=400, detail="Invalid TOTP code. Please try again.")

    return {"message": "2FA verified and enabled successfully."}
