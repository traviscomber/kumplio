import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const createEvidenceSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().trim().min(3).max(180),
  description: z.string().trim().max(3000).nullable().optional(),
  evidenceType: z.enum(['document', 'system_report', 'log', 'screenshot', 'attestation', 'record', 'other']),
  source: z.string().trim().max(500).nullable().optional(),
  documentId: z.string().uuid().nullable().optional(),
  issuedAt: z.string().datetime({ offset: true }).nullable().optional(),
  periodStart: z.string().date().nullable().optional(),
  periodEnd: z.string().date().nullable().optional(),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
  integrityHash: z.string().trim().max(256).nullable().optional(),
  confidentiality: z.enum(['internal', 'confidential', 'restricted']),
  controlId: z.string().uuid().nullable().optional(),
})

export async function POST(request: NextRequest) {
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

  const parsed = createEvidenceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid evidence request', code: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  if (parsed.data.periodStart && parsed.data.periodEnd && parsed.data.periodEnd < parsed.data.periodStart) {
    return NextResponse.json({ error: 'Evidence period end cannot precede period start', code: 'invalid_period' }, { status: 400 })
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
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', parsed.data.projectId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!project) {
    return NextResponse.json({ error: 'Project not found', code: 'project_not_found' }, { status: 404 })
  }

  if (parsed.data.documentId) {
    const { data: document } = await supabase
      .from('documents')
      .select('id')
      .eq('id', parsed.data.documentId)
      .eq('project_id', parsed.data.projectId)
      .maybeSingle()

    if (!document) {
      return NextResponse.json({ error: 'Document not found in this project', code: 'document_not_found' }, { status: 404 })
    }
  }

  if (parsed.data.controlId) {
    const { data: control } = await supabase
      .from('controls')
      .select('id')
      .eq('id', parsed.data.controlId)
      .eq('project_id', parsed.data.projectId)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (!control) {
      return NextResponse.json({ error: 'Control not found in this project', code: 'control_not_found' }, { status: 404 })
    }
  }

  try {
    const admin = createAdminClient()
    const { data: evidenceId, error } = await admin.rpc('create_evidence_record', {
      p_actor_id: user.id,
      p_organization_id: organizationId,
      p_project_id: parsed.data.projectId,
      p_name: parsed.data.name,
      p_description: parsed.data.description || null,
      p_evidence_type: parsed.data.evidenceType,
      p_source: parsed.data.source || null,
      p_document_id: parsed.data.documentId || null,
      p_issued_at: parsed.data.issuedAt || null,
      p_period_start: parsed.data.periodStart || null,
      p_period_end: parsed.data.periodEnd || null,
      p_expires_at: parsed.data.expiresAt || null,
      p_integrity_hash: parsed.data.integrityHash || null,
      p_confidentiality: parsed.data.confidentiality,
      p_control_id: parsed.data.controlId || null,
    })

    if (error || !evidenceId) {
      console.error('[evidence/create]', error?.code)
      return NextResponse.json({ error: 'Unable to create evidence', code: 'evidence_create_failed' }, { status: 500 })
    }

    return NextResponse.json({ evidenceId }, { status: 201 })
  } catch (error) {
    console.error('[evidence/create/configuration]', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Evidence service is not configured', code: 'evidence_service_unavailable' }, { status: 503 })
  }
}
