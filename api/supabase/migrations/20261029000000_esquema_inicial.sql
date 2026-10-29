-- Esquema del servidor de ACPI.
--
-- Sólo el servidor lee y escribe, con la clave secreta (rol service_role), que
-- salta el RLS. Las tablas tienen el RLS activo y ninguna política, así que la
-- clave pública del proyecto (anon) no puede leer ni escribir nada.

-- Eventos tal como llegan de la app (contrato v3). Es la fuente de verdad: las
-- demás tablas se pueden reconstruir a partir de ella.
create table public.eventos (
  id text primary key,
  version smallint not null,
  tipo text not null check (tipo in ('cruce', 'semaforo', 'prueba')),
  dispositivo text not null,
  momento timestamptz not null,
  recibido_en timestamptz not null default now(),
  datos jsonb not null
);

create index eventos_tipo_momento_idx on public.eventos (tipo, momento desc);

-- Una fila por evento `cruce`, con las medidas tipadas para consultarlas y agregarlas
create table public.cruces (
  evento_id text primary key references public.eventos (id) on delete cascade,
  sesion text not null,
  dispositivo text not null,
  momento timestamptz not null,
  inicio timestamptz not null,
  simulado boolean not null default false,
  lat double precision check (lat between -90 and 90),
  lon double precision check (lon between -180 and 180),
  precision_m double precision check (precision_m >= 0),
  semaforo_id bigint,
  -- Id público del semáforo (semaforos.id); sin FK porque el cruce puede llegar antes
  semaforo text,
  espera_s double precision check (espera_s >= 0),
  cruzo boolean not null,
  duracion_cruce_s double precision check (duracion_cruce_s >= 0),
  verde_restante_s double precision check (verde_restante_s >= 0),
  rumbo_cruce double precision check (rumbo_cruce between 0 and 360),
  veces_mal_orientado integer not null default 0 check (veces_mal_orientado >= 0),
  duracion_sesion_s double precision not null check (duracion_sesion_s >= 0),
  paquetes_ble integer not null default 0 check (paquetes_ble >= 0),
  paquetes_ble_perdidos integer check (paquetes_ble_perdidos >= 0),
  recepcion_semaforo_pct smallint check (recepcion_semaforo_pct between 0 and 100),
  rssi_semaforo_medio_dbm smallint,
  rssi_semaforo_min_dbm smallint,
  semaforo_ble_id integer,
  brujula_sin_calibrar boolean not null default false,
  recibido_en timestamptz not null default now(),
  check ((lat is null) = (lon is null))
);

create index cruces_momento_idx on public.cruces (momento desc) where not simulado;
create index cruces_semaforo_idx on public.cruces (semaforo, momento desc);

-- Estado actual de cada semáforo: el último evento `semaforo` de la pareja
-- dispositivo + semaforo_id. `id` es el resumen público de esa pareja.
create table public.semaforos (
  id text primary key,
  dispositivo text not null,
  semaforo_id bigint not null,
  nombre text,
  lat double precision check (lat between -90 and 90),
  lon double precision check (lon between -180 and 180),
  precision_m double precision check (precision_m >= 0),
  origen text check (origen in ('manual', 'brazalete')),
  borrado boolean not null default false,
  -- Lo decide la administración; los eventos de la app no lo tocan
  verificado boolean not null default false,
  ultimo_evento_en timestamptz not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (dispositivo, semaforo_id),
  -- Un semáforo vigente siempre tiene posición. Uno borrado puede no tenerla si
  -- el servidor sólo llegó a ver su borrado
  check (borrado or (lat is not null and lon is not null))
);

-- Reportes que hace la gente desde la web
create table public.reportes (
  id uuid primary key,
  nombre text not null check (char_length(nombre) between 1 and 80),
  problema text not null check (problema in ('no-sound', 'short-crossing', 'broken', 'obstructed')),
  nota text not null default '' check (char_length(nota) <= 280),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  reportado_en timestamptz not null default now()
);

create index reportes_reportado_en_idx on public.reportes (reportado_en desc);

alter table public.eventos enable row level security;
alter table public.cruces enable row level security;
alter table public.semaforos enable row level security;
alter table public.reportes enable row level security;

-- Supabase da acceso a las tablas nuevas a anon y authenticated; el RLS ya lo
-- impide, y esto lo deja explícito
revoke all on public.eventos, public.cruces, public.semaforos, public.reportes
  from anon, authenticated;

