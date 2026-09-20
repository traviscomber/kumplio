export type OutcomePreparationMessage = {
  queueId: string
  organizationId: string
  taskId: string
  preparationType: 'prepare_evidence_context'
}

export interface ExecutionTransport {
  publish(message: OutcomePreparationMessage): Promise<{ accepted: boolean; provider: string }>
}

class HttpExecutionTransport implements ExecutionTransport {
  async publish(message: OutcomePreparationMessage) {
    const endpoint = process.env.OUTCOME_EXECUTION_HTTP_ENDPOINT
    const secret = process.env.OUTCOME_EXECUTION_HTTP_SECRET
    const environment = process.env.OUTCOME_EXECUTION_ENV
    if (!endpoint || !secret || environment !== 'staging') return { accepted: false, provider: 'http-unconfigured' }

    let target: URL
    try {
      target = new URL(endpoint)
    } catch {
      return { accepted: false, provider: 'http-invalid-endpoint' }
    }
    if (target.protocol !== 'https:' || !target.hostname.endsWith('.workers.dev') || target.pathname !== '/enqueue') {
      return { accepted: false, provider: 'http-unsafe-endpoint' }
    }

    try {
      const response = await fetch(target, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(8000),
      })
      return { accepted: response.status === 202, provider: 'cloudflare-queue-staging' }
    } catch {
      return { accepted: false, provider: 'cloudflare-queue-unavailable' }
    }
  }
}

class DurableOnlyTransport implements ExecutionTransport {
  async publish() {
    return { accepted: true, provider: 'supabase-durable-queue' }
  }
}

export function getOutcomeExecutionTransport(): ExecutionTransport {
  if (process.env.OUTCOME_EXECUTION_TRANSPORT === 'http') return new HttpExecutionTransport()
  return new DurableOnlyTransport()
}
