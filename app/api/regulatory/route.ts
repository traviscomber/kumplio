import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getIndustries,
  getRegulatoryStats,
  matchObligationsToRegulations,
  searchRegulatoryFrameworks,
  searchRegulatoryRequirements,
} from '@/lib/services/regulatory'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const queryTypeSchema = z.enum(['industries', 'frameworks', 'requirements', 'stats'])
const severitySchema = z.enum(['low', 'medium', 'high', 'critical'])

const matchSchema = z.object({
  action: z.literal('match-obligations'),
  industry: z.string().trim().min(2).max(120),
  obligations: z.array(z.object({
    id: z.string().trim().min(1).max(128),
    obligation_text: z.string().trim().min(5).max(20_000),
  })).min(1).max(500),
})

async function authenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { supabase, user, error }
}

export async function GET(request: NextRequest) {
  const { supabase, user, error: authError } = await authenticatedClient()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'authentication_required' },
      { status: 401 },
    )
  }

  const parsedType = queryTypeSchema.safeParse(request.nextUrl.searchParams.get('type') || 'frameworks')
  if (!parsedType.success) {
    return NextResponse.json(
      { error: 'Invalid query type', code: 'invalid_query_type' },
      { status: 400 },
    )
  }

  const industry = request.nextUrl.searchParams.get('industry')?.trim() || undefined
  const frameworkId = request.nextUrl.searchParams.get('frameworkId')?.trim() || undefined
  const category = request.nextUrl.searchParams.get('category')?.trim() || undefined
  const rawSeverity = request.nextUrl.searchParams.get('severity')
  const parsedSeverity = rawSeverity ? severitySchema.safeParse(rawSeverity) : null

  if (rawSeverity && !parsedSeverity?.success) {
    return NextResponse.json(
      { error: 'Invalid severity', code: 'invalid_severity' },
      { status: 400 },
    )
  }

  try {
    let payload: Record<string, unknown>

    switch (parsedType.data) {
      case 'industries':
        payload = { industries: await getIndustries(supabase) }
        break
      case 'requirements':
        payload = {
          requirements: await searchRegulatoryRequirements(
            supabase,
            frameworkId,
            category,
            parsedSeverity?.success ? parsedSeverity.data : undefined,
          ),
        }
        break
      case 'stats':
        payload = { stats: await getRegulatoryStats(supabase, industry) }
        break
      default:
        payload = { frameworks: await searchRegulatoryFrameworks(supabase, industry) }
    }

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    console.error('[regulatory] query failed', error instanceof Error ? error.message : 'unknown_error')
    return NextResponse.json(
      { error: 'No fue posible consultar la base regulatoria.', code: 'regulatory_query_failed' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const { supabase, user, error: authError } = await authenticatedClient()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'authentication_required' },
      { status: 401 },
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request', code: 'invalid_json' },
      { status: 400 },
    )
  }

  const parsed = matchSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid regulatory mapping request', code: 'invalid_mapping_request' },
      { status: 400 },
    )
  }

  try {
    const mappings = await matchObligationsToRegulations(
      supabase,
      parsed.data.obligations,
      parsed.data.industry,
    )

    return NextResponse.json({ mappings }, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    console.error('[regulatory] mapping failed', error instanceof Error ? error.message : 'unknown_error')
    return NextResponse.json(
      { error: 'No fue posible mapear las obligaciones.', code: 'regulatory_mapping_failed' },
      { status: 500 },
    )
  }
}
