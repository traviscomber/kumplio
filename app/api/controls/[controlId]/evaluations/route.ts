import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const isoDate = /^\d{4}-\d{2}-\d{2}$/

const createEvaluationSchema = z.object({
  evaluationType: z.enum(['design', 'operating']),
  result: z.enum(['effective', 'partial', 'ineffective', 'not_applicable']),
  summary: z.string().trim().min(10).max(4000),
  sampleSize: z.number().int().min(1).max(1_000_000).nullable().optional(),
  periodStart: z.string().regex(isoDate).nullable().optional(),
  periodEnd: z.string().regex(isoDate).nullable().optional(),
  caseId: z.string().uuid().nullable().optional(),
  evidenceIds: z.array(z.string().uuid()).max(100).default([]),
}).superRefine((value, context) => {
  if (value.periodStart && value.periodEnd && value.periodEnd < value.periodStart) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['periodEnd'],
      message: 'La fecha final no puede ser anterior a la fecha inicial.',
    })
  }
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ controlId: string }> },
) {
  const { controlId } = await params
  const controlIdResult = z.string().uuid().safeParse(controlId)
  if (!controlIdResult.success) {
    return NextResponse.json({ error: 'Invalid control identifier', code: 'invalid_control_id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request', code: 'invalid_json' }, { status: 400 })
  }

  const parsed = createEvaluationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid control evaluation request', code: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'Organization required', code: 'organization_required' }, { status: 403 })
  }

  const organizationId = membership.organization_id
  const { data: control } = await supabase
    .from('controls')
    .select('id, project_id')
    .eq('id', controlIdResult.data)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!control?.project_id) {
    return NextResponse.json({ error: 'Control not found', code: 'control_not_found' }, { status: 404 })
  }

  if (parsed.data.caseId) {
    const { data: complianceCase } = await supabase
      .from('compliance_cases')
      .select('id')
      .eq('id', parsed.data.caseId)
      .eq('organization_id', organizationId)
      .eq('project_id', control.project_id)
      .maybeSingle()

    if (!complianceCase) {
      return NextResponse.json({ error: 'Case not found in the control project', code: 'case_not_found' }, { status: 404 })
    }
  }

  const evidenceIds = [...new Set(parsed.data.evidenceIds)]
  if (evidenceIds.length) {
    const { data: links, error: linkError } = await supabase
      .from('control_evidence')
      .select('evidence_id')
      .eq('control_id', controlIdResult.data)
      .eq('organization_id', organizationId)
      .eq('project_id', control.project_id)
      .in('evidence_id', evidenceIds)

    if (linkError || (links || []).length !== evidenceIds.length) {
      return NextResponse.json(
        { error: 'All evidence must already be linked to this control', code: 'evidence_not_linked' },
        { status: 409 },
      )
    }
  }

  try {
    const admin = createAdminClient()
    const { data: evaluationId, error } = await admin.rpc('create_control_evaluation_record', {
      p_actor_id: user.id,
      p_organization_id: organizationId,
      p_control_id: controlIdResult.data,
      p_case_id: parsed.data.caseId || null,
      p_evaluation_type: parsed.data.evaluationType,
      p_result: parsed.data.result,
      p_summary: parsed.data.summary,
      p_sample_size: parsed.data.sampleSize || null,
      p_period_start: parsed.data.periodStart || null,
      p_period_end: parsed.data.periodEnd || null,
      p_evidence_ids: evidenceIds,
    })

    if (error || !evaluationId) {
      console.error('[controls/evaluations/create]', error?.code)
      return NextResponse.json({ error: 'Unable to record control evaluation', code: 'evaluation_create_failed' }, { status: 500 })
    }

    return NextResponse.json({ evaluationId }, { status: 201 })
  } catch (error) {
    console.error('[controls/evaluations/configuration]', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Control assurance service is not configured', code: 'assurance_service_unavailable' }, { status: 503 })
  }
}
