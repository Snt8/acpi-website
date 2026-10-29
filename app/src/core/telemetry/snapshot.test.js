import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  SNAPSHOT_STATUS,
  SNAPSHOT_VERSION,
  cellSizeMeters,
  emptySnapshot,
  parseSnapshot,
} from './snapshot.js'

const generatedAt = new Date('2026-10-28T15:00:00.000Z')

describe('parseSnapshot', () => {
  it('acepta un resumen vacío de la versión actual', () => {
    const snapshot = emptySnapshot(SNAPSHOT_STATUS.unconfigured, { generatedAt })
    assert.equal(parseSnapshot(snapshot), snapshot)
  })

  it('rechaza otra versión, otro estado o un resumen «ok» sin totales', () => {
    const base = emptySnapshot(SNAPSHOT_STATUS.insufficient, { generatedAt })
    assert.equal(parseSnapshot({ ...base, version: SNAPSHOT_VERSION + 1 }), null)
    assert.equal(parseSnapshot({ ...base, status: 'raro' }), null)
    assert.equal(parseSnapshot({ ...base, status: SNAPSHOT_STATUS.ok }), null)
    assert.equal(parseSnapshot('<!doctype html>'), null)
  })
})

describe('cellSizeMeters', () => {
  it('traduce los decimales de la cuadrícula a metros', () => {
    assert.equal(cellSizeMeters(3), 111)
    assert.equal(cellSizeMeters(2), 1113)
  })
})
