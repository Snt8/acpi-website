/**
 * Única fuente de verdad de las rutas del sitio.
 * Cualquier enlace interno debe referenciar esta tabla en vez de escribir
 * la cadena a mano, para que renombrar una ruta sea un cambio de una línea.
 */
export const PATHS = Object.freeze({
  home: '/',
  bracelet: '/brazalete',
  telemetry: '/telemetria',
  mobileApp: '/app-movil',
  story: '/historia',
})
