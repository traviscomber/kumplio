import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  performConfigScan,
  performDependencyScan,
  performSASTScan,
  saveScanResults,
} from '@/lib/scanner'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const scanSchema = z.object({
  projectId: z.string().uuid(),
  code: z.string().min(20).max(500_000).optional(),
  dependencies: z.record(z.string(), z.string().min(1).max(80)).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (value) => Boolean(value.code || Object.keys(value.dependencies || {}).length || Object.keys(value.config || {}).length),
  { message: 'At least one real scan input is required' },
)

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

  const parsed = scanSchema.safeParse(payload)
  if (!parsed.success || parsed.data.code?.trim().toLowerCase() === 'mock') {
    return NextResponse.json(
      { error: 'A valid project source is required', code: 'invalid_scan_input' },
      { status: 400 },
    )
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, compliance_score')
    .eq('id', parsed.data.projectId)
    .maybeSingle()

  if (projectError) {
    console.error('[scan] project lookup failed', projectError.code)
    return NextResponse.json(
      { error: 'No fue posible consultar el proyecto.', code: 'project_lookup_failed' },
      { status: 500 },
    )
  }

  if (!project) {
    return NextResponse.json(
      { error: 'Proyecto no encontrado.', code: 'project_not_found' },
      { status: 404 },
    )
  }

  const findings = [
    ...(parsed.data.code ? performSASTScan(parsed.data.code) : []),
    ...(parsed.data.dependencies ? performDependencyScan(parsed.data.dependencies) : []),
    ...(parsed.data.config ? performConfigScan(parsed.data.config) : []),
  ]

  try {
    await saveScanResults(supabase, parsed.data.projectId, findings)

    const { data: updatedProject, error: updatedProjectError } = await supabase
      .from('projects')
      .select('compliance_score')
      .eq('id', parsed.data.projectId)
      .single()

    if (updatedProjectError) throw updatedProjectError

    return NextResponse.json({
      success: true,
      findings: findings.length,
      complianceScore: updatedProject.compliance_score,
    }, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    console.error('[scan] execution failed', error instanceof Error ? error.message : 'unknown_error')
    return NextResponse.json(
      { error: 'No fue posible completar el escaneo.', code: 'scan_failed' },
      { status: 500 },
    )
  }
}
