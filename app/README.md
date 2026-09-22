# ACPI — sitio web

Sitio de divulgación del **Asistente de Cruce Peatonal para Invidentes**.
React 19 + Vite + Tailwind CSS 4 + React Router 7.

## Comandos

```bash
pnpm dev      # servidor de desarrollo
pnpm build    # compilación de producción en dist/
pnpm preview  # sirve dist/ localmente
pnpm lint     # oxlint
```

## Arquitectura

La regla es que las dependencias apunten siempre hacia adentro: las páginas
conocen el contenido y la UI compartida, nunca al revés.

```
src/
├── app/            Composición raíz: tabla de rutas y RouterProvider.
├── core/           Núcleo sin React.
│   ├── content/    Textos del sitio como datos puros.
│   └── routing/    Rutas canónicas (PATHS).
├── layout/         Cabecera, pie y shell común a todas las páginas.
├── pages/          Una carpeta por página, con sus secciones propias.
└── shared/         Piezas reutilizables sin conocimiento del dominio.
    ├── lib/        Utilidades (cx).
    └── ui/         Container, Section, Card, Button, AssetPlaceholder…
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

Todos los `import` de imágenes viven en `core/content/media.content.js`, así
que ninguna página conoce una ruta de archivo y Vite sigue versionando cada
asset en la compilación. `Figure` las muestra con la misma aparición que el
resto del contenido.

`SpinViewer` usa las seis vistas del brazalete para dejar girarlo: la posición
horizontal del puntero dentro del marco elige el fotograma, y las flechas del
teclado hacen lo mismo sin ratón. Los seis fotogramas se montan a la vez para
que el giro no espere descargas, lo que pesa unos 2,3 MB: conviene comprimir
esas imágenes (WebP o AVIF) antes de publicar.

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

## Estado

| Página | Estado |
| --- | --- |
| Inicio (`/`) | Implementada según boceto |
| Brazalete (`/brazalete`) | Implementada según boceto, con visor giratorio |
| Telemetría (`/telemetria`) | A la espera de boceto |
| App móvil (`/app-movil`) | A la espera de boceto |
| Historia (`/historia`) | A la espera de boceto |
