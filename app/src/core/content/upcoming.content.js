import { ILLUSTRATIONS } from './media.content.js'

/**
 * Secciones que el nav ya anuncia pero que todavía no tienen boceto.
 * El resumen y los puntos clave salen de la guía del sistema, para que la
 * página diga algo real mientras llega el diseño definitivo.
 */
export const UPCOMING_PAGES = Object.freeze({
  mobileApp: {
    title: 'App móvil',
    lead: 'ACPIGPS es el acompañante del sistema, no su cerebro.',
    body: 'Se conecta al brazalete por Bluetooth para traducir la vibración a voz, poner cada cruce en el mapa y llevar la bitácora de las sesiones. Sigue trabajando con la pantalla apagada y, si no hay señal, guarda los datos y los envía después. Nunca hace esperar a la persona por culpa de la red.',
    image: ILLUSTRATIONS.appPhone,
    highlights: {
      title: 'Cuatro papeles',
      items: [
        { id: 'voice', title: 'Traduce a palabras', body: 'Lo que el brazalete dice con vibración, la app lo puede decir en voz alta junto al tiempo restante.' },
        { id: 'map', title: 'Pone el cruce en el mapa', body: 'El GPS del teléfono marca en qué esquina ocurrió cada cruce y cuenta los pasos del trayecto.' },
        { id: 'log', title: 'Lleva la bitácora', body: 'Cada cruce queda como una sesión: cuánto se esperó, cuánto duró y si la orientación fue correcta.' },
        { id: 'background', title: 'Trabaja en segundo plano', body: 'Con la pantalla apagada o el teléfono en el bolsillo, la conexión con el brazalete sigue viva.' },
      ],
    },
  },
  story: {
    title: 'Historia',
    lead: 'De dónde viene ACPI y hacia dónde va.',
    body: 'ACPI es un prototipo funcional en desarrollo: las piezas existen, se comunican entre sí y el cruce asistido se puede demostrar completo. Lo que sigue es lo que decide si una idea se vuelve producto: pruebas de campo en calles reales, una carcasa cómoda y resistente al agua, y conversaciones con las entidades de movilidad para instalar balizas en cruces de verdad.',
    image: ILLUSTRATIONS.storyCrossing,
    highlights: {
      title: 'Lo que sigue',
      items: [
        { id: 'field', title: 'Pruebas de campo', body: 'Con personas ciegas y con baja visión, en calles reales. Son las que van a cambiar el diseño.' },
        { id: 'case', title: 'Una carcasa para todos los días', body: 'Cómoda, resistente al agua y fácil de poner y quitar sin ver.' },
        { id: 'city', title: 'Balizas en cruces reales', body: 'Conversaciones con las entidades de movilidad para instalarlas sobre los postes que ya existen.' },
      ],
    },
  },
})
