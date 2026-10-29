/**
 * Eventos de prueba con el formato v2 de la app (docs/grafana-setup.md del
 * repositorio ACPI), incluidos los campos identificativos que el script debe
 * descartar.
 */

export const meta = Object.freeze({
  generatedAt: new Date('2026-10-28T15:00:00.000Z'),
  from: new Date('2026-09-28T15:00:00.000Z'),
  to: new Date('2026-10-28T15:00:00.000Z'),
})

/** `count` sesiones de cruce junto a un punto. La primera, mal orientada. */
export const crossings = (count, lat, lon, extra = {}) =>
  Array.from({ length: count }, (_, i) => ({
    v: 2,
    tipo: 'cruce',
    dispositivo: 'mh3k2a9x1c4f',
    momento: 1793300000000 + i,
    sesion: `mh3k2b0q8d2${i}`,
    inicio: 1793299940000 + i,
    simulado: false,
    lat: lat + i * 0.0001,
    lon,
    precision_m: 6,
    semaforo_id: 3,
    espera_s: 20 + i,
    cruzo: true,
    duracion_cruce_s: 15,
    verde_restante_s: 25,
    rumbo_cruce: 92,
    veces_mal_orientado: i === 0 ? 1 : 0,
    duracion_sesion_s: 64.5,
    ...extra,
  }))

/** Evento `semaforo` de un teléfono. */
export const lightEvent = (accion, semaforoId, extra = {}) => ({
  v: 2,
  tipo: 'semaforo',
  dispositivo: 'mh3k2a9x1c4f',
  momento: 1793300000000,
  accion,
  semaforo_id: semaforoId,
  nombre: 'Semáforo en Calle 26 13',
  lat: 4.609712,
  lon: -74.081753,
  precision_m: 6,
  ...extra,
})
