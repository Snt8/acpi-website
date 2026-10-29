"""Cruces: la proyección de los eventos `cruce` que se puede consultar y agregar."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from acpi_api.domain.events import CrossingEvent, from_millis
from acpi_api.domain.traffic_lights import public_id


class Crossing(BaseModel):
    """Fila de `cruces`. Los campos de medida son los del evento."""

    model_config = ConfigDict(frozen=True)

    evento_id: str
    sesion: str
    dispositivo: str
    momento: datetime
    inicio: datetime
    simulado: bool
    lat: float | None
    lon: float | None
    precision_m: float | None
    semaforo_id: int | None
    # Id público del semáforo (`semaforos.id`), para cruzar ambas tablas
    semaforo: str | None
    espera_s: float | None
    cruzo: bool
    duracion_cruce_s: float | None
    verde_restante_s: float | None
    rumbo_cruce: float | None
    veces_mal_orientado: int
    duracion_sesion_s: float
    paquetes_ble: int
    paquetes_ble_perdidos: int | None
    recepcion_semaforo_pct: int | None
    rssi_semaforo_medio_dbm: int | None
    rssi_semaforo_min_dbm: int | None
    semaforo_ble_id: int | None
    brujula_sin_calibrar: bool

    @classmethod
    def from_event(cls, event: CrossingEvent) -> "Crossing":
        measures = event.model_dump(
            include=set(cls.model_fields) - {"evento_id", "momento", "inicio", "semaforo"}
        )
        return cls(
            **measures,
            evento_id=event.id,
            momento=event.occurred_at,
            inicio=from_millis(event.inicio),
            semaforo=(
                None
                if event.semaforo_id is None
                else public_id(event.dispositivo, event.semaforo_id)
            ),
        )


class CrossingFilters(BaseModel):
    """Filtros de la consulta de cruces. Se ordenan del más reciente al más viejo."""

    model_config = ConfigDict(frozen=True)

    since: datetime | None = None
    until: datetime | None = None
    traffic_light: str | None = None
    include_simulated: bool = False
    limit: int = 100
