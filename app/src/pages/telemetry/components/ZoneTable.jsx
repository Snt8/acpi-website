import { CITY_TELEMETRY } from '../../../core/content/telemetry.content.js'
import {
  formatInteger,
  formatPercent,
  formatPosition,
  formatSeconds,
} from '../../../shared/lib/format.js'

const CELL = 'px-4 py-3 text-right tabular-nums'

/** Tabla de las zonas con más cruces, ya agregadas y anonimizadas. */
export function ZoneTable({ zones }) {
  const { caption, columns } = CITY_TELEMETRY.zones

  return (
    <div className="overflow-x-auto rounded-card border border-line bg-paper">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-ink">
            <th scope="col" className="px-4 py-3 text-left font-semibold">
              {columns.zone}
            </th>
            <th scope="col" className={`${CELL} font-semibold`}>
              {columns.sessions}
            </th>
            <th scope="col" className={`${CELL} font-semibold`}>
              {columns.wait}
            </th>
            <th scope="col" className={`${CELL} font-semibold`}>
              {columns.disorientation}
            </th>
            <th scope="col" className={`${CELL} font-semibold`}>
              {columns.panic}
            </th>
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => (
            <tr
              key={`${zone.lat},${zone.lng}`}
              className="border-b border-line text-ink-soft last:border-b-0"
            >
              <th scope="row" className="px-4 py-3 text-left font-medium text-ink tabular-nums">
                {formatPosition(zone)}
              </th>
              <td className={CELL}>{formatInteger(zone.sessions)}</td>
              <td className={CELL}>{formatSeconds(zone.avgWaitSeconds)}</td>
              <td className={CELL}>{formatPercent(zone.disorientationRate)}</td>
              <td className={CELL}>{formatInteger(zone.panicAlerts)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
