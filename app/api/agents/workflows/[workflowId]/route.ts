import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) return NextResponse.json({ error: 'Organization required' }, { status: 403 })

  const { data: workflow, error } = await supabase
    .from('agent_workflows')
    .select('*, compliance_cases(id, title, description, status, priority)')
    .eq('id', workflowId)
    .eq('organization_id', membership.organization_id)
    .maybeSingle()
  if (error || !workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })

  const { data: stages } = await supabase
    .from('agent_workflow_stages')
    .select('id, stage_index, agent_id, status, run_id, output_artifact_id, attempt_count, max_attempts, context_snapshot, started_at, completed_at, updated_at')
    .eq('workflow_id', workflowId)
    .order('stage_index', { ascending: true })

  const artifactIds = (stages || []).map((stage) => stage.output_artifact_id).filter(Boolean)
  const { data: artifacts } = artifactIds.length
    ? await supabase.from('agent_artifacts').select('id, run_id, artifact_type, title, content, status, created_at').in('id', artifactIds)
    : { data: [] as any[] }

  return NextResponse.json({ workflow, stages: stages || [], artifacts: artifacts || [] })
}
