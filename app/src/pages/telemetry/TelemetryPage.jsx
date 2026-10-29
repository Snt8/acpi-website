import { CityTelemetrySection } from './sections/CityTelemetrySection.jsx'
import { DataFlowSection } from './sections/DataFlowSection.jsx'
import { ReportsSection } from './sections/ReportsSection.jsx'
import { TelemetryHero } from './sections/TelemetryHero.jsx'
import { useTelemetrySnapshot } from './hooks/useTelemetrySnapshot.js'

const NO_LIGHTS = Object.freeze([])

/**
 * Panel de telemetría: los semáforos que reportan las personas, el camino
 * que siguen los datos de cada cruce y las cifras agregadas que resultan.
 */
export default function TelemetryPage() {
  // Un solo pedido del resumen: el mapa usa sus semáforos y la última
  // sección, sus cifras.
  const telemetry = useTelemetrySnapshot()

  return (
    <>
      <TelemetryHero />
      <ReportsSection trafficLights={telemetry.snapshot?.trafficLights ?? NO_LIGHTS} />
      <DataFlowSection />
      <CityTelemetrySection {...telemetry} />
    </>
  )
}
