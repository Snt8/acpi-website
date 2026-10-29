import { CityTelemetrySection } from './sections/CityTelemetrySection.jsx'
import { DataFlowSection } from './sections/DataFlowSection.jsx'
import { ReportsSection } from './sections/ReportsSection.jsx'
import { TelemetryHero } from './sections/TelemetryHero.jsx'

/**
 * Panel de telemetría: los semáforos que reportan las personas, el camino
 * que siguen los datos de cada cruce y las cifras agregadas que resultan.
 */
export default function TelemetryPage() {
  return (
    <>
      <TelemetryHero />
      <ReportsSection />
      <DataFlowSection />
      <CityTelemetrySection />
    </>
  )
}
