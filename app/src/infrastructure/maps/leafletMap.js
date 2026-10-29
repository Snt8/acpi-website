/**
 * Mapa base: Leaflet con las teselas de OpenStreetMap.
 *
 * No necesita cuenta, clave ni facturación. La política de uso de las
 * teselas de OpenStreetMap solo pide mostrar la atribución, que Leaflet pone
 * en la esquina del mapa.
 */
export const TILE_LAYER = Object.freeze({
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">colaboradores de OpenStreetMap</a>',
  maxZoom: 19,
})

let library = null

/**
 * Carga Leaflet y su hoja de estilos bajo demanda, una sola vez. Así su peso
 * solo lo paga la página que muestra el mapa. Si la carga falla, se olvida la
 * promesa para que un nuevo intento vuelva a pedirla.
 *
 * @returns {Promise<typeof import('leaflet')>}
 */
export function loadMapLibrary() {
  library ??= Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
    .then(([leaflet]) => leaflet.default ?? leaflet)
    .catch((error) => {
      library = null
      throw error
    })
  return library
}
