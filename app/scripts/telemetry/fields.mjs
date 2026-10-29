/**
 * Lectura defensiva de los campos que envía la app. Loki guarda texto: un
 * número puede llegar como cadena, y un dato ausente como `null` o vacío.
 */

/** Versión del formato de eventos de la app (docs/grafana-setup.md, ACPI). */
export const EVENT_VERSION = 2

export const EVENT_TYPE = Object.freeze({ crossing: 'cruce', trafficLight: 'semaforo' })

/** @returns {number} `NaN` si no hay dato */
export const toNumber = (value) =>
  value === null || value === undefined || value === '' ? Number.NaN : Number(value)

/** @returns {number | null} segundos no negativos, o `null` */
export const toDuration = (value) => {
  const seconds = toNumber(value)
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null
}

export const toFlag = (value) => value === true || value === 'true' || value === 1

export const round = (value, decimals) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** @returns {{ lat: number, lng: number } | null} */
export function toPosition(row) {
  const lat = toNumber(row.lat)
  const lng = toNumber(row.lon)
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null
}

/** ¿Es un evento de este tipo y de la versión que entiende el script? */
export const isEvent = (row, type) =>
  toNumber(row.v) === EVENT_VERSION && row.tipo === type
