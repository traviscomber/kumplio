/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DEPLOYMENT_ENV: 'staging'
  OUTCOME_PREPARATIONS_QUEUE: Queue<PreparationMessage>
  KUMPLIO_INGRESS_SECRET: string
  KUMPLIO_RUNNER_URL: string
  KUMPLIO_RUNNER_SECRET: string
  VERCEL_AUTOMATION_BYPASS_SECRET: string
}

type PreparationMessage = {
  queueId: string
  organizationId: string
  taskId: string
  preparationType: 'prepare_evidence_context'
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_MESSAGE_BYTES = 4096

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}

function parseMessage(value: unknown): PreparationMessage | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const body = value as Record<string, unknown>
  const keys = Object.keys(body).sort()
  if (keys.join(',') !== 'organizationId,preparationType,queueId,taskId') return null
  if (body.preparationType !== 'prepare_evidence_context') return null
  if (![body.queueId, body.organizationId, body.taskId].every((item) => typeof item === 'string' && UUID_PATTERN.test(item))) return null
  return body as PreparationMessage
}

function stagingRunnerUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.vercel.app')) return null
    if (url.pathname !== '/api/internal/outcomes/closure-preparations/run') return null
    return url
  } catch {
    return null
  }
}

async function secretMatches(actual: string | null, expected: string) {
  if (!actual || !expected) return false
  const encoder = new TextEncoder()
  const [actualHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(actual)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])
  const left = new Uint8Array(actualHash)
  const right = new Uint8Array(expectedHash)
  return left.length === right.length && left.every((byte, index) => byte === right[index])
}

function retryDelay(attempts: number) {
  return Math.min(300, 15 * 2 ** Math.max(0, attempts - 1))
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: env.DEPLOYMENT_ENV === 'staging', environment: env.DEPLOYMENT_ENV })
    }
    if (url.pathname !== '/enqueue') return json({ error: 'not_found' }, 404)
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
    if (env.DEPLOYMENT_ENV !== 'staging') return json({ error: 'unsafe_environment' }, 503)

    const authorization = request.headers.get('authorization')
    if (!(await secretMatches(authorization, `Bearer ${env.KUMPLIO_INGRESS_SECRET}`))) {
      return json({ error: 'unauthorized' }, 401)
    }

    const declaredLength = Number(request.headers.get('content-length') || '0')
    if (declaredLength > MAX_MESSAGE_BYTES) return json({ error: 'payload_too_large' }, 413)

    const raw = await request.text()
    if (new TextEncoder().encode(raw).byteLength > MAX_MESSAGE_BYTES) return json({ error: 'payload_too_large' }, 413)

    let decoded: unknown
    try {
      decoded = JSON.parse(raw)
    } catch {
      return json({ error: 'invalid_json' }, 400)
    }
    const message = parseMessage(decoded)
    if (!message) return json({ error: 'invalid_message' }, 422)

    await env.OUTCOME_PREPARATIONS_QUEUE.send(message, { contentType: 'json' })
    return json({ accepted: true, queueId: message.queueId }, 202)
  },

  async queue(batch: MessageBatch<PreparationMessage>, env: Env): Promise<void> {
    const runnerUrl = stagingRunnerUrl(env.KUMPLIO_RUNNER_URL)
    for (const message of batch.messages) {
      const parsed = parseMessage(message.body)
      if (env.DEPLOYMENT_ENV !== 'staging' || !runnerUrl || !parsed || !env.VERCEL_AUTOMATION_BYPASS_SECRET) {
        message.retry({ delaySeconds: retryDelay(message.attempts) })
        continue
      }
      try {
        const response = await fetch(runnerUrl, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${env.KUMPLIO_RUNNER_SECRET}`,
            'content-type': 'application/json',
            'x-kumplio-queue-id': parsed.queueId,
            'x-vercel-protection-bypass': env.VERCEL_AUTOMATION_BYPASS_SECRET,
          },
          body: JSON.stringify(parsed),
        })
        if (!response.ok) {
          message.retry({ delaySeconds: retryDelay(message.attempts) })
          continue
        }
        message.ack()
      } catch {
        message.retry({ delaySeconds: retryDelay(message.attempts) })
      }
    }
  },
} satisfies ExportedHandler<Env, PreparationMessage>
