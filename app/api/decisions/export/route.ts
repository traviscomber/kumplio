import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess, listOrganizationDecisions } from '@/lib/compliance/accountability/workspace-access'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) return NextResponse.json({ error: 'Sin organización' }, { status: 403 })

  const decisions = await listOrganizationDecisions(admin, access.organizationId)
  const rows = [
    ['id', 'mision', 'titulo', 'prioridad', 'estado', 'responsable', 'solicitada', 'resuelta', 'justificacion'],
    ...decisions.map((item) => [
      item.id,
      item.missionTitle,
      item.title,
      item.priority,
      item.status,
      item.assignedTo || '',
      item.requestedAt,
      item.resolvedAt || '',
      item.resolutionNotes || '',
    ]),
  ]

  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n')
  const stamp = new Date().toISOString().slice(0, 10)

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kumplio-decisiones-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}
