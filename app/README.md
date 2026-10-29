# ACPI Web — código del sitio

React 19 + Vite + Tailwind CSS 4 + React Router 7.

Este documento explica el código. Qué es el sitio, cómo se relaciona con el
repositorio principal [Snt8/ACPI](https://github.com/Snt8/ACPI), cómo se
despliega y qué hay que configurar está en el [README de la raíz](../README.md).

## Comandos

```bash
pnpm dev      # servidor de desarrollo
pnpm build    # compilación de producción en dist/
pnpm preview  # sirve dist/ localmente
pnpm lint     # oxlint
pnpm test     # pruebas (node --test)
pnpm telemetry  # genera public/telemetry.json desde Grafana (usa .env.local)
```

Para generar la telemetría en local, copia `.env.example` como `.env.local`
con las credenciales de Grafana. El mapa no necesita configuración.

## Arquitectura

La regla es que las dependencias apunten siempre hacia adentro: las páginas
conocen el contenido y la UI compartida, nunca al revés.

```
src/
├── app/            Composición raíz: tabla de rutas y RouterProvider.
├── core/           Núcleo sin React.
│   ├── content/    Textos del sitio como datos puros.
│   ├── routing/    Rutas canónicas (PATHS).
│   └── telemetry/  Dominio: reportes de semáforos y contrato del resumen.
├── infrastructure/ Adaptadores: localStorage, Leaflet, telemetry.json.
├── layout/         Cabecera, pie y shell común a todas las páginas.
├── pages/          Una carpeta por página, con sus secciones propias.
└── shared/         Piezas reutilizables sin conocimiento del dominio.
    ├── lib/        Utilidades (cx, formatos, animación).
    └── ui/         Container, Section, Card, Button, Field…

scripts/telemetry/  Consulta a Grafana y anonimización (corre en CI).
```

### Por qué el contenido va aparte

Todo el texto vive en `core/content/*.content.js`. Cambiar una descripción no
obliga a tocar un componente, y el día que llegue un CMS solo cambia el origen
de esos módulos.

### Rutas

`core/routing/paths.js` es la única fuente de verdad. Ningún componente
escribe una ruta a mano, así que renombrar una sección es un cambio de una
línea. Al usar `createBrowserRouter` (URLs limpias, sin `#`), el hosting de
producción debe redirigir cualquier ruta desconocida a `index.html`.

### Imágenes

El logo es el V3.5 del repositorio ACPI (`assets/ACPI-V3.5-Logo-updated.pdf`;
`ACPI-3.5-logo.pdf` es la versión anterior). El PDF trae una imagen de
1600 × 900 sobre fondo blanco: se extrajo, se le quitó el fondo y se recortó
en `assets/brand/acpi-logo.webp`, a tres veces la altura con la que aparece
en la cabecera. Los favicons de `public/` son el semáforo del mismo logo.

Las ilustraciones de `assets/illustrations/` (ciudad, teléfono y cruce) son
SVG propios dibujados con la paleta de los tokens; pesan unos pocos KB y Vite
incrusta las más pequeñas en el bundle.

Todos los `import` de imágenes viven en `core/content/media.content.js`, así
que ninguna página conoce una ruta de archivo y Vite sigue versionando cada
asset en la compilación. `Figure` las muestra con la misma aparición que el
resto del contenido.

`SpinViewer` usa las seis vistas del brazalete para dejar girarlo: la posición
horizontal del puntero dentro del marco elige el fotograma, y las flechas del
teclado hacen lo mismo sin ratón. Los seis fotogramas se montan a la vez para
que el giro no espere descargas, lo que pesa unos 2,3 MB: conviene comprimir
esas imágenes (WebP o AVIF) antes de publicar.

### Telemetría

La página tiene dos fuentes de datos con ciclos de vida distintos.

**Reportes de semáforos.** La persona marca un cruce en el mapa, escribe sus
coordenadas o usa su ubicación, y elige qué le pasa. Los reportes se guardan
por ahora en `localStorage`, a través de un repositorio
(`infrastructure/reports`) con un contrato explícito: `getAll`, `add`,
`remove` y `subscribe`. Llevarlos a una API es escribir otro repositorio con
ese contrato y cambiar una línea en `infrastructure/reports/index.js`. La
página los lee con `useSyncExternalStore`, así que dos pestañas abiertas se
mantienen sincronizadas. La lista bajo el mapa contiene la misma información,
porque para quien usa lector de pantalla es la vista principal.

El mapa es [Leaflet](https://leafletjs.com) con las teselas de
OpenStreetMap: mapa mundial real, sin cuenta, clave ni facturación. La
política de uso de las teselas solo pide mostrar la atribución, que Leaflet
pone en la esquina. `infrastructure/maps/leafletMap.js` carga la biblioteca y
su CSS bajo demanda, así que solo los descarga la página de telemetría. Los
pines son `divIcon` con un SVG propio cuyo color sale de los tokens
(`.acpi-pin--*` en `index.css`). El contenedor lleva `isolate` para que los
`z-index` de Leaflet no tapen la cabecera fija. Si el mapa no carga, la
página lo avisa y sigue funcionando.

**Cruces registrados.** Cada hora el workflow de despliegue ejecuta la Action
`.github/actions/grafana-telemetry`, que consulta `POST /api/ds/query` en
Grafana, anonimiza el resultado y escribe `public/telemetry.json` antes de
compilar. El token y los datos sin agregar no salen del runner, y no se hace
ningún commit por hora. La anonimización (`scripts/telemetry/anonymize.mjs`):

- solo lee los campos del payload de la app (`docs/grafana-setup.md` en el
  repositorio ACPI) que necesita: `lat`, `lon`, `waiting_sec`, `duration_sec`,
  `status` (2 = orientación incorrecta, 3 = pánico) y `panics`. `device_id`,
  `session_id`, `timestamp` y `steps` se descartan sin leerlos;
- agrupa los cruces en una cuadrícula de ~110 m y publica una zona solo si
  reúne al menos 5 cruces; los de zonas más pequeñas cuentan en el total;
- no publica ninguna cifra si el total no llega a ese mínimo.

El formato de `telemetry.json` lo define `core/telemetry/snapshot.js`, que
importan tanto el script como la página: cambiarlo obliga a subir
`SNAPSHOT_VERSION`, y una página vieja frente a un archivo nuevo muestra «sin
datos» en lugar de cifras erróneas.

Las variables de Grafana y Maps, y un ejemplo de consulta, están en la sección
*Configuración* del [README de la raíz](../README.md#configuración).

### Animación

`Reveal` hace aparecer el contenido al entrar en pantalla. Lo que ya está
visible al montar se resuelve midiendo su posición, sin esperar al
`IntersectionObserver`, para que la portada no dependa de que llegue a
ejecutarse. Quien pida reducir el movimiento no recibe ninguna clase de
transición.

### Accesibilidad

Es un proyecto para personas con discapacidad visual, así que el sitio se
sostiene en HTML semántico, enlace de salto al contenido, anillo de foco
visible, `aria-current` en la navegación y respeto por
`prefers-reduced-motion`.

### Pruebas

`pnpm test` ejecuta `node --test`, sin dependencias: cubre el dominio de los
reportes, el contrato del resumen, el repositorio de `localStorage` y la
consulta y anonimización de Grafana. Las pruebas viven junto al módulo que
prueban (`*.test.js`, `*.test.mjs`) y corren en CI antes de compilar.

El estado de cada página está en el [README de la raíz](../README.md#páginas).
