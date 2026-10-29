import { useSyncExternalStore } from 'react'
import { reportRepository } from '../../../infrastructure/reports/index.js'

/**
 * Reportes de semáforos, sincronizados con el repositorio (y con las demás
 * pestañas abiertas, si el repositorio lo permite).
 *
 * @param {ReturnType<typeof import('../../../infrastructure/reports/localStorageReportRepository.js').createLocalStorageReportRepository>} [repository]
 */
export function useReports(repository = reportRepository) {
  const reports = useSyncExternalStore(
    repository.subscribe,
    repository.getAll,
    repository.getAll,
  )

  return { reports, addReport: repository.add, removeReport: repository.remove }
}
