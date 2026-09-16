import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { buildApprovedOutcomeSnapshot } from '@/lib/agents/outcome-snapshot'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const emptyChecklist = {
  evidence_reviewed: false,
  limitations_understood: false,
  outcome_supported: false,
}

const reviewSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'changes_requested', 'commented']),
  comment: z.string().trim().max(5000).optional(),
  checklist: z.object({
    evidence_reviewed: z.boolean().default(false),
    limitations_understood: z.boolean().default(false),
    outcome_supported: z.boolean().default(false),
  }).optional().default(emptyChecklist),
}).superRefine((value, context) => {
  if (
    ['approved', 'rejected', 'changes_requested'].includes(value.decision)
    && (!value.comment || value.comment.length < 3)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['comment'],
      message: 'Registra una justificación breve para la decisión.',
    })
  }

  if (
    value.decision === 'approved'
    && (!value.checklist.evidence_reviewed
      || !value.checklist.limitations_understood
      || !value.checklist.outcome_supported)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['checklist'],
      message: 'Confirma evidencia, limitaciones y respaldo antes de aprobar.',
    })
  }
})

export async function POST(req: NextRequest, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params
  if (!z.string().uuid().safeParse(runId).success) {
    return NextResponse.json({ error: 'Identificador de ejecución inválido', code: 'invalid_run_id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Debes iniciar sesión', code: 'authentication_required' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'La solicitud no contiene JSON válido', code: 'invalid_json' }, { status: 400 })
  }

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message
    return NextResponse.json({
      error: firstIssue || 'La revisión no cumple el contrato requerido',
      code: 'invalid_review',
      details: parsed.error.flatten(),
    }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'Necesitas una membresía activa', code: 'organization_required' }, { status: 403 })
  }

  const organizationId = membership.organization_id
  const admin = createAdminClient()
  let outcomeSnapshot: ReturnType<typeof buildApprovedOutcomeSnapshot> | null = null

  if (parsed.data.decision === 'approved') {
    const { data: stage, error: stageError } = await admin
      .from('agent_workflow_stages')
      .select('workflow_id, stage_index')
      .eq('run_id', runId)
      .eq('organization_id', organizationId)
      .limit(1)
      .maybeSingle()

    if (stageError) {
      console.error('[agents/review] snapshot stage lookup failed', stageError.code)
      return NextResponse.json({ error: 'No fue posible preparar la aprobación', code: 'outcome_snapshot_prepare_failed' }, { status: 500 })
    }

    if (stage?.workflow_id) {
      const { data: workflow, error: workflowError } = await admin
        .from('agent_workflows')
        .select('id, case_id, total_stages, compliance_cases(title, description)')
        .eq('id', stage.workflow_id)
        .eq('organization_id', organizationId)
        .maybeSingle()

      if (workflowError) {
        console.error('[agents/review] snapshot workflow lookup failed', workflowError.code)
        return NextResponse.json({ error: 'No fue posible preparar la aprobación', code: 'outcome_snapshot_prepare_failed' }, { status: 500 })
      }

      const isFinalStage = Boolean(
        workflow
        && Number(stage.stage_index) >= Number(workflow.total_stages) - 1,
      )

      if (workflow && isFinalStage) {
        const { data: stages, error: stagesError } = await admin
          .from('agent_workflow_stages')
          .select('id, stage_index, run_id, status, output_artifact_id')
          .eq('workflow_id', workflow.id)
          .eq('organization_id', organizationId)
          .order('stage_index', { ascending: true })

        if (stagesError) {
          console.error('[agents/review] snapshot stages failed', stagesError.code)
          return NextResponse.json({ error: 'No fue posible preparar el resultado final', code: 'outcome_snapshot_prepare_failed' }, { status: 500 })
        }

        const artifactIds = (stages || [])
          .map((item) => item.output_artifact_id)
          .filter((id): id is string => Boolean(id))
        const runIds = (stages || [])
          .map((item) => item.run_id)
          .filter((id): id is string => Boolean(id))

        const [artifactsResult, reviewsResult] = await Promise.all([
          artifactIds.length
            ? admin
                .from('agent_artifacts')
                .select('id, artifact_type, content, status')
                .eq('organization_id', organizationId)
                .in('id', artifactIds)
            : Promise.resolve({ data: [] as Array<Record<string, unknown>>, error: null }),
          runIds.length
            ? admin
                .from('agent_reviews')
                .select('id, run_id, decision, comment, created_at')
                .eq('organization_id', organizationId)
                .in('run_id', runIds)
                .order('created_at', { ascending: true })
            : Promise.resolve({ data: [] as Array<Record<string, unknown>>, error: null }),
        ])

        if (artifactsResult.error || reviewsResult.error) {
          console.error(
            '[agents/review] snapshot sources failed',
            artifactsResult.error?.code || reviewsResult.error?.code || 'unknown',
          )
          return NextResponse.json({ error: 'No fue posible preparar el resultado final', code: 'outcome_snapshot_prepare_failed' }, { status: 500 })
        }

        const caseRecord = Array.isArray(workflow.compliance_cases)
          ? workflow.compliance_cases[0]
          : workflow.compliance_cases

        outcomeSnapshot = buildApprovedOutcomeSnapshot({
          goal: caseRecord?.title || caseRecord?.description || null,
          artifacts: artifactsResult.data || [],
          stages: stages || [],
          reviews: reviewsResult.data || [],
          finalRunId: runId,
          finalReviewComment: parsed.data.comment || null,
          reviewedAt: new Date().toISOString(),
        })
      }
    }
  }

  const { data, error } = await admin.rpc('review_agent_workflow_run', {
    p_actor_id: user.id,
    p_organization_id: organizationId,
    p_run_id: runId,
    p_decision: parsed.data.decision,
    p_comment: parsed.data.comment || null,
    p_checklist: parsed.data.checklist,
    p_outcome_snapshot: outcomeSnapshot,
  })

  if (error) {
    const message = error.message || ''
    const code = error.code === '23505' ? 'already_reviewed'
      : message.includes('not_found') ? 'run_not_found'
        : message.includes('not_reviewable') ? 'run_not_reviewable'
          : message.includes('approval_checklist_required') ? 'approval_checklist_required'
            : message.includes('comment_required') ? 'review_comment_required'
              : message.includes('review_forbidden') ? 'review_forbidden'
                : message.includes('outcome_snapshot_stale') ? 'outcome_snapshot_stale'
                  : message.includes('outcome_snapshot') ? 'outcome_snapshot_invalid'
                    : 'review_transaction_failed'
    const status = code === 'run_not_found' ? 404
      : code === 'run_not_reviewable' || code === 'already_reviewed' || code === 'outcome_snapshot_stale' ? 409
        : code === 'review_forbidden' ? 403
          : code === 'review_comment_required' || code === 'approval_checklist_required' ? 400
            : 500
    const publicMessage = code === 'run_not_found' ? 'La ejecución no existe'
      : code === 'run_not_reviewable' ? 'La ejecución ya no admite esta revisión'
        : code === 'already_reviewed' ? 'Esta ejecución ya recibió una decisión final'
          : code === 'review_forbidden' ? 'Tu rol no permite aprobar este resultado'
            : code === 'approval_checklist_required' ? 'Confirma evidencia, limitaciones y respaldo antes de aprobar'
              : code === 'review_comment_required' ? 'Registra una justificación breve para la decisión'
                : code === 'outcome_snapshot_stale' ? 'El resultado cambió durante la revisión. Recarga antes de aprobar nuevamente.'
                  : code === 'outcome_snapshot_invalid' ? 'No fue posible congelar el resultado aprobado de forma segura'
                    : 'No fue posible guardar la revisión de forma atómica'

    console.error('[agents/review]', error.code, code)
    return NextResponse.json({ error: publicMessage, code }, { status })
  }

  return NextResponse.json(data)
}
