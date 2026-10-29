import { createLocalStorageReportRepository } from './localStorageReportRepository.js'

/**
 * Repositorio de reportes que usa el sitio. Es el único punto que decide
 * dónde se guardan: cambiar a una API es sustituir esta línea por otra
 * implementación con el mismo contrato.
 */
export const reportRepository = createLocalStorageReportRepository()
