import { useCallback, useMemo, useRef, useState } from 'react'
import { REPORTS_SECTION } from '../../../core/content/telemetry.content.js'
import { Reveal, Section, SectionHeading } from '../../../shared/ui/index.js'
import { ReportForm } from '../components/ReportForm.jsx'
import { ReportList } from '../components/ReportList.jsx'
import { ReportsMap } from '../components/ReportsMap.jsx'
import { useReports } from '../hooks/useReports.js'
import {
  EMPTY_POSITION_INPUT,
  parsePositionInput,
  toPositionInput,
} from '../lib/positionInput.js'

/**
 * Mapa, formulario y lista de reportes. La sección coordina el estado que
 * comparten: el reporte seleccionado y las coordenadas en borrador, que
 * escriben tanto el mapa como el formulario.
 */
export function ReportsSection() {
  const { reports, addReport, removeReport } = useReports()
  const [selectedId, setSelectedId] = useState(null)
  const [positionInput, setPositionInput] = useState(EMPTY_POSITION_INPUT)
  const mapRef = useRef(null)
  const { eyebrow, title, description } = REPORTS_SECTION

  // Memorizada: el mapa rehace sus marcadores cuando cambia esta referencia.
  const draftPosition = useMemo(() => parsePositionInput(positionInput), [positionInput])

  const handlePick = useCallback((position) => setPositionInput(toPositionInput(position)), [])

  const handleAdd = (report) => {
    addReport(report)
    setSelectedId(report.id)
  }

  const handleLocate = (id) => {
    setSelectedId(id)
    mapRef.current?.scrollIntoView({ block: 'center' })
  }

  return (
    <Section labelledBy="reportes-titulo" className="border-t border-line">
      <Reveal>
        <SectionHeading
          id="reportes-titulo"
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        {/* `Reveal` ocupa su propia ref; el desplazamiento usa la de este contenedor. */}
        <div ref={mapRef}>
          <Reveal>
            <ReportsMap
              reports={reports}
              selectedId={selectedId}
              draftPosition={draftPosition}
              onPick={handlePick}
              onSelect={setSelectedId}
            />
          </Reveal>
        </div>
        <Reveal delay={120}>
          <ReportForm
            position={positionInput}
            onPositionChange={setPositionInput}
            onSubmit={handleAdd}
          />
        </Reveal>
      </div>

      <Reveal className="mt-6">
        <ReportList
          reports={reports}
          selectedId={selectedId}
          onLocate={handleLocate}
          onRemove={removeReport}
        />
      </Reveal>
    </Section>
  )
}
