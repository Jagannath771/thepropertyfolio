"""Models package — import all for Alembic auto-detection."""

from app.models.user import User
from app.models.property import Property
from app.models.application import Application
from app.models.maintenance import MaintenanceRequest
from app.models.payment import Payment
from app.models.message import Message
from app.models.audit_log import AuditLog
from app.models.chat_history import ChatHistory
from app.models.contact import ContactInquiry

__all__ = [
    "User",
    "Property",
    "Application",
    "MaintenanceRequest",
    "Payment",
    "Message",
    "AuditLog",
    "ChatHistory",
    "ContactInquiry",
]
