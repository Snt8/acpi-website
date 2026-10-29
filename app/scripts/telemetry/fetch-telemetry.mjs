#!/usr/bin/env node
/**
 * Consulta Grafana y escribe el resumen anónimo de telemetría que publica el
 * sitio. Lo ejecuta la Action `.github/actions/grafana-telemetry` antes de
 * compilar; en local: `pnpm telemetry` con las variables en `.env.local`.
 *
 * Variables de entorno:
 *   GRAFANA_URL            URL base de Grafana (p. ej. https://acpi.grafana.net)
 *   GRAFANA_TOKEN          token de una service account con rol Viewer
 *   GRAFANA_QUERIES        JSON con el arreglo `queries` de /api/ds/query
 *   GRAFANA_RANGE_DAYS     días hacia atrás que cubre el resumen (30 por defecto)
 *   PREVIOUS_SNAPSHOT_URL  resumen publicado, del que se hereda el registro
 *                          de semáforos (opcional)
 *   TELEMETRY_OUTPUT       archivo de salida (public/telemetry.json por defecto)
 *
 * Sin credenciales escribe un resumen vacío y termina bien: un fork o una
 * copia local deben poder compilar el sitio sin acceso a Grafana. Con
 * credenciales, cualquier fallo termina con error para que el despliegue se
 * detenga y siga publicado el último resumen bueno.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import {
  SNAPSHOT_STATUS,
  emptySnapshot,
  parseSnapshot,
} from '../../src/core/telemetry/snapshot.js'
import { buildSnapshot } from './build-snapshot.mjs'
import { queryGrafana } from './grafana.mjs'
import { sanitizeTrafficLights } from './traffic-lights.mjs'

const DAY_MS = 24 * 60 * 60 * 1000
const inActions = process.env.GITHUB_ACTIONS === 'true'

// Anotaciones de GitHub Actions: aparecen en el resumen del job.
const warn = (message) => console.warn(inActions ? `::warning::${message}` : message)
const fail = (message) => console.error(inActions ? `::error::${message}` : message)

function parseQueries(raw) {
  const parsed = JSON.parse(raw)
  const queries = Array.isArray(parsed) ? parsed : parsed?.queries
  if (!Array.isArray(queries) || queries.length === 0) {
    throw new Error('GRAFANA_QUERIES debe ser un arreglo JSON con al menos una consulta.')
  }
  return queries
}

/**
 * Registro de semáforos del resumen ya publicado. Si todavía no hay ninguno
 * (404) o es de otra versión, se empieza de cero. Cualquier otro fallo
 * detiene el proceso: seguir con un registro vacío borraría del mapa todos
 * los semáforos que Loki ya no conserva.
 */
async function fetchPreviousTrafficLights(url) {
  if (!url) return []
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15_000) })
  if (response.status === 404) return []
  if (!response.ok) {
    throw new Error(`No se pudo leer el resumen publicado (${response.status}).`)
  }
  const previous = parseSnapshot(await response.json())
  if (!previous) warn('El resumen publicado es de otra versión: el registro de semáforos empieza de cero.')
  return sanitizeTrafficLights(previous?.trafficLights)
}

async function writeSnapshot(path, snapshot) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(snapshot, null, 2)}\n`)
}

async function main() {
  const {
    GRAFANA_URL,
    GRAFANA_TOKEN,
    GRAFANA_QUERIES,
    GRAFANA_RANGE_DAYS = '30',
    PREVIOUS_SNAPSHOT_URL,
    TELEMETRY_OUTPUT = 'public/telemetry.json',
  } = process.env

  const output = resolve(TELEMETRY_OUTPUT)
  const to = new Date()

  if (!GRAFANA_URL || !GRAFANA_TOKEN || !GRAFANA_QUERIES) {
    warn('Grafana no está configurado: se publica un resumen de telemetría vacío.')
    await writeSnapshot(output, emptySnapshot(SNAPSHOT_STATUS.unconfigured, { generatedAt: to }))
    return
  }

  const days = Number(GRAFANA_RANGE_DAYS)
  if (!Number.isInteger(days) || days <= 0) {
    throw new Error('GRAFANA_RANGE_DAYS debe ser un número entero de días mayor que cero.')
  }
  const from = new Date(to.getTime() - days * DAY_MS)

  const previousTrafficLights = await fetchPreviousTrafficLights(PREVIOUS_SNAPSHOT_URL)
  const rows = await queryGrafana({
    url: GRAFANA_URL,
    token: GRAFANA_TOKEN,
    queries: parseQueries(GRAFANA_QUERIES),
    from,
    to,
  })
  const snapshot = buildSnapshot(rows, { generatedAt: to, from, to, previousTrafficLights })
  await writeSnapshot(output, snapshot)

  // Solo cifras agregadas: el registro del job también es público.
  console.log(
    `Telemetría: ${rows.length} eventos leídos, estado «${snapshot.status}», ` +
      `${snapshot.zones.length} zonas y ${snapshot.trafficLights.length} semáforos ` +
      `(${previousTrafficLights.length} heredados) → ${TELEMETRY_OUTPUT}`,
  )
}

main().catch((error) => {
  fail(`No se pudo generar la telemetría: ${error.message}`)
  process.exitCode = 1
})
