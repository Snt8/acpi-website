import { CITY_TELEMETRY } from '../../../core/content/telemetry.content.js'
import { cellSizeMeters } from '../../../core/telemetry/snapshot.js'
import {
  formatDate,
  formatDateTime,
  formatInteger,
  formatPercent,
  formatSeconds,
} from '../../../shared/lib/format.js'
import { Card, Reveal, Section, SectionHeading } from '../../../shared/ui/index.js'
import { StatTile } from '../components/StatTile.jsx'
import { ZoneTable } from '../components/ZoneTable.jsx'
import { useTelemetrySnapshot } from '../hooks/useTelemetrySnapshot.js'

/** Cómo se presenta cada cifra del total, en el orden en que se muestran. */
const TOTAL_FORMATS = Object.freeze([
  ['sessions', formatInteger],
  ['avgWaitSeconds', formatSeconds],
  ['avgCrossingSeconds', formatSeconds],
  ['disorientationRate', formatPercent],
  ['panicAlerts', formatInteger],
])

/** Telemetría agregada de la ciudad, tal como la publica la Action de Grafana. */
export function CityTelemetrySection() {
  const { status, snapshot } = useTelemetrySnapshot()
  const { eyebrow, title, description, states } = CITY_TELEMETRY

  return (
    <Section
      labelledBy="telemetria-ciudad-titulo"
      className="border-t border-line bg-paper-raised"
    >
      <Reveal>
        <SectionHeading
          id="telemetria-ciudad-titulo"
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
      </Reveal>

      <div aria-live="polite" aria-busy={status === 'loading'} className="mt-12">
        {status === 'ok' ? (
          <TelemetryReport snapshot={snapshot} />
        ) : (
          <Card className="max-w-3xl bg-paper">
            <p className="text-base leading-relaxed text-ink-soft">{states[status]}</p>
          </Card>
        )}
      </div>
    </Section>
  )
}

/** @param {{ snapshot: import('../../../core/telemetry/snapshot.js').Snapshot }} props */
function TelemetryReport({ snapshot }) {
  const { stats, zones, meta, privacy } = CITY_TELEMETRY
  const { totals, range, policy } = snapshot

  return (
    <>
      {/* Cada StatTile es el único nivel que un <dl> admite entre él y su dt/dd. */}
      <Reveal as="dl" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {TOTAL_FORMATS.map(([key, format]) => (
          <StatTile key={key} label={stats[key]} value={format(totals[key])} />
        ))}
      </Reveal>

      <p className="mt-4 text-sm text-ink-faint">
        {meta.updated}{' '}
        <time dateTime={snapshot.generatedAt}>{formatDateTime(snapshot.generatedAt)}</time>
        {range ? (
          <>
            {' · '}
            {meta.range} {formatDate(range.from)} – {formatDate(range.to)}
          </>
        ) : null}
      </p>

      {snapshot.zones.length > 0 ? (
        <Reveal className="mt-12">
          <h3 className="text-xl">{zones.title}</h3>
          <div className="mt-5">
            <ZoneTable zones={snapshot.zones} />
          </div>
        </Reveal>
      ) : null}

      {policy ? (
        <p className="mt-6 max-w-3xl border-l-2 border-signal-soft pl-4 text-sm leading-relaxed text-ink-soft">
          {privacy({
            cellMeters: cellSizeMeters(policy.cellDecimals),
            minSessions: policy.minSessionsPerZone,
            hiddenSessions: snapshot.hiddenSessions,
          })}
        </p>
      ) : null}
    </>
  )
}
