# ACPI API

Servidor de ACPI: recibe los eventos que envía la app móvil, los guarda en
**Supabase** y publica sus cifras anónimas para la web. FastAPI sobre Python
3.13, desplegado en Render.

```text
[App móvil] ──POST /api/eventos──► [ACPI API] ──► [Supabase (PostgreSQL)]
                                       │
[ACPI Web]  ◄──GET /api/telemetria─────┘  cifras anónimas y semáforos
            ──POST /api/reportes──►       reportes de la gente
```

Reemplaza el envío directo a Loki (Grafana Cloud): la app ya apunta aquí con
`EXPO_PUBLIC_API_URL` y `EXPO_PUBLIC_API_TOKEN`
(`app-movil/src/telemetria/servidor.ts` en el repositorio ACPI).

## Rutas

| Ruta | Quién | Qué hace |
| --- | --- | --- |
| `GET /api/salud` | Cualquiera | Despierta el servidor. `?base=true` comprueba también Supabase. |
| `POST /api/eventos` | App (`API_TOKEN_APP`) | Recibe un lote de eventos `cruce`, `semaforo` y `prueba`. |
| `GET /api/telemetria` | Cualquiera | Cifras anónimas con la forma de `telemetry.json` (`Snapshot` v2). |
| `GET /api/semaforos` | Cualquiera | Semáforos vigentes: posición y origen, sin nombre. |
| `GET /api/reportes` | Cualquiera | Reportes de la web, del más reciente al más viejo. |
| `POST /api/reportes` | Cualquiera | Crea un reporte; 10 por hora por cliente. |
| `GET /api/admin/eventos` | Admin (`API_TOKEN_ADMIN`) | Últimos eventos tal como llegaron (`?tipo=prueba`). |
| `GET /api/admin/cruces` | Admin | Cruces sin agregar, con filtros `desde`, `hasta`, `semaforo`, `simulados`, `limite`. |
| `GET /api/admin/semaforos` | Admin | Todos los datos de cada semáforo (`?borrados=true`). |
| `GET/PATCH/DELETE /api/admin/semaforos/{id}` | Admin | Ver, corregir (`nombre`, `lat`, `lon`, `verificado`) o borrar. |
| `DELETE /api/admin/reportes/{id}` | Admin | Borra un reporte. |

La documentación interactiva está en `/docs` del servidor.

## Contrato con la app (`POST /api/eventos`)

```http
POST /api/eventos
Authorization: Bearer <API_TOKEN_APP>
Content-Type: application/json

{"eventos": [{"v": 3, "id": "lq1a2b3c4d", "tipo": "cruce", "dispositivo": "mh3k2a9x1c4f", "momento": 1793300000000, ...}]}
```

Todos los eventos llevan `v` (3), `id` (único, lo genera la app), `tipo`,
`dispositivo` (seudónimo del teléfono) y `momento` (ms desde epoch). Los campos
de `cruce` y `semaforo` son los de `docs/grafana-setup.md` en ACPI; la versión
3 suma al `cruce` las métricas de los enlaces (`paquetes_ble`,
`paquetes_ble_perdidos`, `recepcion_semaforo_pct`, `rssi_semaforo_medio_dbm`,
`rssi_semaforo_min_dbm`, `semaforo_ble_id`, `brujula_sin_calibrar`). Los
modelos exactos están en [`domain/events.py`](src/acpi_api/domain/events.py).

La respuesta decide qué hace la app con el lote:

| Respuesta | Cuándo | La app |
| --- | --- | --- |
| `200` | Siempre que el lote se procesó | Lo saca de la cola |
| `401` | Token ausente o distinto | Lo reintenta |
| `413` | Más de 500 eventos o más de 1 MB | Lo descarta |
| `422` | El cuerpo no es `{"eventos": [...]}` | Lo descarta |
| `503` | Supabase no responde | Lo reintenta |

```json
{"recibidos": 4, "guardados": 2, "duplicados": 1,
 "rechazados": [{"indice": 3, "id": null, "motivo": "evento: Unable to extract tag using discriminator 'tipo'"}]}
```

- **Duplicados.** Si se pierde la respuesta, la app reenvía el lote. Un `id`
  que ya existe no se vuelve a guardar.
- **Rechazados.** Cada evento se valida por separado: uno mal formado se
  lista en `rechazados` y no arrastra al resto, porque con el `200` la app saca
  todo el lote de la cola.
- **Versiones.** Sólo se acepta `v: 3`. Antes de que la app suba de versión,
  hay que desplegar el servidor que la entiende; si no, esos eventos se
  rechazan y se pierden.

## Datos en Supabase

La migración está en [`supabase/migrations/`](supabase/migrations/).

| Tabla | Contenido |
| --- | --- |
| `eventos` | Cada evento tal como llegó (`datos` en JSON). Es la fuente de verdad: las demás se pueden reconstruir desde aquí. |
| `cruces` | Un cruce por evento `cruce`, con las medidas tipadas. `semaforo` enlaza con `semaforos.id`. |
| `semaforos` | Estado actual de cada semáforo: el último evento de la pareja `dispositivo` + `semaforo_id`, por `momento`. |
| `reportes` | Reportes de la web. |

