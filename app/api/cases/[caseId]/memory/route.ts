import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(_: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Debes iniciar sesión.', code: 'authentication_required' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'No tienes una organización activa.', code: 'organization_required' }, { status: 403 })
  }

  if (!['owner', 'admin'].includes(membership.role || '')) {
    return NextResponse.json({ error: 'Solo propietarios y administradores pueden actualizar la memoria.', code: 'insufficient_role' }, { status: 403 })
  }

  const { data: complianceCase } = await supabase
    .from('compliance_cases')
    .select('id')
    .eq('id', caseId)
    .eq('organization_id', membership.organization_id)
    .maybeSingle()

  if (!complianceCase) {
    return NextResponse.json({ error: 'Expediente no encontrado.', code: 'case_not_found' }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('project_organization_operational_memory', {
    p_organization_id: membership.organization_id,
  })

  if (error) {
    console.error('[cases/memory/project]', error.code)
    return NextResponse.json({ error: 'No fue posible actualizar la Memoria Organizacional.', code: 'memory_projection_failed' }, { status: 500 })
  }

  return NextResponse.json({ projection: data })
}
