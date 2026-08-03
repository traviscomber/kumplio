import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type RouteParams = Promise<{ runId: string }>

type CompletionBody = {
  action: 'complete' | 'fail'
  agentId: string
  artifact?: {
    type: string
    title: string
    content: Record<string, unknown>
    sourceRefs?: unknown[]
    confidence?: number | null
  }
  result?: {
    type: string
    title: string
    summary?: string | null
    payload?: Record<string, unknown>
    evidenceIds?: string[]
  }
  error?: { code: string; message: string }
}

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized_worker' }, { status: 401 })
}

export async function POST(request: NextRequest, { params }: { params: RouteParams }) {
  const configuredSecret = process.env.MISSION_WORKER_SECRET
  const suppliedSecret = request.headers.get('x-mission-worker-secret')
  if (!configuredSecret || suppliedSecret !== configuredSecret) return unauthorized()

  const { runId } = await params
  let body: CompletionBody
  try {
    body = await request.json() as CompletionBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!body.agentId || !['complete', 'fail'].includes(body.action)) {
    return NextResponse.json({ error: 'invalid_worker_payload' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (body.action === 'fail') {
    if (!body.error?.code || !body.error?.message) {
      return NextResponse.json({ error: 'missing_failure_details' }, { status: 400 })
    }
    const { data, error } = await admin.rpc('fail_mission_capability', {
      p_capability_run_id: runId,
      p_agent_id: body.agentId,
      p_error_code: body.error.code,
      p_error_message: body.error.message,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 409 })
    return NextResponse.json(data)
  }

  if (!body.artifact?.type || !body.artifact.title || !body.result?.type || !body.result.title) {
    return NextResponse.json({ error: 'missing_completion_artifact_or_result' }, { status: 400 })
  }

  const confidence = body.artifact.confidence
  if (confidence != null && (confidence < 0 || confidence > 1)) {
    return NextResponse.json({ error: 'invalid_confidence' }, { status: 400 })
  }

  const { data, error } = await admin.rpc('complete_mission_capability', {
    p_capability_run_id: runId,
    p_agent_id: body.agentId,
    p_artifact_type: body.artifact.type,
    p_artifact_title: body.artifact.title,
    p_artifact_content: body.artifact.content || {},
    p_source_refs: body.artifact.sourceRefs || [],
    p_confidence: confidence ?? null,
    p_result_type: body.result.type,
    p_result_title: body.result.title,
    p_result_summary: body.result.summary ?? null,
    p_result_payload: body.result.payload || {},
    p_evidence_ids: body.result.evidenceIds || [],
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 409 })
  return NextResponse.json(data, { status: 201 })
}
