import 'server-only'

import { createHash, randomUUID } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export type ScraperRunStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'unchanged'
  | 'failed'
  | 'blocked'
  | 'requires_review'
  | 'dead_letter'
  | 'cancelled'

function idempotencyKey(connectorKey: string, canonicalUrl: string, scope = 'manual') {
  return createHash('sha256')
    .update(`${connectorKey}\n${canonicalUrl}\n${scope}`, 'utf8')
    .digest('hex')
}

export async function enqueueAndClaimScraperRun(input: {
  connectorKey: string
  organizationId: string | null
  requestedBy: string | null
  triggerType: 'manual' | 'schedule' | 'retry' | 'reprocess' | 'webhook'
  requestedUrl: string
  canonicalUrl: string
  idempotencyScope?: string
}) {
  const admin = createAdminClient()
  const key = idempotencyKey(
    input.connectorKey,
    input.canonicalUrl,
    input.idempotencyScope || input.triggerType,
  )

  const { data: runId, error: enqueueError } = await admin.rpc('enqueue_scraper_run', {
    target_connector_key: input.connectorKey,
    target_organization: input.organizationId,
    target_requested_by: input.requestedBy,
    target_trigger_type: input.triggerType,
    target_requested_url: input.requestedUrl,
    target_canonical_url: input.canonicalUrl,
    target_idempotency_key: key,
    target_parent_run: null,
  })

  if (enqueueError || !runId) {
    throw new Error(`scraper_enqueue_failed:${enqueueError?.code || 'unknown'}`)
  }

  const workerId = `vercel:${randomUUID()}`
  const { data: run, error: claimError } = await admin.rpc('claim_scraper_run', {
    target_run: runId,
    worker_id: workerId,
    lease_seconds: 300,
  })

  if (claimError || !run) {
    throw new Error(`scraper_claim_failed:${claimError?.code || 'unknown'}`)
  }

  return { runId: String(runId), workerId, run }
}

export async function completeScraperRun(input: {
  runId: string
  status: 'succeeded' | 'unchanged' | 'requires_review'
  httpStatus?: number | null
  mimeType?: string | null
  byteSize?: number | null
  contentHash?: string | null
  documentId?: string | null
  versionId?: string | null
  sourceChangeId?: string | null
  sectionCount?: number | null
  changeCount?: number | null
  metrics?: Record<string, unknown>
}) {
  const admin = createAdminClient()
  const { error } = await admin.rpc('complete_scraper_run', {
    target_run: input.runId,
    target_status: input.status,
    target_http_status: input.httpStatus ?? null,
    target_mime: input.mimeType ?? null,
    target_bytes: input.byteSize ?? null,
    target_hash: input.contentHash ?? null,
    target_document: input.documentId ?? null,
    target_version: input.versionId ?? null,
    target_change: input.sourceChangeId ?? null,
    target_sections: input.sectionCount ?? null,
    target_changes: input.changeCount ?? null,
    target_metrics: input.metrics || {},
  })
  if (error) throw new Error(`scraper_complete_failed:${error.code || 'unknown'}`)
}

export async function failScraperRun(input: {
  runId: string
  errorCode: string
  errorMessage: string
  retryable: boolean
}) {
  const admin = createAdminClient()
  const { data: retryRunId, error } = await admin.rpc('fail_scraper_run', {
    target_run: input.runId,
    target_error_code: input.errorCode,
    target_error_message: input.errorMessage,
    target_retryable: input.retryable,
  })
  if (error) throw new Error(`scraper_fail_record_failed:${error.code || 'unknown'}`)
  return retryRunId ? String(retryRunId) : null
}

export function classifyScraperError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const code = message.split(':')[0] || 'scraper_unknown_error'
  const nonRetryable = new Set([
    'invalid_url',
    'https_required',
    'host_not_allowed',
    'path_not_allowed',
    'invalid_norm_id',
    'invalid_version',
    'method_not_approved',
    'approval_reference_required',
    'capture_disabled',
    'mime_not_allowed',
    'leychile_parse_no_articles',
    'leychile_parse_invalid_html',
  ])

  return {
    code,
    message: message.slice(0, 1000),
    retryable: !nonRetryable.has(code),
  }
}
