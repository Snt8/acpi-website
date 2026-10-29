# ACPI Web

Sitio web del **Asistente de Cruce Peatonal para Invidentes**: presenta el
sistema, muestra el brazalete y publica el panel de telemetría con los datos
anónimos de los cruces.

**En línea:** <https://snt8.github.io/acpi-website/>

> Este repositorio contiene el sitio y la API que recibe los datos de la app
> ([`api/`](api/README.md)). El sistema —firmware de la baliza y del
> brazalete, app móvil y documentación técnica— vive en el repositorio
> principal: **[Snt8/ACPI](https://github.com/Snt8/ACPI)**.

## Lugar en el sistema

ACPI tiene cuatro piezas. El sitio es la última de la cadena: no participa en
ningún cruce, solo muestra lo que el resto del sistema ya registró.

```text
[Baliza del semáforo] ─ESP-NOW─► [Brazalete] ─BLE─► [App móvil] ─HTTPS─► [Grafana Cloud] ─cada hora─► [ACPI Web]
 firmware/semaforo               firmware/brazalete  app-movil                                         este repositorio
                                                         │
                                                         └──HTTPS──► [ACPI API + Supabase]   api/ de este repositorio
```

La app está pasando de escribir en Grafana Cloud a enviar sus eventos a la
[API](api/README.md), que los guarda en Supabase y publica las mismas cifras
anónimas. Mientras la web no la use, sigue leyendo la telemetría de Grafana.

| Pieza | Dónde está |
| --- | --- |
| Baliza del semáforo (ESP32 DevKit V1) | [`ACPI/firmware/semaforo`](https://github.com/Snt8/ACPI/tree/main/firmware/semaforo) |
| Brazalete (ESP32-C3 Super Mini) | [`ACPI/firmware/brazalete`](https://github.com/Snt8/ACPI/tree/main/firmware/brazalete) |
| App móvil (React Native + Expo) | [`ACPI/app-movil`](https://github.com/Snt8/ACPI/tree/main/app-movil) |
| Telemetría en Grafana Cloud | [`ACPI/docs/grafana-setup.md`](https://github.com/Snt8/ACPI/blob/main/docs/grafana-setup.md) |
| API (FastAPI + Supabase, en Render) | [`api/`](api/README.md) de este repositorio |
| Sitio web | Este repositorio |

### Lo que el sitio toma del repositorio principal

El sitio depende de tres cosas definidas en ACPI. Si alguna cambia allí, hay
que actualizarla aquí:

| En ACPI | Uso en el sitio | Qué tocar si cambia |
| --- | --- | --- |
| [`assets/ACPI-V3.5-Logo-updated.pdf`](https://github.com/Snt8/ACPI/blob/main/assets/ACPI-V3.5-Logo-updated.pdf) | Logo de la cabecera y del pie, y favicons. `ACPI-3.5-logo.pdf` es la versión anterior y no se usa. | `app/src/assets/brand/` y `app/public/` |
| [`docs/grafana-setup.md`](https://github.com/Snt8/ACPI/blob/main/docs/grafana-setup.md) | Contrato de datos v2 de la app (eventos `cruce` y `semaforo` en Loki); la Action lee esos campos. | `app/scripts/telemetry/` y sus pruebas |
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
├── api/                          API: FastAPI + Supabase (ver api/README.md)
│   ├── src/acpi_api/             Dominio, casos de uso, repositorios y rutas
│   └── supabase/migrations/      Esquema de la base
├── render.yaml                   Despliegue de la API en Render
├── .github/
│   ├── workflows/deploy.yml      Compila y publica en GitHub Pages
│   ├── workflows/api.yml         Lint y pruebas de la API
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

El mapa es de OpenStreetMap y no necesita configuración. Para generar la
telemetría en local, copia `app/.env.example` como `app/.env.local` con las
credenciales de Grafana y ejecuta `pnpm telemetry`. Los demás comandos y la
arquitectura del código están en [`app/README.md`](app/README.md).

## Despliegue

[`deploy.yml`](.github/workflows/deploy.yml) publica en GitHub Pages en tres
casos: con cada push a `main`, cada hora en punto y a mano desde la pestaña
*Actions*. En cada ejecución:

1. Instala dependencias, pasa el lint y las pruebas. Si algo falla, el sitio
   anterior sigue publicado.
2. Ejecuta la Action [`grafana-telemetry`](.github/actions/grafana-telemetry/action.yml),
   que consulta Grafana, anonimiza los cruces y escribe
   `app/public/telemetry.json`.
3. Compila y publica.

La ejecución horaria es la que mantiene al día la telemetría sin hacer un
commit por hora. GitHub puede retrasarla unos minutos y la desactiva si el
repositorio pasa 60 días sin actividad.

### Configuración

Solo la telemetría necesita configuración; el mapa usa OpenStreetMap, que no
pide cuenta, clave ni tarjeta. En *Settings → Secrets and variables →
Actions*:

| Nombre | Tipo | Contenido |
| --- | --- | --- |
| `GRAFANA_URL` | Variable | URL base de Grafana, p. ej. `https://acpi.grafana.net` |
| `GRAFANA_TOKEN` | Secreto | Token de una service account con rol Viewer |
| `GRAFANA_QUERIES` | Variable | Arreglo JSON `queries` de `POST /api/ds/query` |

La app móvil (`app-movil/src/telemetria/` en el repositorio ACPI) escribe en
**Loki**, el servicio de logs de Grafana Cloud, eventos del formato v2: un
evento `cruce` al terminar cada sesión y un evento `semaforo` cada vez que un
semáforo se crea, se edita o se borra en el teléfono. `GRAFANA_QUERIES` lee
ambos tipos desde la fuente de logs del stack (por lo general
`grafanacloud-<stack>-logs`), cada uno con su propio límite de líneas:

```json
[
  { "refId": "cruces", "datasource": { "type": "loki", "uid": "<uid-de-la-fuente-de-logs>" },
    "expr": "{app=\"acpi\", tipo=\"cruce\"}", "queryType": "range", "maxLines": 5000 },
  { "refId": "semaforos", "datasource": { "type": "loki", "uid": "<uid-de-la-fuente-de-logs>" },
    "expr": "{app=\"acpi\", tipo=\"semaforo\"}", "queryType": "range", "maxLines": 5000 }
]
```

Con eso la Action publica dos cosas:

- **Cifras de los cruces**, anónimas: sesiones, espera media, duración media
  del cruce, sesiones con desorientación y verde restante al empezar a cruzar,
  en total y por zonas. Se descartan las sesiones del brazalete simulado.
- **Registro de semáforos** con baliza, que el mapa muestra con un icono de
  semáforo. Se publica la posición y si lo detectó el brazalete o se registró a
  mano; el nombre no, porque es texto libre.

Loki solo conserva los registros unos días (en el plan gratuito, unas dos
semanas). Para que un semáforo no desaparezca del mapa cuando su evento
caduca, el registro es acumulativo: en cada ejecución la Action lee el
`telemetry.json` ya publicado y le aplica, en orden, los eventos `creado`,
`editado` y `borrado` de la ventana consultada. Las cifras de cruces, en
cambio, cubren solo lo que Loki conserva.

No hace falta publicar un tablero de Grafana ni poner un token en la web: la
lectura con el token de Viewer ocurre en el runner de GitHub, que hace de
intermediario.

Sin las variables de Grafana la Action publica un resumen vacío y el sitio se
despliega igual; la página dice que todavía no hay datos. Con ellas, si Grafana
falla, el despliegue se detiene y sigue publicado el último resumen bueno.

## Privacidad

El sitio no recibe datos de nadie que lo visite:

- **Reportes de semáforos.** Se guardan solo en el navegador de quien los hace
  (`localStorage`). No salen del equipo.
- **Telemetría.** El navegador solo descarga `telemetry.json`, que ya llega
  agregado. La anonimización ocurre en el runner de GitHub: se leen únicamente
  los campos necesarios (nunca el seudónimo `dispositivo`, la `sesion`, los
  momentos exactos ni el nombre de los semáforos), los cruces se agrupan en zonas de unos 110 m, una zona solo se
  publica si reúne al menos 5 cruces y, si el total no llega a ese mínimo, no
  se publica ninguna cifra.

## Documentación

- [`app/README.md`](app/README.md): arquitectura del código, telemetría,
  imágenes, animación y accesibilidad.
- [`api/README.md`](api/README.md): rutas y contrato de la API, tablas de
  Supabase, despliegue en Render y desarrollo.
- [`.claude/guia-acpi-web.md`](.claude/guia-acpi-web.md): guía del sistema en
  lenguaje sencillo, de donde salen los textos del sitio.
- [Repositorio ACPI](https://github.com/Snt8/ACPI): firmware, app móvil,
  protocolo BLE y configuración de Grafana.
