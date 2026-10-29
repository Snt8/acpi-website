from fastapi import APIRouter, Response

from acpi_api.application.telemetry_snapshot import telemetry_snapshot
from acpi_api.http.dependencies import RepositoriesDep, SettingsDep

router = APIRouter(tags=["telemetría"])

# Las cifras cambian poco: que el navegador y cualquier caché intermedia las reutilicen
_CACHE_SECONDS = 300


@router.get("/api/telemetria")
async def telemetry(
    repositories: RepositoriesDep, settings: SettingsDep, response: Response
) -> dict:
    """
    Cifras anónimas de los cruces y registro público de semáforos, con la
    forma del `telemetry.json` que publica la web (`Snapshot`, versión 2).
    """
    response.headers["Cache-Control"] = f"public, max-age={_CACHE_SECONDS}"
    return await telemetry_snapshot(
        repositories.crossings,
        repositories.traffic_lights,
        range_days=settings.telemetry_range_days,
    )
