"""
Dependencias de FastAPI. `create_app` deja la configuración y los repositorios
en `app.state`; las rutas los piden por aquí y nunca importan la infraestructura.
"""

import hmac
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import SecretStr

from acpi_api.application.ports import Repositories
from acpi_api.config import Settings
from acpi_api.http.rate_limit import SlidingWindowLimiter


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_repositories(request: Request) -> Repositories:
    return request.app.state.repositories


SettingsDep = Annotated[Settings, Depends(get_settings)]
RepositoriesDep = Annotated[Repositories, Depends(get_repositories)]

_bearer = HTTPBearer(auto_error=False)
BearerDep = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]


def _check_token(expected: SecretStr, credentials: HTTPAuthorizationCredentials | None) -> None:
    given = credentials.credentials if credentials else ""
    # Comparación en tiempo constante, para no filtrar el token carácter a carácter
    if not hmac.compare_digest(given.encode(), expected.get_secret_value().encode()):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Token inválido o ausente.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_app_token(settings: SettingsDep, credentials: BearerDep) -> None:
    """Escribir eventos. Sin API_TOKEN_APP configurado, la ruta queda abierta."""
    if settings.api_token_app.get_secret_value():
        _check_token(settings.api_token_app, credentials)


def require_admin_token(settings: SettingsDep, credentials: BearerDep) -> None:
    if not settings.api_token_admin.get_secret_value():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "La administración no está configurada (falta API_TOKEN_ADMIN).",
        )
    _check_token(settings.api_token_admin, credentials)


def limit_reports(request: Request) -> None:
    limiter: SlidingWindowLimiter = request.app.state.reports_limiter
    client = request.client.host if request.client else "desconocido"
    if not limiter.allow(client):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Demasiados reportes seguidos; inténtalo más tarde.",
            headers={"Retry-After": str(limiter.window_s)},
        )
