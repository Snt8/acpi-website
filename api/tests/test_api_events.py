from dataclasses import replace

from fastapi.testclient import TestClient

from acpi_api.application.ports import StorageUnavailable
from acpi_api.infrastructure.memory_repositories import MemoryDatabase, create_memory_repositories
from acpi_api.main import create_app
from conftest import APP_AUTH, make_settings, send
from factories import crossings, light_event, probe_event


def test_guarda_el_lote_y_responde_lo_que_hizo(client, db: MemoryDatabase):
    events = [*crossings(2, 4.6, -74.08), light_event("creado", 3), probe_event()]
    response = send(client, events)

    assert response.status_code == 200
    assert response.json() == {"recibidos": 4, "guardados": 4, "duplicados": 0, "rechazados": []}
    assert len(db.events) == 4
    assert len(db.crossings) == 2
    assert len(db.traffic_lights) == 1


def test_reenviar_un_lote_no_duplica_nada(client, db: MemoryDatabase):
    # La app reenvía el lote si se pierde la respuesta
    events = crossings(3, 4.6, -74.08)
    send(client, events)
    response = send(client, events)

    assert response.json()["duplicados"] == 3
    assert response.json()["guardados"] == 0
    assert len(db.crossings) == 3


def test_un_evento_mal_formado_no_tumba_el_resto_del_lote(client, db: MemoryDatabase):
    good = crossings(1, 4.6, -74.08)[0]
    bad = crossings(1, 4.6, -74.08)[0] | {"lat": 200}
    response = send(client, [good, bad])

    assert response.status_code == 200
    body = response.json()
    assert body["guardados"] == 1
    [rejected] = body["rechazados"]
    assert (rejected["indice"], rejected["id"]) == (1, bad["id"])
    assert "lat" in rejected["motivo"]
    assert list(db.events) == [good["id"]]


def test_un_cuerpo_sin_lista_de_eventos_se_rechaza_con_422(client):
    # 422: la app descarta el lote, porque nunca se va a aceptar
    response = client.post("/api/eventos", json={"otra": []}, headers=APP_AUTH)
    assert response.status_code == 422


def test_un_lote_demasiado_grande_se_rechaza_con_413(client):
    response = send(client, [probe_event() for _ in range(501)])
    assert response.status_code == 413


def test_un_cuerpo_demasiado_grande_se_rechaza_antes_de_leerlo():
    app = create_app(make_settings(max_body_bytes=100), create_memory_repositories())
    with TestClient(app) as client:
        response = send(client, crossings(3, 4.6, -74.08))
    assert response.status_code == 413


def test_sin_token_o_con_otro_responde_401_para_que_la_app_reintente(client):
    events = crossings(1, 4.6, -74.08)
    assert send(client, events, headers={"X": "y"}).status_code == 401
    assert send(client, events, headers={"Authorization": "Bearer otro"}).status_code == 401


def test_el_token_de_administracion_no_sirve_para_escribir_eventos(client):
    response = send(
        client, crossings(1, 4.6, -74.08), headers={"Authorization": "Bearer token-admin"}
    )
    assert response.status_code == 401


def test_sin_token_configurado_la_ruta_queda_abierta():
    app = create_app(make_settings(api_token_app=""), create_memory_repositories())
    with TestClient(app) as client:
        assert send(client, crossings(1, 4.6, -74.08), headers={}).status_code == 200


class _BrokenStore:
    async def save(self, batch):
        raise StorageUnavailable("sin red")

    async def recent(self, event_type, limit):
        raise StorageUnavailable("sin red")


def test_si_la_base_no_responde_devuelve_503_para_que_la_app_reintente():
    repositories = replace(create_memory_repositories(), events=_BrokenStore())
    app = create_app(make_settings(), repositories)
    with TestClient(app) as client:
        response = send(client, crossings(1, 4.6, -74.08))
    assert response.status_code == 503
    assert response.headers["Retry-After"] == "30"
