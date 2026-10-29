/**
 * Reporte de un semáforo: una persona marca un cruce y cuenta qué le pasa.
 * Es dominio puro, sin almacenamiento ni React, para que el día que los
 * reportes vivan en un servidor solo cambie el repositorio que los guarda.
 *
 * @typedef {{ lat: number, lng: number }} Position
 * @typedef {{
 *   id: string,
 *   name: string,
 *   issue: string,
 *   note: string,
 *   position: Position,
 *   reportedAt: string,
 * }} Report
 */

/** Problemas que se pueden reportar. Los textos viven en el contenido. */
export const REPORT_ISSUES = Object.freeze([
  'no-sound',
  'short-crossing',
  'broken',
  'obstructed',
])

export const REPORT_LIMITS = Object.freeze({ name: 80, note: 280 })

const inRange = (value, limit) =>
  typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit

/** @param {unknown} position */
export const isValidPosition = (position) =>
  inRange(position?.lat, 90) && inRange(position?.lng, 180)

/**
 * Reconoce un reporte bien formado. El repositorio lo usa para descartar lo
 * que encuentre corrupto en el almacenamiento en vez de romper la página.
 *
 * @param {unknown} value
 * @returns {value is Report}
 */
export function isReport(value) {
  return (
    typeof value?.id === 'string' &&
    typeof value.name === 'string' &&
    REPORT_ISSUES.includes(value.issue) &&
    typeof value.note === 'string' &&
    isValidPosition(value.position) &&
    !Number.isNaN(Date.parse(value.reportedAt))
  )
}

/**
 * Valida los datos de un formulario y, si son correctos, construye el reporte.
 * Los errores son códigos por campo; el mensaje que ve la persona lo decide
 * el contenido, no el dominio.
 *
 * @param {{ name?: string, issue?: string, note?: string, position?: Partial<Position> }} input
 * @param {{ now?: Date, createId?: () => string }} [deps]
 * @returns {{ ok: true, report: Report } | { ok: false, errors: Record<string, string> }}
 */
export function createReport(
  { name = '', issue = '', note = '', position },
  { now = new Date(), createId = () => crypto.randomUUID() } = {},
) {
  const cleanName = name.trim()
  const cleanNote = note.trim()
  const errors = {}

  if (!cleanName) errors.name = 'required'
  else if (cleanName.length > REPORT_LIMITS.name) errors.name = 'tooLong'
  if (!REPORT_ISSUES.includes(issue)) errors.issue = 'required'
  if (cleanNote.length > REPORT_LIMITS.note) errors.note = 'tooLong'
  if (!isValidPosition(position)) errors.position = 'invalid'

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    report: {
      id: createId(),
      name: cleanName,
      issue,
      note: cleanNote,
      position: { lat: position.lat, lng: position.lng },
      reportedAt: now.toISOString(),
    },
  }
}
