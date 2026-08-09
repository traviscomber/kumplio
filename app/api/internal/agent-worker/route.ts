import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  classifyWorkflowExecutionFailure,
  executeWorkflowStage,
  isRetryableWorkflowFailure,
} from '@/lib/agents/workflow-stage-executor'

export const runtime = 'nodejs'
export const maxDuration = 300

const VISIBILITY_SECONDS = 420
const HEARTBEAT_MS = 45_000

type ClaimedJob = {
  job_id: string
  message_id: number
  read_count: number
  organization_id: string
  workflow_id: string
  stage_index: number
  requested_by: string
  retry_instructions: string | null
}

type ProviderTrace = {
  requestId: string | null
  organization: string | null
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || ''
  if (!token) return NextResponse.json({ error: 'Worker authorization required' }, { status: 401 })

  const admin = createAdminClient()
  const { data: valid, error: validationError } = await admin.rpc('validate_agent_worker_token', { p_token: token })
  if (validationError || valid !== true) {
    console.error('[agent-worker/auth]', validationError?.code || 'invalid_token')
    return NextResponse.json({ error: 'Worker authorization failed' }, { status: 401 })
  }

  const workerId = `vercel-${crypto.randomUUID()}`
  const { data: claims, error: claimError } = await admin.rpc('claim_agent_jobs', {
    p_worker_id: workerId,
    p_visibility_seconds: VISIBILITY_SECONDS,
    p_qty: 1,
  })

  if (claimError) {
    console.error('[agent-worker/claim]', claimError.code)
    return NextResponse.json({ error: 'Unable to claim agent job', code: 'job_claim_failed' }, { status: 500 })
  }

  const job = (Array.isArray(claims) ? claims[0] : null) as ClaimedJob | null
  if (!job) return new NextResponse(null, { status: 204 })

  let heartbeatBusy = false
  const heartbeat = setInterval(async () => {
    if (heartbeatBusy) return
    heartbeatBusy = true
    try {
      const { error } = await admin.rpc('heartbeat_agent_job', {
        p_job_id: job.job_id,
        p_message_id: job.message_id,
        p_worker_id: workerId,
        p_visibility_seconds: VISIBILITY_SECONDS,
      })
      if (error) console.error('[agent-worker/heartbeat]', error.code)
    } finally {
      heartbeatBusy = false
    }
  }, HEARTBEAT_MS)

  try {
    const result = await executeWorkflowStage({
      db: admin,
      workflowId: job.workflow_id,
      organizationId: job.organization_id,
      actorId: job.requested_by,
      retryInstructions: job.retry_instructions,
    })

    const { data: completed, error: completeError } = await admin.rpc('complete_agent_job', {
      p_job_id: job.job_id,
      p_message_id: job.message_id,
      p_worker_id: workerId,
    })
    if (completeError || completed !== true) {
      console.error('[agent-worker/complete]', completeError?.code || 'lease_mismatch')
      return NextResponse.json({ error: 'Stage completed but queue acknowledgement failed', code: 'job_ack_failed' }, { status: 500 })
    }

    const providerTrace = readProviderTrace(result.result)
    return NextResponse.json({
      processed: true,
      jobId: job.job_id,
      workflowId: job.workflow_id,
      stageIndex: result.stageIndex,
      status: result.status,
      providerTrace,
    })
  } catch (error) {
    const failure = classifyWorkflowExecutionFailure(error)

    if (['stage_already_completed', 'workflow_completed'].includes(failure.code)) {
      await admin.rpc('complete_agent_job', {
        p_job_id: job.job_id,
        p_message_id: job.message_id,
        p_worker_id: workerId,
      })
      return NextResponse.json({ processed: true, idempotent: true, jobId: job.job_id })
    }

    const retryable = isRetryableWorkflowFailure(failure.code)
    const { data: disposition, error: failError } = await admin.rpc('fail_agent_job', {
      p_job_id: job.job_id,
      p_message_id: job.message_id,
      p_worker_id: workerId,
      p_error_code: failure.code,
      p_error_message: failure.message,
      p_retryable: retryable,
    })

    if (failError) console.error('[agent-worker/fail]', failError.code)
    console.error('[agent-worker/execute]', failure.code, failure.internalCode || 'unknown')

    return NextResponse.json({
      processed: false,
      jobId: job.job_id,
      code: failure.code,
      retryable,
      disposition: disposition || null,
    }, { status: retryable ? 503 : 422 })
  } finally {
    clearInterval(heartbeat)
  }
}

function readProviderTrace(value: unknown): ProviderTrace | null {
  if (!value || typeof value !== 'object' || !('providerTrace' in value)) return null
  const trace = (value as { providerTrace?: unknown }).providerTrace
  if (!trace || typeof trace !== 'object') return null
  const record = trace as Record<string, unknown>
  return {
    requestId: typeof record.requestId === 'string' ? record.requestId : null,
    organization: typeof record.organization === 'string' ? record.organization : null,
  }
}
