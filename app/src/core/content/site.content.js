import { PATHS } from '../routing/paths.js'

export const BRAND = Object.freeze({
  name: 'ACPI',
  fullName: 'Asistente de Cruce Peatonal para Invidentes',
  tagline: 'Asistencia Inteligente para Cruces Seguros',
})

/** Enlaces de la barra superior, en el orden del boceto. */
export const NAV_LINKS = Object.freeze([
  { id: 'bracelet', label: 'Brazalete', to: PATHS.bracelet },
  { id: 'telemetry', label: 'Telemetría', to: PATHS.telemetry },
  { id: 'mobileApp', label: 'App móvil', to: PATHS.mobileApp },
  { id: 'story', label: 'Historia', to: PATHS.story },
])

/**
 * Los tres componentes del sistema.
 * Viven en el contenido del sitio y no en el de una página porque describen
 * el proyecto, no una pantalla: la portada los presenta y la página del
 * brazalete enlaza a los otros dos desde su cierre.
 */
export const SYSTEM_COMPONENTS = Object.freeze([
  {
    id: 'bracelet',
    title: 'Brazalete ACPI',
    summary:
      'La única pieza que se lleva encima. Una brújula y un acelerómetro establecen hacia dónde apunta la muñeca, y dos motores traducen el resultado a vibración.',
    to: PATHS.bracelet,
  },
  {
    id: 'mobileApp',
    title: 'App móvil',
    summary:
      'ACPIGPS acompaña al brazalete por Bluetooth: pone el cruce en el mapa, lleva la bitácora de cada sesión y puede anunciar por voz lo que el brazalete indica por vibración.',
    to: PATHS.mobileApp,
  },
  {
    id: 'telemetry',
    title: 'Telemetría',
    summary:
      'El panel que no mira a la persona usuaria, sino a la ciudad: qué esquinas desorientan y dónde los tiempos de espera resultan excesivos. Datos para sustentar una intervención.',
    to: PATHS.telemetry,
  },
])

export const FOOTER = Object.freeze({
  credits: ['@ACPI', 'ETITC', 'Edy S. Ávila'],
  note: 'Prototipo funcional en desarrollo. Las pruebas de campo con personas ciegas y con baja visión son las que tienen la última palabra sobre el diseño.',
})
