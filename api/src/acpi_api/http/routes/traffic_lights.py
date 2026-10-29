from fastapi import APIRouter

from acpi_api.domain.traffic_lights import PublicTrafficLight
from acpi_api.http.dependencies import RepositoriesDep

router = APIRouter(tags=["semáforos"])


@router.get("/api/semaforos", response_model=list[PublicTrafficLight])
async def list_traffic_lights(repositories: RepositoriesDep) -> list[PublicTrafficLight]:
    """Semáforos vigentes: posición y origen, sin nombre ni dispositivo."""
    lights = await repositories.traffic_lights.find(include_deleted=False)
    return [light.public() for light in lights]
