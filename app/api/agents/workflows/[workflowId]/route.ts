import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getWorkflowDefinition } from '@/lib/agents/orchestration'
import { buildComplianceOutcome } from '@/lib/agents/outcome-contract'
import { evaluateComplianceOutcome } from '@/lib/agents/evaluator'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await context.params
  if (!z.string().uuid().safeParse(workflowId).success) {
    return NextResponse.json({ error: 'Invalid workflow id', code: 'invalid_workflow_id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) return NextResponse.json({ error: 'Organization required' }, { status: 403 })

  const organizationId = membership.organization_id
  const { data: workflow, error } = await supabase
    .from('agent_workflows')
    .select('id, organization_id, case_id, workflow_type, status, current_stage, total_stages, input_payload, final_payload, error_code, error_message, started_at, completed_at, created_at, updated_at, compliance_cases(id, title, description, status, priority)')
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error || !workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })

  const [stagesResult, snapshotResult] = await Promise.all([
    supabase
      .from('agent_workflow_stages')
      .select('id, stage_index, agent_id, status, run_id, source_artifact_ids, output_artifact_id, attempt_count, max_attempts, task_template, context_snapshot, started_at, completed_at, updated_at')
      .eq('workflow_id', workflowId)
      .eq('organization_id', organizationId)
      .order('stage_index', { ascending: true }),
    supabase
      .from('agent_workflow_outcome_snapshots')
      .select('id, review_id, reviewer_id, contract_version, outcome, quality, content_hash, frozen_at')
      .eq('workflow_id', workflowId)
      .eq('organization_id', organizationId)
      .order('frozen_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const stages = stagesResult.data || []
  const artifactIds = stages.map((stage) => stage.output_artifact_id).filter((id): id is string => Boolean(id))
  const runIds = stages.map((stage) => stage.run_id).filter((id): id is string => Boolean(id))

  const [artifactsResult, reviewsResult] = await Promise.all([
    artifactIds.length
      ? supabase
          .from('agent_artifacts')
          .select('id, run_id, artifact_type, title, version, content, source_refs, confidence, status, created_at')
          .eq('organization_id', organizationId)
          .in('id', artifactIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    runIds.length
      ? supabase
          .from('agent_reviews')
          .select('id, run_id, artifact_id, reviewer_id, decision, comment, checklist, created_at')
          .eq('organization_id', organizationId)
          .in('run_id', runIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ])

  const caseRecord = Array.isArray(workflow.compliance_cases)
    ? workflow.compliance_cases[0]
    : workflow.compliance_cases
  const artifacts = artifactsResult.data || []
  const reviews = reviewsResult.data || []
  const frozenSnapshot = snapshotResult.data || null
  const liveOutcome = frozenSnapshot ? null : buildComplianceOutcome({
    goal: caseRecord?.title || caseRecord?.description || null,
    workflowStatus: workflow.status,
    artifacts,
    stages: stages || [],
    reviews,
  })
  const outcome = frozenSnapshot?.outcome || liveOutcome
  const outcomeQuality = frozenSnapshot?.quality || (liveOutcome ? evaluateComplianceOutcome(liveOutcome) : null)

  return NextResponse.json({
    workflow,
    template: getWorkflowDefinition(workflow.workflow_type),
    stages,
    artifacts,
    reviews,
    outcome,
    outcomeQuality,
    outcomeSnapshot: frozenSnapshot ? {
      id: frozenSnapshot.id,
      frozen: true,
      contractVersion: frozenSnapshot.contract_version,
      reviewId: frozenSnapshot.review_id,
      reviewerId: frozenSnapshot.reviewer_id,
      frozenAt: frozenSnapshot.frozen_at,
      contentHash: frozenSnapshot.content_hash,
    } : {
      frozen: false,
      contractVersion: null,
      reviewId: null,
      reviewerId: null,
      frozenAt: null,
      contentHash: null,
      legacyFallback: workflow.status === 'completed',
    },
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
