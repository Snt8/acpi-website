import { parseSnapshot } from '../../core/telemetry/snapshot.js'

/**
 * El resumen se publica como un archivo estático junto al sitio, regenerado
 * cada hora por la Action de Grafana. Se pide en tiempo de ejecución, y no se
 * importa, para que el archivo no forme parte del código fuente.
 */
const SNAPSHOT_URL = `${import.meta.env.BASE_URL}telemetry.json`

/**
 * @param {AbortSignal} [signal]
 * @returns {Promise<import('../../core/telemetry/snapshot.js').Snapshot | null>}
 *   el resumen, o `null` si todavía no se ha publicado ninguno válido
 */
export async function fetchTelemetrySnapshot(signal) {
  const response = await fetch(SNAPSHOT_URL, { signal, cache: 'no-cache' })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Telemetría no disponible (${response.status}).`)
  // Sin archivo, el servidor de desarrollo responde con index.html.
  if (!response.headers.get('content-type')?.includes('json')) return null
  return parseSnapshot(await response.json())
}
