from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from acpi_api.domain.reports import NewReport, Report
from acpi_api.http.dependencies import RepositoriesDep, limit_reports

router = APIRouter(tags=["reportes"])


@router.get("/api/reportes", response_model=list[Report])
async def list_reports(
    repositories: RepositoriesDep,
    limite: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[Report]:
    """Reportes de la gente, del más reciente al más viejo."""
    return await repositories.reports.find(limite)


@router.post(
    "/api/reportes",
    response_model=Report,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(limit_reports)],
)
async def create_report(data: NewReport, repositories: RepositoriesDep) -> Report:
    report = Report.create(data)
    await repositories.reports.add(report)
    return report
