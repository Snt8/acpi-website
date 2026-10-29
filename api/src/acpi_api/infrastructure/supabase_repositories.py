"""
Repositorios contra Supabase (PostgREST). El esquema y las funciones que usan
están en `supabase/migrations/`. Se conectan con la clave secreta, que salta
el RLS: las tablas no tienen políticas, así que nadie más puede leerlas.
"""

import logging
from collections.abc import Awaitable
from dataclasses import asdict
from datetime import UTC, datetime
from typing import Any

import httpx
from postgrest.exceptions import APIError
from supabase import AsyncClient, AsyncClientOptions, acreate_client

from acpi_api.application.ports import (
    EventBatch,
    Repositories,
    StorageUnavailable,
)
from acpi_api.domain.crossings import Crossing, CrossingFilters
from acpi_api.domain.reports import Position, Report
from acpi_api.domain.telemetry import CellAggregate, Metric
from acpi_api.domain.traffic_lights import TrafficLight, TrafficLightUpdate

logger = logging.getLogger(__name__)

# El plan gratis de Render corta la petición a los 100 s: mejor fallar antes y reintentar
_TIMEOUT_S = 15

_CROSSING_COLUMNS = ",".join(Crossing.model_fields)
_TRAFFIC_LIGHT_COLUMNS = ",".join(TrafficLight.model_fields)
_REPORT_COLUMNS = "id,nombre,problema,nota,lat,lng,reportado_en"


async def create_supabase_repositories(
    url: str, secret_key: str, http_client: httpx.AsyncClient | None = None
) -> Repositories:
    """`http_client` deja a las pruebas sustituir la red por un transporte simulado."""
    client = await acreate_client(
        url,
        secret_key,
        options=AsyncClientOptions(
            auto_refresh_token=False,
            persist_session=False,
            httpx_client=http_client or httpx.AsyncClient(timeout=_TIMEOUT_S),
        ),
    )
    return Repositories(
        events=SupabaseEventStore(client),
        crossings=SupabaseCrossingReader(client),
        traffic_lights=SupabaseTrafficLightRepository(client),
        reports=SupabaseReportRepository(client),
        health=SupabaseHealthCheck(client),
    )


async def _run(request: Awaitable[Any]) -> Any:
    """Ejecuta una consulta y traduce cualquier fallo a StorageUnavailable."""
    try:
        return (await request).data
    except (APIError, httpx.HTTPError) as error:
        logger.exception("Supabase no respondió")
        raise StorageUnavailable(str(error)) from error


def event_batch_params(batch: EventBatch) -> dict:
    """Argumentos de `registrar_eventos`: una lista JSON por tabla."""
    return {
        "p_eventos": [
            {
                "id": event.id,
                "version": event.v,
                "tipo": event.tipo,
                "dispositivo": event.dispositivo,
                "momento": event.occurred_at.isoformat(),
                "datos": event.model_dump(mode="json"),
            }
            for event in batch.events
        ],
        "p_cruces": [crossing.model_dump(mode="json") for crossing in batch.crossings],
        "p_semaforos": [
            {**asdict(change), "ultimo_evento_en": change.ultimo_evento_en.isoformat()}
            for change in batch.traffic_lights
        ],
    }


def cell_from_row(row: dict) -> CellAggregate:
    """Una fila de `resumen_cruces_por_celda`."""
    return CellAggregate(
        lat=row["lat"],
        lng=row["lon"],
        sessions=row["sesiones"],
        disoriented=row["desorientadas"],
        wait=Metric(row["espera_suma"], row["espera_n"]),
        crossing=Metric(row["cruce_suma"], row["cruce_n"]),
        green_left=Metric(row["verde_suma"], row["verde_n"]),
    )


class SupabaseEventStore:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def save(self, batch: EventBatch) -> int:
        return int(
            await _run(self._client.rpc("registrar_eventos", event_batch_params(batch)).execute())
        )

    async def recent(self, event_type: str | None, limit: int) -> list[dict]:
        query = self._client.table("eventos").select(
            "id,version,tipo,dispositivo,momento,recibido_en,datos"
        )
        if event_type:
            query = query.eq("tipo", event_type)
        return await _run(query.order("momento", desc=True).limit(limit).execute())


class SupabaseCrossingReader:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def find(self, filters: CrossingFilters) -> list[Crossing]:
        query = self._client.table("cruces").select(_CROSSING_COLUMNS)
        if filters.since:
            query = query.gte("momento", filters.since.isoformat())
        if filters.until:
            query = query.lt("momento", filters.until.isoformat())
        if filters.traffic_light:
            query = query.eq("semaforo", filters.traffic_light)
        if not filters.include_simulated:
            query = query.eq("simulado", False)
        rows = await _run(query.order("momento", desc=True).limit(filters.limit).execute())
        return [Crossing.model_validate(row) for row in rows]

    async def cells(self, since: datetime, decimals: int) -> list[CellAggregate]:
        rows = await _run(
            self._client.rpc(
                "resumen_cruces_por_celda",
                {"p_desde": since.isoformat(), "p_decimales": decimals},
            ).execute()
        )
        return [cell_from_row(row) for row in rows]


class SupabaseTrafficLightRepository:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    def _select(self):
        return self._client.table("semaforos").select(_TRAFFIC_LIGHT_COLUMNS)

    async def find(self, *, include_deleted: bool) -> list[TrafficLight]:
        query = self._select()
        if not include_deleted:
            query = query.eq("borrado", False)
        rows = await _run(query.order("id").execute())
        return [TrafficLight.model_validate(row) for row in rows]

    async def get(self, light_id: str) -> TrafficLight | None:
        rows = await _run(self._select().eq("id", light_id).limit(1).execute())
        return TrafficLight.model_validate(rows[0]) if rows else None

    async def _patch(self, light_id: str, values: dict) -> list[dict]:
        values = {**values, "actualizado_en": datetime.now(UTC).isoformat()}
        return await _run(
            self._client.table("semaforos").update(values).eq("id", light_id).execute()
        )

    async def update(self, light_id: str, changes: TrafficLightUpdate) -> TrafficLight | None:
        values = changes.model_dump(exclude_unset=True)
        if not values:
            return await self.get(light_id)
        rows = await self._patch(light_id, values)
        return TrafficLight.model_validate(rows[0]) if rows else None

    async def delete(self, light_id: str) -> bool:
        return bool(await self._patch(light_id, {"borrado": True}))


class SupabaseReportRepository:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def find(self, limit: int) -> list[Report]:
        rows = await _run(
            self._client.table("reportes")
            .select(_REPORT_COLUMNS)
            .order("reportado_en", desc=True)
            .limit(limit)
            .execute()
        )
        return [
            Report(
                id=row["id"],
                name=row["nombre"],
                issue=row["problema"],
                note=row["nota"],
                position=Position(lat=row["lat"], lng=row["lng"]),
                reported_at=row["reportado_en"],
            )
            for row in rows
        ]

    async def add(self, report: Report) -> None:
        await _run(
            self._client.table("reportes")
            .insert(
                {
                    "id": report.id,
                    "nombre": report.name,
                    "problema": report.issue,
                    "nota": report.note,
                    "lat": report.position.lat,
                    "lng": report.position.lng,
                    "reportado_en": report.reported_at.isoformat(),
                }
            )
            .execute()
        )

    async def delete(self, report_id: str) -> bool:
        return bool(
            await _run(self._client.table("reportes").delete().eq("id", report_id).execute())
        )


class SupabaseHealthCheck:
    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    async def ping(self) -> None:
        await _run(self._client.table("semaforos").select("id").limit(1).execute())
