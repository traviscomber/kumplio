import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processPendingComplianceEvents } from '@/lib/compliance/autonomy/engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!expected || provided !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await processPendingComplianceEvents(createAdminClient(), 50)
  return NextResponse.json({ ok: true, ...result })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
