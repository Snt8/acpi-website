from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from acpi_api.domain.traffic_lights import public_id
from acpi_api.infrastructure.memory_repositories import create_memory_repositories
from acpi_api.main import create_app
from conftest import ADMIN_AUTH, APP_AUTH, make_settings, send
from factories import BASE_MS, DEVICE, crossings, light_event, probe_event

LIGHT = public_id(DEVICE, 3)


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("get", "/api/admin/eventos"),
        ("get", "/api/admin/cruces"),
        ("get", "/api/admin/semaforos"),
        ("patch", f"/api/admin/semaforos/{LIGHT}"),
        ("delete", f"/api/admin/semaforos/{LIGHT}"),
    ],
)
def test_todo_pide_el_token_de_administracion(client, method, path):
    assert client.request(method, path).status_code == 401
    assert client.request(method, path, headers=APP_AUTH).status_code == 401


def test_sin_token_de_administracion_configurado_no_responde():
    app = create_app(make_settings(api_token_admin=""), create_memory_repositories())
    with TestClient(app) as client:
        assert client.get("/api/admin/cruces", headers=ADMIN_AUTH).status_code == 503


def test_no_arranca_con_el_mismo_token_para_la_app_y_la_administracion():
    with pytest.raises(ValueError, match="distinto"):
        make_settings(api_token_admin="token-app")


def test_lista_los_eventos_tal_como_llegaron(client):
    probe = probe_event()
    send(client, [probe, *crossings(1, 4.6, -74.08)])
    rows = client.get("/api/admin/eventos?tipo=prueba", headers=ADMIN_AUTH).json()
    assert [row["id"] for row in rows] == [probe["id"]]
    assert rows[0]["datos"]["mensaje"] == "Prueba desde Diagnóstico"


def test_filtra_y_pagina_los_cruces(client):
    send(client, [*crossings(3, 4.6, -74.08), *crossings(1, 4.6, -74.08, simulado=True)])

    rows = client.get("/api/admin/cruces", headers=ADMIN_AUTH).json()
    assert len(rows) == 3
    moments = [datetime.fromisoformat(row["momento"]) for row in rows]
    assert moments == sorted(moments, reverse=True)

    page = client.get("/api/admin/cruces?limite=2", headers=ADMIN_AUTH).json()
    rest = client.get(
        "/api/admin/cruces", params={"hasta": page[-1]["momento"]}, headers=ADMIN_AUTH
    ).json()
    assert [r["evento_id"] for r in page + rest] == [r["evento_id"] for r in rows]

    with_simulated = client.get("/api/admin/cruces?simulados=true", headers=ADMIN_AUTH).json()
    assert len(with_simulated) == 4

    by_light = client.get(f"/api/admin/cruces?semaforo={LIGHT}", headers=ADMIN_AUTH).json()
    assert len(by_light) == 3


def test_corrige_un_semaforo_y_un_evento_mas_nuevo_de_la_app_manda(client):
    send(client, [light_event("creado", 3)])

    response = client.patch(
        f"/api/admin/semaforos/{LIGHT}",
        json={"nombre": "Calle 26 con 13", "verificado": True},
        headers=ADMIN_AUTH,
    )
    assert response.status_code == 200
    assert response.json()["nombre"] == "Calle 26 con 13"
    assert response.json()["verificado"] is True

    send(client, [light_event("editado", 3, momento=BASE_MS + 1, nombre="De la app")])
    light = client.get(f"/api/admin/semaforos/{LIGHT}", headers=ADMIN_AUTH).json()
    assert light["nombre"] == "De la app"
    # La app no toca lo que decide la administración
    assert light["verificado"] is True


def test_rechaza_cambios_que_no_se_pueden_hacer(client):
    send(client, [light_event("creado", 3)])
    for body in ({"lat": 100}, {"dispositivo": "otro"}, {"nombre": ""}):
        response = client.patch(f"/api/admin/semaforos/{LIGHT}", json=body, headers=ADMIN_AUTH)
        assert response.status_code == 422


def test_borra_un_semaforo(client):
    send(client, [light_event("creado", 3)])

    assert client.delete(f"/api/admin/semaforos/{LIGHT}", headers=ADMIN_AUTH).status_code == 204
    assert client.get("/api/semaforos").json() == []
    deleted = client.get("/api/admin/semaforos?borrados=true", headers=ADMIN_AUTH).json()
    assert [light["borrado"] for light in deleted] == [True]


def test_responde_404_si_no_existe(client):
    assert client.get("/api/admin/semaforos/nada", headers=ADMIN_AUTH).status_code == 404
    assert client.patch("/api/admin/semaforos/nada", json={}, headers=ADMIN_AUTH).status_code == 404
    assert client.delete("/api/admin/semaforos/nada", headers=ADMIN_AUTH).status_code == 404
    missing = "/api/admin/reportes/00000000-0000-4000-8000-000000000000"
    assert client.delete(missing, headers=ADMIN_AUTH).status_code == 404


def test_borra_un_reporte(client):
    report = client.post(
        "/api/reportes",
        json={"name": "Cruce", "issue": "broken", "position": {"lat": 4.6, "lng": -74.1}},
    ).json()
    assert (
        client.delete(f"/api/admin/reportes/{report['id']}", headers=ADMIN_AUTH).status_code == 204
    )
    assert client.get("/api/reportes").json() == []
