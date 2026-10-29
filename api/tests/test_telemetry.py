"""
Mismos casos que `app/scripts/telemetry/anonymize.test.mjs` en la web: las
cifras del servidor tienen que coincidir con las de la Action de Grafana.
"""

import asyncio
from datetime import UTC, datetime

from acpi_api.application.ingest_events import build_batch
from acpi_api.application.telemetry_snapshot import telemetry_snapshot
from acpi_api.domain.telemetry import AnonymityPolicy
from acpi_api.domain.traffic_lights import public_id
from acpi_api.infrastructure.memory_repositories import create_memory_repositories
from factories import BASE_MS, DEVICE, crossings, light_event

POLICY = AnonymityPolicy(cell_decimals=3, min_sessions_per_zone=3, max_zones=10)
NOW = datetime(2026, 10, 28, 15, tzinfo=UTC)


def snapshot(*raw_events, policy=POLICY):
    repositories = create_memory_repositories()
    batch, rejected = build_batch(list(raw_events))
    assert not rejected

    async def run():
        await repositories.events.save(batch)
        return await telemetry_snapshot(
            repositories.crossings,
            repositories.traffic_lights,
            range_days=30,
            policy=policy,
            now=NOW,
        )

    return asyncio.run(run())


def test_no_publica_cifras_si_el_total_no_llega_al_minimo():
    result = snapshot(*crossings(2, 4.6, -74.08))
    assert result["status"] == "insufficient"
    assert result["totals"] is None
    assert result["zones"] == []


def test_agrega_por_zona_y_oculta_las_zonas_pequenas_y_las_sesiones_sin_gps():
    result = snapshot(
        *crossings(4, 4.6081, -74.0821),
        *crossings(2, 4.65, -74.05),
        *crossings(1, None, None),
        light_event("creado", 9),
    )

    assert result["status"] == "ok"
    assert result["totals"] == {
        "sessions": 7,
        "avgWaitSeconds": 21,
        "avgCrossingSeconds": 15,
        "disorientationRate": 0.429,
        "avgGreenLeftSeconds": 25,
    }
    assert result["zones"] == [
        {
            "lat": 4.608,
            "lng": -74.082,
            "sessions": 4,
            "avgWaitSeconds": 21.5,
            "avgCrossingSeconds": 15,
            "disorientationRate": 0.25,
            "avgGreenLeftSeconds": 25,
        }
    ]
    assert result["hiddenSessions"] == 3


def test_sin_cruce_no_cuenta_la_duracion_ni_el_verde_restante():
    result = snapshot(*crossings(3, 4.6, -74.08, cruzo=False, duracion_cruce_s=None, espera_s=None))
    assert result["totals"]["avgCrossingSeconds"] is None
    assert result["totals"]["avgGreenLeftSeconds"] is None
    assert result["totals"]["avgWaitSeconds"] is None


def test_el_brazalete_simulado_no_cuenta():
    result = snapshot(*crossings(5, 4.6, -74.08, simulado=True))
    assert result["status"] == "insufficient"


def test_publica_los_semaforos_sin_nombre_y_con_la_forma_de_la_web():
    result = snapshot(
        light_event("creado", 9),
        light_event("creado", 4, origen="manual"),
        light_event("creado", 5),
        light_event("borrado", 5, momento=BASE_MS + 1),
    )
    expected = [
        {"id": public_id(DEVICE, 9), "lat": 4.60971, "lng": -74.08175, "origin": "brazalete"},
        {"id": public_id(DEVICE, 4), "lat": 4.60971, "lng": -74.08175, "origin": "manual"},
    ]
    assert result["trafficLights"] == sorted(expected, key=lambda light: light["id"])


def test_el_resumen_lleva_la_version_y_el_rango_que_espera_la_web():
    result = snapshot()
    assert result["version"] == 2
    assert result["range"] == {"from": "2026-09-28T15:00:00.000Z", "to": "2026-10-28T15:00:00.000Z"}
    assert result["policy"] == {"cellDecimals": 3, "minSessionsPerZone": 3}
