import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type WorkflowStepState = { state?: unknown }

export async function GET(
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
  const { data, error } = await supabase
    .from('workflow_executions')
    .select('id, state, steps, start_time, end_time, error')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[workflows/status] lookup failed', error.code)
    return NextResponse.json(
      { error: 'No fue posible consultar la ejecución.', code: 'workflow_status_failed' },
      { status: 500 },
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Ejecución no encontrada.', code: 'execution_not_found' },
      { status: 404 },
    )
  }

  const steps = Array.isArray(data.steps) ? data.steps as WorkflowStepState[] : []
  const totalSteps = steps.length
  const completedSteps = steps.filter((step) => step?.state === 'completed').length
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  return NextResponse.json({
    execution: {
      id: data.id,
      state: data.state,
      progress,
      totalSteps,
      completedSteps,
      startTime: data.start_time,
      endTime: data.end_time,
      error: data.error,
      steps,
    },
  }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
