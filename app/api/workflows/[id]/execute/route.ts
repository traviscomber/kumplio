import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'authentication_required' },
      { status: 401 },
    )
  }

  const { id } = await context.params
  const { data: workflow, error: workflowError } = await supabase
    .from('workflow_definitions')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (workflowError) {
    console.error('[workflows/execute] lookup failed', workflowError.code)
    return NextResponse.json(
      { error: 'No fue posible consultar el workflow.', code: 'workflow_lookup_failed' },
      { status: 500 },
    )
  }

  if (!workflow) {
    return NextResponse.json(
      { error: 'Workflow no encontrado.', code: 'workflow_not_found' },
      { status: 404 },
    )
  }

  return NextResponse.json(
    {
      error: 'La ejecución automática está deshabilitada hasta conectar workers y agentes verificables.',
      code: 'workflow_execution_not_configured',
    },
    {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store' },
    },
  )
}
