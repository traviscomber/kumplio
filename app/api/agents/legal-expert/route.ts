import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { legalExpertInterpret } from '@/lib/agents/legal-expert'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const requestSchema = z.object({
  legalQuestion: z.string().trim().min(5).max(10_000),
  context: z.unknown().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

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

  const parsed = requestSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid legal question', code: 'invalid_request' },
      { status: 400 },
    )
  }

  try {
    const opinion = await legalExpertInterpret(parsed.data.legalQuestion, parsed.data.context)

    return NextResponse.json({
      success: true,
      data: {
        caseId: opinion.caseId,
        legalQuestion: opinion.legalQuestion,
        articlesCited: opinion.articlesCited,
        legalInterpretation: opinion.legalInterpretation,
        sernacPrecedents: opinion.sernacPrecedents,
        analogousCases: opinion.analogousCases,
        applicablePatterns: opinion.applicablePatterns,
        estimatedPenalty: opinion.estimatedPenalty,
        rootCauses: opinion.rootCauses,
        strategicRecommendations: opinion.strategicRecommendations,
        confidence: opinion.confidence,
        reasoningTrace: opinion.reasoningTrace.getTrace(),
      },
    }, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    console.error('[legal-expert]', error instanceof Error ? error.message : 'unknown_error')
    return NextResponse.json(
      { error: 'No fue posible completar el análisis jurídico.', code: 'legal_analysis_failed' },
      { status: 500 },
    )
  }
}
