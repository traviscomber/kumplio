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

  const [missions, controls, evidence, risks, documents, playbooks] = await Promise.all([
    supabase.from('missions').select('id,title,objective,status').eq('organization_id', organizationId).or(`title.ilike.${pattern},objective.ilike.${pattern}`).limit(8),
    supabase.from('controls').select('id,name,description,status').eq('organization_id', organizationId).or(`name.ilike.${pattern},description.ilike.${pattern}`).limit(8),
    supabase.from('evidence').select('id,title,description,status').eq('organization_id', organizationId).or(`title.ilike.${pattern},description.ilike.${pattern}`).limit(8),
    supabase.from('risks').select('id,title,description,status').eq('organization_id', organizationId).or(`title.ilike.${pattern},description.ilike.${pattern}`).limit(8),
    supabase.from('documents').select('id,name,file_name,status').eq('organization_id', organizationId).or(`name.ilike.${pattern},file_name.ilike.${pattern}`).limit(8),
    supabase.from('mission_playbooks').select('id,name,objective,vertical').eq('status', 'published').or(`name.ilike.${pattern},objective.ilike.${pattern}`).limit(8),
  ])

  const results: SearchItem[] = [
    ...(missions.data || []).map((row) => ({ id: row.id, type: 'mission', title: row.title, subtitle: row.objective || row.status, href: `/missions/${row.id}` })),
    ...(controls.data || []).map((row) => ({ id: row.id, type: 'control', title: row.name, subtitle: row.description || row.status || 'Control', href: `/entities/control/${row.id}` })),
    ...(evidence.data || []).map((row) => ({ id: row.id, type: 'evidence', title: row.title, subtitle: row.description || row.status || 'Evidencia', href: `/entities/evidence/${row.id}` })),
    ...(risks.data || []).map((row) => ({ id: row.id, type: 'risk', title: row.title, subtitle: row.description || row.status || 'Riesgo', href: `/entities/risk/${row.id}` })),
    ...(documents.data || []).map((row) => ({ id: row.id, type: 'document', title: row.name || row.file_name || 'Documento', subtitle: row.file_name || row.status || 'Documento', href: `/entities/document/${row.id}` })),
    ...(playbooks.data || []).map((row) => ({ id: row.id, type: 'playbook', title: row.name, subtitle: row.objective || row.vertical || 'Playbook', href: `/entities/playbook/${row.id}` })),
  ]

  return NextResponse.json({ results })
}
