import { SNAPSHOT_STATUS } from '../../src/core/telemetry/snapshot.js'
import { EVENT_TYPE, isEvent, round, toDuration, toFlag, toNumber, toPosition } from './fields.mjs'

/**
 * Política de anonimato de las cifras de cruces.
 *
 * - Solo se leen los campos de `toSession`; los demás (dispositivo, sesión,
 *   momentos exactos, rumbo…) se descartan sin mirarlos.
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

/**
 * Reduce un evento `cruce` de la app a la sesión mínima que necesita el
 * resumen. Descarta los eventos de otro tipo y los del brazalete simulado.
 * Una sesión sin GPS (`lat` nulo) cuenta en el total, pero en ninguna zona.
 *
 * @param {Record<string, unknown>} row
 */
export function toSession(row) {
  if (!isEvent(row, EVENT_TYPE.crossing) || toFlag(row.simulado)) return null

  const crossed = toFlag(row.cruzo)
  return {
    position: toPosition(row),
    wait: toDuration(row.espera_s),
    crossing: crossed ? toDuration(row.duracion_cruce_s) : null,
    greenLeft: crossed ? toDuration(row.verde_restante_s) : null,
    disoriented: toNumber(row.veces_mal_orientado) > 0,
  }
}

/** Acumulador de un grupo de sesiones: la ciudad entera o una zona. */
const createAccumulator = () => ({
  sessions: 0,
  disoriented: 0,
  wait: { sum: 0, count: 0 },
  crossing: { sum: 0, count: 0 },
  greenLeft: { sum: 0, count: 0 },
})

const addValue = (metric, value) => {
  if (value === null) return
  metric.sum += value
  metric.count += 1
}

function accumulate(acc, session) {
  acc.sessions += 1
  if (session.disoriented) acc.disoriented += 1
  addValue(acc.wait, session.wait)
  addValue(acc.crossing, session.crossing)
  addValue(acc.greenLeft, session.greenLeft)
}

const average = ({ sum, count }) => (count === 0 ? null : round(sum / count, 1))

/** @returns {import('../../src/core/telemetry/snapshot.js').Summary} */
const summarize = (acc) => ({
  sessions: acc.sessions,
  avgWaitSeconds: average(acc.wait),
  avgCrossingSeconds: average(acc.crossing),
  disorientationRate: round(acc.disoriented / acc.sessions, 3),
  avgGreenLeftSeconds: average(acc.greenLeft),
})

/**
 * Agrega los cruces en cifras de ciudad y de zona. Función pura.
 *
 * @param {Record<string, unknown>[]} rows
 * @param {typeof ANONYMITY_POLICY} [policy]
 */
export function summarizeCrossings(rows, policy = ANONYMITY_POLICY) {
  const sessions = rows.map(toSession).filter(Boolean)
  if (sessions.length < policy.minSessionsPerZone) {
    return { status: SNAPSHOT_STATUS.insufficient, totals: null, zones: [], hiddenSessions: 0 }
  }

  // Un solo recorrido llena el total y las celdas de la cuadrícula.
  const totals = createAccumulator()
  const cells = new Map()
  for (const session of sessions) {
    accumulate(totals, session)
    if (!session.position) continue
    const lat = round(session.position.lat, policy.cellDecimals)
    const lng = round(session.position.lng, policy.cellDecimals)
    const key = `${lat},${lng}`
    if (!cells.has(key)) cells.set(key, { lat, lng, acc: createAccumulator() })
    accumulate(cells.get(key).acc, session)
  }

  const publishable = [...cells.values()].filter(
    (cell) => cell.acc.sessions >= policy.minSessionsPerZone,
  )
  const publishedSessions = publishable.reduce((sum, cell) => sum + cell.acc.sessions, 0)

  return {
    status: SNAPSHOT_STATUS.ok,
    totals: summarize(totals),
    zones: publishable
      .sort((a, b) => b.acc.sessions - a.acc.sessions)
      .slice(0, policy.maxZones)
      .map(({ lat, lng, acc }) => ({ lat, lng, ...summarize(acc) })),
    hiddenSessions: sessions.length - publishedSessions,
  }
}
