export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { legalExpertInterpret } from '@/lib/agents/legal-expert'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { legalQuestion, context } = body

    if (!legalQuestion) {
      return NextResponse.json(
        { error: 'Legal question is required' },
        { status: 400 }
      )
    }

    const opinion = await legalExpertInterpret(legalQuestion, context)

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
        reasoningTrace: opinion.reasoningTrace.getFullTrace()
      }
    })
  } catch (error) {
    console.error('[legal-expert] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
