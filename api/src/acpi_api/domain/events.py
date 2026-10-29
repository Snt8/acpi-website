"""
Eventos que envía la app móvil (formato v3, `docs/servidor-api.md` en ACPI).

Los nombres de los campos son los del contrato de la app, en español, porque
son los que viajan por la red y los que se guardan en la base.
"""

from datetime import UTC, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, ValidationError, model_validator

EVENT_VERSION = 3

# Un `momento` fuera de este rango es un reloj roto, no un evento real
_MIN_MS = 1_577_836_800_000  # 2020-01-01
_MAX_MS = 4_102_444_800_000  # 2100-01-01

Millis = Annotated[int, Field(ge=_MIN_MS, le=_MAX_MS)]
Latitude = Annotated[float, Field(ge=-90, le=90)]
Longitude = Annotated[float, Field(ge=-180, le=180)]
Seconds = Annotated[float, Field(ge=0, le=86_400)]
Meters = Annotated[float, Field(ge=0, le=100_000)]
Count = Annotated[int, Field(ge=0, le=10_000_000)]
Dbm = Annotated[int, Field(ge=-127, le=20)]
ShortText = Annotated[str, Field(min_length=1, max_length=64)]


def from_millis(ms: int) -> datetime:
    return datetime.fromtimestamp(ms / 1000, tz=UTC)


class _Event(BaseModel):
    # Los campos que la app agregue en el futuro se guardan tal cual en `eventos.datos`
    model_config = ConfigDict(extra="allow", frozen=True)

    v: Literal[3]
    id: ShortText
    dispositivo: ShortText
    momento: Millis

    @property
    def occurred_at(self) -> datetime:
        return from_millis(self.momento)


def _require_pair(lat: float | None, lon: float | None) -> None:
    if (lat is None) != (lon is None):
        raise ValueError("lat y lon van juntas: las dos o ninguna")


class CrossingEvent(_Event):
    """Resumen de una sesión con el brazalete, enviado al terminarla."""

    tipo: Literal["cruce"]
    sesion: ShortText
    inicio: Millis
    simulado: bool = False
    lat: Latitude | None = None
    lon: Longitude | None = None
    precision_m: Meters | None = None
    semaforo_id: int | None = None
    espera_s: Seconds | None = None
    cruzo: bool
    duracion_cruce_s: Seconds | None = None
    verde_restante_s: Seconds | None = None
    rumbo_cruce: Annotated[float, Field(ge=0, le=360)] | None = None
    veces_mal_orientado: Count = 0
    duracion_sesion_s: Seconds
    # Enlaces: `null` con firmware sin telemetría extendida
    paquetes_ble: Count = 0
    paquetes_ble_perdidos: Count | None = None
    recepcion_semaforo_pct: Annotated[int, Field(ge=0, le=100)] | None = None
    rssi_semaforo_medio_dbm: Dbm | None = None
    rssi_semaforo_min_dbm: Dbm | None = None
    semaforo_ble_id: int | None = None
    brujula_sin_calibrar: bool = False

    @model_validator(mode="after")
    def _check(self):
        _require_pair(self.lat, self.lon)
        return self


TrafficLightAction = Literal["creado", "editado", "borrado"]
TrafficLightOrigin = Literal["manual", "brazalete"]


class TrafficLightEvent(_Event):
    """Alta, edición o baja de un semáforo en la lista del teléfono."""

    tipo: Literal["semaforo"]
    accion: TrafficLightAction
    semaforo_id: int
    nombre: Annotated[str, Field(max_length=120)] | None = None
    lat: Latitude | None = None
    lon: Longitude | None = None
    precision_m: Meters | None = None
    # Sólo viaja en `creado`
    origen: TrafficLightOrigin | None = None

    @model_validator(mode="after")
    def _check(self):
        _require_pair(self.lat, self.lon)
        if self.accion != "borrado" and self.lat is None:
            raise ValueError(f"un semáforo {self.accion} necesita lat y lon")
        return self


class ProbeEvent(_Event):
    """Ajustes → Diagnóstico → Enviar dato de prueba."""

    tipo: Literal["prueba"]
    mensaje: Annotated[str, Field(max_length=280)] | None = None


AppEvent = CrossingEvent | TrafficLightEvent | ProbeEvent

_adapter: TypeAdapter[AppEvent] = TypeAdapter(Annotated[AppEvent, Field(discriminator="tipo")])


class InvalidEvent(ValueError):
    """El evento no cumple el contrato: nunca se va a aceptar, así que se descarta."""


def parse_event(raw: object) -> AppEvent:
    try:
        return _adapter.validate_python(raw)
    except ValidationError as error:
        first = error.errors(include_url=False)[0]
        where = ".".join(str(part) for part in first["loc"]) or "evento"
        raise InvalidEvent(f"{where}: {first['msg']}") from None
