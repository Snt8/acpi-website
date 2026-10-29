import { isReport } from '../../core/telemetry/reports.js'

const STORAGE_KEY = 'acpi:traffic-light-reports:v1'
const EMPTY = Object.freeze([])

/**
 * El acceso a `localStorage` puede lanzar una excepción en una ventana
 * privada o con los datos del sitio bloqueados. En ese caso el repositorio
 * sigue funcionando en memoria durante la visita.
 */
const getBrowserStorage = () => {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

/**
 * Repositorio de reportes de semáforos respaldado por `localStorage`.
 *
 * Contrato que debe cumplir cualquier otro repositorio (p. ej. uno contra una
 * API) para sustituir a este sin tocar la página:
 *   - `getAll()` devuelve la lista, más reciente primero, y conserva la misma
 *     referencia mientras no cambie: así sirve tal cual a `useSyncExternalStore`.
 *   - `add(report)` y `remove(id)` modifican la lista y avisan a los suscriptores.
 *   - `subscribe(listener)` devuelve la función que cancela la suscripción.
 *
 * @param {{ storage?: Storage | null, events?: EventTarget, key?: string }} [options]
 */
export function createLocalStorageReportRepository({
  storage = getBrowserStorage(),
  events = globalThis.window,
  key = STORAGE_KEY,
} = {}) {
  const listeners = new Set()
  let cache = null

  const read = () => {
    try {
      const parsed = JSON.parse(storage?.getItem(key) ?? '[]')
      return Array.isArray(parsed) ? Object.freeze(parsed.filter(isReport)) : EMPTY
    } catch {
      return EMPTY
    }
  }

  const notify = () => listeners.forEach((listener) => listener())

  const getAll = () => (cache ??= read())

  const write = (reports) => {
    cache = Object.freeze(reports)
    try {
      storage?.setItem(key, JSON.stringify(reports))
    } catch {
      // Cuota agotada o almacenamiento bloqueado: la lista queda en memoria.
    }
    notify()
  }

  // Otra pestaña modificó los reportes (o borró todo el almacenamiento, en
  // cuyo caso `key` llega nulo): se descarta la copia y se vuelve a leer.
  const onStorage = (event) => {
    if (event.key !== null && event.key !== key) return
    cache = null
    notify()
  }

  return {
    getAll,
    add: (report) => write([report, ...getAll()]),
    remove: (id) => write(getAll().filter((report) => report.id !== id)),
    subscribe(listener) {
      if (listeners.size === 0) events?.addEventListener('storage', onStorage)
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) events?.removeEventListener('storage', onStorage)
      }
    },
  }
}