-- Guarda un lote de eventos ya validados por el servidor, en una sola
-- transacción. Es idempotente: un evento repetido no se vuelve a guardar, y un
-- cambio de semáforo sólo se aplica si es más nuevo que el que hay. Devuelve
-- cuántos eventos eran nuevos.
create function public.registrar_eventos(p_eventos jsonb, p_cruces jsonb, p_semaforos jsonb)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  nuevos integer;
begin
  insert into public.eventos (id, version, tipo, dispositivo, momento, datos)
  select e.id, e.version, e.tipo, e.dispositivo, e.momento, e.datos
  from jsonb_to_recordset(p_eventos) as e (
    id text, version smallint, tipo text, dispositivo text, momento timestamptz, datos jsonb
  )
  on conflict (id) do nothing;
  get diagnostics nuevos = row_count;

  -- Todas las columnas menos recibido_en, que toma su valor por defecto
  insert into public.cruces (
    evento_id, sesion, dispositivo, momento, inicio, simulado, lat, lon, precision_m,
    semaforo_id, semaforo, espera_s, cruzo, duracion_cruce_s, verde_restante_s, rumbo_cruce,
    veces_mal_orientado, duracion_sesion_s, paquetes_ble, paquetes_ble_perdidos,
    recepcion_semaforo_pct, rssi_semaforo_medio_dbm, rssi_semaforo_min_dbm, semaforo_ble_id,
    brujula_sin_calibrar
  )
  select
    evento_id, sesion, dispositivo, momento, inicio, simulado, lat, lon, precision_m,
    semaforo_id, semaforo, espera_s, cruzo, duracion_cruce_s, verde_restante_s, rumbo_cruce,
    veces_mal_orientado, duracion_sesion_s, paquetes_ble, paquetes_ble_perdidos,
    recepcion_semaforo_pct, rssi_semaforo_medio_dbm, rssi_semaforo_min_dbm, semaforo_ble_id,
    brujula_sin_calibrar
  from jsonb_populate_recordset(null::public.cruces, p_cruces)
  on conflict (evento_id) do nothing;

  insert into public.semaforos as s (
    id, dispositivo, semaforo_id, nombre, lat, lon, precision_m, origen, borrado,
    ultimo_evento_en
  )
  select c.id, c.dispositivo, c.semaforo_id, c.nombre, c.lat, c.lon, c.precision_m, c.origen,
    c.borrado, c.ultimo_evento_en
  from jsonb_to_recordset(p_semaforos) as c (
    id text, dispositivo text, semaforo_id bigint, nombre text, lat double precision,
    lon double precision, precision_m double precision, origen text, borrado boolean,
    ultimo_evento_en timestamptz
  )
  on conflict (id) do update set
    borrado = excluded.borrado,
    nombre = coalesce(excluded.nombre, s.nombre),
    lat = coalesce(excluded.lat, s.lat),
    lon = coalesce(excluded.lon, s.lon),
    precision_m = case when excluded.borrado then s.precision_m else excluded.precision_m end,
    -- `origen` sólo viaja al crearlo: una edición conserva el que había
    origen = coalesce(excluded.origen, s.origen),
    ultimo_evento_en = excluded.ultimo_evento_en,
    actualizado_en = now()
  where excluded.ultimo_evento_en >= s.ultimo_evento_en;

  return nuevos;
end;
$$;

-- Sumas de los cruces reales desde p_desde, por celda de la cuadrícula de
-- anonimato (coordenadas redondeadas a p_decimales). La celda con lat y lon
-- nulas reúne los cruces sin GPS. La política de qué se publica la aplica el
-- servidor (domain/telemetry.py).
create function public.resumen_cruces_por_celda(p_desde timestamptz, p_decimales integer)
returns table (
  lat double precision,
  lon double precision,
  sesiones bigint,
  desorientadas bigint,
  espera_suma double precision,
  espera_n bigint,
  cruce_suma double precision,
  cruce_n bigint,
  verde_suma double precision,
  verde_n bigint
)
language sql
stable
set search_path = ''
as $$
  select
    round(c.lat::numeric, p_decimales)::double precision,
    round(c.lon::numeric, p_decimales)::double precision,
    count(*),
    count(*) filter (where c.veces_mal_orientado > 0),
    coalesce(sum(c.espera_s), 0),
    count(c.espera_s),
    coalesce(sum(c.duracion_cruce_s) filter (where c.cruzo), 0),
    count(c.duracion_cruce_s) filter (where c.cruzo),
    coalesce(sum(c.verde_restante_s) filter (where c.cruzo), 0),
    count(c.verde_restante_s) filter (where c.cruzo)
  from public.cruces c
  where not c.simulado and c.momento >= p_desde
  group by 1, 2;
$$;

-- Las funciones son sólo para el servidor
revoke execute on function public.registrar_eventos(jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.resumen_cruces_por_celda(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.registrar_eventos(jsonb, jsonb, jsonb) to service_role;
grant execute on function public.resumen_cruces_por_celda(timestamptz, integer) to service_role;
