import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const querySchema = z.object({
  caseId: z.string().uuid().optional(),
  runId: z.string().uuid().optional(),
  workflowId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
}).refine((value) => value.caseId || value.runId || value.workflowId, {
  message: 'caseId, runId or workflowId is required',
})

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid audit query', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) return NextResponse.json({ error: 'Organization required' }, { status: 403 })

  let query = supabase
    .from('agent_tool_calls')
    .select('id, case_id, workflow_id, stage_id, run_id, agent_id, tool_name, arguments, result_summary, result_count, source_refs, status, error_code, started_at, completed_at')
    .eq('organization_id', membership.organization_id)
    .order('created_at', { ascending: false })
    .limit(parsed.data.limit)

  if (parsed.data.caseId) query = query.eq('case_id', parsed.data.caseId)
  if (parsed.data.runId) query = query.eq('run_id', parsed.data.runId)
  if (parsed.data.workflowId) query = query.eq('workflow_id', parsed.data.workflowId)

  const { data, error } = await query
  if (error) {
    const notReady = error.code === '42P01' || error.code === 'PGRST205'
    return NextResponse.json(
      { error: notReady ? 'Agent tools migration is required' : 'Unable to load tool audit trail' },
      { status: notReady ? 503 : 500 },
    )
  }

  return NextResponse.json({ calls: data || [] })
}
