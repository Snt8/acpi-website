import { useRef, useState } from 'react'
import {
  REPORT_ISSUE_LABELS,
  REPORTS_SECTION,
} from '../../../core/content/telemetry.content.js'
import { cx } from '../../../shared/lib/cx.js'
import { formatDateTime, formatPosition } from '../../../shared/lib/format.js'
import { Card } from '../../../shared/ui/index.js'

const ACTION_CLASSES =
  'text-sm font-semibold underline-offset-4 transition-colors duration-200 hover:underline'

/**
 * Lista de reportes: la versión textual y completa del mapa. Para quien usa
 * lector de pantalla es la vista principal, no un añadido.
 */
export function ReportList({ reports, selectedId, onLocate, onRemove }) {
  const headingRef = useRef(null)
  const [announcement, setAnnouncement] = useState('')
  const { list: copy } = REPORTS_SECTION

  // El botón pulsado desaparece con su reporte: el foco vuelve al título
  // para no dejar a quien navega con teclado en ninguna parte.
  const handleRemove = (id) => {
    onRemove(id)
    setAnnouncement(copy.removed)
    headingRef.current?.focus()
  }

  return (
    <Card as="section" aria-labelledby="reportes-lista-titulo">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="reportes-lista-titulo" ref={headingRef} tabIndex={-1} className="text-xl">
          {copy.title}
          <span className="ml-2 text-base font-normal text-ink-faint">({reports.length})</span>
        </h3>
        <p role="status" className="text-sm text-signal">
          {announcement}
        </p>
      </div>

      {reports.length === 0 ? (
        <p className="mt-4 text-base text-ink-soft">{copy.empty}</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => {
            const isSelected = report.id === selectedId
            return (
              <li
                key={report.id}
                aria-current={isSelected ? 'true' : undefined}
                className={cx(
                  'flex flex-col rounded-xl border p-4 transition-colors duration-200',
                  isSelected ? 'border-signal bg-signal-soft' : 'border-line bg-paper',
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">
                  {REPORT_ISSUE_LABELS[report.issue]}
                </p>
                <h4 className="mt-1 text-base font-semibold text-ink">{report.name}</h4>
                {report.note ? (
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{report.note}</p>
                ) : null}
                <p className="mt-2 text-xs text-ink-faint">
                  <time dateTime={report.reportedAt}>{formatDateTime(report.reportedAt)}</time>
                  {' · '}
                  {formatPosition(report.position)}
                </p>
                <div className="mt-auto flex gap-4 pt-3">
                  <button
                    type="button"
                    onClick={() => onLocate(report.id)}
                    className={cx(ACTION_CLASSES, 'text-signal')}
                  >
                    {copy.locate}
                    <span className="sr-only">: {report.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(report.id)}
                    className={cx(ACTION_CLASSES, 'text-ink-soft hover:text-ink')}
                  >
                    {copy.remove}
                    <span className="sr-only">: {report.name}</span>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
