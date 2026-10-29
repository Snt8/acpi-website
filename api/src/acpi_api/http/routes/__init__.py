from acpi_api.http.routes import admin, events, health, reports, telemetry, traffic_lights

ROUTERS = (
    health.router,
    events.router,
    telemetry.router,
    traffic_lights.router,
    reports.router,
    admin.router,
)
