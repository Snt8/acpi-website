import { createHash } from 'node:crypto'
import { EVENT_TYPE, isEvent, round, toNumber, toPosition } from './fields.mjs'

/**
 * Registro público de semáforos con baliza.
 *
 * La app envía un evento cada vez que un semáforo se crea, se edita o se
 * borra en un teléfono; su estado actual es el último evento de la pareja
 * `dispositivo` + `semaforo_id`. Loki solo conserva unos días de registros,
 * así que el registro no se reconstruye desde cero: se parte del que ya está
 * publicado y se le aplican, en orden, los eventos de la ventana consultada.
 * Repetir un evento ya aplicado no cambia nada, de modo que las ventanas
 * pueden solaparse entre una ejecución y otra.
 *
 * Se publica la posición y si lo detectó el brazalete o se registró a mano.
 * El nombre no, porque es texto libre que escribe la persona.
 */

/** ~1 m: la posición de un poste no es un dato personal. */
const POSITION_DECIMALS = 5

const ACTION = Object.freeze({ created: 'creado', edited: 'editado', deleted: 'borrado' })
const ORIGINS = Object.freeze(['brazalete', 'manual'])

/**
 * Identificador público y estable de un semáforo. Es un resumen de la pareja
 * que lo identifica en la app: no deja ver el seudónimo del teléfono ni
 * agrupar los semáforos que registró un mismo teléfono.
 */
export const trafficLightId = (device, lightId) =>
  createHash('sha256').update(`${device}:${lightId}`).digest('hex').slice(0, 16)

/** @param {Record<string, unknown>} row */
export function toTrafficLightEvent(row) {
  if (!isEvent(row, EVENT_TYPE.trafficLight)) return null
  if (!Object.values(ACTION).includes(row.accion)) return null

  const device = row.dispositivo
  const lightId = row.semaforo_id
  if (typeof device !== 'string' || !device || lightId === null || lightId === undefined) {
    return null
  }

  const position = toPosition(row)
  if (row.accion !== ACTION.deleted && !position) return null

  const at = toNumber(row.momento)
  return {
    id: trafficLightId(device, lightId),
    action: row.accion,
    at: Number.isFinite(at) ? at : 0,
    position,
    origin: ORIGINS.includes(row.origen) ? row.origen : null,
  }
}

/**
 * Aplica los eventos de la ventana sobre el registro anterior.
 *
 * @param {import('../../src/core/telemetry/snapshot.js').TrafficLight[]} previous
 * @param {Record<string, unknown>[]} rows
 * @returns {import('../../src/core/telemetry/snapshot.js').TrafficLight[]}
 */
export function applyTrafficLightEvents(previous, rows) {
  const lights = new Map(previous.map((light) => [light.id, light]))
  const events = rows
    .map(toTrafficLightEvent)
    .filter(Boolean)
    .sort((a, b) => a.at - b.at)

  for (const event of events) {
    if (event.action === ACTION.deleted) {
      lights.delete(event.id)
      continue
    }
    // `origen` solo viaja en `creado`; una edición conserva el que había.
    const origin =
      event.action === ACTION.created ? event.origin : (lights.get(event.id)?.origin ?? null)
    lights.set(event.id, {
      id: event.id,
      lat: round(event.position.lat, POSITION_DECIMALS),
      lng: round(event.position.lng, POSITION_DECIMALS),
      origin,
    })
  }

  // Orden estable: el archivo solo cambia cuando cambia el registro.
  return [...lights.values()].sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * Filtra un registro leído del archivo publicado, por si llega dañado.
 *
 * @param {unknown} lights
 * @returns {import('../../src/core/telemetry/snapshot.js').TrafficLight[]}
 */
export function sanitizeTrafficLights(lights) {
  if (!Array.isArray(lights)) return []
  return lights.filter(
    (light) =>
      typeof light?.id === 'string' &&
      Math.abs(light.lat) <= 90 &&
      Math.abs(light.lng) <= 180 &&
      (light.origin === null || ORIGINS.includes(light.origin)),
  )
}
