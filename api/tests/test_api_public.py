from fastapi.testclient import TestClient

from acpi_api.domain.traffic_lights import public_id
from acpi_api.infrastructure.memory_repositories import create_memory_repositories
from acpi_api.main import create_app
from conftest import make_settings, send
from factories import BASE_MS, DEVICE, crossings, light_event

REPORT = {
    "name": "  Av. Calle 13 con Carrera 15 ",
    "issue": "no-sound",
    "note": "El sonido no funciona de noche",
    "position": {"lat": 4.6097, "lng": -74.0817},
}


def test_salud_responde_sin_tocar_la_base(client):
    assert client.get("/api/salud").json() == {"estado": "ok"}
    assert client.get("/api/salud?base=true").json() == {"estado": "ok", "base": "ok"}


def test_telemetria_publica_las_cifras_anonimas(client):
    send(client, crossings(6, 4.6081, -74.0821))
    response = client.get("/api/telemetria")

    assert response.status_code == 200
    assert response.headers["Cache-Control"] == "public, max-age=300"
    body = response.json()
    assert body["status"] == "ok"
    assert body["totals"]["sessions"] == 6
    assert "dispositivo" not in response.text


def test_semaforos_publica_los_vigentes_sin_nombre_ni_dispositivo(client):
    send(
        client,
        [
            light_event("creado", 3),
            light_event("creado", 4),
            light_event("borrado", 4, momento=BASE_MS + 1),
        ],
    )
    response = client.get("/api/semaforos")

    assert response.json() == [
        {"id": public_id(DEVICE, 3), "lat": 4.60971, "lng": -74.08175, "origin": "brazalete"}
    ]
    assert "Calle 26" not in response.text


def test_un_evento_viejo_no_pisa_uno_mas_nuevo_de_otro_lote(client):
    send(client, [light_event("borrado", 3, momento=BASE_MS + 10)])
    send(client, [light_event("creado", 3, momento=BASE_MS)])
    assert client.get("/api/semaforos").json() == []


def test_crea_un_reporte_con_la_forma_de_la_web(client):
    response = client.post("/api/reportes", json=REPORT)

    assert response.status_code == 201
    report = response.json()
    assert set(report) == {"id", "name", "issue", "note", "position", "reportedAt"}
    assert report["name"] == "Av. Calle 13 con Carrera 15"
    assert client.get("/api/reportes").json() == [report]


def test_rechaza_un_reporte_invalido(client):
    for change in (
        {"name": "   "},
        {"issue": "otro"},
        {"note": "x" * 281},
        {"position": {"lat": 99, "lng": 0}},
    ):
        assert client.post("/api/reportes", json=REPORT | change).status_code == 422


def test_limita_los_reportes_seguidos_de_un_mismo_cliente():
    app = create_app(make_settings(reports_per_hour_per_client=3), create_memory_repositories())
    with TestClient(app) as client:
        statuses = [client.post("/api/reportes", json=REPORT).status_code for _ in range(4)]
    assert statuses == [201, 201, 201, 429]
