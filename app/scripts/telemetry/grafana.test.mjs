import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { crossings, meta } from './fixtures.mjs'
import { framesToRows, queryGrafana } from './grafana.mjs'

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

  it('convierte en fila el JSON de cada línea de Loki', () => {
    const [session] = crossings(1, 4.6, -74.08)
    const payload = {
      results: {
        A: {
          frames: [
            {
              schema: { fields: [{ name: 'labels' }, { name: 'Time' }, { name: 'Line' }] },
              data: {
                values: [
                  [{ app: 'acpi', tipo: 'cruce' }, { app: 'acpi' }],
                  [1793300000000, 1793300000001],
                  [JSON.stringify(session), 'línea que no es JSON'],
                ],
              },
            },
          ],
        },
      },
    }

    const [fromJson, fromText] = framesToRows(payload)
    assert.deepEqual(fromJson, session)
    assert.equal(fromText.Line, 'línea que no es JSON')
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
