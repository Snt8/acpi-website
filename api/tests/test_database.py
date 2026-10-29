"""
Prueba la migración y sus funciones contra un PostgreSQL de verdad, y que se
comportan igual que los repositorios en memoria que usan las demás pruebas.

Necesita ACPI_TEST_DATABASE_URL con un usuario que pueda crear bases, p. ej.
`postgresql://postgres@localhost:54329/postgres`. Crea una base temporal, le
aplica `supabase/migrations/` y la borra al terminar.
"""

import asyncio
import json
import os
import uuid
from collections.abc import Iterator
from datetime import UTC, datetime
from pathlib import Path

import pytest

from acpi_api.application.ingest_events import build_batch
from acpi_api.domain.crossings import Crossing
from acpi_api.domain.traffic_lights import TrafficLight
from acpi_api.infrastructure.memory_repositories import create_memory_repositories
from acpi_api.infrastructure.supabase_repositories import cell_from_row, event_batch_params
from factories import BASE_MS, crossings, light_event, probe_event

psycopg = pytest.importorskip("psycopg")
from psycopg.rows import dict_row  # noqa: E402

ADMIN_URL = os.environ.get("ACPI_TEST_DATABASE_URL")
MIGRATIONS = sorted((Path(__file__).parents[1] / "supabase" / "migrations").glob("*.sql"))

pytestmark = [
    pytest.mark.database,
    pytest.mark.skipif(not ADMIN_URL, reason="sin ACPI_TEST_DATABASE_URL"),
]

# Lo que un proyecto de Supabase ya trae antes de la migración: sus roles y
# permisos por defecto para anon y authenticated sobre todo lo que se cree
SUPABASE_BOOTSTRAP = """
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;
"""


@pytest.fixture(scope="module")
def database_url() -> Iterator[str]:
    name = f"acpi_test_{uuid.uuid4().hex[:8]}"
    with psycopg.connect(ADMIN_URL, autocommit=True) as admin:
        admin.execute(f'create database "{name}"')
    url = ADMIN_URL.rsplit("/", 1)[0] + f"/{name}"
    try:
        with psycopg.connect(url, autocommit=True) as conn:
            conn.execute(SUPABASE_BOOTSTRAP)
            for migration in MIGRATIONS:
                conn.execute(migration.read_text(encoding="utf-8"))
        yield url
    finally:
        with psycopg.connect(ADMIN_URL, autocommit=True) as admin:
            admin.execute(f'drop database "{name}" with (force)')


@pytest.fixture
def conn(database_url: str) -> Iterator[psycopg.Connection]:
    with psycopg.connect(database_url, autocommit=True, row_factory=dict_row) as connection:
        connection.execute("truncate public.eventos, public.semaforos, public.reportes cascade")
        yield connection


def save(conn, raw_events: list[dict]) -> int:
    batch, rejected = build_batch(raw_events)
    assert not rejected
    params = event_batch_params(batch)
    row = conn.execute(
        "select public.registrar_eventos(%s::jsonb, %s::jsonb, %s::jsonb) as nuevos",
        [json.dumps(params[key]) for key in ("p_eventos", "p_cruces", "p_semaforos")],
    ).fetchone()
    return row["nuevos"]


def save_in_memory(batches: list[list[dict]]):
    repositories = create_memory_repositories()

    async def run():
        for raw_events in batches:
            await repositories.events.save(build_batch(raw_events)[0])
        return repositories

    return asyncio.run(run())


def traffic_lights(conn) -> list[TrafficLight]:
    rows = conn.execute("select * from public.semaforos order by id").fetchall()
    return [TrafficLight.model_validate(row) for row in rows]


def comparable(lights: list[TrafficLight]) -> list[dict]:
    # Las marcas de tiempo de escritura dependen del reloj de cada lado
    return [light.model_dump(exclude={"creado_en", "actualizado_en"}) for light in lights]


def test_guarda_cada_tabla_y_es_idempotente(conn):
    events = [*crossings(3, 4.6, -74.08), light_event("creado", 3), probe_event()]
    assert save(conn, events) == 5
    assert save(conn, events) == 0

    counts = conn.execute(
        "select (select count(*) from public.eventos) as eventos,"
        " (select count(*) from public.cruces) as cruces,"
        " (select count(*) from public.semaforos) as semaforos"
    ).fetchone()
    assert counts == {"eventos": 5, "cruces": 3, "semaforos": 1}


