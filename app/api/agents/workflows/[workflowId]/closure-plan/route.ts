import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getIdentity() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, organizationId: null }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  return { supabase, user, organizationId: membership?.organization_id || null }
}

async function loadWorkflowContext(workflowId: string, organizationId: string) {
  const admin = createAdminClient()
  const { data: workflow, error } = await admin
    .from('agent_workflows')
    .select('id, case_id, status, total_stages, compliance_cases(id, project_id, title)')
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (error) throw new Error(`workflow_lookup_failed:${error.code}`)
  return workflow
}

export async function GET(_request: NextRequest, context: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await context.params
  if (!z.string().uuid().safeParse(workflowId).success) {
    return NextResponse.json({ error: 'Invalid workflow id', code: 'invalid_workflow_id' }, { status: 400 })
  }

  const { user, organizationId } = await getIdentity()
  if (!user) return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })
  if (!organizationId) return NextResponse.json({ error: 'Organization required', code: 'organization_required' }, { status: 403 })

  try {
    const workflow = await loadWorkflowContext(workflowId, organizationId)
    if (!workflow) return NextResponse.json({ error: 'Workflow not found', code: 'workflow_not_found' }, { status: 404 })

    const caseData = Array.isArray(workflow.compliance_cases) ? workflow.compliance_cases[0] : workflow.compliance_cases
    const projectId = caseData?.project_id || null
    const admin = createAdminClient()

    const { data: plan, error: planError } = await admin
      .from('compliance_action_plans')
      .select('id, title, description, status, priority, project_id, case_id, source_workflow_id, source_snapshot_id, source_contract_version, created_at, updated_at')
      .eq('organization_id', organizationId)
      .eq('source_workflow_id', workflowId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (planError) {
      console.error('[agents/closure-plan/read]', planError.code)
      return NextResponse.json({ error: 'Unable to load closure plan', code: 'closure_plan_read_failed' }, { status: 500 })
    }

    if (!plan) {
      return NextResponse.json({
        plan: null,
        tasks: [],
        availableEvidence: [],
        canMaterialize: workflow.status === 'completed',
      })
    }

    const [tasksResult, evidenceResult] = await Promise.all([
      admin
        .from('compliance_action_plan_tasks')
        .select('id, action_plan_id, title, description, status, priority, owner_role, target_label, sequence, dependencies, closure_criteria, evidence_requirements, verification_status, completion_note, completed_at, completed_by, verification_notes, verified_at, verified_by, source_outcome_action_index')
        .eq('action_plan_id', plan.id)
        .order('sequence', { ascending: true }),
      projectId
        ? admin
          .from('evidence')
          .select('id, name, evidence_type, validation_status, integrity_status, created_at')
          .eq('organization_id', organizationId)
          .eq('project_id', projectId)
          .eq('validation_status', 'accepted')
          .eq('integrity_status', 'verified')
          .order('created_at', { ascending: false })
          .limit(100)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (tasksResult.error || evidenceResult.error) {
      console.error('[agents/closure-plan/context]', tasksResult.error?.code || evidenceResult.error?.code)
      return NextResponse.json({ error: 'Unable to load closure plan context', code: 'closure_plan_context_failed' }, { status: 500 })
    }

    const tasks = tasksResult.data || []
    const taskIds = tasks.map((task) => task.id)
    let links: Array<{ task_id: string; evidence_id: string }> = []
    if (taskIds.length) {
      const { data, error } = await admin
        .from('compliance_action_task_evidence')
        .select('task_id, evidence_id')
        .eq('organization_id', organizationId)
        .in('task_id', taskIds)
      if (error) {
        console.error('[agents/closure-plan/evidence-links]', error.code)
        return NextResponse.json({ error: 'Unable to load closure evidence links', code: 'closure_plan_evidence_failed' }, { status: 500 })
      }
      links = data || []
    }

    const evidenceByTask = links.reduce<Record<string, string[]>>((acc, link) => {
      ;(acc[link.task_id] ||= []).push(link.evidence_id)
      return acc
    }, {})

    const automation = buildClosureAutomationSummary(tasks, evidenceResult.data || [], evidenceByTask)
    const enqueuedPreparations: string[] = []
    for (const preparation of automation.safePreparations.filter((item) => item.executable)) {
      const { error: enqueueError } = await admin.rpc('enqueue_outcome_closure_preparation', {
        p_actor_id: user.id,
        p_organization_id: organizationId,
        p_task_id: preparation.taskId,
        p_preparation_type: preparation.action,
      })
      if (enqueueError) {
        console.error('[agents/closure-plan/automation-enqueue]', enqueueError.code)
        continue
      }
      enqueuedPreparations.push(preparation.taskId)
    }

    return NextResponse.json({
      plan,
      tasks: tasks.map((task) => ({ ...task, evidenceIds: evidenceByTask[task.id] || [] })),
      availableEvidence: evidenceResult.data || [],
      automation: { ...automation, enqueuedPreparations },
      canMaterialize: false,
    })
  } catch (error) {
    console.error('[agents/closure-plan/read/configuration]', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Closure plan service unavailable', code: 'closure_plan_service_unavailable' }, { status: 503 })
  }
}

export async function POST(_request: NextRequest, context: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await context.params
  if (!z.string().uuid().safeParse(workflowId).success) {
    return NextResponse.json({ error: 'Invalid workflow id', code: 'invalid_workflow_id' }, { status: 400 })
  }

  const { user, organizationId } = await getIdentity()
  if (!user) return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })
  if (!organizationId) return NextResponse.json({ error: 'Organization required', code: 'organization_required' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('materialize_outcome_closure_plan', {
    p_actor_id: user.id,
    p_organization_id: organizationId,
    p_workflow_id: workflowId,
  })

  if (error) {
    const message = error.message || ''
    const code = message.includes('workflow_not_found') ? 'workflow_not_found'
      : message.includes('workflow_not_completed') ? 'workflow_not_completed'
        : message.includes('approved_outcome_snapshot_required') ? 'approved_outcome_snapshot_required'
          : message.includes('approved_human_review_required') ? 'approved_human_review_required'
            : message.includes('outcome_has_no_actions') ? 'outcome_has_no_actions'
              : 'closure_plan_create_failed'
    const status = code === 'workflow_not_found' ? 404 : code === 'outcome_has_no_actions' ? 422 : code === 'closure_plan_create_failed' ? 500 : 409
    if (status >= 500) console.error('[agents/closure-plan/create]', error.code)
    return NextResponse.json({ error: 'Unable to activate verified closure plan', code }, { status })
  }

  return NextResponse.json({ closurePlan: data }, { status: data?.created ? 201 : 200 })
}


function buildClosureAutomationSummary(
  tasks: Array<{ id: string; verification_status: string; status: string; closure_criteria?: unknown; evidence_requirements?: unknown }>,
  evidence: Array<{ id: string; validation_status: string; integrity_status: string }>,
  evidenceByTask: Record<string, string[]>,
) {
  const active = tasks.filter((task) => task.status !== 'cancelled')
  const needsHuman = active.filter((task) => ['ready_for_review', 'changes_requested'].includes(task.verification_status)).length
  const waitingForEvidence = active.filter((task) => task.verification_status === 'pending_evidence').length
  const verified = active.filter((task) => task.verification_status === 'verified').length
  const trustedEvidenceIds = new Set(evidence.filter((item) => item.validation_status === 'accepted' && item.integrity_status === 'verified').map((item) => item.id))
  const preparedAutomatically = active.filter((task) => {
    if (task.verification_status !== 'pending_evidence') return false
    const linked = evidenceByTask[task.id] || []
    return linked.some((id) => trustedEvidenceIds.has(id))
  }).length
  const safePreparations = active.filter((task) => task.verification_status === 'pending_evidence').map((task) => ({
    taskId: task.id,
    action: 'prepare_evidence_context',
    executable: (evidenceByTask[task.id] || []).some((id) => trustedEvidenceIds.has(id)),
    requiresHumanVerification: true,
  }))
  return {
    mode: 'human_controlled_autopilot',
    verified,
    needsHuman,
    waitingForEvidence,
    preparedAutomatically,
    safePreparations,
    canContinueWithoutHuman: needsHuman === 0 && waitingForEvidence === 0 && verified < active.length,
    guardrail: 'No action is verified automatically. Evidence integrity and required human review remain mandatory.',
  }
}
