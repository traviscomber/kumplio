import { NextRequest, NextResponse } from 'next/server'
import {
  LeyChileRunError,
  runLeyChileOfficialJson,
} from '@/lib/regulatory/services/run-leychile-official-json'

export const runtime = 'nodejs'
export const maxDuration = 300

function isAuthorizedCronCall(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  const authorization = request.headers.get('authorization')?.trim()

  if (!secret) {
    console.error('[cron/leychile] CRON_SECRET is not configured')
    return false
  }

  return authorization === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronCall(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const day = new Date().toISOString().slice(0, 10)

  try {
    const result = await runLeyChileOfficialJson({
      organizationId: null,
      requestedBy: null,
      triggerType: 'schedule',
      idempotencyScope: `law-21719:2026-12-01:schedule:${day}`,
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof LeyChileRunError) {
      return NextResponse.json({
        success: false,
        timestamp: new Date().toISOString(),
        code: error.code,
        runId: error.runId,
        retryRunId: error.retryRunId,
      }, { status: error.retryable ? 502 : 422 })
    }

    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      code: 'unexpected_error',
    }, { status: 500 })
  }
}