def test_el_cruce_guardado_es_el_mismo_que_se_proyecto(conn):
    raw = crossings(1, 4.6, -74.08)
    save(conn, raw)
    [row] = conn.execute("select * from public.cruces").fetchall()
    stored = Crossing.model_validate({k: v for k, v in row.items() if k != "recibido_en"})
    assert stored == build_batch(raw)[0].crossings[0]


BATCHES = [
    # Llega primero un borrado viejo, luego la creación y la edición
    [light_event("borrado", 3, momento=BASE_MS - 10)],
    [
        light_event("creado", 3, momento=BASE_MS),
        light_event("editado", 3, momento=BASE_MS + 1, nombre="Editado", precision_m=None),
    ],
    # Una edición más vieja que la que hay no cambia nada
    [light_event("editado", 3, momento=BASE_MS - 5, nombre="Viejo")],
    # Un semáforo que el servidor sólo ve borrado, y otro creado y borrado en lotes distintos
    [light_event("borrado", 7)],
    [light_event("creado", 8, origen="manual")],
    [light_event("borrado", 8, momento=BASE_MS + 2)],
    # Un borrado y una recreación posterior del mismo id
    [light_event("creado", 9), light_event("borrado", 9, momento=BASE_MS + 1)],
    [light_event("creado", 9, momento=BASE_MS + 2, origen="manual", lat=4.7, lon=-74.1)],
]


def test_los_semaforos_quedan_igual_que_en_memoria(conn):
    for raw_events in BATCHES:
        save(conn, raw_events)
    memory = save_in_memory(BATCHES)
    expected = asyncio.run(memory.traffic_lights.find(include_deleted=True))

    assert comparable(traffic_lights(conn)) == comparable(expected)
    by_light = {light.semaforo_id: light for light in traffic_lights(conn)}
    assert (by_light[3].nombre, by_light[3].origen, by_light[3].borrado) == (
        "Editado",
        "brazalete",
        False,
    )
    assert by_light[7].borrado and by_light[7].lat is None
    assert by_light[8].borrado and by_light[8].lat is not None
    assert (by_light[9].borrado, by_light[9].origen, by_light[9].lat) == (False, "manual", 4.7)


def test_las_celdas_coinciden_con_las_de_memoria(conn):
    batches = [
        crossings(4, 4.6081, -74.0821),
        crossings(2, 4.65, -74.05, cruzo=False, duracion_cruce_s=None),
        crossings(1, None, None),
        crossings(3, 4.6, -74.08, simulado=True),
    ]
    for raw_events in batches:
        save(conn, raw_events)
    since = datetime(2026, 1, 1, tzinfo=UTC)

    rows = conn.execute("select * from public.resumen_cruces_por_celda(%s, 3)", [since]).fetchall()
    memory = save_in_memory(batches)
    expected = asyncio.run(memory.crossings.cells(since, 3))

    def key(cell):
        return (cell.lat is None, cell.lat or 0, cell.lng or 0)

    assert sorted((cell_from_row(row) for row in rows), key=key) == sorted(expected, key=key)


def test_la_clave_publica_no_puede_leer_ni_escribir_nada(conn):
    for role in ("anon", "authenticated"):
        conn.execute(f"set role {role}")
        try:
            with pytest.raises(psycopg.errors.InsufficientPrivilege):
                conn.execute("select * from public.eventos")
            with pytest.raises(psycopg.errors.InsufficientPrivilege):
                conn.execute("select public.registrar_eventos('[]', '[]', '[]')")
            with pytest.raises(psycopg.errors.InsufficientPrivilege):
                conn.execute("select * from public.resumen_cruces_por_celda(now(), 3)")
        finally:
            conn.execute("reset role")


def test_el_servidor_si_puede(conn):
    conn.execute("set role service_role")
    try:
        assert conn.execute(
            "select public.registrar_eventos('[]', '[]', '[]') as n"
        ).fetchone() == {"n": 0}
    finally:
        conn.execute("reset role")
