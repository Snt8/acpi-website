import { useEffect, useState } from 'react'
import { SNAPSHOT_STATUS } from '../../../core/telemetry/snapshot.js'
import { fetchTelemetrySnapshot } from '../../../infrastructure/telemetry/fetchTelemetrySnapshot.js'

/**
 * Estado de la telemetría publicada, reducido a lo que la página distingue.
 * Una Action sin credenciales se presenta igual que «aún no hay datos»: a
 * quien visita el sitio no le sirve saber por qué falta.
 *
 * @typedef {'loading' | 'empty' | 'insufficient' | 'ok' | 'error'} TelemetryStatus
 * @returns {{ status: TelemetryStatus, snapshot: import('../../../core/telemetry/snapshot.js').Snapshot | null }}
 */
export function useTelemetrySnapshot() {
  const [state, setState] = useState({ status: 'loading', snapshot: null })

  useEffect(() => {
    const controller = new AbortController()

    fetchTelemetrySnapshot(controller.signal)
      .then((snapshot) => {
        const status =
          !snapshot || snapshot.status === SNAPSHOT_STATUS.unconfigured
            ? 'empty'
            : snapshot.status
        setState({ status, snapshot })
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error', snapshot: null })
      })

    return () => controller.abort()
  }, [])

  return state
}
