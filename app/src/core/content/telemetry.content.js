import { ILLUSTRATIONS } from './media.content.js'

export const TELEMETRY_HERO = Object.freeze({
  eyebrow: 'Telemetría',
  title: 'El panel que mira a la ciudad',
  lead: 'Cada cruce asistido deja un resumen: dónde ocurrió, cuánto se esperó, cuánto duró y si hubo desorientación. Sumados, dibujan un mapa que hoy prácticamente no existe y que sirve para argumentar, con datos, qué esquina necesita intervención.',
  image: ILLUSTRATIONS.telemetryCity,
})

/**
 * Recorrido de un dato, de la esquina al panel. Sigue la figura de
 * arquitectura del repositorio ACPI (docs/figuras/figura-1-arquitectura).
 */
export const TELEMETRY_FLOW = Object.freeze({
  eyebrow: 'Cómo llegan los datos',
  title: 'De la esquina al panel',
  description:
    'Lo que decide un cruce ocurre entre el poste y la muñeca, sin internet. El panel solo recibe, después, el resumen de cada cruce terminado.',
  steps: [
    {
      id: 'beacon',
      link: 'ESP-NOW · 2 veces por segundo',
      title: 'Baliza del semáforo',
      body: 'Anuncia al aire la dirección del cruce, el estado de la luz y los segundos que quedan.',
    },
    {
      id: 'bracelet',
      link: 'Bluetooth',
      title: 'Brazalete',
      body: 'Compara esa dirección con la de la muñeca y vibra. Al terminar, pasa el estado del cruce al celular.',
    },
    {
      id: 'phone',
      link: 'Internet, cuando haya señal',
      title: 'App móvil',
      body: 'Marca la esquina con el GPS y envía a Grafana un resumen: espera, duración, orientación y alertas.',
    },
    {
      id: 'panel',
      link: null,
      title: 'Panel de telemetría',
      body: 'Cada hora lee Grafana, agrupa los cruces por zonas y publica aquí solo cifras anónimas.',
    },
  ],
})

/** Etiquetas de `REPORT_ISSUES`, en el mismo orden que el dominio. */
export const REPORT_ISSUE_LABELS = Object.freeze({
  'no-sound': 'Sin señal sonora',
  'short-crossing': 'Tiempo de paso insuficiente',
  broken: 'Semáforo dañado o apagado',
  obstructed: 'Esquina obstruida o insegura',
})

export const REPORTS_SECTION = Object.freeze({
  eyebrow: 'Reportes',
  title: 'Semáforos reportados',
  description:
    'Marca un cruce que no funciona como debería. Por ahora los reportes se guardan solo en este navegador: nadie más los ve y no salen de tu equipo.',
  map: {
    label: 'Mapa de semáforos reportados',
    hint: 'Haz clic en el mapa para tomar las coordenadas del cruce.',
    listHint: 'La lista de reportes contiene la misma información que el mapa.',
    loading: 'Cargando el mapa…',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    unavailable:
      'El mapa no está disponible en este momento. Puedes reportar escribiendo las coordenadas o usando tu ubicación, y la lista sigue completa.',
  },
  list: {
    title: 'Reportes guardados',
    empty: 'Todavía no hay reportes en este navegador.',
    locate: 'Ver en el mapa',
    remove: 'Eliminar',
    removed: 'Reporte eliminado.',
  },
})

export const REPORT_FORM = Object.freeze({
  title: 'Reportar un semáforo',
  fields: {
    name: { label: 'Cruce', placeholder: 'Ej. Av. Calle 13 con Carrera 15' },
    issue: { label: 'Qué pasa', placeholder: 'Elige una opción' },
    note: { label: 'Detalle (opcional)', placeholder: 'Lo que ayude a ubicar el problema' },
    lat: { label: 'Latitud' },
    lng: { label: 'Longitud' },
  },
  useLocation: 'Usar mi ubicación',
  locating: 'Buscando tu ubicación…',
  locationDenied: 'No se pudo obtener tu ubicación. Escribe las coordenadas o elige el punto en el mapa.',
  submit: 'Guardar reporte',
  saved: 'Reporte guardado.',
  errors: {
    name: { required: 'Escribe el nombre del cruce.', tooLong: 'El nombre es demasiado largo.' },
    issue: { required: 'Elige qué le pasa al semáforo.' },
    note: { tooLong: 'El detalle es demasiado largo.' },
    position: { invalid: 'Indica unas coordenadas válidas: elige el punto en el mapa o escríbelas.' },
  },
})

export const CITY_TELEMETRY = Object.freeze({
  eyebrow: 'Datos de los cruces',
  title: 'Lo que cuentan los cruces',
  description:
    'Cifras agregadas a partir de los cruces que registra la app. Se actualizan cada hora y se publican de forma anónima: sin nombres, sin dispositivos y sin recorridos.',
  stats: {
    sessions: 'Cruces registrados',
    avgWaitSeconds: 'Espera media',
    avgCrossingSeconds: 'Duración media del cruce',
    disorientationRate: 'Cruces con desorientación',
    panicAlerts: 'Alertas de pánico',
  },
  zones: {
    title: 'Zonas con más cruces',
    caption: 'Zonas con más cruces registrados en el periodo',
    columns: {
      zone: 'Zona (centro aproximado)',
      sessions: 'Cruces',
      wait: 'Espera media',
      disorientation: 'Desorientación',
      panic: 'Alertas',
    },
  },
  meta: {
    updated: 'Actualizado',
    range: 'Periodo',
  },
  /** Cómo se protege a las personas detrás de las cifras. */
  privacy: ({ cellMeters, minSessions, hiddenSessions }) =>
    `Cada zona agrupa los cruces en una cuadrícula de unos ${cellMeters} m y solo se muestra si reúne al menos ${minSessions} cruces.` +
    (hiddenSessions > 0
      ? ` ${hiddenSessions} cruces de zonas más pequeñas cuentan en el total, pero no aparecen por zona.`
      : ''),
  states: {
    loading: 'Cargando la telemetría…',
    empty: 'Todavía no se ha publicado telemetría. Aparecerá aquí en cuanto la app registre los primeros cruces.',
    insufficient:
      'Ya hay cruces registrados, pero todavía son tan pocos que publicarlos podría señalar a alguien. Las cifras aparecerán cuando haya suficientes.',
    error: 'No se pudo cargar la telemetría. Vuelve a intentarlo más tarde.',
  },
})
