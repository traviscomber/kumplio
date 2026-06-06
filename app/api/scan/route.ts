import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import {
  performSASTScan,
  performDependencyScan,
  performConfigScan,
  performDataProtectionScan,
  saveScanResults,
} from '@/lib/scanner'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, code, dependencies, config } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Perform all scans
    const findings = [
      ...(code ? performSASTScan(code) : []),
      ...(dependencies ? performDependencyScan(dependencies) : []),
      ...(config ? performConfigScan(config) : []),
      performDataProtectionScan(),
    ]

    // Save results
    await saveScanResults(supabase, projectId, findings)

    // Get updated project
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    return NextResponse.json({
      success: true,
      findings: findings.length,
      complianceScore: project?.compliance_score,
    })
  } catch (error) {
    console.error('[v0] Scan error:', error)
    return NextResponse.json(
      { error: 'Scan failed' },
      { status: 500 }
    )
  }
}
