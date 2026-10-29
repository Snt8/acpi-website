"""
Repositorios en memoria con el mismo comportamiento que los de Supabase. Sirven
para las pruebas y para levantar el servidor en local sin base (`STORAGE=memory`).
Los datos se pierden al reiniciar.
"""

from dataclasses import dataclass, field
from datetime import UTC, datetime

from acpi_api.application.ports import EventBatch, Repositories
from acpi_api.domain.crossings import Crossing, CrossingFilters
from acpi_api.domain.events import AppEvent
from acpi_api.domain.reports import Report
from acpi_api.domain.telemetry import CellAggregate, Metric
from acpi_api.domain.traffic_lights import TrafficLight, TrafficLightChange, TrafficLightUpdate


@dataclass
class MemoryDatabase:
    events: dict[str, tuple[AppEvent, datetime]] = field(default_factory=dict)
    crossings: dict[str, Crossing] = field(default_factory=dict)
    traffic_lights: dict[str, TrafficLight] = field(default_factory=dict)
    reports: dict[str, Report] = field(default_factory=dict)


def create_memory_repositories(db: MemoryDatabase | None = None) -> Repositories:
    db = db or MemoryDatabase()
    return Repositories(
        events=MemoryEventStore(db),
        crossings=MemoryCrossingReader(db),
        traffic_lights=MemoryTrafficLightRepository(db),
        reports=MemoryReportRepository(db),
        health=MemoryHealthCheck(),
    )


def _apply_change(current: TrafficLight | None, change: TrafficLightChange) -> TrafficLight:
    """Lo mismo que el `on conflict` de `registrar_eventos` en la migración."""
    now = datetime.now(UTC)
    if current is None:
        return TrafficLight(
            **{k: getattr(change, k) for k in TrafficLightChange.__slots__},
            verificado=False,
            creado_en=now,
            actualizado_en=now,
        )
    if change.ultimo_evento_en < current.ultimo_evento_en:
        return current
    return current.model_copy(
        update={
            "borrado": change.borrado,
            "nombre": change.nombre if change.nombre is not None else current.nombre,
            "lat": change.lat if change.lat is not None else current.lat,
            "lon": change.lon if change.lon is not None else current.lon,
            "precision_m": current.precision_m if change.borrado else change.precision_m,
            "origen": change.origen or current.origen,
            "ultimo_evento_en": change.ultimo_evento_en,
            "actualizado_en": now,
        }
    )


class MemoryEventStore:
    def __init__(self, db: MemoryDatabase) -> None:
        self._db = db

    async def save(self, batch: EventBatch) -> int:
        received_at = datetime.now(UTC)
        new = [e for e in batch.events if e.id not in self._db.events]
        for event in new:
            self._db.events[event.id] = (event, received_at)
        for crossing in batch.crossings:
            self._db.crossings.setdefault(crossing.evento_id, crossing)
        for change in batch.traffic_lights:
            self._db.traffic_lights[change.id] = _apply_change(
                self._db.traffic_lights.get(change.id), change
            )
        return len(new)

    async def recent(self, event_type: str | None, limit: int) -> list[dict]:
        rows = [
            {
                "id": event.id,
                "version": event.v,
                "tipo": event.tipo,
                "dispositivo": event.dispositivo,
                "momento": event.occurred_at.isoformat(),
                "recibido_en": received_at.isoformat(),
                "datos": event.model_dump(mode="json"),
            }
            for event, received_at in self._db.events.values()
            if event_type is None or event.tipo == event_type
        ]
        rows.sort(key=lambda row: row["momento"], reverse=True)
        return rows[:limit]


class MemoryCrossingReader:
    def __init__(self, db: MemoryDatabase) -> None:
        self._db = db

    async def find(self, filters: CrossingFilters) -> list[Crossing]:
        rows = [
            c
            for c in self._db.crossings.values()
            if (filters.since is None or c.momento >= filters.since)
            and (filters.until is None or c.momento < filters.until)
            and (filters.traffic_light is None or c.semaforo == filters.traffic_light)
            and (filters.include_simulated or not c.simulado)
        ]
        rows.sort(key=lambda c: c.momento, reverse=True)
        return rows[: filters.limit]

    async def cells(self, since: datetime, decimals: int) -> list[CellAggregate]:
        cells: dict[tuple[float | None, float | None], CellAggregate] = {}
        for c in self._db.crossings.values():
            if c.simulado or c.momento < since:
                continue
            key = (
                (None, None)
                if c.lat is None or c.lon is None
                else (round(c.lat, decimals), round(c.lon, decimals))
            )
            one = CellAggregate(
                lat=key[0],
                lng=key[1],
                sessions=1,
                disoriented=int(c.veces_mal_orientado > 0),
                wait=_metric(c.espera_s),
                crossing=_metric(c.duracion_cruce_s if c.cruzo else None),
                green_left=_metric(c.verde_restante_s if c.cruzo else None),
            )
            cells[key] = cells[key] + one if key in cells else one
        return list(cells.values())


def _metric(value: float | None) -> Metric:
    return Metric() if value is None else Metric(value, 1)


class MemoryTrafficLightRepository:
    def __init__(self, db: MemoryDatabase) -> None:
        self._db = db

    async def find(self, *, include_deleted: bool) -> list[TrafficLight]:
        lights = (
            light
            for light in self._db.traffic_lights.values()
            if include_deleted or not light.borrado
        )
        return sorted(lights, key=lambda light: light.id)

    async def get(self, light_id: str) -> TrafficLight | None:
        return self._db.traffic_lights.get(light_id)

    def _patch(self, light_id: str, values: dict) -> TrafficLight | None:
        current = self._db.traffic_lights.get(light_id)
        if current is None:
            return None
        updated = current.model_copy(update={**values, "actualizado_en": datetime.now(UTC)})
        self._db.traffic_lights[light_id] = updated
        return updated

    async def update(self, light_id: str, changes: TrafficLightUpdate) -> TrafficLight | None:
        return self._patch(light_id, changes.model_dump(exclude_unset=True))

    async def delete(self, light_id: str) -> bool:
        return self._patch(light_id, {"borrado": True}) is not None


class MemoryReportRepository:
    def __init__(self, db: MemoryDatabase) -> None:
        self._db = db

    async def find(self, limit: int) -> list[Report]:
        reports = sorted(self._db.reports.values(), key=lambda r: r.reported_at, reverse=True)
        return reports[:limit]

    async def add(self, report: Report) -> None:
        self._db.reports[report.id] = report

    async def delete(self, report_id: str) -> bool:
        return self._db.reports.pop(report_id, None) is not None


class MemoryHealthCheck:
    async def ping(self) -> None:
        return None
