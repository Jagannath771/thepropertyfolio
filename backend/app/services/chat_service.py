"""Chat service — OpenAI GPT-4o streaming with ThePropertyFolio system prompt."""

from __future__ import annotations

from collections.abc import AsyncGenerator

import structlog
from openai import AsyncOpenAI

from app.config import settings

logger = structlog.get_logger(__name__)

SYSTEM_PROMPT = """You are the ThePropertyFolio AI assistant — a knowledgeable, friendly, and professional property management concierge.

Your responses MUST be well-structured using Markdown:
1. Use **bold headers** for key points or steps.
2. Use proper numbered or bulleted lists for multi-step instructions.
3. Ensure there is a blank line between paragraphs and before starting a list.
4. Never join sentences with list numbers (e.g., use "word. 1." instead of "word.1.").

You help:
- Prospective tenants find available properties and guide them through the application process.
- Property owners understand listing, pricing, and portfolio management services.
- Everyone understand policies on pets, parking, maintenance, payments, and lease terms.

Always be concise, warm, and professional. If you don't know something specific, direct the user to contact ThePropertyFolio team at contact@thepropertyfolio.com.

Key information:
- Applications are processed within 3-5 business days.
- Rent payments are due on the 1st of each month.
- Maintenance requests are addressed within 24-48 hours for non-emergencies.
- Security deposits are typically equal to one month's rent.
- Background and credit checks are required for all applicants."""

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    """Get or create the OpenAI async client."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


async def stream_chat_response(
    messages: list[dict[str, str]],
) -> AsyncGenerator[str, None]:
    """
    Stream a GPT-4o response token by token.

    Args:
        messages: List of {role, content} dicts (conversation history).

    Yields:
        Text chunks as they stream from OpenAI.
    """
    if not settings.OPENAI_API_KEY:
        yield "I'm sorry, the AI assistant is not configured. Please contact support at contact@thepropertyfolio.com."
        return

    client = _get_client()
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}, *messages]

    try:
        stream = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=full_messages,  # type: ignore[arg-type]
            max_tokens=settings.OPENAI_MAX_TOKENS,
            stream=True,
            temperature=0.7,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content
    except Exception as e:
        logger.error("OpenAI streaming error", error=str(e))
        yield "I'm experiencing technical difficulties. Please try again or contact support at contact@thepropertyfolio.com."
