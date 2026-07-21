import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const querySchema = z.object({
  agentId: z.enum(['isidora', 'rodrigo', 'javier', 'beatriz', 'veronica', 'andres', 'catalina']).optional(),
  caseId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
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

  let query = supabase
    .from('agent_runs')
    .select('id, case_id, agent_id, status, task, output_payload, output_text, model, prompt_version, schema_version, input_tokens, output_tokens, total_tokens, elapsed_ms, error_code, created_at, completed_at')
    .eq('organization_id', membership.organization_id)
    .order('created_at', { ascending: false })
    .limit(parsed.data.limit)

  if (parsed.data.agentId) query = query.eq('agent_id', parsed.data.agentId)
  if (parsed.data.caseId) query = query.eq('case_id', parsed.data.caseId)

  const { data, error } = await query
  if (error) {
    const migrationPending = error.code === '42P01' || error.message.includes('agent_runs')
    return NextResponse.json(
      {
        error: migrationPending ? 'Agent Control Plane migration is required' : 'Unable to load agent runs',
        code: migrationPending ? 'control_plane_not_ready' : 'history_load_failed',
      },
      { status: migrationPending ? 503 : 500 },
    )
  }

  return NextResponse.json({ runs: data || [] })
}
