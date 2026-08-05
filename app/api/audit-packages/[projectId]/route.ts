import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLatestAuditPackage } from '@/lib/compliance/operations/vendor-audit-marketplace'

type RouteContext = { params: Promise<{ projectId: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'Organización no disponible.' }, { status: 403 })
  }

  const { data: project } = await admin
    .from('projects')
    .select('id,name,organization_id')
    .eq('id', projectId)
    .eq('organization_id', membership.organization_id)
    .maybeSingle()

  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado.' }, { status: 404 })
  }

  const auditPackage = await getLatestAuditPackage(
    admin,
    membership.organization_id,
    projectId,
  )

  if (!auditPackage) {
    return NextResponse.json({ error: 'Todavía no existe un paquete de auditoría.' }, { status: 404 })
  }

  const payload = {
    schemaVersion: 'kumplio.audit-package.v1',
    exportedAt: new Date().toISOString(),
    organizationId: membership.organization_id,
    project: {
      id: project.id,
      name: project.name,
    },
    package: auditPackage,
  }

  const safeName = String(project.name || 'auditoria')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'auditoria'

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="kumplio-${safeName}-audit-package.json"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
