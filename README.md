# ACPI Web

Sitio web del **Asistente de Cruce Peatonal para Invidentes**: presenta el
sistema, muestra el brazalete y publica el panel de telemetría con los datos
anónimos de los cruces.

**En línea:** <https://snt8.github.io/acpi-website/>

> Este repositorio contiene solo el sitio. El sistema —firmware de la baliza y
> del brazalete, app móvil y documentación técnica— vive en el repositorio
> principal: **[Snt8/ACPI](https://github.com/Snt8/ACPI)**.

## Lugar en el sistema

ACPI tiene cuatro piezas. El sitio es la última de la cadena: no participa en
ningún cruce, solo muestra lo que el resto del sistema ya registró.

```text
[Baliza del semáforo] ─ESP-NOW─► [Brazalete] ─BLE─► [App móvil] ─HTTPS─► [Grafana Cloud] ─cada hora─► [ACPI Web]
 firmware/semaforo               firmware/brazalete  app-movil                                         este repositorio
```

| Pieza | Dónde está |
| --- | --- |
| Baliza del semáforo (ESP32 DevKit V1) | [`ACPI/firmware/semaforo`](https://github.com/Snt8/ACPI/tree/main/firmware/semaforo) |
| Brazalete (ESP32-C3 Super Mini) | [`ACPI/firmware/brazalete`](https://github.com/Snt8/ACPI/tree/main/firmware/brazalete) |
| App móvil (React Native + Expo) | [`ACPI/app-movil`](https://github.com/Snt8/ACPI/tree/main/app-movil) |
| Telemetría en Grafana Cloud | [`ACPI/docs/grafana-setup.md`](https://github.com/Snt8/ACPI/blob/main/docs/grafana-setup.md) |
| Sitio web | Este repositorio |

### Lo que el sitio toma del repositorio principal

El sitio depende de tres cosas definidas en ACPI. Si alguna cambia allí, hay
que actualizarla aquí:

| En ACPI | Uso en el sitio | Qué tocar si cambia |
| --- | --- | --- |
| [`assets/ACPI-V3.5-Logo-updated.pdf`](https://github.com/Snt8/ACPI/blob/main/assets/ACPI-V3.5-Logo-updated.pdf) | Logo de la cabecera y del pie, y favicons. `ACPI-3.5-logo.pdf` es la versión anterior y no se usa. | `app/src/assets/brand/` y `app/public/` |
| [`docs/grafana-setup.md`](https://github.com/Snt8/ACPI/blob/main/docs/grafana-setup.md) | Contrato del payload que la app envía al cerrar cada cruce; la Action lee esos campos. | `app/scripts/telemetry/anonymize.mjs` y sus pruebas |
| [`docs/figuras/`](https://github.com/Snt8/ACPI/tree/main/docs/figuras) | Figura de arquitectura en la que se basa la sección «De la esquina al panel». | `app/src/core/content/telemetry.content.js` |

## Páginas

| Página | Estado |
| --- | --- |
| Inicio (`/`) | Implementada según boceto |
| Brazalete (`/brazalete`) | Implementada según boceto, con visor giratorio |
| Telemetría (`/telemetria`) | Mapa de semáforos reportados, recorrido de los datos y cifras anónimas de Grafana |
| App móvil (`/app-movil`) | A la espera de boceto, con ilustración y puntos clave |
| Historia (`/historia`) | A la espera de boceto, con ilustración y puntos clave |

Los bocetos originales están en [`designs/`](designs/).

## Estructura del repositorio

```text
.
├── app/                          Sitio: React 19 + Vite + Tailwind CSS 4 + React Router 7
│   ├── src/                      Código del sitio (ver app/README.md)
│   ├── scripts/telemetry/        Consulta a Grafana y anonimización
│   └── public/                   Favicons; telemetry.json se genera al desplegar
├── .github/
│   ├── workflows/deploy.yml      Compila y publica en GitHub Pages
│   └── actions/grafana-telemetry Action que trae y anonimiza la telemetría
├── designs/                      Bocetos a mano de las páginas
└── .claude/                      Guía del sistema y reglas de trabajo
```

## Desarrollo

Requiere Node 22 o superior y pnpm (la versión está fijada en
`app/package.json`).

```bash
cd app
pnpm install
pnpm dev
```

Para ver el mapa en local, copia `app/.env.example` como `app/.env.local` y
añade una clave de Google Maps. Sin ella el sitio funciona igual y muestra un
aviso en lugar del mapa. Los demás comandos y la arquitectura del código están
en [`app/README.md`](app/README.md).

## Despliegue

[`deploy.yml`](.github/workflows/deploy.yml) publica en GitHub Pages en tres
casos: con cada push a `main`, cada hora en punto y a mano desde la pestaña
*Actions*. En cada ejecución:

1. Instala dependencias, pasa el lint y las pruebas. Si algo falla, el sitio
   anterior sigue publicado.
2. Ejecuta la Action [`grafana-telemetry`](.github/actions/grafana-telemetry/action.yml),
   que consulta Grafana, anonimiza los cruces y escribe
   `app/public/telemetry.json`.
3. Compila con la clave de Google Maps y publica.

La ejecución horaria es la que mantiene al día la telemetría sin hacer un
commit por hora. GitHub puede retrasarla unos minutos y la desactiva si el
repositorio pasa 60 días sin actividad.

### Configuración

En *Settings → Secrets and variables → Actions*:

| Nombre | Tipo | Contenido |
| --- | --- | --- |
| `GOOGLE_MAPS_API_KEY` | Secreto | Clave de la API de JavaScript de Maps |
| `GOOGLE_MAPS_MAP_ID` | Variable | Map ID con marcadores avanzados (sin él se usa `DEMO_MAP_ID`) |
| `GRAFANA_URL` | Variable | URL base de Grafana, p. ej. `https://acpi.grafana.net` |
| `GRAFANA_TOKEN` | Secreto | Token de una service account con rol Viewer |
| `GRAFANA_QUERIES` | Variable | Arreglo JSON `queries` de `POST /api/ds/query` |

La clave de Maps termina en el código público del sitio, como en cualquier
mapa web: su protección es restringirla en Google Cloud por referente HTTP a
`https://snt8.github.io/*`. Va en un secreto solo para que no quede escrita en
el repositorio.

`GRAFANA_QUERIES` debe devolver, en formato tabla, una fila por sesión con los
campos del payload de la app: `lat`, `lon`, `waiting_sec`, `duration_sec`,
`status` y `panics`. Un ejemplo con la fuente InfluxDB (SQL) de Grafana Cloud,
suponiendo que la app escribe en la medición `crossings`:

```json
[{
  "refId": "A",
  "datasource": { "uid": "<uid-de-la-fuente>" },
  "format": "table",
  "rawSql": "SELECT lat, lon, waiting_sec, duration_sec, status, panics FROM crossings WHERE $__timeFilter(time)"
}]
```

Sin las variables de Grafana la Action publica un resumen vacío y el sitio se
despliega igual; la página dice que todavía no hay datos. Con ellas, si Grafana
falla, el despliegue se detiene y sigue publicado el último resumen bueno.

## Privacidad

El sitio no recibe datos de nadie que lo visite:

- **Reportes de semáforos.** Se guardan solo en el navegador de quien los hace
  (`localStorage`). No salen del equipo.
- **Telemetría.** El navegador solo descarga `telemetry.json`, que ya llega
  agregado. La anonimización ocurre en el runner de GitHub: se leen únicamente
  los campos necesarios (nunca `device_id`, `session_id`, `timestamp` ni
  `steps`), los cruces se agrupan en zonas de unos 110 m, una zona solo se
  publica si reúne al menos 5 cruces y, si el total no llega a ese mínimo, no
  se publica ninguna cifra.

## Documentación

- [`app/README.md`](app/README.md): arquitectura del código, telemetría,
  imágenes, animación y accesibilidad.
- [`.claude/guia-acpi-web.md`](.claude/guia-acpi-web.md): guía del sistema en
  lenguaje sencillo, de donde salen los textos del sitio.
- [Repositorio ACPI](https://github.com/Snt8/ACPI): firmware, app móvil,
  protocolo BLE y configuración de Grafana.
