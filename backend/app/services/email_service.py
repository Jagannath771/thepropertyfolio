"""Email service — Resend API for transactional emails."""

from __future__ import annotations

import structlog
import resend

from app.config import settings

logger = structlog.get_logger(__name__)

resend.api_key = settings.RESEND_API_KEY


async def send_email_verification(email: str, full_name: str, token: str) -> bool:
    """Send email verification link to new user."""
    verify_url = f"{settings.ALLOWED_ORIGINS[0]}/verify-email?token={token}"
    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": email,
            "reply_to": settings.EMAIL_REPLY_TO,
            "subject": "Verify your ThePropertyFolio account",
            "html": f"""
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F1E; color: #F9FAFB; padding: 40px; border-radius: 16px;">
                <h1 style="color: #6366F1; font-size: 28px;">Welcome to ThePropertyFolio</h1>
                <p style="font-size: 16px; color: #9CA3AF;">Hi {full_name},</p>
                <p style="font-size: 16px; color: #9CA3AF;">Click the button below to verify your email address and activate your account.</p>
                <a href="{verify_url}" style="display: inline-block; background: #6366F1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; margin: 24px 0;">Verify Email Address</a>
                <p style="font-size: 14px; color: #6B7280;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
                <hr style="border: 1px solid rgba(255,255,255,0.08); margin: 32px 0;" />
                <p style="font-size: 12px; color: #6B7280;">ThePropertyFolio &bull; contact@thepropertyfolio.com</p>
            </div>
            """,
        })
        logger.info("Email verification sent", email=email)
        return True
    except Exception as e:
        logger.error("Failed to send verification email", email=email, error=str(e))
        return False


async def send_password_reset(email: str, full_name: str, token: str) -> bool:
    """Send password reset link."""
    reset_url = f"{settings.ALLOWED_ORIGINS[0]}/reset-password?token={token}"
    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": email,
            "subject": "Reset your ThePropertyFolio password",
            "html": f"""
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F1E; color: #F9FAFB; padding: 40px; border-radius: 16px;">
                <h1 style="color: #6366F1; font-size: 28px;">Password Reset</h1>
                <p style="color: #9CA3AF;">Hi {full_name}, we received a request to reset your password.</p>
                <a href="{reset_url}" style="display: inline-block; background: #6366F1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; margin: 24px 0;">Reset Password</a>
                <p style="font-size: 14px; color: #6B7280;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
            </div>
            """,
        })
        logger.info("Password reset email sent", email=email)
        return True
    except Exception as e:
        logger.error("Failed to send password reset email", email=email, error=str(e))
        return False


async def send_application_confirmation(email: str, full_name: str, property_address: str) -> bool:
    """Notify tenant that their application was received."""
    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": email,
            "subject": "Application received — ThePropertyFolio",
            "html": f"""
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F1E; color: #F9FAFB; padding: 40px; border-radius: 16px;">
                <h1 style="color: #10B981; font-size: 28px;">Application Received ✓</h1>
                <p style="color: #9CA3AF;">Hi {full_name},</p>
                <p style="color: #9CA3AF;">Your application for <strong style="color: #F9FAFB;">{property_address}</strong> has been received and is under review. You'll hear from us within 3-5 business days.</p>
                <p style="color: #9CA3AF;">Questions? Contact us at <a href="mailto:contact@thepropertyfolio.com" style="color: #6366F1;">contact@thepropertyfolio.com</a></p>
            </div>
            """,
        })
        return True
    except Exception as e:
        logger.error("Failed to send application confirmation", email=email, error=str(e))
        return False


async def send_contact_confirmation(email: str, name: str) -> bool:
    """Send confirmation to contact form submitter."""
    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": email,
            "subject": "We received your message — ThePropertyFolio",
            "html": f"""
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F1E; color: #F9FAFB; padding: 40px; border-radius: 16px;">
                <h1 style="color: #6366F1; font-size: 28px;">Thanks for reaching out!</h1>
                <p style="color: #9CA3AF;">Hi {name}, we've received your message and will get back to you within 1 business day.</p>
                <p style="color: #9CA3AF;">In the meantime, feel free to browse our <a href="{settings.ALLOWED_ORIGINS[0]}/availability" style="color: #6366F1;">available properties</a>.</p>
            </div>
            """,
        })
        return True
    except Exception as e:
        logger.error("Failed to send contact confirmation", email=email, error=str(e))
        return False


async def notify_admin_new_lead(name: str, email: str, message: str | None = None, role: str | None = None) -> bool:
    """Notify the admin about a new lead (signup or contact form)."""
    lead_type = "New Signup" if role else "Contact Form Inquiry"
    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": settings.ADMIN_EMAIL,
            "subject": f"[{lead_type}] {name} — ThePropertyFolio",
            "html": f"""
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F1E; color: #F9FAFB; padding: 40px; border-radius: 16px;">
                <h1 style="color: #6366F1; font-size: 24px; margin-bottom: 20px;">{lead_type} Alert</h1>
                <div style="background: rgba(255,255,255,0.03); padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                    <p style="margin: 0 0 12px 0;"><strong>Name:</strong> {name}</p>
                    <p style="margin: 0 0 12px 0;"><strong>Email:</strong> {email}</p>
                    {f'<p style="margin: 0 0 12px 0;"><strong>Role:</strong> {role}</p>' if role else ''}
                    {f'<p style="margin: 0;"><strong>Message:</strong><br/><br/>{message}</p>' if message else ''}
                </div>
                <hr style="border: 1px solid rgba(255,255,255,0.08); margin: 32px 0;" />
                <p style="font-size: 12px; color: #6B7280;">Sent via ThePropertyFolio Admin Notification System</p>
            </div>
            """,
        })
        logger.info("Admin notification sent", email=email, lead_type=lead_type)
        return True
    except Exception as e:
        logger.error("Failed to send admin notification", error=str(e))
        return False
