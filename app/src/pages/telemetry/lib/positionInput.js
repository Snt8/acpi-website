import { isValidPosition } from '../../../core/telemetry/reports.js'

/**
 * Las coordenadas del formulario se editan como texto —se pueden escribir a
 * mano, con coma o punto decimal— y solo se convierten a número al usarlas.
 */
export const EMPTY_POSITION_INPUT = Object.freeze({ lat: '', lng: '' })

/** @param {{ lat: number, lng: number }} position */
export const toPositionInput = ({ lat, lng }) => ({
  lat: lat.toFixed(6),
  lng: lng.toFixed(6),
})

const toNumber = (text) => {
  const clean = text.trim().replace(',', '.')
  return clean === '' ? Number.NaN : Number(clean)
}

/**
 * @param {{ lat: string, lng: string }} input
 * @returns {{ lat: number, lng: number } | null} `null` si no es una posición válida
 */
export function parsePositionInput(input) {
  const position = { lat: toNumber(input.lat), lng: toNumber(input.lng) }
  return isValidPosition(position) ? position : null
}
