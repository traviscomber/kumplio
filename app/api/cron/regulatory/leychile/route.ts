import { NextRequest, NextResponse } from 'next/server'
import { runLeyChileScraper } from '@/lib/regulatory/services/run-leychile-scraper'

export const runtime = 'nodejs'
export const maxDuration = 300

function isAuthorizedCronCall(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET?.trim()
  const authorization = request.headers.get('authorization')?.trim()

  if (!expectedSecret) {
    console.error('[cron/leychile] CRON_SECRET is not configured')
    return false
  }

  return authorization === `Bearer ${expectedSecret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronCall(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runLeyChileScraper('cron')

  return NextResponse.json({
    success: result.status !== 'failed',
    timestamp: new Date().toISOString(),
    result,
  }, {
    status: result.status === 'failed' ? 500 : 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
