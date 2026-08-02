import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runLeyChileScraper } from '@/lib/regulatory/services/run-leychile-scraper'

export const runtime = 'nodejs'
export const maxDuration = 300

function isAuthorizedCronCall(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET?.trim()
  const authorization = request.headers.get('authorization')?.trim()

  if (!expectedSecret) {
    console.error('[cron/leychile-retry] CRON_SECRET is not configured')
    return false
  }

  return authorization === `Bearer ${expectedSecret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronCall(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: source } = await admin
    .from('regulatory_sources')
    .select('id')
    .eq('canonical_url', 'https://www.bcn.cl/leychile/')
    .maybeSingle()

  if (!source) {
    return NextResponse.json({ success: false, error: 'LeyChile source not registered' }, { status: 503 })
  }

  const { data: latestRun } = await admin
    .from('regulatory_source_fetches')
    .select('status, fetched_at, error_code')
    .eq('source_id', source.id)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latestRun || latestRun.status !== 'failed') {
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      retried: false,
      message: 'The latest LeyChile run does not require a retry',
      latestRun,
    })
  }

  const result = await runLeyChileScraper('retry')

  return NextResponse.json({
    success: result.status !== 'failed',
    timestamp: new Date().toISOString(),
    retried: true,
    previousFailure: latestRun,
    result,
  }, {
    status: result.status === 'failed' ? 500 : 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
