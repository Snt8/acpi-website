const LOCALE = 'es-CO'

const integer = new Intl.NumberFormat(LOCALE)
const percent = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 })
const coordinate = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})
const dateTime = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' })
const date = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' })

/** @param {number} value */
export const formatInteger = (value) => integer.format(value)

/** @param {number} ratio entre 0 y 1 */
export const formatPercent = (ratio) => percent.format(ratio)

/** @param {string | Date} value */
export const formatDateTime = (value) => dateTime.format(new Date(value))

/** @param {string | Date} value */
export const formatDate = (value) => date.format(new Date(value))

/** @param {{ lat: number, lng: number }} position */
export const formatPosition = ({ lat, lng }) =>
  `${coordinate.format(lat)}, ${coordinate.format(lng)}`

/**
 * Duración legible: «42 s» o «1 min 05 s».
 *
 * @param {number | null} seconds
 * @returns {string} «—» cuando no hay dato
 */
export function formatSeconds(seconds) {
  if (seconds === null || !Number.isFinite(seconds)) return '—'
  const total = Math.round(seconds)
  if (total < 60) return `${total} s`
  const minutes = Math.floor(total / 60)
  const rest = String(total % 60).padStart(2, '0')
  return `${minutes} min ${rest} s`
}
