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
    if (!endpoint || !secret) return { accepted: false, provider: 'http-unconfigured' }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(8000),
    })
    return { accepted: response.ok, provider: 'http' }
  }
}

class DurableOnlyTransport implements ExecutionTransport {
  async publish(_message: OutcomePreparationMessage) {
    return { accepted: true, provider: 'supabase-durable-queue' }
  }
}

export function getOutcomeExecutionTransport(): ExecutionTransport {
  if (process.env.OUTCOME_EXECUTION_TRANSPORT === 'http') return new HttpExecutionTransport()
  return new DurableOnlyTransport()
}
