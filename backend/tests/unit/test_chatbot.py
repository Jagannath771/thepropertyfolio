"""Unit tests for Chatbot service and history model."""

from __future__ import annotations

import uuid
from datetime import datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_history import ChatHistory
from app.models.user import User
from app.services.chat_service import stream_chat_response


@pytest.mark.asyncio
class TestChatHistoryModel:
    async def test_create_chat_history(self, db_session: AsyncSession, tenant_user: User):
        """Test creating a chat history record."""
        history = ChatHistory(
            session_id="test_session_123",
            user_id=tenant_user.id,
            role="user",
            content="Hello, I am looking for a house."
        )
        db_session.add(history)
        await db_session.flush()

        assert history.id is not None
        assert history.session_id == "test_session_123"
        assert history.user_id == tenant_user.id
        assert history.role == "user"
        assert "house" in history.content
        assert isinstance(history.created_at, datetime)

    async def test_chat_history_repr(self, db_session: AsyncSession):
        """Test the __repr__ method."""
        history = ChatHistory(
            session_id="test_session_456",
            role="assistant",
            content="How can I help you?"
        )
        db_session.add(history)
        await db_session.flush()

        repr_str = repr(history)
        assert repr_str == f"<ChatHistory id={history.id} role=assistant session=test_session_456>"


@pytest.mark.asyncio
class TestChatService:
    async def test_stream_chat_response_no_api_key(self, mocker):
        """Test streaming response when API key is missing."""
        mocker.patch("app.services.chat_service.settings.OPENAI_API_KEY", "")

        messages = [{"role": "user", "content": "Hi"}]
        chunks = []
        async for chunk in stream_chat_response(messages):
            chunks.append(chunk)

        result = "".join(chunks)
        assert "not configured" in result

    async def test_stream_chat_response_success(self, mocker):
        """Test successful streaming from mocked OpenAI."""
        mocker.patch("app.services.chat_service.settings.OPENAI_API_KEY", "test-key")

        # Mock the async stream object
        class MockChunk:
            class Choice:
                class Delta:
                    def __init__(self, content):
                        self.content = content
                def __init__(self, content):
                    self.delta = self.Delta(content)
            def __init__(self, content):
                self.choices = [self.Choice(content)]

        class MockStream:
            async def __aiter__(self):
                for chunk_text in ["Hello", " ", "there", "!"]:
                    yield MockChunk(chunk_text)

        mock_create = mocker.AsyncMock(return_value=MockStream())
        
        mock_client = mocker.MagicMock()
        mock_client.chat.completions.create = mock_create
        
        mocker.patch("app.services.chat_service._get_client", return_value=mock_client)

        messages = [{"role": "user", "content": "Hi"}]
        chunks = []
        async for chunk in stream_chat_response(messages):
            chunks.append(chunk)

        result = "".join(chunks)
        assert result == "Hello there!"
        mock_create.assert_called_once()
        
        # Verify system prompt is included
        call_args = mock_create.call_args[1]
        assert call_args["messages"][0]["role"] == "system"
        assert "ThePropertyFolio AI assistant" in call_args["messages"][0]["content"]
        assert call_args["messages"][1]["role"] == "user"

    async def test_stream_chat_response_error(self, mocker):
        """Test streaming error fallback message."""
        mocker.patch("app.services.chat_service.settings.OPENAI_API_KEY", "test-key")

        mock_create = mocker.AsyncMock(side_effect=Exception("API Down"))
        mock_client = mocker.MagicMock()
        mock_client.chat.completions.create = mock_create
        mocker.patch("app.services.chat_service._get_client", return_value=mock_client)

        messages = [{"role": "user", "content": "Hi"}]
        chunks = []
        async for chunk in stream_chat_response(messages):
            chunks.append(chunk)

        result = "".join(chunks)
        assert "technical difficulties" in result
