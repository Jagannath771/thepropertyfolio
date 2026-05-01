"""Encryption service — AES-256-GCM for sensitive fields."""

from __future__ import annotations

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import settings


def _get_key() -> bytes:
    """Decode the base64-encoded 32-byte encryption key from settings."""
    return base64.b64decode(settings.FIELD_ENCRYPTION_KEY)


def encrypt_field(plaintext: str) -> str:
    """
    Encrypt a plaintext string using AES-256-GCM.

    Returns a base64-encoded string: nonce (12 bytes) + ciphertext.
    """
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    combined = nonce + ciphertext
    return base64.b64encode(combined).decode("utf-8")


def decrypt_field(encrypted: str) -> str:
    """
    Decrypt an AES-256-GCM encrypted field.

    Accepts a base64-encoded string: nonce (12 bytes) + ciphertext.
    """
    key = _get_key()
    aesgcm = AESGCM(key)
    combined = base64.b64decode(encrypted.encode("utf-8"))
    nonce = combined[:12]
    ciphertext = combined[12:]
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")


def mask_ssn(ssn: str) -> str:
    """Return a masked SSN for display (e.g., ***-**-1234)."""
    clean = ssn.replace("-", "").replace(" ", "")
    if len(clean) >= 4:
        return f"***-**-{clean[-4:]}"
    return "***-**-****"
