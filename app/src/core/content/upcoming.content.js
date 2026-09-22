/**
 * Secciones que el nav ya anuncia pero que todavía no tienen boceto.
 * El resumen sale de la guía del sistema, para que la página diga algo real
 * mientras llega el diseño definitivo.
 */
export const UPCOMING_PAGES = Object.freeze({
  telemetry: {
    title: 'Telemetría',
    lead: 'El panel que no mira a la persona usuaria, sino a la ciudad.',
    body: 'Cuando termina un cruce, la app envía un resumen: en qué punto ocurrió, cuánto se esperó, cuánto duró y si hubo desorientación. Sumados en el tiempo, esos resúmenes dibujan un mapa que hoy prácticamente no existe: qué esquinas generan más desorientación, dónde los tiempos de espera resultan excesivos para quien camina despacio y qué rutas de la ciudad se usan de verdad frente a las que aparecen en el papel.',
  },
  mobileApp: {
    title: 'App móvil',
    lead: 'ACPIGPS es el acompañante del sistema, no su cerebro.',
    body: 'Se conecta al brazalete por Bluetooth para traducir la vibración a voz, poner cada cruce en el mapa y llevar la bitácora de las sesiones. Sigue trabajando con la pantalla apagada y, si no hay señal, guarda los datos y los envía después. Nunca hace esperar a la persona por culpa de la red.',
  },
  story: {
    title: 'Historia',
    lead: 'De dónde viene ACPI y hacia dónde va.',
    body: 'ACPI es un prototipo funcional en desarrollo: las piezas existen, se comunican entre sí y el cruce asistido se puede demostrar completo. Lo que sigue es lo que decide si una idea se vuelve producto: pruebas de campo en calles reales, una carcasa cómoda y resistente al agua, y conversaciones con las entidades de movilidad para instalar balizas en cruces de verdad.',
  },
})
