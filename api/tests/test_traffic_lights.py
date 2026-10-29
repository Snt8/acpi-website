from acpi_api.domain.events import parse_event
from acpi_api.domain.traffic_lights import fold_traffic_light_events, public_id
from factories import BASE_MS, DEVICE, light_event


def fold(*raw_events):
    return {
        c.semaforo_id: c for c in fold_traffic_light_events([parse_event(e) for e in raw_events])
    }


def test_el_id_publico_es_el_mismo_que_publica_la_web():
    # createHash('sha256').update('mh3k2a9x1c4f:3').digest('hex').slice(0, 16) en Node
    assert public_id(DEVICE, 3) == "a24e403667d0e94b"


def test_se_queda_con_el_ultimo_evento_por_momento_aunque_llegue_antes():
    [change] = fold(
        light_event("editado", 3, momento=BASE_MS + 2, nombre="Nuevo"),
        light_event("creado", 3, momento=BASE_MS + 1, nombre="Viejo"),
    ).values()
    assert change.nombre == "Nuevo"
    # La edición no trae origen: conserva el de la creación
    assert change.origen == "brazalete"


def test_un_borrado_conserva_lo_ultimo_conocido():
    [change] = fold(
        light_event("creado", 3, momento=BASE_MS),
        light_event("borrado", 3, momento=BASE_MS + 1),
    ).values()
    assert change.borrado
    assert (change.lat, change.origen) == (4.609712, "brazalete")


def test_un_borrado_sin_historia_no_trae_posicion():
    [change] = fold(light_event("borrado", 3)).values()
    assert change.borrado and change.lat is None


def test_separa_los_semaforos_de_cada_telefono():
    changes = fold_traffic_light_events(
        [
            parse_event(light_event("creado", 3)),
            parse_event(light_event("creado", 3, dispositivo="otro")),
        ]
    )
    assert len({c.id for c in changes}) == 2
