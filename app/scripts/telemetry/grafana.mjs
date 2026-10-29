/**
 * Cliente mínimo de la API de consultas de Grafana (`POST /api/ds/query`).
 *
 * Grafana responde en su formato de *data frames*, por columnas y común a
 * todas las fuentes de datos; aquí se convierte en filas planas para que el
 * resto del proceso no tenga que conocer ese formato.
 */

const REQUEST_TIMEOUT_MS = 30_000

/**
 * @param {{
 *   url: string,
 *   token: string,
 *   queries: object[],
 *   from: Date,
 *   to: Date,
 *   fetchImpl?: typeof fetch,
 * }} options
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function queryGrafana({ url, token, queries, from, to, fetchImpl = fetch }) {
  const response = await fetchImpl(`${url.replace(/\/+$/, '')}/api/ds/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      queries,
      from: String(from.getTime()),
      to: String(to.getTime()),
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Grafana respondió ${response.status} ${response.statusText}.`)
  }

  return framesToRows(await response.json())
}

/**
 * Aplana la respuesta de `/api/ds/query` en una lista de filas.
 * Una consulta con error invalida el resultado entero: publicar solo una
 * parte de los datos daría cifras que parecen ciertas y no lo son.
 *
 * @param {{ results?: Record<string, { error?: string, frames?: object[] }> }} payload
 * @returns {Record<string, unknown>[]}
 */
export function framesToRows(payload) {
  const results = Object.entries(payload?.results ?? {})

  const failed = results.find(([, result]) => result.error)
  if (failed) throw new Error(`La consulta ${failed[0]} falló: ${failed[1].error}`)

  return results.flatMap(([, result]) => (result.frames ?? []).flatMap(frameToRows))
}

/** Un frame guarda los valores por columnas; se recorren por índice de fila. */
function frameToRows({ schema, data }) {
  const names = schema?.fields?.map((field) => field.name) ?? []
  const columns = data?.values ?? []
  const length = columns[0]?.length ?? 0

  return Array.from({ length }, (_, row) =>
    Object.fromEntries(names.map((name, column) => [name, columns[column]?.[row]])),
  )
}
