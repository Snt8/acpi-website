import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { REPORT_LIMITS, createReport, isReport } from './reports.js'

const deps = { now: new Date('2026-10-28T15:00:00.000Z'), createId: () => 'id-1' }
const valid = {
  name: '  Av. Calle 13 con Carrera 15 ',
  issue: 'no-sound',
  note: ' Pita solo a veces ',
  position: { lat: 4.6086, lng: -74.0826 },
}

describe('createReport', () => {
  it('construye un reporte limpio a partir de datos válidos', () => {
    assert.deepEqual(createReport(valid, deps), {
      ok: true,
      report: {
        id: 'id-1',
        name: 'Av. Calle 13 con Carrera 15',
        issue: 'no-sound',
        note: 'Pita solo a veces',
        position: { lat: 4.6086, lng: -74.0826 },
        reportedAt: '2026-10-28T15:00:00.000Z',
      },
    })
  })

  it('devuelve un código de error por cada campo inválido', () => {
    const result = createReport(
      { name: '   ', issue: 'otra', note: 'x'.repeat(REPORT_LIMITS.note + 1) },
      deps,
    )
    assert.deepEqual(result, {
      ok: false,
      errors: { name: 'required', issue: 'required', note: 'tooLong', position: 'invalid' },
    })
  })

  it('rechaza coordenadas fuera de rango', () => {
    const result = createReport({ ...valid, position: { lat: 91, lng: 0 } }, deps)
    assert.deepEqual(result.errors, { position: 'invalid' })
  })

  it('rechaza un nombre demasiado largo', () => {
    const result = createReport({ ...valid, name: 'a'.repeat(REPORT_LIMITS.name + 1) }, deps)
    assert.deepEqual(result.errors, { name: 'tooLong' })
  })
})

describe('isReport', () => {
  it('reconoce un reporte creado por el dominio', () => {
    assert.equal(isReport(createReport(valid, deps).report), true)
  })

  it('descarta valores corruptos', () => {
    assert.equal(isReport(null), false)
    assert.equal(isReport({ id: 'x' }), false)
    assert.equal(
      isReport({ ...createReport(valid, deps).report, reportedAt: 'ayer' }),
      false,
    )
  })
})
