import { useEffect, useRef, useState } from 'react'
import {
  REPORT_ISSUE_LABELS,
  REPORTS_SECTION,
} from '../../../core/content/telemetry.content.js'
import {
  MAP_ID,
  isMapsConfigured,
  loadMapLibraries,
  onMapsAuthFailure,
} from '../../../infrastructure/maps/googleMaps.js'
import { formatDateTime } from '../../../shared/lib/format.js'

/** Bogotá, sede de la ETITC: donde nace el prototipo. */
const DEFAULT_VIEW = Object.freeze({ center: { lat: 4.6097, lng: -74.0817 }, zoom: 13 })
const SINGLE_REPORT_ZOOM = 16

/**
 * Encuadre inicial: todos los reportes guardados o, si no hay, la ciudad.
 *
 * @param {import('../../../core/telemetry/reports.js').Report[]} reports
 */
function applyInitialView(map, reports) {
  if (reports.length === 0) return
  if (reports.length === 1) {
    map.setCenter(reports[0].position)
    map.setZoom(SINGLE_REPORT_ZOOM)
    return
  }
  const lats = reports.map((report) => report.position.lat)
  const lngs = reports.map((report) => report.position.lng)
  map.fitBounds({
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  })
}

/** Los pines toman los colores de los tokens de diseño, no de una copia. */
const token = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim()

const pinOptions = (fill, border, scale = 1) => ({
  background: token(fill),
  borderColor: token(border),
  glyphColor: token('paper-raised'),
  scale,
})

// Según la versión de la API, PinElement es el nodo o lo expone en `element`.
const pinNode = (pin) => (pin instanceof HTMLElement ? pin : pin.element)

/**
 * Mapa de Google con un marcador por reporte.
 *
 * El mapa se crea una vez; los marcadores se rehacen cuando cambian los
 * reportes, la selección o el punto en borrador. Son pocos y viven en este
 * navegador, así que rehacerlos es más simple que reconciliarlos uno a uno.
 * Si no hay clave o Google la rechaza, el componente lo dice y la página
 * sigue funcionando con la lista y las coordenadas escritas a mano.
 */
export function ReportsMap({ reports, selectedId, draftPosition, onPick, onSelect }) {
  const containerRef = useRef(null)
  const [instance, setInstance] = useState(null)
  const [status, setStatus] = useState(isMapsConfigured ? 'loading' : 'unavailable')
  const { map: copy } = REPORTS_SECTION

  // Los manejadores se leen al dispararse, no al crear el mapa, para no tener
  // que volver a registrar los eventos de Google en cada render.
  const latest = useRef({ onPick, onSelect, reports })
  useEffect(() => {
    latest.current = { onPick, onSelect, reports }
  })

  useEffect(() => {
    if (!isMapsConfigured) return undefined

    let cancelled = false
    let clickListener = null
    const stopAuthWatch = onMapsAuthFailure(() => setStatus('unavailable'))

    loadMapLibraries()
      .then((libraries) => {
        if (cancelled) return
        const map = new libraries.Map(containerRef.current, {
          ...DEFAULT_VIEW,
          mapId: MAP_ID,
          clickableIcons: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        })
        applyInitialView(map, latest.current.reports)
        clickListener = map.addListener('click', ({ latLng }) => {
          if (latLng) latest.current.onPick({ lat: latLng.lat(), lng: latLng.lng() })
        })
        setInstance({ map, libraries })
        setStatus('ready')
      })
      .catch((error) => {
        if (cancelled) return
        console.warn('[ACPI] No se pudo cargar Google Maps:', error)
        setStatus('unavailable')
      })

    return () => {
      cancelled = true
      clickListener?.remove()
      stopAuthWatch()
    }
  }, [])

  useEffect(() => {
    if (!instance) return undefined
    const { map, libraries } = instance
    const { AdvancedMarkerElement, PinElement } = libraries

    const markers = reports.map((report) => {
      const isSelected = report.id === selectedId
      const pin = new PinElement(
        isSelected ? pinOptions('signal', 'signal-strong', 1.3) : pinOptions('amber', 'ink'),
      )
      const marker = new AdvancedMarkerElement({
        map,
        position: report.position,
        title: `${report.name}: ${REPORT_ISSUE_LABELS[report.issue]}`,
        content: pinNode(pin),
        gmpClickable: true,
        zIndex: isSelected ? 1 : 0,
      })
      marker.addEventListener('gmp-click', () => latest.current.onSelect(report.id))
      return marker
    })

    if (draftPosition) {
      markers.push(
        new AdvancedMarkerElement({
          map,
          position: draftPosition,
          title: 'Punto del nuevo reporte',
          content: pinNode(new PinElement(pinOptions('ink', 'ink'))),
          zIndex: 2,
        }),
      )
    }

    return () => markers.forEach((marker) => (marker.map = null))
  }, [instance, reports, selectedId, draftPosition])

  const selected = reports.find((report) => report.id === selectedId)

  useEffect(() => {
    if (instance && selected) instance.map.panTo(selected.position)
  }, [instance, selected])

  return (
    <div className="overflow-hidden rounded-card border border-line bg-paper-raised">
      <div className="relative h-80 bg-paper sm:h-[28rem]">
        <div
          ref={containerRef}
          role="region"
          aria-label={copy.label}
          aria-describedby="mapa-reportes-ayuda"
          className="absolute inset-0"
        />
        {status === 'ready' ? null : (
          <div className="absolute inset-0 grid place-items-center bg-paper p-6 text-center">
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
