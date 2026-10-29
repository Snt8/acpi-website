"""
Consulta de los datos sin agregar y correcciones a mano. Todo pide el token
de administración (API_TOKEN_ADMIN), que nunca debe ir en la app ni en la web.
"""

from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from acpi_api.domain.crossings import Crossing, CrossingFilters
from acpi_api.domain.traffic_lights import TrafficLight, TrafficLightUpdate
from acpi_api.http.dependencies import RepositoriesDep, require_admin_token

router = APIRouter(
    prefix="/api/admin", tags=["administración"], dependencies=[Depends(require_admin_token)]
)

Limit = Annotated[int, Query(ge=1, le=500)]


def _not_found(what: str) -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, f"No existe {what}.")


@router.get("/eventos")
async def list_events(
    repositories: RepositoriesDep,
    tipo: Literal["cruce", "semaforo", "prueba"] | None = None,
    limite: Limit = 50,
) -> list[dict]:
    """Últimos eventos tal como llegaron de la app (sirve para ver los de prueba)."""
    return await repositories.events.recent(tipo, limite)


@router.get("/cruces", response_model=list[Crossing])
async def list_crossings(
    repositories: RepositoriesDep,
    desde: datetime | None = None,
    hasta: Annotated[
        datetime | None, Query(description="Exclusivo: sirve de cursor para paginar")
    ] = None,
    semaforo: str | None = None,
    simulados: bool = False,
    limite: Limit = 100,
) -> list[Crossing]:
    return await repositories.crossings.find(
        CrossingFilters(
            since=desde,
            until=hasta,
            traffic_light=semaforo,
            include_simulated=simulados,
            limit=limite,
        )
    )


@router.get("/semaforos", response_model=list[TrafficLight])
async def list_traffic_lights(
    repositories: RepositoriesDep, borrados: bool = False
) -> list[TrafficLight]:
    return await repositories.traffic_lights.find(include_deleted=borrados)


@router.get("/semaforos/{light_id}", response_model=TrafficLight)
async def get_traffic_light(light_id: str, repositories: RepositoriesDep) -> TrafficLight:
    light = await repositories.traffic_lights.get(light_id)
    if light is None:
        raise _not_found("ese semáforo")
    return light


@router.patch("/semaforos/{light_id}", response_model=TrafficLight)
async def update_traffic_light(
    light_id: str, changes: TrafficLightUpdate, repositories: RepositoriesDep
) -> TrafficLight:
    """
    Corrige un semáforo. Si después la app lo edita, su evento manda: los
    cambios de la app son los de la persona que lo tiene en su lista.
    """
    light = await repositories.traffic_lights.update(light_id, changes)
    if light is None:
        raise _not_found("ese semáforo")
    return light


@router.delete("/semaforos/{light_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_traffic_light(light_id: str, repositories: RepositoriesDep) -> Response:
    if not await repositories.traffic_lights.delete(light_id):
        raise _not_found("ese semáforo")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/reportes/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(report_id: UUID, repositories: RepositoriesDep) -> Response:
    if not await repositories.reports.delete(str(report_id)):
        raise _not_found("ese reporte")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
