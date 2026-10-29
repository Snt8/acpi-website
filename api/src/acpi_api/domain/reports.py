"""
Reportes de semáforos que hace la gente desde la web. La forma es la de
`Report` en `app/src/core/telemetry/reports.js`, para que la web cambie de
repositorio sin tocar la página.
"""

import uuid
from datetime import UTC, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from acpi_api.domain.events import Latitude, Longitude

ReportIssue = Literal["no-sound", "short-crossing", "broken", "obstructed"]

# Los mismos límites que REPORT_LIMITS en la web
NAME_MAX_LENGTH = 80
NOTE_MAX_LENGTH = 280


class Position(BaseModel):
    model_config = ConfigDict(frozen=True)

    lat: Latitude
    lng: Longitude


class NewReport(BaseModel):
    """Lo que envía el formulario. Los textos llegan recortados."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    name: Annotated[str, StringConstraints(min_length=1, max_length=NAME_MAX_LENGTH)]
    issue: ReportIssue
    note: Annotated[str, StringConstraints(max_length=NOTE_MAX_LENGTH)] = ""
    position: Position


class Report(BaseModel):
    model_config = ConfigDict(frozen=True, populate_by_name=True)

    id: str
    name: str
    issue: ReportIssue
    note: str
    position: Position
    reported_at: datetime = Field(serialization_alias="reportedAt")

    @classmethod
    def create(cls, data: NewReport, now: datetime | None = None) -> "Report":
        return cls(
            id=str(uuid.uuid4()),
            name=data.name,
            issue=data.issue,
            note=data.note,
            position=data.position,
            reported_at=now or datetime.now(UTC),
        )
