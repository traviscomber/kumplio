import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('review_agent_workflow_run', {
    p_actor_id: user.id,
    p_organization_id: membership.organization_id,
    p_run_id: runId,
    p_decision: parsed.data.decision,
    p_comment: parsed.data.comment || null,
    p_checklist: parsed.data.checklist,
  })

  if (error) {
    const message = error.message || ''
    const code = message.includes('not_found') ? 'run_not_found'
      : message.includes('not_reviewable') ? 'run_not_reviewable'
        : message.includes('approval_checklist_required') ? 'approval_checklist_required'
          : message.includes('comment_required') ? 'review_comment_required'
            : message.includes('review_forbidden') ? 'review_forbidden'
              : 'review_transaction_failed'
    const status = code === 'run_not_found' ? 404
      : code === 'run_not_reviewable' ? 409
        : code === 'review_forbidden' ? 403
          : code === 'review_comment_required' || code === 'approval_checklist_required' ? 400
            : 500
    const publicMessage = code === 'run_not_found' ? 'La ejecución no existe'
      : code === 'run_not_reviewable' ? 'La ejecución ya no admite esta revisión'
        : code === 'review_forbidden' ? 'Tu rol no permite aprobar este resultado'
          : code === 'approval_checklist_required' ? 'Confirma evidencia, limitaciones y respaldo antes de aprobar'
            : code === 'review_comment_required' ? 'Registra una justificación breve para la decisión'
              : 'No fue posible guardar la revisión de forma atómica'

    console.error('[agents/review]', error.code, code)
    return NextResponse.json({ error: publicMessage, code }, { status })
  }

  return NextResponse.json(data)
}
