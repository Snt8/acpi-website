"""
Contratos de almacenamiento. Los casos de uso y las rutas dependen de estos
protocolos, no de Supabase: `infrastructure` trae una implementación contra
Supabase y otra en memoria con el mismo comportamiento.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol

from acpi_api.domain.crossings import Crossing, CrossingFilters
from acpi_api.domain.events import AppEvent
from acpi_api.domain.reports import Report
from acpi_api.domain.telemetry import CellAggregate
from acpi_api.domain.traffic_lights import TrafficLight, TrafficLightChange, TrafficLightUpdate


class StorageUnavailable(RuntimeError):
    """La base no respondió. Es transitorio: quien llama puede reintentar."""


@dataclass(frozen=True, slots=True)
class EventBatch:
    """Eventos válidos de un lote, sin ids repetidos, y lo que se deriva de ellos."""

    events: list[AppEvent]
    crossings: list[Crossing]
    traffic_lights: list[TrafficLightChange]


class EventStore(Protocol):
    async def save(self, batch: EventBatch) -> int:
        """
        Guarda el lote de forma atómica e idempotente: un evento cuyo id ya
        existe no se repite, y un cambio de semáforo sólo se aplica si es más
        nuevo que el guardado. Devuelve cuántos eventos eran nuevos.
        """
        ...

    async def recent(self, event_type: str | None, limit: int) -> list[dict]:
        """Últimos eventos tal como llegaron, del más nuevo al más viejo."""
        ...


class CrossingReader(Protocol):
    async def find(self, filters: CrossingFilters) -> list[Crossing]: ...

    async def cells(self, since: datetime, decimals: int) -> list[CellAggregate]:
        """Sumas de los cruces reales desde `since`, por celda de `decimals` decimales."""
        ...


class TrafficLightRepository(Protocol):
    async def find(self, *, include_deleted: bool) -> list[TrafficLight]: ...

    async def get(self, light_id: str) -> TrafficLight | None: ...

    async def update(self, light_id: str, changes: TrafficLightUpdate) -> TrafficLight | None: ...

    async def delete(self, light_id: str) -> bool:
        """Lo marca como borrado; un evento más nuevo de la app puede devolverlo."""
        ...


class ReportRepository(Protocol):
    async def find(self, limit: int) -> list[Report]:
        """Del más reciente al más viejo."""
        ...

    async def add(self, report: Report) -> None: ...

    async def delete(self, report_id: str) -> bool: ...


class HealthCheck(Protocol):
    async def ping(self) -> None:
        """Lanza StorageUnavailable si la base no responde."""
        ...


@dataclass(frozen=True, slots=True)
class Repositories:
    events: EventStore
    crossings: CrossingReader
    traffic_lights: TrafficLightRepository
    reports: ReportRepository
    health: HealthCheck
