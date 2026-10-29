"""Cuerpos de petición y respuesta propios de HTTP; los del dominio se usan tal cual."""

from typing import Any

from pydantic import BaseModel

from acpi_api.application.ingest_events import IngestResult


class EventBatchIn(BaseModel):
    # Cada evento se valida por separado en el caso de uso: aquí basta con que
    # llegue una lista, para que uno mal formado no tumbe el lote entero
    eventos: list[Any]


class RejectedEventOut(BaseModel):
    indice: int
    id: str | None
    motivo: str


class IngestOut(BaseModel):
    recibidos: int
    guardados: int
    duplicados: int
    rechazados: list[RejectedEventOut]

    @classmethod
    def from_result(cls, result: IngestResult) -> "IngestOut":
        return cls(
            recibidos=result.received,
            guardados=result.stored,
            duplicados=result.duplicates,
            rechazados=[
                RejectedEventOut(indice=r.index, id=r.event_id, motivo=r.reason)
                for r in result.rejected
            ],
        )


class HealthOut(BaseModel):
    estado: str
    base: str | None = None
