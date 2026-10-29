import {
  SNAPSHOT_STATUS,
  SNAPSHOT_VERSION,
  emptySnapshot,
} from '../../src/core/telemetry/snapshot.js'

/**
 * Política de anonimato del resumen público.
 *
 * - Solo se leen los campos de `toSession`; cualquier otra columna que traiga
 *   la consulta (dispositivo, sesión, hora exacta…) se descarta sin mirarla.
 * - La ubicación se redondea a una cuadrícula de unos 110 m: se publica la
 *   zona de un cruce, nunca un punto.
 * - Una zona con menos de `minSessionsPerZone` cruces no se publica, porque
 *   en una celda con dos o tres cruces es fácil adivinar quién los hizo. Sus
 *   cruces siguen contando en el total de la ciudad.
 * - Si ni siquiera el total llega a ese mínimo, no se publica ninguna cifra.
 */
export const ANONYMITY_POLICY = Object.freeze({
  cellDecimals: 3,
  minSessionsPerZone: 5,
  maxZones: 12,
})

const toNumber = (value) =>
  value === null || value === undefined || value === '' ? Number.NaN : Number(value)

const toDuration = (value) => {
  const seconds = toNumber(value)
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null
}

const toCount = (value) => {
  const count = toNumber(value)
  return Number.isInteger(count) && count > 0 ? count : 0
}

/** `status` que envía la app al cerrar una sesión (docs/grafana-setup.md). */
const SESSION_STATUS = Object.freeze({ misaligned: 2, panic: 3 })

const round = (value, decimals) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Reduce una fila de Grafana a la sesión mínima que necesita el resumen.
 * Lee los campos del payload que envía la app al cerrar cada cruce
 * (`lat`, `lon`, `waiting_sec`, `duration_sec`, `status`, `panics`); los
 * demás —`device_id`, `session_id`, `timestamp`, `steps`— nunca se leen.
 *
 * @param {Record<string, unknown>} row
 */
export function toSession(row) {
  const lat = toNumber(row.lat)
  const lng = toNumber(row.lon)
  if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return null

  const status = toNumber(row.status)
  const panics = toCount(row.panics)

  return {
    lat,
    lng,
    wait: toDuration(row.waiting_sec),
    crossing: toDuration(row.duration_sec),
    disoriented: status === SESSION_STATUS.misaligned,
    // Una sesión cerrada en pánico cuenta al menos una alerta aunque el
    // contador de pulsaciones no haya llegado a registrarla.
    panicAlerts: status === SESSION_STATUS.panic ? Math.max(panics, 1) : panics,
  }
}

/** Acumulador de un grupo de sesiones: la ciudad entera o una zona. */
const createAccumulator = () => ({
  sessions: 0,
  waitSum: 0,
  waitCount: 0,
  crossingSum: 0,
  crossingCount: 0,
  disoriented: 0,
  panic: 0,
})

function accumulate(acc, session) {
  acc.sessions += 1
  if (session.wait !== null) {
    acc.waitSum += session.wait
    acc.waitCount += 1
  }
  if (session.crossing !== null) {
    acc.crossingSum += session.crossing
    acc.crossingCount += 1
  }
  if (session.disoriented) acc.disoriented += 1
  acc.panic += session.panicAlerts
}

const average = (sum, count) => (count === 0 ? null : round(sum / count, 1))

/** @returns {import('../../src/core/telemetry/snapshot.js').Summary} */
const summarize = (acc) => ({
  sessions: acc.sessions,
  avgWaitSeconds: average(acc.waitSum, acc.waitCount),
  avgCrossingSeconds: average(acc.crossingSum, acc.crossingCount),
  disorientationRate: round(acc.disoriented / acc.sessions, 3),
  panicAlerts: acc.panic,
})

/**
 * Convierte las filas de Grafana en el resumen anónimo que publica el sitio.
 * Es una función pura: misma entrada, mismo archivo.
 *
 * @param {Record<string, unknown>[]} rows
 * @param {{ generatedAt: Date, from: Date, to: Date, policy?: typeof ANONYMITY_POLICY }} meta
 * @returns {import('../../src/core/telemetry/snapshot.js').Snapshot}
 */
export function buildSnapshot(rows, { generatedAt, from, to, policy = ANONYMITY_POLICY }) {
  const range = { from: from.toISOString(), to: to.toISOString() }
  const publicPolicy = {
    cellDecimals: policy.cellDecimals,
    minSessionsPerZone: policy.minSessionsPerZone,
  }

  const sessions = rows.map(toSession).filter(Boolean)
  if (sessions.length < policy.minSessionsPerZone) {
    return emptySnapshot(SNAPSHOT_STATUS.insufficient, {
      generatedAt,
      range,
      policy: publicPolicy,
    })
  }

  // Un solo recorrido llena el total y las celdas de la cuadrícula.
  const totals = createAccumulator()
  const cells = new Map()
  for (const session of sessions) {
    accumulate(totals, session)
    const lat = round(session.lat, policy.cellDecimals)
    const lng = round(session.lng, policy.cellDecimals)
    const key = `${lat},${lng}`
    if (!cells.has(key)) cells.set(key, { lat, lng, acc: createAccumulator() })
    accumulate(cells.get(key).acc, session)
  }

  const publishable = [...cells.values()].filter(
    (cell) => cell.acc.sessions >= policy.minSessionsPerZone,
  )
  const publishedSessions = publishable.reduce((sum, cell) => sum + cell.acc.sessions, 0)

  const zones = publishable
    .sort((a, b) => b.acc.sessions - a.acc.sessions)
    .slice(0, policy.maxZones)
    .map(({ lat, lng, acc }) => ({ lat, lng, ...summarize(acc) }))

  return {
    version: SNAPSHOT_VERSION,
    status: SNAPSHOT_STATUS.ok,
    generatedAt: generatedAt.toISOString(),
    range,
    policy: publicPolicy,
    totals: summarize(totals),
    zones,
    hiddenSessions: sessions.length - publishedSessions,
  }
}
