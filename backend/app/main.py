"""FastAPI application factory and entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base
from app.middleware.logging_middleware import StructlogMiddleware
from app.routers import (
    auth,
    properties,
    applications,
    tenants,
    owners,
    maintenance,
    payments,
    messages,
    contact,
    chatbot,
)

# ── Logging Setup ──────────────────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer()
        if settings.LOG_FORMAT == "console"
        else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(
        logging.getLevelName(settings.LOG_LEVEL)
    ),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifecycle: startup and shutdown events."""
    # Startup
    logger.info("Starting ThePropertyFolio API", version=settings.APP_VERSION)
    async with engine.begin() as conn:
        # Create tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database connected successfully")
    yield
    # Shutdown
    await engine.dispose()
    logger.info("Database connections closed")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="ThePropertyFolio API",
        description=(
            "Production-ready property management API for tenants and owners. "
            "Powered by FastAPI, PostgreSQL, and OpenAI GPT-4o."
        ),
        version=settings.APP_VERSION,
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
        openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else None,
        lifespan=lifespan,
    )

    # ── Middleware (order matters — outermost first) ────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
        expose_headers=["X-Request-ID"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(StructlogMiddleware)

    # ── Routers ────────────────────────────────────────────────────────────
    api_prefix = "/api"
    app.include_router(auth.router, prefix=f"{api_prefix}/auth", tags=["Authentication"])
    app.include_router(properties.router, prefix=f"{api_prefix}/properties", tags=["Properties"])
    app.include_router(applications.router, prefix=f"{api_prefix}/applications", tags=["Applications"])
    app.include_router(tenants.router, prefix=f"{api_prefix}/tenants", tags=["Tenants"])
    app.include_router(owners.router, prefix=f"{api_prefix}/owners", tags=["Owners"])
    app.include_router(maintenance.router, prefix=f"{api_prefix}/maintenance", tags=["Maintenance"])
    app.include_router(payments.router, prefix=f"{api_prefix}/payments", tags=["Payments"])
    app.include_router(messages.router, prefix=f"{api_prefix}/messages", tags=["Messages"])
    app.include_router(contact.router, prefix=f"{api_prefix}/contact", tags=["Contact"])
    app.include_router(chatbot.router, prefix=f"{api_prefix}/chat", tags=["Chatbot"])

    # ── Health Check ───────────────────────────────────────────────────────
    @app.get("/health", tags=["Health"], include_in_schema=False)
    async def health_check() -> dict[str, str]:
        """Health check endpoint for Docker and load balancers."""
        return {"status": "healthy", "version": settings.APP_VERSION}

    # ── Global Exception Handler ───────────────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            "Unhandled exception",
            path=request.url.path,
            method=request.method,
            error=str(exc),
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred. Please try again."},
        )

    return app


app = create_app()
