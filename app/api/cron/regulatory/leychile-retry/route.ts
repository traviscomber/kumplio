import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  LEYCHILE_CONNECTOR_KEY,
  LeyChileRunError,
  runLeyChileOfficialJson,
} from '@/lib/regulatory/services/run-leychile-official-json'

export const runtime = 'nodejs'
export const maxDuration = 300

function isAuthorizedCronCall(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  const authorization = request.headers.get('authorization')?.trim()

  if (!secret) {
    console.error('[cron/leychile-retry] CRON_SECRET is not configured')
    return false
  }

  return authorization === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronCall(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: connector } = await admin
    .from('scraper_connectors')
    .select('id')
    .eq('connector_key', LEYCHILE_CONNECTOR_KEY)
    .maybeSingle()

  if (!connector) {
    return NextResponse.json({ success: false, code: 'connector_not_found' }, { status: 503 })
  }

  const { data: queuedRun } = await admin
    .from('scraper_runs')
    .select('id, attempt, available_at')
    .eq('connector_id', connector.id)
    .eq('status', 'queued')
    .eq('trigger_type', 'retry')
    .lte('available_at', new Date().toISOString())
    .order('available_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!queuedRun) {
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      retried: false,
      message: 'No due LeyChile retries',
    })
  }

  try {
    const result = await runLeyChileOfficialJson({
      organizationId: null,
      requestedBy: null,
      triggerType: 'retry',
      existingRunId: queuedRun.id,
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      retried: true,
      attempt: queuedRun.attempt,
      result,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof LeyChileRunError) {
      return NextResponse.json({
        success: false,
        timestamp: new Date().toISOString(),
        retried: true,
        code: error.code,
        runId: error.runId,
        retryRunId: error.retryRunId,
      }, { status: error.retryable ? 502 : 422 })
    }

    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      retried: true,
      code: 'unexpected_error',
    }, { status: 500 })
  }
}
