import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const querySchema = z.object({
  status: z.enum(['pending_review', 'approved', 'rejected', 'all']).default('pending_review'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required', code: 'authentication_required' }, { status: 401 })
  }

  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', code: 'invalid_query' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'An organization membership is required', code: 'organization_required' }, { status: 403 })
  }

  const organizationId = membership.organization_id
  let runsQuery = supabase
    .from('agent_runs')
    .select('id, case_id, agent_id, status, task, output_payload, output_text, model, prompt_version, schema_version, total_tokens, elapsed_ms, created_at, completed_at, compliance_cases(id, title, priority)')
    .eq('organization_id', organizationId)
    .order('completed_at', { ascending: false, nullsFirst: false })
    .limit(parsed.data.limit)

  if (parsed.data.status !== 'all') runsQuery = runsQuery.eq('status', parsed.data.status)

  const { data: runs, error: runsError } = await runsQuery
  if (runsError) {
    return NextResponse.json({ error: 'Unable to load review queue', code: 'review_queue_load_failed' }, { status: 500 })
  }

  const runIds = (runs || []).map((run) => run.id)
  const [{ data: artifacts }, { data: stages }, { data: reviews }] = await Promise.all([
    runIds.length
      ? supabase
          .from('agent_artifacts')
          .select('id, run_id, title, artifact_type, version, content, source_refs, status, created_at')
          .in('run_id', runIds)
          .order('version', { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    runIds.length
      ? supabase
          .from('agent_workflow_stages')
          .select('id, workflow_id, stage_index, agent_id, status, run_id, updated_at, agent_workflows(id, status, current_stage, total_stages)')
          .in('run_id', runIds)
      : Promise.resolve({ data: [] as any[] }),
    runIds.length
      ? supabase
          .from('agent_reviews')
          .select('id, run_id, reviewer_id, decision, comment, checklist, created_at')
          .in('run_id', runIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
  ])

  const items = (runs || []).map((run) => ({
    ...run,
    artifact: (artifacts || []).find((artifact) => artifact.run_id === run.id) || null,
    workflowStage: (stages || []).find((stage) => stage.run_id === run.id) || null,
    reviews: (reviews || []).filter((review) => review.run_id === run.id),
  }))

  return NextResponse.json({ items })
}
