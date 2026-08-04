import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'authentication_required' },
      { status: 401 },
    )
  }

  return NextResponse.json(
    {
      error: 'Este pipeline histórico está deshabilitado. Utiliza las misiones y agentes verificables del workspace.',
      code: 'legacy_agent_pipeline_retired',
    },
    {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store' },
    },
  )
}
