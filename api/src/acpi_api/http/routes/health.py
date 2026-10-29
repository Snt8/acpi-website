from fastapi import APIRouter, Response, status

from acpi_api.application.ports import StorageUnavailable
from acpi_api.http.dependencies import RepositoriesDep
from acpi_api.http.schemas import HealthOut

router = APIRouter(tags=["salud"])


@router.get("/api/salud", response_model=HealthOut, response_model_exclude_none=True)
async def health(
    repositories: RepositoriesDep, response: Response, base: bool = False
) -> HealthOut:
    """
    Responde en cuanto el proceso está arriba: la app lo llama para despertar
    el servidor de Render. Con `?base=true` comprueba además la base de datos.
    """
    if not base:
        return HealthOut(estado="ok")
    try:
        await repositories.health.ping()
    except StorageUnavailable:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthOut(estado="degradado", base="sin conexión")
    return HealthOut(estado="ok", base="ok")
