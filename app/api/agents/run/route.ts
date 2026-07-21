import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAgentProfile } from '@/lib/agents/catalog'
import { runAgent } from '@/lib/agents/openai-runtime'

export const runtime = 'nodejs'
export const maxDuration = 300

const requestSchema = z.object({
  agentId: z.enum(['isidora', 'rodrigo', 'javier', 'beatriz', 'veronica', 'andres', 'catalina']),
  task: z.string().trim().min(10).max(30000),
  context: z.string().max(120000).optional().default(''),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const parsed = requestSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid agent request', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const profile = getAgentProfile(parsed.data.agentId)
    if (!profile) {
      return NextResponse.json({ error: 'Unknown agent' }, { status: 404 })
    }

    const startedAt = Date.now()
    const result = await runAgent({
      agentId: parsed.data.agentId,
      task: parsed.data.task,
      context: parsed.data.context,
      userId: user.id,
    })

    return NextResponse.json({
      agent: profile,
      result,
      elapsedMs: Date.now() - startedAt,
      reviewRequired: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Agent execution failed'
    console.error('[agents/run]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
