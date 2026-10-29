"""
Raíz de composición: arma la aplicación, elige los repositorios según la
configuración y conecta las rutas. Se arranca con

    uvicorn acpi_api.main:create_app --factory
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from acpi_api.application.ports import Repositories, StorageUnavailable
from acpi_api.config import Settings
from acpi_api.http.rate_limit import SlidingWindowLimiter
from acpi_api.http.routes import ROUTERS
from acpi_api.infrastructure.memory_repositories import create_memory_repositories

logger = logging.getLogger("acpi_api")

_RETRY_AFTER_S = 30


async def _build_repositories(settings: Settings) -> Repositories:
    if settings.storage == "memory":
        logger.warning("STORAGE=memory: los datos se pierden al reiniciar el servidor")
        return create_memory_repositories()
    secret_key = settings.supabase_secret_key.get_secret_value()
    if not settings.supabase_url or not secret_key:
        raise RuntimeError(
            "Faltan SUPABASE_URL y SUPABASE_SECRET_KEY (o usa STORAGE=memory en local)."
        )
    # Se importa aquí para que las pruebas y el modo memoria no carguen el cliente
    from acpi_api.infrastructure.supabase_repositories import create_supabase_repositories

    return await create_supabase_repositories(settings.supabase_url, secret_key)


class BodySizeLimit:
    """Rechaza con 413 los cuerpos que anuncian más de `max_bytes`, antes de leerlos."""

    def __init__(self, app: ASGIApp, max_bytes: int) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            length = dict(scope["headers"]).get(b"content-length", b"0")
            if length.isdigit() and int(length) > self.max_bytes:
                response = JSONResponse(
                    {"detail": f"El cuerpo supera {self.max_bytes} bytes."},
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                )
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)


def create_app(
    settings: Settings | None = None, repositories: Repositories | None = None
) -> FastAPI:
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.repositories = repositories or await _build_repositories(settings)
        if not settings.api_token_app.get_secret_value():
            logger.warning("Sin API_TOKEN_APP: cualquiera puede escribir en POST /api/eventos")
        yield

    app = FastAPI(
        title="ACPI API",
        summary="Recibe los eventos de la app móvil de ACPI y publica sus cifras anónimas.",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.state.reports_limiter = SlidingWindowLimiter(
        settings.reports_per_hour_per_client, window_s=3600
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
        max_age=3600,
    )
    app.add_middleware(BodySizeLimit, max_bytes=settings.max_body_bytes)

    @app.exception_handler(StorageUnavailable)
    async def storage_unavailable(_: Request, __: StorageUnavailable) -> JSONResponse:
        # 503: la app deja el lote en la cola y lo reintenta
        return JSONResponse(
            {"detail": "La base de datos no está disponible; reintenta más tarde."},
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            headers={"Retry-After": str(_RETRY_AFTER_S)},
        )

    for router in ROUTERS:
        app.include_router(router)
    return app
