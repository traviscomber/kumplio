import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAgentProfile } from '@/lib/agents/catalog'
import { prepareAgentInput } from '@/lib/agents/input-security'
import { AgentRuntimeError, runAgent } from '@/lib/agents/openai-runtime'

export const runtime = 'nodejs'
export const maxDuration = 300

const requestSchema = z.object({
  agentId: z.enum(['isidora', 'rodrigo', 'javier', 'beatriz', 'veronica', 'andres', 'catalina']),
  task: z.string().trim().min(10).max(30000),
  context: z.string().max(120000).optional().default(''),
  caseId: z.string().uuid().optional(),
})

type PublicError = {
  status: number
  code: string
  message: string
}

function publicError(error: unknown): PublicError {
  if (error instanceof AgentRuntimeError) {
    const status = error.code === 'timeout' ? 504 : error.code === 'configuration_error' ? 503 : 502
    return { status, code: error.code, message: error.message }
  }
  if (error instanceof Error && error.message === 'artifact_integrity_migration_required') {
    return { status: 503, code: 'artifact_integrity_not_ready', message: 'Artifact integrity migration is required' }
  }
  return { status: 500, code: 'agent_execution_failed', message: 'No fue posible completar la ejecución del agente' }
}

function isMissingControlPlane(error: { code?: string; message?: string } | null) {
  return error?.code === '42P01' || Boolean(error?.message?.includes('agent_runs'))
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request', code: 'invalid_json' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid agent request', code: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const profile = getAgentProfile(parsed.data.agentId)
  if (!profile) {
    return NextResponse.json({ error: 'Unknown agent', code: 'unknown_agent' }, { status: 404 })
  }

  const prepared = prepareAgentInput(parsed.data.task, parsed.data.context)
  if (prepared.task.length < 10) {
    return NextResponse.json({ error: 'Task is empty after security processing', code: 'invalid_task' }, { status: 400 })
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (membershipError || !membership?.organization_id) {
    return NextResponse.json(
      { error: 'An organization membership is required', code: 'organization_required' },
      { status: 403 },
    )
  }

  const organizationId = membership.organization_id

  if (parsed.data.caseId) {
    const { data: complianceCase } = await supabase
      .from('compliance_cases')
      .select('id')
      .eq('id', parsed.data.caseId)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (!complianceCase) {
      return NextResponse.json({ error: 'Compliance case not found', code: 'case_not_found' }, { status: 404 })
    }
  }

  const quotaResult = await supabase.rpc('agent_quota_status', { target_organization: organizationId })
  if (quotaResult.error) {
    if (isMissingControlPlane(quotaResult.error)) {
      return NextResponse.json(
        { error: 'Agent Control Plane migration is required', code: 'control_plane_not_ready' },
        { status: 503 },
      )
    }
    console.error('[agents/run] quota check failed', quotaResult.error.code)
    return NextResponse.json({ error: 'Unable to verify agent quota', code: 'quota_check_failed' }, { status: 503 })
  }

  const quota = Array.isArray(quotaResult.data) ? quotaResult.data[0] : quotaResult.data
  if (quota && quota.allowed === false) {
    return NextResponse.json(
      { error: 'Agent execution quota exceeded', code: quota.reason || 'quota_exceeded', quota },
      { status: 429 },
    )
  }

  const startedAt = Date.now()
  const { data: run, error: runInsertError } = await supabase
    .from('agent_runs')
    .insert({
      organization_id: organizationId,
      case_id: parsed.data.caseId || null,
      user_id: user.id,
      agent_id: parsed.data.agentId,
      status: 'running',
      task: prepared.task,
      context_text: prepared.context || null,
      input_payload: {
        taskLength: prepared.task.length,
        contextLength: prepared.context.length,
        securityWarnings: prepared.warnings,
        injectionIndicators: prepared.injectionIndicators,
        secretsRedacted: prepared.secretsRedacted,
      },
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (runInsertError || !run) {
    if (isMissingControlPlane(runInsertError)) {
      return NextResponse.json(
        { error: 'Agent Control Plane migration is required', code: 'control_plane_not_ready' },
        { status: 503 },
      )
    }
    console.error('[agents/run] unable to create run', runInsertError?.code)
    return NextResponse.json({ error: 'Unable to create agent run', code: 'run_create_failed' }, { status: 500 })
  }

  try {
    const result = await runAgent({
      agentId: parsed.data.agentId,
      task: prepared.task,
      context: prepared.context,
      userId: user.id,
    })
    const elapsedMs = Date.now() - startedAt

    const { error: runUpdateError } = await supabase
      .from('agent_runs')
      .update({
        status: 'pending_review',
        output_payload: result.output,
        output_text: result.outputText,
        response_id: result.responseId,
        model: result.model,
        prompt_version: result.promptVersion,
        schema_version: result.schemaVersion,
        input_tokens: result.usage.inputTokens,
        output_tokens: result.usage.outputTokens,
        total_tokens: result.usage.totalTokens,
        elapsed_ms: elapsedMs,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', run.id)

    if (runUpdateError) console.error('[agents/run] unable to finalize run', runUpdateError.code)

    const { data: artifact, error: artifactError } = await supabase
      .from('agent_artifacts')
      .insert({
        organization_id: organizationId,
        case_id: parsed.data.caseId || null,
        run_id: run.id,
        artifact_type: parsed.data.agentId,
        title: `${profile.name}: ${prepared.task.slice(0, 120)}`,
        content: result.output,
        source_refs: [],
        status: 'pending_review',
        created_by: user.id,
      })
      .select('id, lineage_id, version, content_hash, integrity_version')
      .single()

    if (artifactError || !artifact) {
      const migrationPending = artifactError?.code === 'PGRST204'
        || artifactError?.code === '42703'
        || artifactError?.message?.includes('content_hash')
      if (migrationPending) throw new Error('artifact_integrity_migration_required')
      console.error('[agents/run] unable to create artifact', artifactError?.code)
    }

    return NextResponse.json({
      runId: run.id,
      artifactId: artifact?.id || null,
      artifactIntegrity: artifact ? {
        lineageId: artifact.lineage_id,
        version: artifact.version,
        contentHash: artifact.content_hash,
        integrityVersion: artifact.integrity_version,
      } : null,
      agent: profile,
      result,
      elapsedMs,
      reviewRequired: true,
      status: 'pending_review',
      security: {
        warnings: prepared.warnings,
        injectionIndicators: prepared.injectionIndicators,
        secretsRedacted: prepared.secretsRedacted,
      },
    })
  } catch (error) {
    const elapsedMs = Date.now() - startedAt
    const exposed = publicError(error)

    await supabase
      .from('agent_runs')
      .update({
        status: 'failed',
        error_code: exposed.code,
        error_message: exposed.message,
        elapsed_ms: elapsedMs,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', run.id)

    console.error('[agents/run]', exposed.code, error instanceof Error ? error.name : 'unknown')
    return NextResponse.json({ error: exposed.message, code: exposed.code, runId: run.id }, { status: exposed.status })
  }
}
