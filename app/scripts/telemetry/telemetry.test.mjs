import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SNAPSHOT_STATUS } from '../../src/core/telemetry/snapshot.js'
import { buildSnapshot, toSession } from './anonymize.mjs'
import { framesToRows, queryGrafana } from './grafana.mjs'

const meta = {
  generatedAt: new Date('2026-10-28T15:00:00.000Z'),
  from: new Date('2026-09-28T15:00:00.000Z'),
  to: new Date('2026-10-28T15:00:00.000Z'),
}
const policy = { cellDecimals: 3, minSessionsPerZone: 3, maxZones: 10 }

/**
 * `count` cruces alrededor de un punto, con el payload de la app
 * (docs/grafana-setup.md) y sus campos identificativos. El primero termina
 * con orientación incorrecta (`status` 2).
 */
const crossings = (count, lat, lon, extra = {}) =>
  Array.from({ length: count }, (_, i) => ({
    device_id: 'ACPI_Brazalete',
    session_id: `8fa538e1-0000-4000-8000-00000000000${i}`,
    status: i === 0 ? 2 : 1,
    timestamp: 1780704000000 + i,
    duration_sec: 15,
    waiting_sec: 20 + i,
    steps: 24,
    panics: 0,
    allowed_cruce: 1,
    lat: lat + i * 0.0001,
    lon,
    ...extra,
  }))

describe('framesToRows', () => {
  it('convierte los frames por columnas en filas', () => {
    const payload = {
      results: {
        A: {
          frames: [
            {
              schema: { fields: [{ name: 'lat' }, { name: 'lon' }] },
              data: { values: [[4.6, 4.7], [-74.1, -74.2]] },
            },
          ],
        },
        B: { frames: [] },
      },
    }
    assert.deepEqual(framesToRows(payload), [
      { lat: 4.6, lon: -74.1 },
      { lat: 4.7, lon: -74.2 },
    ])
  })

  it('falla si alguna consulta trae error', () => {
    assert.throws(
      () => framesToRows({ results: { A: { frames: [] }, B: { error: 'timeout' } } }),
      /La consulta B falló: timeout/,
    )
  })
})

describe('queryGrafana', () => {
  it('envía las consultas con el token y el rango en milisegundos', async () => {
    let request
    const fetchImpl = async (url, init) => {
      request = { url, init }
      return new Response(JSON.stringify({ results: {} }), { status: 200 })
    }
    await queryGrafana({
      url: 'https://acpi.grafana.net/',
      token: 'glsa_prueba',
      queries: [{ refId: 'A' }],
      from: meta.from,
      to: meta.to,
      fetchImpl,
    })

    assert.equal(request.url, 'https://acpi.grafana.net/api/ds/query')
    assert.equal(request.init.headers.Authorization, 'Bearer glsa_prueba')
    assert.deepEqual(JSON.parse(request.init.body), {
      queries: [{ refId: 'A' }],
      from: String(meta.from.getTime()),
      to: String(meta.to.getTime()),
    })
  })

  it('falla con el código HTTP si Grafana rechaza la petición', async () => {
    const fetchImpl = async () => new Response('', { status: 401, statusText: 'Unauthorized' })
    await assert.rejects(
      queryGrafana({ url: 'https://g', token: 't', queries: [{}], ...meta, fetchImpl }),
      /401 Unauthorized/,
    )
  })
})

describe('toSession', () => {
  it('conserva solo los campos permitidos', () => {
    assert.deepEqual(toSession(crossings(1, 4.6, -74.08)[0]), {
      lat: 4.6,
      lng: -74.08,
      wait: 20,
      crossing: 15,
      disoriented: true,
      panicAlerts: 0,
    })
  })

  it('cuenta las alertas de pánico, y al menos una si la sesión cerró en pánico', () => {
    assert.equal(toSession({ lat: 4.6, lon: -74, panics: 2 }).panicAlerts, 2)
    assert.equal(toSession({ lat: 4.6, lon: -74, status: 3, panics: 0 }).panicAlerts, 1)
    assert.equal(toSession({ lat: 4.6, lon: -74, status: '3', panics: 3 }).panicAlerts, 3)
  })

  it('descarta filas sin ubicación válida y duraciones negativas', () => {
    assert.equal(toSession({ lat: null, lon: -74 }), null)
    assert.equal(toSession({ lat: 120, lon: -74 }), null)
    assert.equal(toSession({ lat: 4.6, lon: -74, waiting_sec: -3 }).wait, null)
  })
})

describe('buildSnapshot', () => {
  it('no publica cifras si el total no llega al mínimo de anonimato', () => {
    const snapshot = buildSnapshot(crossings(2, 4.6, -74.08), { ...meta, policy })
    assert.equal(snapshot.status, SNAPSHOT_STATUS.insufficient)
    assert.equal(snapshot.totals, null)
    assert.deepEqual(snapshot.zones, [])
  })

  it('agrega por zona y oculta las zonas pequeñas sin sacarlas del total', () => {
    const rows = [
      ...crossings(4, 4.6081, -74.0821),
      ...crossings(2, 4.65, -74.05, { panics: 1 }),
    ]
    const snapshot = buildSnapshot(rows, { ...meta, policy })

    assert.equal(snapshot.status, SNAPSHOT_STATUS.ok)
    assert.deepEqual(snapshot.totals, {
      sessions: 6,
      avgWaitSeconds: 21.2,
      avgCrossingSeconds: 15,
      disorientationRate: 0.333,
      panicAlerts: 2,
    })
    assert.deepEqual(snapshot.zones, [
      {
        lat: 4.608,
        lng: -74.082,
        sessions: 4,
        avgWaitSeconds: 21.5,
        avgCrossingSeconds: 15,
        disorientationRate: 0.25,
        panicAlerts: 0,
      },
    ])
    assert.equal(snapshot.hiddenSessions, 2)
  })

  it('no deja rastro de los campos identificativos en el archivo', () => {
    const serialized = JSON.stringify(
      buildSnapshot(crossings(5, 4.6081, -74.0821), { ...meta, policy }),
    )
    assert.doesNotMatch(serialized, /ACPI_Brazalete|8fa538e1|device_id|session_id|steps/)
  })
})
