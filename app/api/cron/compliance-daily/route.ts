import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { refreshDailyComplianceSummary } from '@/lib/compliance/continuous/daily-summary'

export const runtime = 'nodejs'
export const maxDuration = 300

function isAuthorizedCronCall(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  const authorization = request.headers.get('authorization')?.trim()

  if (!secret) {
    console.error('[cron/compliance-daily] CRON_SECRET is not configured')
    return false
  }

  return authorization === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronCall(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: organizations, error } = await admin
    .from('organizations')
    .select('id')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[cron/compliance-daily] Could not list organizations:', error)
    return NextResponse.json({ success: false, code: 'organizations_query_failed' }, { status: 500 })
  }

  const results: Array<{ organizationId: string; success: boolean; runId?: string; error?: string }> = []

  for (const organization of organizations || []) {
    try {
      const summary = await refreshDailyComplianceSummary(admin, organization.id)
      results.push({ organizationId: organization.id, success: true, runId: summary.id })
    } catch (runError) {
      console.error('[cron/compliance-daily] Review failed:', organization.id, runError)
      results.push({
        organizationId: organization.id,
        success: false,
        error: runError instanceof Error ? runError.message : 'unknown_error',
      })
    }
  }

  const failed = results.filter((result) => !result.success).length

  return NextResponse.json({
    success: failed === 0,
    timestamp: new Date().toISOString(),
    organizations: results.length,
    failed,
    results,
  }, {
    status: failed === 0 ? 200 : 207,
    headers: { 'Cache-Control': 'no-store' },
  })
}
