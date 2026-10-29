"""
Eventos de prueba con el formato v3 de la app. `crossings` y `light_event`
reproducen los de `app/scripts/telemetry/fixtures.mjs` en la web, para
comprobar que las cifras salen iguales que las de la Action de Grafana.
"""

from itertools import count

DEVICE = "mh3k2a9x1c4f"
BASE_MS = 1_793_300_000_000

_ids = count()


def next_id() -> str:
    return f"ev{next(_ids):06d}"


def crossings(n: int, lat: float | None, lon: float | None, **extra) -> list[dict]:
    """`n` sesiones de cruce junto a un punto. La primera, mal orientada."""
    return [
        {
            "v": 3,
            "id": next_id(),
            "tipo": "cruce",
            "dispositivo": DEVICE,
            "momento": BASE_MS + i,
            "sesion": f"mh3k2b0q8d2{i}",
            "inicio": BASE_MS - 60_000 + i,
            "simulado": False,
            "lat": None if lat is None else lat + i * 0.0001,
            "lon": lon,
            "precision_m": 6,
            "semaforo_id": 3,
            "espera_s": 20 + i,
            "cruzo": True,
            "duracion_cruce_s": 15,
            "verde_restante_s": 25,
            "rumbo_cruce": 92,
            "veces_mal_orientado": 1 if i == 0 else 0,
            "duracion_sesion_s": 64.5,
            "paquetes_ble": 120,
            "paquetes_ble_perdidos": 2,
            "recepcion_semaforo_pct": 95,
            "rssi_semaforo_medio_dbm": -61,
            "rssi_semaforo_min_dbm": -78,
            "semaforo_ble_id": 1,
            "brujula_sin_calibrar": False,
            **extra,
        }
        for i in range(n)
    ]


def light_event(accion: str, semaforo_id: int, **extra) -> dict:
    event = {
        "v": 3,
        "id": next_id(),
        "tipo": "semaforo",
        "dispositivo": DEVICE,
        "momento": BASE_MS,
        "accion": accion,
        "semaforo_id": semaforo_id,
    }
    if accion != "borrado":
        event |= {
            "nombre": "Semáforo en Calle 26 13",
            "lat": 4.609712,
            "lon": -74.081753,
            "precision_m": 6,
        }
    if accion == "creado":
        event["origen"] = "brazalete"
    return event | extra


def probe_event(**extra) -> dict:
    return {
        "v": 3,
        "id": next_id(),
        "tipo": "prueba",
        "dispositivo": DEVICE,
        "momento": BASE_MS,
        "mensaje": "Prueba desde Diagnóstico",
        **extra,
    }
