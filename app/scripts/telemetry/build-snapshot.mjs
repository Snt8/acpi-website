import {
  SNAPSHOT_STATUS,
  SNAPSHOT_VERSION,
  emptySnapshot,
} from '../../src/core/telemetry/snapshot.js'
import { ANONYMITY_POLICY, summarizeCrossings } from './anonymize.mjs'
import { applyTrafficLightEvents } from './traffic-lights.mjs'

/**
 * Compone el resumen público a partir de los eventos leídos de Grafana y del
 * registro de semáforos que ya estaba publicado. Función pura.
 *
 * @param {Record<string, unknown>[]} rows
 * @param {{
 *   generatedAt: Date,
 *   from: Date,
 *   to: Date,
 *   previousTrafficLights?: import('../../src/core/telemetry/snapshot.js').TrafficLight[],
 *   policy?: typeof ANONYMITY_POLICY,
 * }} meta
 * @returns {import('../../src/core/telemetry/snapshot.js').Snapshot}
 */
export function buildSnapshot(
  rows,
  { generatedAt, from, to, previousTrafficLights = [], policy = ANONYMITY_POLICY },
) {
  const range = { from: from.toISOString(), to: to.toISOString() }
  const publicPolicy = {
    cellDecimals: policy.cellDecimals,
    minSessionsPerZone: policy.minSessionsPerZone,
  }
  const trafficLights = applyTrafficLightEvents(previousTrafficLights, rows)
  const crossings = summarizeCrossings(rows, policy)

  if (crossings.status !== SNAPSHOT_STATUS.ok) {
    return emptySnapshot(crossings.status, {
      generatedAt,
      range,
      policy: publicPolicy,
      trafficLights,
    })
  }

  return {
    version: SNAPSHOT_VERSION,
    status: crossings.status,
    generatedAt: generatedAt.toISOString(),
    range,
    policy: publicPolicy,
    totals: crossings.totals,
    zones: crossings.zones,
    hiddenSessions: crossings.hiddenSessions,
    trafficLights,
  }
}
