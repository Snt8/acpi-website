/**
 * Contrato del resumen de telemetría que se publica junto al sitio.
 *
 * Lo escribe la Action que consulta Grafana (`scripts/telemetry`) y lo lee la
 * página de telemetría, así que ambos lados importan este módulo: cambiar la
 * forma del archivo obliga a subir `SNAPSHOT_VERSION`, y una página vieja
 * frente a un archivo nuevo muestra «sin datos» en lugar de cifras erróneas.
 *
 * @typedef {{
 *   sessions: number,
 *   avgWaitSeconds: number | null,
 *   avgCrossingSeconds: number | null,
 *   disorientationRate: number,
 *   panicAlerts: number,
 * }} Summary
 * @typedef {Summary & { lat: number, lng: number }} Zone
 * @typedef {{
 *   version: number,
 *   status: 'ok' | 'insufficient' | 'unconfigured',
 *   generatedAt: string,
 *   range: { from: string, to: string } | null,
 *   policy: { cellDecimals: number, minSessionsPerZone: number } | null,
 *   totals: Summary | null,
 *   zones: Zone[],
 *   hiddenSessions: number,
 * }} Snapshot
 */

export const SNAPSHOT_VERSION = 1

export const SNAPSHOT_STATUS = Object.freeze({
  /** Hay datos suficientes para publicarlos sin identificar a nadie. */
  ok: 'ok',
  /** Hay datos, pero tan pocos que publicarlos podría señalar a alguien. */
  insufficient: 'insufficient',
  /** La Action no tiene credenciales de Grafana. */
  unconfigured: 'unconfigured',
})

const METERS_PER_DEGREE = 111_320

/**
 * Lado aproximado, en metros, de una celda de la cuadrícula de anonimato.
 * Las coordenadas se redondean a `decimals` decimales, así que la celda mide
 * 10^-decimals grados (en longitud un poco menos, lejos del ecuador).
 *
 * @param {number} decimals
 */
export const cellSizeMeters = (decimals) => Math.round(METERS_PER_DEGREE * 10 ** -decimals)

/**
 * Resumen sin cifras, para cuando no hay nada publicable.
 *
 * @param {Snapshot['status']} status
 * @param {{ generatedAt: Date, range?: Snapshot['range'], policy?: Snapshot['policy'] }} meta
 * @returns {Snapshot}
 */
export function emptySnapshot(status, { generatedAt, range = null, policy = null }) {
  return {
    version: SNAPSHOT_VERSION,
    status,
    generatedAt: generatedAt.toISOString(),
    range,
    policy,
    totals: null,
    zones: [],
    hiddenSessions: 0,
  }
}

/**
 * Acepta el resumen solo si es de esta versión y tiene la forma esperada.
 *
 * @param {unknown} raw
 * @returns {Snapshot | null}
 */
export function parseSnapshot(raw) {
  if (raw?.version !== SNAPSHOT_VERSION) return null
  if (!Object.values(SNAPSHOT_STATUS).includes(raw.status)) return null
  if (!Array.isArray(raw.zones)) return null
  if (raw.status === SNAPSHOT_STATUS.ok && typeof raw.totals?.sessions !== 'number') {
    return null
  }
  return raw
}
