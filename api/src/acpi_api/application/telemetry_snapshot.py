from datetime import UTC, datetime, timedelta

from acpi_api.application.ports import CrossingReader, TrafficLightRepository
from acpi_api.domain.telemetry import DEFAULT_POLICY, AnonymityPolicy, build_snapshot


async def telemetry_snapshot(
    crossings: CrossingReader,
    traffic_lights: TrafficLightRepository,
    *,
    range_days: int,
    policy: AnonymityPolicy = DEFAULT_POLICY,
    now: datetime | None = None,
) -> dict:
    generated_at = now or datetime.now(UTC)
    since = generated_at - timedelta(days=range_days)
    cells = await crossings.cells(since, policy.cell_decimals)
    lights = await traffic_lights.find(include_deleted=False)
    return build_snapshot(
        cells,
        sorted((light.public() for light in lights), key=lambda light: light.id),
        generated_at=generated_at,
        since=since,
        policy=policy,
    )
