"""
Registro de semáforos con baliza.

La app manda un evento cada vez que crea, edita o borra un semáforo en el
teléfono. Un semáforo se identifica por la pareja `dispositivo` + `semaforo_id`
y su estado actual es el último evento de esa pareja, por `momento`: así da
igual el orden en que lleguen los lotes o que se repitan.
"""

import hashlib
from dataclasses import dataclass, replace
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from acpi_api.domain.events import Latitude, Longitude, TrafficLightEvent, TrafficLightOrigin

# ~1 m: la posición de un poste no es un dato personal
PUBLIC_POSITION_DECIMALS = 5


def public_id(device: str, light_id: int) -> str:
    """
    Identificador público y estable de un semáforo. Resume la pareja que lo
    identifica en la app sin dejar ver el seudónimo del teléfono ni agrupar los
    semáforos de un mismo teléfono. Es el mismo que publica la web
    (`app/scripts/telemetry/traffic-lights.mjs`), así que los enlaces no cambian.
    """
    return hashlib.sha256(f"{device}:{light_id}".encode()).hexdigest()[:16]


@dataclass(frozen=True, slots=True)
class TrafficLightChange:
    """Estado al que lleva un semáforo su último evento del lote."""

    id: str
    dispositivo: str
    semaforo_id: int
    borrado: bool
    nombre: str | None
    lat: float | None
    lon: float | None
    precision_m: float | None
    origen: TrafficLightOrigin | None
    ultimo_evento_en: datetime


def fold_traffic_light_events(events: list[TrafficLightEvent]) -> list[TrafficLightChange]:
    """
    Reduce los eventos de un lote a un cambio por semáforo, aplicándolos en
    orden de `momento`. El repositorio sólo aplica el cambio si es más nuevo
    que el que ya tiene guardado.
    """
    changes: dict[str, TrafficLightChange] = {}
    for event in sorted(events, key=lambda e: e.momento):
        key = public_id(event.dispositivo, event.semaforo_id)
        previous = changes.get(key)
        # `origen` sólo viaja en `creado`; una edición o un borrado conservan el que había
        if event.accion == "creado":
            origin = event.origen
        else:
            origin = previous.origen if previous else None
        change = TrafficLightChange(
            id=key,
            dispositivo=event.dispositivo,
            semaforo_id=event.semaforo_id,
            borrado=event.accion == "borrado",
            nombre=event.nombre,
            lat=event.lat,
            lon=event.lon,
            precision_m=event.precision_m,
            origen=origin,
            ultimo_evento_en=event.occurred_at,
        )
        if change.borrado and previous:
            # Un borrado sólo trae el id: se conserva lo último conocido
            change = replace(previous, borrado=True, ultimo_evento_en=change.ultimo_evento_en)
        changes[key] = change
    return list(changes.values())


class TrafficLight(BaseModel):
    """Fila de `semaforos`, tal como la ve la administración."""

    model_config = ConfigDict(frozen=True)

    id: str
    dispositivo: str
    semaforo_id: int
    nombre: str | None
    lat: float | None
    lon: float | None
    precision_m: float | None
    origen: TrafficLightOrigin | None
    borrado: bool
    verificado: bool
    ultimo_evento_en: datetime
    creado_en: datetime
    actualizado_en: datetime

    def public(self) -> "PublicTrafficLight":
        return PublicTrafficLight(
            id=self.id,
            lat=round(self.lat, PUBLIC_POSITION_DECIMALS),
            lng=round(self.lon, PUBLIC_POSITION_DECIMALS),
            origin=self.origen,
        )


class PublicTrafficLight(BaseModel):
    """
    Lo que se publica de un semáforo: la forma `TrafficLight` de la web
    (`app/src/core/telemetry/snapshot.js`). El nombre no, porque es texto libre.
    """

    id: str
    lat: float
    lng: float
    origin: TrafficLightOrigin | None


class TrafficLightUpdate(BaseModel):
    """Cambios que puede hacer la administración. Lo que no se envía no cambia."""

    model_config = ConfigDict(extra="forbid")

    nombre: Annotated[str, Field(min_length=1, max_length=120)] | None = None
    lat: Latitude | None = None
    lon: Longitude | None = None
    verificado: bool | None = None
