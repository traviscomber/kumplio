import { createCompliancePipeline, runQuickCompliacneScan } from '@/lib/agents/coordinator'

export async function POST(req: Request) {
  try {
    const { documentContent, organizationType, scanType } = await req.json()

    if (!documentContent) {
      return Response.json({ error: 'Document content required' }, { status: 400 })
    }

    const orgType = organizationType || 'empresa'

    if (scanType === 'quick') {
      const result = await runQuickCompliacneScan(documentContent, orgType)
      return Response.json(result)
    }

    // Full analysis (default)
    const result = await createCompliancePipeline(documentContent, orgType)
    return Response.json(result)
  } catch (error) {
    console.error('[API] Compliance analysis error:', error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    )
  }
}
