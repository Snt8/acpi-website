import pytest

from acpi_api.application.ingest_events import build_batch
from acpi_api.domain.events import (
    CrossingEvent,
    InvalidEvent,
    ProbeEvent,
    TrafficLightEvent,
    parse_event,
)
from factories import crossings, light_event, probe_event


def test_reconoce_cada_tipo_de_evento():
    assert isinstance(parse_event(crossings(1, 4.6, -74.08)[0]), CrossingEvent)
    assert isinstance(parse_event(light_event("creado", 3)), TrafficLightEvent)
    assert isinstance(parse_event(probe_event()), ProbeEvent)


def test_acepta_un_cruce_con_firmware_sin_telemetria_extendida():
    [raw] = crossings(1, 4.6, -74.08)
    for field in ("paquetes_ble_perdidos", "recepcion_semaforo_pct", "rssi_semaforo_medio_dbm"):
        raw[field] = None
    assert parse_event(raw).recepcion_semaforo_pct is None


def test_conserva_los_campos_que_no_conoce():
    event = parse_event(probe_event(campo_nuevo=42))
    assert event.model_dump()["campo_nuevo"] == 42


@pytest.mark.parametrize(
    ("change", "where"),
    [
        ({"v": 2}, "v"),
        ({"tipo": "otro"}, "evento"),
        ({"id": ""}, "id"),
        ({"momento": 12}, "momento"),
        ({"lat": 91}, "lat"),
        ({"lon": None}, "lat y lon"),
        ({"espera_s": -1}, "espera_s"),
        ({"cruzo": None}, "cruzo"),
        ({"recepcion_semaforo_pct": 140}, "recepcion_semaforo_pct"),
    ],
)
def test_rechaza_los_cruces_mal_formados(change, where):
    [raw] = crossings(1, 4.6, -74.08)
    with pytest.raises(InvalidEvent, match=where):
        parse_event(raw | change)


def test_un_semaforo_vigente_necesita_posicion_pero_uno_borrado_no():
    with pytest.raises(InvalidEvent, match="necesita lat y lon"):
        parse_event(light_event("editado", 3, lat=None, lon=None))
    assert parse_event(light_event("borrado", 3)).lat is None


def test_rechaza_lo_que_no_es_un_objeto():
    with pytest.raises(InvalidEvent):
        parse_event("no soy un evento")


def test_el_lote_descarta_los_ids_repetidos_y_separa_los_rechazados():
    [crossing] = crossings(1, 4.6, -74.08)
    light = light_event("creado", 3)
    batch, rejected = build_batch([crossing, crossing, light, {"v": 3}, 7])

    assert [e.id for e in batch.events] == [crossing["id"], light["id"]]
    assert [c.evento_id for c in batch.crossings] == [crossing["id"]]
    assert [t.semaforo_id for t in batch.traffic_lights] == [3]
    assert [(r.index, r.event_id) for r in rejected] == [(3, None), (4, None)]


def test_el_cruce_enlaza_el_id_publico_de_su_semaforo():
    batch, _ = build_batch(crossings(1, 4.6, -74.08) + crossings(1, 4.6, -74.08, semaforo_id=None))
    assert [c.semaforo for c in batch.crossings] == ["a24e403667d0e94b", None]
