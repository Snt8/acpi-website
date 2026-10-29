"""
Comprueba las peticiones que los repositorios mandan a PostgREST, con un
transporte simulado en lugar de la red. Lo que hace la base con ellas lo
prueba `test_database.py`.
"""

import asyncio
import json
from datetime import UTC, datetime

import httpx
import pytest

from acpi_api.application.ingest_events import build_batch
from acpi_api.application.ports import StorageUnavailable
from acpi_api.domain.crossings import CrossingFilters
from acpi_api.domain.reports import NewReport, Report
from acpi_api.infrastructure.supabase_repositories import create_supabase_repositories
from factories import crossings, light_event

URL = "https://proyecto.supabase.co"
KEY = "sb_secret_prueba"


class FakePostgrest:
    def __init__(self, response=None, status: int = 200) -> None:
        self.requests: list[httpx.Request] = []
        self.response = [] if response is None else response
        self.status = status

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        return httpx.Response(self.status, json=self.response)

    @property
    def last(self) -> httpx.Request:
        return self.requests[-1]


def repositories(fake: FakePostgrest):
    http_client = httpx.AsyncClient(transport=httpx.MockTransport(fake))
    return asyncio.run(create_supabase_repositories(URL, KEY, http_client))


def test_guarda_el_lote_con_una_sola_llamada_a_registrar_eventos():
    fake = FakePostgrest(response=2)
    batch, _ = build_batch([*crossings(1, 4.6, -74.08), light_event("creado", 3)])

    assert asyncio.run(repositories(fake).events.save(batch)) == 2
    assert len(fake.requests) == 1
    assert fake.last.method == "POST"
    assert fake.last.url.path == "/rest/v1/rpc/registrar_eventos"
    assert fake.last.headers["apikey"] == KEY
    body = json.loads(fake.last.content)
    assert [len(body[k]) for k in ("p_eventos", "p_cruces", "p_semaforos")] == [2, 1, 1]
    assert body["p_semaforos"][0]["ultimo_evento_en"].endswith("+00:00")


def test_filtra_los_cruces_en_la_consulta():
    fake = FakePostgrest()
    filters = CrossingFilters(
        since=datetime(2026, 10, 1, tzinfo=UTC), traffic_light="abc", limit=20
    )
    asyncio.run(repositories(fake).crossings.find(filters))

    params = fake.last.url.params
    assert fake.last.url.path == "/rest/v1/cruces"
    assert params["momento"] == "gte.2026-10-01T00:00:00+00:00"
    assert params["semaforo"] == "eq.abc"
    assert params["simulado"] == "eq.false"
    assert params["order"] == "momento.desc"
    assert params["limit"] == "20"


def test_traduce_las_filas_de_reportes_a_la_forma_de_la_web():
    report = Report.create(
        NewReport(name="Cruce", issue="broken", position={"lat": 4.6, "lng": -74.1})
    )
    row = {
        "id": report.id,
        "nombre": "Cruce",
        "problema": "broken",
        "nota": "",
        "lat": 4.6,
        "lng": -74.1,
        "reportado_en": report.reported_at.isoformat(),
    }
    fake = FakePostgrest(response=[row])
    [found] = asyncio.run(repositories(fake).reports.find(10))
    assert found == report


def test_un_error_de_supabase_se_vuelve_storage_unavailable():
    # Con 500: el cliente reintenta solo los GET con 503 o 520, y esperaría segundos
    fake = FakePostgrest(response={"message": "caído", "code": "PGRST000"}, status=500)
    with pytest.raises(StorageUnavailable):
        asyncio.run(repositories(fake).health.ping())


def test_sin_red_tambien():
    def no_network(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("sin red", request=request)

    http_client = httpx.AsyncClient(transport=httpx.MockTransport(no_network))
    repos = asyncio.run(create_supabase_repositories(URL, KEY, http_client))
    with pytest.raises(StorageUnavailable):
        asyncio.run(repos.traffic_lights.find(include_deleted=False))
