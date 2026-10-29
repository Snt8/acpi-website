from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from acpi_api.config import Settings
from acpi_api.infrastructure.memory_repositories import MemoryDatabase, create_memory_repositories
from acpi_api.main import create_app

APP_TOKEN = "token-app"
ADMIN_TOKEN = "token-admin"
APP_AUTH = {"Authorization": f"Bearer {APP_TOKEN}"}
ADMIN_AUTH = {"Authorization": f"Bearer {ADMIN_TOKEN}"}


def make_settings(**overrides) -> Settings:
    values = {
        "storage": "memory",
        "api_token_app": SecretStr(APP_TOKEN),
        "api_token_admin": SecretStr(ADMIN_TOKEN),
        # Que el `.env` de quien corre las pruebas no cambie el resultado
        "_env_file": None,
    }
    return Settings(**(values | overrides))


@pytest.fixture
def db() -> MemoryDatabase:
    return MemoryDatabase()


@pytest.fixture
def settings() -> Settings:
    return make_settings()


@pytest.fixture
def client(db: MemoryDatabase, settings: Settings) -> Iterator[TestClient]:
    app = create_app(settings, create_memory_repositories(db))
    with TestClient(app) as test_client:
        yield test_client


def send(client: TestClient, events: list[dict], headers: dict | None = None):
    return client.post("/api/eventos", json={"eventos": events}, headers=headers or APP_AUTH)
