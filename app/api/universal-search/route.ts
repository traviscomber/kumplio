import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type SearchItem = {
  id: string
  type: string
  title: string
  subtitle: string
  href: string
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() || ''
  if (query.length < 2) return NextResponse.json({ results: [] })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) return NextResponse.json({ results: [] })
  const organizationId = membership.organization_id
  const pattern = `%${query.replace(/[%_]/g, '')}%`

  const { data: projects } = await supabase.from('projects').select('id').eq('organization_id', organizationId)
  const projectIds = (projects || []).map((project) => project.id)

  const [missions, controls, evidence, playbooks] = await Promise.all([
    supabase.from('missions').select('id,title,objective,status').eq('organization_id', organizationId).or(`title.ilike.${pattern},objective.ilike.${pattern}`).limit(8),
    supabase.from('controls').select('id,name,description,status').eq('organization_id', organizationId).or(`name.ilike.${pattern},description.ilike.${pattern}`).limit(8),
    supabase.from('evidence').select('id,name,description,validation_status').eq('organization_id', organizationId).or(`name.ilike.${pattern},description.ilike.${pattern}`).limit(8),
    supabase.from('mission_playbooks').select('id,name,objective,vertical').eq('status', 'published').or(`name.ilike.${pattern},objective.ilike.${pattern}`).limit(8),
  ])

  const [risks, documents] = projectIds.length
    ? await Promise.all([
        supabase.from('risks').select('id,risk_description,risk_score,impact,mitigation_status').in('project_id', projectIds).ilike('risk_description', pattern).limit(8),
        supabase.from('documents').select('id,name,document_type,status').in('project_id', projectIds).ilike('name', pattern).limit(8),
      ])
    : [{ data: [] }, { data: [] }]

  const results: SearchItem[] = [
    ...(missions.data || []).map((row) => ({ id: row.id, type: 'mission', title: row.title, subtitle: row.objective || row.status, href: `/missions/${row.id}` })),
    ...(controls.data || []).map((row) => ({ id: row.id, type: 'control', title: row.name, subtitle: row.description || row.status || 'Control', href: `/entities/control/${row.id}` })),
    ...(evidence.data || []).map((row) => ({ id: row.id, type: 'evidence', title: row.name, subtitle: row.description || row.validation_status || 'Evidencia', href: `/entities/evidence/${row.id}` })),
    ...((risks.data || []) as Array<{ id: string; risk_description: string; risk_score: number | null; impact: string | null; mitigation_status: string | null }>).map((row) => ({ id: row.id, type: 'risk', title: row.risk_description, subtitle: row.impact || row.mitigation_status || (row.risk_score == null ? 'Riesgo' : `Score ${row.risk_score}`), href: `/entities/risk/${row.id}` })),
    ...((documents.data || []) as Array<{ id: string; name: string; document_type: string | null; status: string | null }>).map((row) => ({ id: row.id, type: 'document', title: row.name, subtitle: row.document_type || row.status || 'Documento', href: `/entities/document/${row.id}` })),
    ...(playbooks.data || []).map((row) => ({ id: row.id, type: 'playbook', title: row.name, subtitle: row.objective || row.vertical || 'Playbook', href: `/entities/playbook/${row.id}` })),
  ]

  return NextResponse.json({ results })
}