- **Un lote, una transacción.** `registrar_eventos()` guarda las tres tablas
  de un lote en una sola llamada. Un cambio de semáforo sólo se aplica si es
  más nuevo que el guardado, así que da igual el orden en que lleguen los lotes.
- **Cifras en la base.** `resumen_cruces_por_celda()` suma los cruces por
  celda de ~110 m. La política de anonimato (mínimo de 5 cruces por zona, máximo
  12 zonas) la aplica el servidor en
  [`domain/telemetry.py`](src/acpi_api/domain/telemetry.py), igual que
  `app/scripts/telemetry/anonymize.mjs`.
- **Ids públicos.** El `id` de un semáforo es el mismo resumen SHA-256 que ya
  publica la web, así que los enlaces del mapa no cambian.
- **Acceso.** Todas las tablas tienen RLS sin políticas, y a `anon` y
  `authenticated` se les quitan los permisos sobre tablas y funciones. Sólo el
  servidor entra, con la clave secreta.

## Arquitectura

Las dependencias apuntan hacia adentro: el dominio no conoce FastAPI ni
Supabase, y las rutas sólo conocen los puertos.

```text
src/acpi_api/
├── domain/           Reglas puras: contrato de eventos, semáforos, cruces,
│                     reportes y política de anonimato.
├── application/      Casos de uso (recibir eventos, armar el resumen) y los
│                     puertos de almacenamiento que necesitan (ports.py).
├── infrastructure/   Puertos implementados: Supabase y memoria.
├── http/             Rutas, autenticación, límite de reportes y esquemas.
├── config.py         Variables de entorno.
└── main.py           Raíz de composición: create_app().
```

El repositorio en memoria se comporta igual que el de Supabase, y una prueba
lo comprueba contra un PostgreSQL real. Sirve para las pruebas y para
desarrollar sin base (`STORAGE=memory`).

## Puesta en marcha

### 1. Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor** → pegar y ejecutar
   [`supabase/migrations/20261029000000_esquema_inicial.sql`](supabase/migrations/20261029000000_esquema_inicial.sql).
   Las migraciones nuevas van en la misma carpeta, con un prefijo de fecha
   mayor, y se ejecutan en orden.
3. **Project Settings → API Keys**: copiar la URL del proyecto y una clave
   secreta (`sb_secret_…`; la antigua `service_role` también sirve).

### 2. Render

1. **New → Blueprint** y elegir este repositorio: [`render.yaml`](../render.yaml)
   crea el servicio `acpi` (`https://acpi.onrender.com`).
2. Completar las variables: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`,
   `API_TOKEN_APP` y `API_TOKEN_ADMIN`. Para generar cada token:

   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

3. En `app-movil/.env` de ACPI: `EXPO_PUBLIC_API_URL` con la URL del servicio
   y `EXPO_PUBLIC_API_TOKEN` con el mismo valor que `API_TOKEN_APP`.
4. En la app: **Ajustes → Diagnóstico → Enviar dato de prueba**, y comprobar
   que llegó:

   ```bash
   curl -H "Authorization: Bearer $API_TOKEN_ADMIN" "https://acpi.onrender.com/api/admin/eventos?tipo=prueba"
   ```

El plan gratis de Render duerme el servicio tras 15 minutos sin uso; la
primera petición tarda cerca de un minuto en despertarlo. La app ya lo tiene en
cuenta: llama a `/api/salud` al detectar un semáforo y espera hasta 90 s.

## Desarrollo

```bash
cd api
python -m venv .venv
.venv/Scripts/activate        # Windows; en macOS o Linux: source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env          # STORAGE=memory para no necesitar Supabase
uvicorn acpi_api.main:create_app --factory --reload
```

```bash
pytest            # pruebas
ruff check .      # lint
ruff format .     # formato
```

Las pruebas de `tests/test_database.py` aplican la migración en un
PostgreSQL real y comprueban que se comporta igual que el repositorio en
memoria. Se saltan si no hay `ACPI_TEST_DATABASE_URL` con un usuario que pueda
crear bases (en CI corren siempre):

```bash
ACPI_TEST_DATABASE_URL=postgresql://postgres@localhost:5432/postgres pytest
```

## Siguiente paso en la web

La web todavía guarda los reportes en `localStorage` y lee `telemetry.json`.
Para pasarla a la API:

- **Reportes:** escribir un repositorio con el contrato de
  `app/src/infrastructure/reports/localStorageReportRepository.js` contra
  `/api/reportes` y cambiar la línea de `app/src/infrastructure/reports/index.js`.
  Las respuestas ya tienen la forma de `Report`.
- **Telemetría:** `/api/telemetria` devuelve el mismo `Snapshot` (versión 2),
  así que basta con cambiar `SNAPSHOT_URL` en
  `app/src/infrastructure/telemetry/fetchTelemetrySnapshot.js`; la Action de
  Grafana deja de hacer falta.
