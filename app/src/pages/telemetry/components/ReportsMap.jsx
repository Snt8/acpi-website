import { useEffect, useRef, useState } from 'react'
import {
  REPORT_ISSUE_LABELS,
  REPORTS_SECTION,
} from '../../../core/content/telemetry.content.js'
import { TILE_LAYER, loadMapLibrary } from '../../../infrastructure/maps/leafletMap.js'
import { formatDateTime } from '../../../shared/lib/format.js'

/** Bogotá, sede de la ETITC: donde nace el prototipo. */
const DEFAULT_VIEW = Object.freeze({ center: { lat: 4.6097, lng: -74.0817 }, zoom: 13 })
const SINGLE_REPORT_ZOOM = 16

/**
 * Pin de los marcadores. Toma el color de su clase (`acpi-pin--*` en
 * index.css), que a su vez sale de los tokens de diseño.
 */
const PIN_SVG =
  '<svg viewBox="0 0 28 38" aria-hidden="true"><path d="M14 37C10 27 1 22 1 13.5a13 13 0 0 1 26 0C27 22 18 27 14 37Z" fill="currentColor" stroke="var(--color-ink)" stroke-width="1.5"/><circle cx="14" cy="13.5" r="5" fill="var(--color-paper-raised)"/></svg>'

const PIN_SIZES = Object.freeze({
  report: [28, 38],
  selected: [36, 49],
  draft: [28, 38],
})

/** @param {typeof import('leaflet')} L @param {keyof PIN_SIZES} variant */
const pinIcon = (L, variant) => {
  const [width, height] = PIN_SIZES[variant]
  return L.divIcon({
    className: `acpi-pin acpi-pin--${variant}`,
    html: PIN_SVG,
    iconSize: [width, height],
    iconAnchor: [width / 2, height - 1],
  })
}

/**
 * Encuadre inicial: todos los reportes guardados o, si no hay, la ciudad.
 *
 * @param {import('leaflet').Map} map
 * @param {import('../../../core/telemetry/reports.js').Report[]} reports
 */
function applyInitialView(map, reports) {
  if (reports.length === 0) return
  if (reports.length === 1) {
    map.setView(reports[0].position, SINGLE_REPORT_ZOOM)
    return
  }
  map.fitBounds(
    reports.map((report) => report.position),
    { padding: [48, 48], maxZoom: SINGLE_REPORT_ZOOM },
  )
}

/**
 * Mapa de OpenStreetMap (Leaflet) con un marcador por reporte.
 *
 * El mapa se crea una vez; los marcadores se rehacen cuando cambian los
 * reportes, la selección o el punto en borrador. Son pocos y viven en este
 * navegador, así que rehacerlos es más simple que reconciliarlos uno a uno.
 * Si el mapa no carga (sin conexión, por ejemplo), el componente lo dice y la
 * página sigue funcionando con la lista y las coordenadas escritas a mano.
 */
export function ReportsMap({ reports, selectedId, draftPosition, onPick, onSelect }) {
  const containerRef = useRef(null)
  const [instance, setInstance] = useState(null)
  const [status, setStatus] = useState('loading')
  const { map: copy } = REPORTS_SECTION

  // Los manejadores se leen al dispararse, no al crear el mapa, para no tener
  // que volver a registrar los eventos de Leaflet en cada render.
  const latest = useRef({ onPick, onSelect, reports })
  useEffect(() => {
    latest.current = { onPick, onSelect, reports }
  })

  useEffect(() => {
    let cancelled = false
    let map = null

    loadMapLibrary()
      .then((L) => {
        if (cancelled) return
        // La rueda solo hace zoom tras hacer clic o enfocar el mapa: si no,
        // quien baja por la página quedaría atrapado alejando el mapa.
        map = L.map(containerRef.current, {
          ...DEFAULT_VIEW,
          zoomControl: false,
          scrollWheelZoom: false,
        })
        map.on('focus click', () => map.scrollWheelZoom.enable())
        map.on('blur mouseout', () => map.scrollWheelZoom.disable())
        L.control
          .zoom({ zoomInTitle: copy.zoomIn, zoomOutTitle: copy.zoomOut })
          .addTo(map)
        L.tileLayer(TILE_LAYER.url, {
          attribution: TILE_LAYER.attribution,
          maxZoom: TILE_LAYER.maxZoom,
        }).addTo(map)
        applyInitialView(map, latest.current.reports)
        map.on('click', ({ latlng }) =>
          latest.current.onPick({ lat: latlng.lat, lng: latlng.lng }),
        )
        setInstance({ L, map })
        setStatus('ready')
      })
      .catch((error) => {
        if (cancelled) return
        console.warn('[ACPI] No se pudo cargar el mapa:', error)
        setStatus('unavailable')
      })

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [copy.zoomIn, copy.zoomOut])

  useEffect(() => {
    if (!instance) return undefined
    const { L, map } = instance

    const markers = reports.map((report) => {
      const isSelected = report.id === selectedId
      return L.marker(report.position, {
        icon: pinIcon(L, isSelected ? 'selected' : 'report'),
        title: `${report.name}: ${REPORT_ISSUE_LABELS[report.issue]}`,
        riseOnHover: true,
        zIndexOffset: isSelected ? 1000 : 0,
      })
        .on('click', () => latest.current.onSelect(report.id))
        .addTo(map)
    })

    if (draftPosition) {
      markers.push(
        L.marker(draftPosition, {
          icon: pinIcon(L, 'draft'),
          title: 'Punto del nuevo reporte',
          interactive: false,
          keyboard: false,
          zIndexOffset: 2000,
        }).addTo(map),
      )
    }

    return () => markers.forEach((marker) => marker.remove())
  }, [instance, reports, selectedId, draftPosition])

  const selected = reports.find((report) => report.id === selectedId)

  useEffect(() => {
    if (instance && selected) instance.map.panTo(selected.position)
  }, [instance, selected])

  return (
    <div className="overflow-hidden rounded-card border border-line bg-paper-raised">
      {/* `isolate` encierra los z-index de Leaflet (hasta 1000) para que el
          mapa nunca tape la cabecera fija al desplazarse. */}
      <div
        role="region"
        aria-label={copy.label}
        aria-describedby="mapa-reportes-ayuda"
        className="relative isolate h-80 bg-paper sm:h-[28rem]"
      >
        <div ref={containerRef} className="absolute inset-0" />
        {status === 'ready' ? null : (
          <div className="absolute inset-0 z-10 grid place-items-center bg-paper p-6 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-grid-paper opacity-60 mask-fade-edges"
            />
            <p role="status" className="relative max-w-sm text-sm leading-relaxed text-ink-soft">
              {status === 'loading' ? copy.loading : copy.unavailable}
            </p>
          </div>
        )}
      </div>

      <p
        id="mapa-reportes-ayuda"
        aria-live="polite"
        className="border-t border-line px-6 py-4 text-sm leading-relaxed text-ink-soft"
      >
        {selected ? (
          <>
            <span className="font-semibold text-ink">{selected.name}</span>
            {' · '}
            {REPORT_ISSUE_LABELS[selected.issue]}
            {' · '}
            <time dateTime={selected.reportedAt}>{formatDateTime(selected.reportedAt)}</time>
          </>
        ) : status === 'ready' ? (
          `${copy.hint} ${copy.listHint}`
        ) : (
          copy.listHint
        )}
      </p>
    </div>
  )
}
