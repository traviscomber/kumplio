export interface Env {
  KUMPLIO_RUNNER_URL: string
  KUMPLIO_RUNNER_SECRET: string
}

type PreparationMessage = {
  queueId: string
  organizationId: string
  taskId: string
  preparationType: 'prepare_evidence_context'
}

export default {
  async queue(batch: MessageBatch<PreparationMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        const response = await fetch(env.KUMPLIO_RUNNER_URL, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${env.KUMPLIO_RUNNER_SECRET}`,
            'content-type': 'application/json',
            'x-kumplio-queue-id': message.body.queueId,
          },
          body: JSON.stringify(message.body),
        })
        if (!response.ok) {
          message.retry({ delaySeconds: 30 })
          continue
        }
        message.ack()
      } catch {
        message.retry({ delaySeconds: 30 })
      }
    }
  },
}
