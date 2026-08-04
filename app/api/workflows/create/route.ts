import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const workflowRequestSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  steps: z.array(
    z.object({
      id: z.string().trim().min(1).max(120),
      agentName: z.string().trim().min(1).max(120),
      inputs: z.record(z.string(), z.unknown()),
      condition: z.string().max(500).optional(),
      retryCount: z.number().int().min(0).max(10).optional(),
      timeout: z.number().int().min(1).max(900_000).optional(),
    }),
  ).min(1).max(100),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json(
      { error: 'Authentication required', code: 'authentication_required' },
      { status: 401 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: 'Invalid JSON request', code: 'invalid_json' },
      { status: 400 },
    )
  }

  const parsed = workflowRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid workflow definition', code: 'invalid_workflow', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('workflow_definitions')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      definition: parsed.data,
    })
    .select()
    .single()

  if (error) {
    console.error('[workflows/create]', error.code)
    return Response.json(
      { error: 'No fue posible crear el workflow.', code: 'workflow_creation_failed' },
      { status: 500 },
    )
  }

  return Response.json({ workflow: data }, { status: 201 })
}
