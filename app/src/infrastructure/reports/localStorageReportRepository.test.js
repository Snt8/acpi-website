import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createReport } from '../../core/telemetry/reports.js'
import { createLocalStorageReportRepository } from './localStorageReportRepository.js'

const KEY = 'test:reports'

/** Almacenamiento en memoria con la misma interfaz que `localStorage`. */
const createMemoryStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
  }
}

let sequence = 0
const report = (name) =>
  createReport(
    { name, issue: 'broken', position: { lat: 4.6, lng: -74.08 } },
    { createId: () => `id-${++sequence}` },
  ).report

const setup = (initial) => {
  const storage = createMemoryStorage(initial)
  const events = new EventTarget()
  const repository = createLocalStorageReportRepository({ storage, events, key: KEY })
  return { storage, events, repository }
}

describe('createLocalStorageReportRepository', () => {
  it('empieza vacío y conserva la referencia mientras no hay cambios', () => {
    const { repository } = setup()
    assert.deepEqual(repository.getAll(), [])
    assert.equal(repository.getAll(), repository.getAll())
  })

  it('guarda los reportes, el más reciente primero, y los persiste', () => {
    const { repository, storage } = setup()
    const first = report('Primero')
    const second = report('Segundo')
    repository.add(first)
    repository.add(second)

    assert.deepEqual(repository.getAll(), [second, first])
    assert.deepEqual(JSON.parse(storage.getItem(KEY)), [second, first])
  })

  it('elimina por id y avisa a los suscriptores', () => {
    const { repository } = setup()
    const kept = report('Se queda')
    const removed = report('Se va')
    repository.add(kept)
    repository.add(removed)

    let calls = 0
    const unsubscribe = repository.subscribe(() => calls++)
    repository.remove(removed.id)
    unsubscribe()
    repository.remove(kept.id)

    assert.equal(calls, 1)
    assert.deepEqual(repository.getAll(), [])
  })

  it('descarta entradas corruptas y JSON inválido sin fallar', () => {
    const good = report('Bueno')
    assert.deepEqual(
      setup({ [KEY]: JSON.stringify([good, { id: 'roto' }]) }).repository.getAll(),
      [good],
    )
    assert.deepEqual(setup({ [KEY]: '{no es json' }).repository.getAll(), [])
  })

  it('relee el almacenamiento cuando otra pestaña lo modifica', () => {
    const { repository, storage, events } = setup()
    const fromOtherTab = report('Otra pestaña')
    let calls = 0
    repository.subscribe(() => calls++)
    assert.deepEqual(repository.getAll(), [])

    storage.setItem(KEY, JSON.stringify([fromOtherTab]))
    events.dispatchEvent(Object.assign(new Event('storage'), { key: KEY }))

    assert.equal(calls, 1)
    assert.deepEqual(repository.getAll(), [fromOtherTab])
  })

  it('sigue funcionando en memoria si el almacenamiento falla', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    const repository = createLocalStorageReportRepository({ storage, key: KEY })
    const saved = report('En memoria')
    repository.add(saved)
    assert.deepEqual(repository.getAll(), [saved])
  })
})
