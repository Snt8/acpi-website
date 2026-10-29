import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SNAPSHOT_STATUS } from '../../src/core/telemetry/snapshot.js'
import { summarizeCrossings, toSession } from './anonymize.mjs'
import { crossings, lightEvent } from './fixtures.mjs'

const policy = { cellDecimals: 3, minSessionsPerZone: 3, maxZones: 10 }

describe('toSession', () => {
  it('conserva solo los campos permitidos', () => {
    assert.deepEqual(toSession(crossings(1, 4.6, -74.08)[0]), {
      position: { lat: 4.6, lng: -74.08 },
      wait: 20,
      crossing: 15,
      greenLeft: 25,
      disoriented: true,
    })
  })

  it('descarta otros tipos de evento, otras versiones y el brazalete simulado', () => {
    const [session] = crossings(1, 4.6, -74.08)
    assert.equal(toSession(lightEvent('creado', 3)), null)
    assert.equal(toSession({ ...session, v: 1 }), null)
    assert.equal(toSession({ ...session, simulado: true }), null)
    assert.equal(toSession({ ...session, simulado: 'true' }), null)
  })

  it('sin cruce no cuenta la duración ni el verde restante', () => {
    const [session] = crossings(1, 4.6, -74.08, {
      cruzo: false,
      duracion_cruce_s: null,
      espera_s: null,
    })
    const result = toSession(session)
    assert.equal(result.crossing, null)
    assert.equal(result.greenLeft, null)
    assert.equal(result.wait, null)
  })

  it('una sesión sin GPS se conserva, pero sin posición', () => {
    const [session] = crossings(1, 4.6, -74.08, { lat: null, lon: null })
    assert.equal(toSession(session).position, null)
  })
})

describe('summarizeCrossings', () => {
  it('no publica cifras si el total no llega al mínimo de anonimato', () => {
    const result = summarizeCrossings(crossings(2, 4.6, -74.08), policy)
    assert.equal(result.status, SNAPSHOT_STATUS.insufficient)
    assert.equal(result.totals, null)
  })

  it('agrega por zona y oculta las zonas pequeñas y las sesiones sin GPS', () => {
    const rows = [
      ...crossings(4, 4.6081, -74.0821),
      ...crossings(2, 4.65, -74.05),
      ...crossings(1, 0, 0, { lat: null, lon: null }),
      lightEvent('creado', 9),
    ]
    const result = summarizeCrossings(rows, policy)

    assert.equal(result.status, SNAPSHOT_STATUS.ok)
    assert.deepEqual(result.totals, {
      sessions: 7,
      avgWaitSeconds: 21,
      avgCrossingSeconds: 15,
      disorientationRate: 0.429,
      avgGreenLeftSeconds: 25,
    })
    assert.deepEqual(result.zones, [
      {
        lat: 4.608,
        lng: -74.082,
        sessions: 4,
        avgWaitSeconds: 21.5,
        avgCrossingSeconds: 15,
        disorientationRate: 0.25,
        avgGreenLeftSeconds: 25,
      },
    ])
    assert.equal(result.hiddenSessions, 3)
  })
})
