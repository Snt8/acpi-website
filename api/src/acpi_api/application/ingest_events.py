from dataclasses import dataclass, field

from acpi_api.application.ports import EventBatch, EventStore
from acpi_api.domain.crossings import Crossing
from acpi_api.domain.events import (
    AppEvent,
    CrossingEvent,
    InvalidEvent,
    TrafficLightEvent,
    parse_event,
)
from acpi_api.domain.traffic_lights import fold_traffic_light_events


@dataclass(frozen=True, slots=True)
class Rejection:
    index: int
    event_id: str | None
    reason: str


@dataclass(frozen=True, slots=True)
class IngestResult:
    received: int
    stored: int
    duplicates: int
    rejected: list[Rejection] = field(default_factory=list)


def _event_id(raw: object) -> str | None:
    value = raw.get("id") if isinstance(raw, dict) else None
    return value if isinstance(value, str) else None


def build_batch(raw_events: list[object]) -> tuple[EventBatch, list[Rejection]]:
    """
    Valida cada evento por separado: uno mal formado se rechaza sin arrastrar
    al resto del lote, porque la app saca el lote entero de su cola en cuanto
    el servidor responde 2xx.
    """
    events: dict[str, AppEvent] = {}
    rejected: list[Rejection] = []
    for index, raw in enumerate(raw_events):
        try:
            event = parse_event(raw)
        except InvalidEvent as error:
            rejected.append(Rejection(index, _event_id(raw), str(error)))
            continue
        # Un id repetido dentro del lote es el mismo evento reenviado
        events.setdefault(event.id, event)

    unique = list(events.values())
    batch = EventBatch(
        events=unique,
        crossings=[Crossing.from_event(e) for e in unique if isinstance(e, CrossingEvent)],
        traffic_lights=fold_traffic_light_events(
            [e for e in unique if isinstance(e, TrafficLightEvent)]
        ),
    )
    return batch, rejected


async def ingest_events(store: EventStore, raw_events: list[object]) -> IngestResult:
    batch, rejected = build_batch(raw_events)
    stored = await store.save(batch) if batch.events else 0
    return IngestResult(
        received=len(raw_events),
        stored=stored,
        duplicates=len(raw_events) - len(rejected) - stored,
        rejected=rejected,
    )
