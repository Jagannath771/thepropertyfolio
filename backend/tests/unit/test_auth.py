"""Unit tests for authentication service."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta

import pytest
from jose import JWTError

from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    hash_token,
    create_email_verify_token,
    create_password_reset_token,
    generate_totp_secret,
    verify_totp,
)


class TestPasswordHashing:
    def test_hash_password_returns_string(self):
        hashed = hash_password("MySecret123!")
        assert isinstance(hashed, str)
        assert hashed != "MySecret123!"

    def test_verify_correct_password(self):
        hashed = hash_password("CorrectHorse!")
        assert verify_password("CorrectHorse!", hashed) is True

    def test_reject_wrong_password(self):
        hashed = hash_password("CorrectHorse!")
        assert verify_password("WrongHorse!", hashed) is False

    def test_two_hashes_of_same_password_differ(self):
        """Bcrypt uses random salts — same password must produce different hashes."""
        h1 = hash_password("same_password")
        h2 = hash_password("same_password")
        assert h1 != h2


class TestJWTTokens:
    def test_create_and_decode_access_token(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id, "tenant")
        payload = decode_access_token(token)
        assert payload["sub"] == str(user_id)
        assert payload["role"] == "tenant"
        assert payload["type"] == "access"

    def test_decode_invalid_token_raises(self):
        with pytest.raises(JWTError):
            decode_access_token("this.is.not.valid")

    def test_token_has_expiry(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id, "owner")
        payload = decode_access_token(token)
        assert "exp" in payload
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        assert exp > datetime.now(timezone.utc)

    def test_token_has_unique_jti(self):
        user_id = uuid.uuid4()
        t1 = create_access_token(user_id, "tenant")
        t2 = create_access_token(user_id, "tenant")
        p1 = decode_access_token(t1)
        p2 = decode_access_token(t2)
        assert p1["jti"] != p2["jti"]


class TestTokenHashing:
    def test_hash_token_is_deterministic(self):
        token = "my_refresh_token_abc"
        assert hash_token(token) == hash_token(token)

    def test_hash_token_different_inputs_differ(self):
        assert hash_token("token_a") != hash_token("token_b")

    def test_email_verify_token_is_url_safe(self):
        token = create_email_verify_token()
        assert len(token) > 20
        assert " " not in token

    def test_password_reset_token_has_expiry(self):
        token, expires = create_password_reset_token()
        assert isinstance(token, str)
        assert expires > datetime.now(timezone.utc)
        assert expires < datetime.now(timezone.utc) + timedelta(hours=2)


class TestTOTP:
    def test_generate_totp_secret(self):
        secret = generate_totp_secret()
        assert isinstance(secret, str)
        assert len(secret) >= 16

    def test_verify_valid_totp(self):
        import pyotp
        secret = generate_totp_secret()
        totp = pyotp.TOTP(secret)
        current_code = totp.now()
        assert verify_totp(secret, current_code) is True

    def test_reject_invalid_totp(self):
        secret = generate_totp_secret()
        assert verify_totp(secret, "000000") is False
