from fastapi import APIRouter, Depends, HTTPException, status

from acpi_api.application.ingest_events import ingest_events
from acpi_api.http.dependencies import RepositoriesDep, SettingsDep, require_app_token
from acpi_api.http.schemas import EventBatchIn, IngestOut

router = APIRouter(tags=["eventos"])


@router.post("/api/eventos", response_model=IngestOut, dependencies=[Depends(require_app_token)])
async def receive_events(
    batch: EventBatchIn, repositories: RepositoriesDep, settings: SettingsDep
) -> IngestOut:
    """
    Recibe un lote de eventos de la app. La app interpreta la respuesta así
    (`app-movil/src/telemetria/servidor.ts`):

    - 2xx: el lote se dio por recibido y sale de la cola. Los eventos
      repetidos se ignoran y los mal formados se listan en `rechazados`.
    - 400, 413 o 422: el lote nunca se va a aceptar y también sale de la cola.
    - Cualquier otro (401, 5xx…): el lote se queda en el teléfono y se reintenta.
    """
    if len(batch.eventos) > settings.max_events_per_batch:
        raise HTTPException(
            status.HTTP_413_CONTENT_TOO_LARGE,
            f"El lote trae {len(batch.eventos)} eventos; el máximo es "
            f"{settings.max_events_per_batch}.",
        )
    result = await ingest_events(repositories.events, batch.eventos)
    return IngestOut.from_result(result)
