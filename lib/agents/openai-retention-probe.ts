import 'server-only'

const OPENAI_API_BASE = 'https://api.openai.com/v1'
const PROBE_TIMEOUT_MS = 30_000
const SYNTHETIC_INPUT = 'Synthetic Kumplio retention probe. Return exactly: OK'

export type OpenAIRetentionProbeResult = {
  observedAt: string
  model: string
  createStatus: number
  createStoreFlag: boolean | null
  createRequestId: string | null
  organizationHeader: string | null
  retrieveStatus: number
  retrievable: boolean
  retrievedStoreFlag: boolean | null
  deleteStatus: number | null
  deleted: boolean
  applicationStateObserved: boolean
  retentionModeEvidence:
    | 'zdr_contradicted_by_persisted_application_state'
    | 'consistent_with_forced_non_storage_but_unverified'
    | 'inconclusive'
  standardVsModifiedAbuseMonitoring: 'not_distinguishable_by_this_probe'
}

type OpenAIResponseEnvelope = {
  id?: unknown
  model?: unknown
  store?: unknown
}

function bearerHeaders(apiKey: string, contentType = false) {
  return {
    Authorization: `Bearer ${apiKey}`,
    ...(contentType ? { 'Content-Type': 'application/json' } : {}),
  }
}

async function readEnvelope(response: Response): Promise<OpenAIResponseEnvelope> {
  const payload = await response.json().catch(() => ({}))
  return payload && typeof payload === 'object' ? payload as OpenAIResponseEnvelope : {}
}

export async function runOpenAIRetentionProbe(): Promise<OpenAIRetentionProbeResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')

  const model = process.env.OPENAI_RETENTION_PROBE_MODEL || process.env.OPENAI_FALLBACK_MODEL || 'gpt-4.1'
  const observedAt = new Date().toISOString()

  let responseId: string | null = null
  let createStatus = 0
  let createStoreFlag: boolean | null = null
  let createRequestId: string | null = null
  let organizationHeader: string | null = null
  let retrieveStatus = 0
  let retrievable = false
  let retrievedStoreFlag: boolean | null = null
  let deleteStatus: number | null = null
  let deleted = false

  try {
    const createResponse = await fetch(`${OPENAI_API_BASE}/responses`, {
      method: 'POST',
      headers: bearerHeaders(apiKey, true),
      body: JSON.stringify({
        model,
        input: SYNTHETIC_INPUT,
        max_output_tokens: 64,
        store: true,
        metadata: { kumplio_probe: 'provider_retention_v1' },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    })

    createStatus = createResponse.status
    createRequestId = createResponse.headers.get('x-request-id')
    organizationHeader = createResponse.headers.get('openai-organization')

    const created = await readEnvelope(createResponse)
    if (!createResponse.ok) throw new Error(`OpenAI retention probe create returned ${createResponse.status}`)
    if (typeof created.id !== 'string' || !created.id.startsWith('resp_')) {
      throw new Error('OpenAI retention probe create returned no response id')
    }

    responseId = created.id
    createStoreFlag = typeof created.store === 'boolean' ? created.store : null

    const retrieveResponse = await fetch(`${OPENAI_API_BASE}/responses/${encodeURIComponent(responseId)}`, {
      method: 'GET',
      headers: bearerHeaders(apiKey),
      cache: 'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    })

    retrieveStatus = retrieveResponse.status
    if (retrieveResponse.ok) {
      retrievable = true
      const retrieved = await readEnvelope(retrieveResponse)
      retrievedStoreFlag = typeof retrieved.store === 'boolean' ? retrieved.store : null
    } else if (retrieveResponse.status === 404) {
      retrievable = false
    } else {
      throw new Error(`OpenAI retention probe retrieve returned ${retrieveResponse.status}`)
    }
  } finally {
    if (responseId) {
      try {
        const deleteResponse = await fetch(`${OPENAI_API_BASE}/responses/${encodeURIComponent(responseId)}`, {
          method: 'DELETE',
          headers: bearerHeaders(apiKey),
          cache: 'no-store',
          signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        })
        deleteStatus = deleteResponse.status
        deleted = deleteResponse.ok
      } catch {
        deleteStatus = null
        deleted = false
      }
    }
  }

  const applicationStateObserved = retrievable
  const retentionModeEvidence = applicationStateObserved && createStoreFlag !== false
    ? 'zdr_contradicted_by_persisted_application_state'
    : !applicationStateObserved && createStoreFlag === false
      ? 'consistent_with_forced_non_storage_but_unverified'
      : 'inconclusive'

  return {
    observedAt,
    model,
    createStatus,
    createStoreFlag,
    createRequestId,
    organizationHeader,
    retrieveStatus,
    retrievable,
    retrievedStoreFlag,
    deleteStatus,
    deleted,
    applicationStateObserved,
    retentionModeEvidence,
    standardVsModifiedAbuseMonitoring: 'not_distinguishable_by_this_probe',
  }
}
