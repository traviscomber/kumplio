import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type QueueStatus = 'queued' | 'working' | 'retry_wait' | 'dead_letter'

export async function GET() {
  const startedAt = Date.now()
  try {
    const admin = createAdminClient()
    const [{ error: dbError }, { data: jobs, error: queueError }] = await Promise.all([
      admin.from('organizations').select('id', { head: true, count: 'exact' }).limit(1),
      admin.from('agent_jobs').select('status, lease_expires_at').in('status', ['queued', 'working', 'retry_wait', 'dead_letter']).limit(500),
    ])

    if (dbError || queueError) {
      return NextResponse.json({ status: 'degraded', database: !dbError, queue: !queueError }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
    }

    const summary: Record<QueueStatus, number> & { stale_leases: number } = {
      queued: 0,
      working: 0,
      retry_wait: 0,
      dead_letter: 0,
      stale_leases: 0,
    }
    const now = Date.now()
    for (const job of jobs || []) {
      const status = job.status as QueueStatus
      if (status === 'queued' || status === 'working' || status === 'retry_wait' || status === 'dead_letter') summary[status] += 1
      if (status === 'working' && job.lease_expires_at && new Date(job.lease_expires_at).getTime() < now) summary.stale_leases += 1
    }

    const healthy = summary.dead_letter === 0 && summary.stale_leases === 0
    return NextResponse.json({ status: healthy ? 'ok' : 'degraded', database: true, queue: summary, latency_ms: Date.now() - startedAt, checked_at: new Date().toISOString() }, {
      status: healthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ status: 'unavailable', database: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
