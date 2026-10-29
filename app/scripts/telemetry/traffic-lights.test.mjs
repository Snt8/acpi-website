import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SNAPSHOT_STATUS } from '../../src/core/telemetry/snapshot.js'
import { buildSnapshot } from './build-snapshot.mjs'
import { crossings, lightEvent, meta } from './fixtures.mjs'
import {
  applyTrafficLightEvents,
  sanitizeTrafficLights,
  trafficLightId,
} from './traffic-lights.mjs'

const idOf = (semaforoId, device = 'mh3k2a9x1c4f') => trafficLightId(device, semaforoId)

describe('applyTrafficLightEvents', () => {
  it('registra un semáforo creado, sin nombre ni seudónimo del teléfono', () => {
    const lights = applyTrafficLightEvents([], [lightEvent('creado', 3, { origen: 'brazalete' })])
    assert.deepEqual(lights, [{ id: idOf(3), lat: 4.60971, lng: -74.08175, origin: 'brazalete' }])
    assert.doesNotMatch(JSON.stringify(lights), /Calle 26|mh3k2a9x1c4f/)
  })

  it('aplica los eventos en orden de momento, no de llegada', () => {
    const rows = [
      lightEvent('borrado', 3, { momento: 30, lat: undefined, lon: undefined }),
      lightEvent('editado', 3, { momento: 20, lat: 4.7 }),
      lightEvent('creado', 3, { momento: 10, origen: 'manual' }),
    ]
    assert.deepEqual(applyTrafficLightEvents([], rows), [])
  })

  it('una edición mueve el semáforo y conserva su origen', () => {
    const rows = [
      lightEvent('creado', 3, { momento: 10, origen: 'manual' }),
      lightEvent('editado', 3, { momento: 20, lat: 4.7 }),
    ]
    assert.deepEqual(applyTrafficLightEvents([], rows), [
      { id: idOf(3), lat: 4.7, lng: -74.08175, origin: 'manual' },
    ])
  })

  it('parte del registro anterior: lo que Loki ya no tiene sigue en el mapa', () => {
    const previous = [{ id: 'semaforo-viejo', lat: 4.65, lng: -74.05, origin: 'brazalete' }]
    const lights = applyTrafficLightEvents(previous, [
      lightEvent('creado', 3, { origen: 'brazalete' }),
      lightEvent('borrado', 7, { lat: undefined, lon: undefined }),
    ])
    assert.equal(lights.length, 2)
    assert.ok(lights.some((light) => light.id === 'semaforo-viejo'))
  })

  it('reaplicar la misma ventana no cambia el registro', () => {
    const rows = [lightEvent('creado', 3, { origen: 'brazalete' }), lightEvent('creado', 4)]
    const once = applyTrafficLightEvents([], rows)
    assert.deepEqual(applyTrafficLightEvents(once, rows), once)
  })

  it('distingue el mismo id en teléfonos distintos e ignora eventos inválidos', () => {
    const lights = applyTrafficLightEvents([], [
      lightEvent('creado', 3),
      lightEvent('creado', 3, { dispositivo: 'otro-telefono' }),
      lightEvent('creado', 5, { lat: null }),
      lightEvent('renombrado', 6),
      { ...lightEvent('creado', 8), v: 1 },
    ])
    assert.deepEqual(
      lights.map((light) => light.id).sort(),
      [idOf(3), idOf(3, 'otro-telefono')].sort(),
    )
  })
})

describe('sanitizeTrafficLights', () => {
  it('descarta entradas dañadas del archivo publicado', () => {
    const good = { id: 'a', lat: 4.6, lng: -74, origin: null }
    assert.deepEqual(
      sanitizeTrafficLights([good, { id: 'b', lat: 200, lng: 0, origin: null }, null]),
      [good],
    )
    assert.deepEqual(sanitizeTrafficLights(undefined), [])
  })
})

describe('buildSnapshot', () => {
  it('publica los semáforos aunque no haya cruces suficientes', () => {
    const snapshot = buildSnapshot([lightEvent('creado', 3)], meta)
    assert.equal(snapshot.status, SNAPSHOT_STATUS.insufficient)
    assert.equal(snapshot.totals, null)
    assert.equal(snapshot.trafficLights.length, 1)
  })

  it('compone cifras y semáforos sin dejar rastro de datos identificativos', () => {
    const snapshot = buildSnapshot(
      [...crossings(5, 4.6081, -74.0821), lightEvent('creado', 3, { origen: 'brazalete' })],
      meta,
    )
    assert.equal(snapshot.status, SNAPSHOT_STATUS.ok)
    assert.equal(snapshot.totals.sessions, 5)
    assert.equal(snapshot.trafficLights.length, 1)
    assert.doesNotMatch(
      JSON.stringify(snapshot),
      /mh3k2|dispositivo|sesion|rumbo|momento|Calle 26/,
    )
  })
})
