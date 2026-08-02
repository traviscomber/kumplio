import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getWorkflowDefinition } from '@/lib/agents/orchestration'

export const runtime = 'nodejs'

const artifactSelect = 'id, run_id, artifact_type, title, version, content, source_refs, confidence, status, created_at, lineage_id, parent_artifact_id, content_hash, approved_by, approved_at, locked_at, superseded_by_artifact_id, superseded_at'

export async function GET(_request: Request, context: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await context.params
  if (!z.string().uuid().safeParse(workflowId).success) {
    return NextResponse.json({ error: 'Invalid workflow id', code: 'invalid_workflow_id' }, { status: 400 })
  }

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

  const organizationId = membership.organization_id
  const { data: workflow, error } = await supabase
    .from('agent_workflows')
    .select('id, organization_id, case_id, workflow_type, status, current_stage, total_stages, input_payload, final_payload, error_code, error_message, started_at, completed_at, created_at, updated_at, compliance_cases(id, title, description, status, priority)')
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error || !workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })

  const { data: stages } = await supabase
    .from('agent_workflow_stages')
    .select('id, stage_index, agent_id, status, run_id, source_artifact_ids, output_artifact_id, attempt_count, max_attempts, task_template, context_snapshot, started_at, completed_at, updated_at')
    .eq('workflow_id', workflowId)
    .eq('organization_id', organizationId)
    .order('stage_index', { ascending: true })

  const currentArtifactIds = (stages || [])
    .map((stage) => stage.output_artifact_id)
    .filter((id): id is string => Boolean(id))

  const { data: currentArtifacts, error: currentArtifactError } = currentArtifactIds.length
    ? await supabase
        .from('agent_artifacts')
        .select(artifactSelect)
        .eq('organization_id', organizationId)
        .in('id', currentArtifactIds)
    : { data: [] as Array<Record<string, unknown>>, error: null }

  if (currentArtifactError) {
    return NextResponse.json({ error: 'Unable to load workflow artifacts', code: 'artifact_query_failed' }, { status: 500 })
  }

  const lineageIds = [...new Set((currentArtifacts || [])
    .map((artifact) => artifact.lineage_id)
    .filter((id): id is string => Boolean(id)))]

  const { data: artifactVersions, error: versionError } = lineageIds.length
    ? await supabase
        .from('agent_artifacts')
        .select(artifactSelect)
        .eq('organization_id', organizationId)
        .in('lineage_id', lineageIds)
        .order('version', { ascending: false })
    : { data: [] as Array<Record<string, unknown>>, error: null }

  if (versionError) {
    return NextResponse.json({ error: 'Unable to load artifact versions', code: 'artifact_version_query_failed' }, { status: 500 })
  }

  const allRunIds = [...new Set([
    ...(stages || []).map((stage) => stage.run_id),
    ...(artifactVersions || []).map((artifact) => artifact.run_id),
  ].filter((id): id is string => Boolean(id)))]

  const { data: reviews } = allRunIds.length
    ? await supabase
        .from('agent_reviews')
        .select('id, run_id, artifact_id, reviewer_id, decision, comment, checklist, created_at')
        .eq('organization_id', organizationId)
        .in('run_id', allRunIds)
        .order('created_at', { ascending: false })
    : { data: [] as Array<Record<string, unknown>> }

  return NextResponse.json({
    workflow,
    template: getWorkflowDefinition(workflow.workflow_type),
    stages: stages || [],
    artifacts: artifactVersions || [],
    currentArtifactIds,
    reviews: reviews || [],
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
