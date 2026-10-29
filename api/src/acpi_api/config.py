from functools import cached_property
from typing import Literal

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuración leída del entorno (o de `.env` en local). Los nombres de las
    variables son los de los campos en mayúsculas; `.env.example` los documenta.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # `memory` guarda todo en el proceso: sirve para desarrollar sin Supabase
    storage: Literal["supabase", "memory"] = "supabase"
    supabase_url: str = ""
    # La clave secreta (`sb_secret_…`) o la antigua `service_role`. Salta el RLS:
    # nunca debe salir del servidor
    supabase_secret_key: SecretStr = SecretStr("")

    # Va dentro de la app, así que no es secreto: sólo permite escribir eventos.
    # Vacío, POST /api/eventos queda abierto
    api_token_app: SecretStr = SecretStr("")
    # Lectura de los datos sin agregar y cambios a mano. Vacío, /api/admin no responde
    api_token_admin: SecretStr = SecretStr("")

    # Orígenes del navegador que pueden llamar a la API, separados por comas
    cors_origins: str = "https://snt8.github.io,http://localhost:5173"

    max_events_per_batch: int = 500
    max_body_bytes: int = 1_000_000
    telemetry_range_days: int = 30
    reports_per_hour_per_client: int = 10

    @model_validator(mode="after")
    def _distinct_tokens(self):
        app, admin = self.api_token_app.get_secret_value(), self.api_token_admin.get_secret_value()
        if admin and admin == app:
            # El de la app se puede sacar del instalable: no puede abrir la administración
            raise ValueError("API_TOKEN_ADMIN tiene que ser distinto de API_TOKEN_APP")
        return self

    @cached_property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
