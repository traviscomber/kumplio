import 'server-only'

import { randomUUID } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  classifyScraperError,
  completeScraperRun,
  enqueueAndClaimScraperRun,
  failScraperRun,
} from '@/lib/regulatory/scraper-platform'

export const LEYCHILE_CONNECTOR_KEY = 'leychile-official-json'
export const LEYCHILE_CONNECTOR_VERSION = 'leychile-official-json-v3'
export const LEYCHILE_API_URL = 'https://servicios-leychile.bcn.cl/Navegar/get_norma_json?idNorma=1209272&idVersion=2026-12-01&idLey=&tipoVersion=&cve=&agrupa_partes=1&r='

export type LeyChileTriggerType = 'manual' | 'schedule' | 'retry' | 'reprocess'

export class LeyChileRunError extends Error {
  constructor(
    public readonly code: string,
    public readonly retryable: boolean,
    public readonly runId: string | null,
    public readonly retryRunId: string | null,
  ) {
    super(code)
    this.name = 'LeyChileRunError'
  }
}

async function claimExistingRun(runId: string) {
  const admin = createAdminClient()
  const workerId = `vercel:${randomUUID()}`
  const { data: run, error } = await admin.rpc('claim_scraper_run', {
    target_run: runId,
    worker_id: workerId,
    lease_seconds: 300,
  })

  if (error || !run) {
    throw new Error(`scraper_claim_failed:${error?.code || 'unknown'}`)
  }

  return { runId, workerId, run }
}

export async function runLeyChileOfficialJson(input: {
  organizationId: string | null
  requestedBy: string | null
  triggerType: LeyChileTriggerType
  existingRunId?: string | null
  idempotencyScope?: string
}) {
  const admin = createAdminClient()
  let runId: string | null = input.existingRunId || null

  try {
    if (runId) {
      await claimExistingRun(runId)
    } else {
      const claimed = await enqueueAndClaimScraperRun({
        connectorKey: LEYCHILE_CONNECTOR_KEY,
        organizationId: input.organizationId,
        requestedBy: input.requestedBy,
        triggerType: input.triggerType,
        requestedUrl: LEYCHILE_API_URL,
        canonicalUrl: LEYCHILE_API_URL,
        idempotencyScope: input.idempotencyScope || `law-21719:2026-12-01:${input.triggerType}`,
      })
      runId = claimed.runId
    }

    const { data, error } = await admin.functions.invoke('leychile-bootstrap', {
      body: { trigger: input.triggerType, runId },
    })

    if (error) {
      throw new Error(`leychile_edge_function_failed:${error.message}`)
    }

    if (!data?.ok) {
      throw new Error(`leychile_capture_failed:${data?.error || 'unknown'}`)
    }

    const record = (data.record || {}) as Record<string, unknown>
    const recordStatus = String(record.status || '')
    const status = recordStatus === 'unchanged' ? 'unchanged' : 'requires_review'
    const documentId = typeof record.documentId === 'string' ? record.documentId : null
    const versionId = typeof record.versionId === 'string' ? record.versionId : null
    const changeId = typeof record.changeId === 'string' ? record.changeId : null

    await completeScraperRun({
      runId,
      status,
      httpStatus: 200,
      mimeType: 'application/json',
      byteSize: Number(data.byteSize || 0),
      contentHash: typeof data.rawHash === 'string' ? data.rawHash : null,
      documentId,
      versionId,
      sourceChangeId: changeId,
      sectionCount: Number(data.totalSections || 0),
      changeCount: changeId ? 1 : 0,
      metrics: {
        sourceParts: Number(data.sourceParts || 0),
        articleSections: Number(data.articleSections || 0),
        incisoSections: Number(data.incisoSections || 0),
        documentHash: data.documentHash || null,
        connectorVersion: LEYCHILE_CONNECTOR_VERSION,
      },
    })

    return {
      runId,
      status,
      sourceParts: Number(data.sourceParts || 0),
      articleSections: Number(data.articleSections || 0),
      incisoSections: Number(data.incisoSections || 0),
      totalSections: Number(data.totalSections || 0),
      byteSize: Number(data.byteSize || 0),
      rawHash: data.rawHash || null,
      documentHash: data.documentHash || null,
      documentId,
      versionId,
      changeId,
      versionNumber: typeof record.versionNumber === 'number' ? record.versionNumber : null,
    }
  } catch (error) {
    const classified = classifyScraperError(error)
    let retryRunId: string | null = null

    if (runId) {
      try {
        retryRunId = await failScraperRun({
          runId,
          errorCode: classified.code,
          errorMessage: classified.message,
          retryable: classified.retryable,
        })
      } catch (recordingError) {
        console.error('[leychile-official-json] failure-recording-error', recordingError)
      }
    }

    throw new LeyChileRunError(classified.code, classified.retryable, runId, retryRunId)
  }
}
