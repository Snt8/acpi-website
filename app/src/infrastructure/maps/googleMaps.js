import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

/**
 * Los marcadores avanzados exigen un Map ID. `DEMO_MAP_ID` es el que Google
 * ofrece para desarrollo; en producción conviene uno propio.
 */
export const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

export const isMapsConfigured = Boolean(API_KEY)

let libraries = null
const authFailureListeners = new Set()

/**
 * Carga, una sola vez, las bibliotecas de Google Maps que usa el sitio.
 * Si la carga falla se olvida la promesa para que un nuevo intento vuelva a
 * pedirla en lugar de heredar el error.
 *
 * @returns {Promise<{ Map: typeof google.maps.Map, AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement, PinElement: typeof google.maps.marker.PinElement }>}
 */
export function loadMapLibraries() {
  if (!isMapsConfigured) {
    return Promise.reject(new Error('Falta VITE_GOOGLE_MAPS_API_KEY.'))
  }

  if (!libraries) {
    setOptions({ key: API_KEY, v: 'weekly', language: 'es', region: 'CO' })
    // Google llama a esta función global cuando rechaza la clave (dominio no
    // autorizado, facturación inactiva…), ya con el mapa cargado.
    window.gm_authFailure = () => authFailureListeners.forEach((listener) => listener())

    libraries = Promise.all([importLibrary('maps'), importLibrary('marker')])
      .then(([maps, marker]) => ({
        Map: maps.Map,
        AdvancedMarkerElement: marker.AdvancedMarkerElement,
        PinElement: marker.PinElement,
      }))
      .catch((error) => {
        libraries = null
        throw error
      })
  }

  return libraries
}

/**
 * @param {() => void} listener
 * @returns {() => void} cancela la suscripción
 */
export function onMapsAuthFailure(listener) {
  authFailureListeners.add(listener)
  return () => authFailureListeners.delete(listener)
}
