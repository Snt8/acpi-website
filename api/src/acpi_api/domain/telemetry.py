"""
Cifras públicas de los cruces y su política de anonimato.

Es la misma política que aplica la web a los datos de Grafana
(`app/scripts/telemetry/anonymize.mjs`) y el resultado tiene la forma de su
`Snapshot` (`app/src/core/telemetry/snapshot.js`), así que la web puede leer
este resumen en lugar del `telemetry.json` que genera cada hora.

- La ubicación se redondea a una cuadrícula de unos 110 m: se publica la zona
  de un cruce, nunca un punto.
- Una zona con menos de `min_sessions_per_zone` cruces no se publica; sus
  cruces siguen contando en el total.
- Si ni siquiera el total llega a ese mínimo, no se publica ninguna cifra.
- Los cruces del brazalete simulado no cuentan.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal

from acpi_api.domain.traffic_lights import PublicTrafficLight

SNAPSHOT_VERSION = 2


@dataclass(frozen=True, slots=True)
class AnonymityPolicy:
    cell_decimals: int = 3
    min_sessions_per_zone: int = 5
    max_zones: int = 12


DEFAULT_POLICY = AnonymityPolicy()


@dataclass(frozen=True, slots=True)
class Metric:
    total: float = 0.0
    count: int = 0

    def __add__(self, other: "Metric") -> "Metric":
        return Metric(self.total + other.total, self.count + other.count)

    def average(self) -> float | None:
        return None if self.count == 0 else round(self.total / self.count, 1)


@dataclass(frozen=True, slots=True)
class CellAggregate:
    """
    Sumas de los cruces de una celda de la cuadrícula, que calcula la base.
    `lat` y `lng` son `None` en la celda de los cruces sin GPS: cuentan en el
    total, pero en ninguna zona. `crossing` y `green_left` sólo suman los
    cruces que llegaron al otro lado.
    """

    lat: float | None
    lng: float | None
    sessions: int = 0
    disoriented: int = 0
    wait: Metric = field(default_factory=Metric)
    crossing: Metric = field(default_factory=Metric)
    green_left: Metric = field(default_factory=Metric)

    def __add__(self, other: "CellAggregate") -> "CellAggregate":
        return CellAggregate(
            lat=self.lat,
            lng=self.lng,
            sessions=self.sessions + other.sessions,
            disoriented=self.disoriented + other.disoriented,
            wait=self.wait + other.wait,
            crossing=self.crossing + other.crossing,
            green_left=self.green_left + other.green_left,
        )

    def summary(self) -> dict:
        return {
            "sessions": self.sessions,
            "avgWaitSeconds": self.wait.average(),
            "avgCrossingSeconds": self.crossing.average(),
            "disorientationRate": round(self.disoriented / self.sessions, 3),
            "avgGreenLeftSeconds": self.green_left.average(),
        }


SnapshotStatus = Literal["ok", "insufficient"]


def build_snapshot(
    cells: list[CellAggregate],
    traffic_lights: list[PublicTrafficLight],
    *,
    generated_at: datetime,
    since: datetime,
    policy: AnonymityPolicy = DEFAULT_POLICY,
) -> dict:
    """Arma el resumen público a partir de las celdas. Función pura."""
    totals = sum(cells, CellAggregate(lat=None, lng=None))
    sufficient = totals.sessions >= policy.min_sessions_per_zone

    publishable = sorted(
        (
            cell
            for cell in cells
            if cell.lat is not None and cell.sessions >= policy.min_sessions_per_zone
        ),
        key=lambda cell: cell.sessions,
        reverse=True,
    )
    published_sessions = sum(cell.sessions for cell in publishable)

    status: SnapshotStatus = "ok" if sufficient else "insufficient"
    return {
        "version": SNAPSHOT_VERSION,
        "status": status,
        "generatedAt": _iso(generated_at),
        "range": {"from": _iso(since), "to": _iso(generated_at)},
        "policy": {
            "cellDecimals": policy.cell_decimals,
            "minSessionsPerZone": policy.min_sessions_per_zone,
        },
        "totals": totals.summary() if sufficient else None,
        "zones": [
            {"lat": cell.lat, "lng": cell.lng, **cell.summary()}
            for cell in publishable[: policy.max_zones]
        ]
        if sufficient
        else [],
        "hiddenSessions": totals.sessions - published_sessions if sufficient else 0,
        "trafficLights": [light.model_dump() for light in traffic_lights],
    }


def _iso(moment: datetime) -> str:
    # Como `Date.prototype.toISOString`, que es lo que escribe la Action de la web
    return moment.isoformat(timespec="milliseconds").replace("+00:00", "Z")
