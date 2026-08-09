import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || ''
  if (!token) return NextResponse.json({ error: 'Worker authorization required' }, { status: 401 })

  const admin = createAdminClient()
  const { data: valid, error: validationError } = await admin.rpc('validate_agent_worker_token', { p_token: token })
  if (validationError || valid !== true) {
    console.error('[sst-bootstrap/auth]', validationError?.code || 'invalid_token')
    return NextResponse.json({ error: 'Worker authorization failed' }, { status: 401 })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('[sst-bootstrap/config]', 'supabase_server_configuration_missing')
    return NextResponse.json({ error: 'SST bootstrap configuration missing' }, { status: 500 })
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/sst-ds44-bootstrap`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      cache: 'no-store',
      signal: AbortSignal.timeout(240_000),
    })

    const payload = await response.json().catch(() => null) as Record<string, unknown> | null
    if (!response.ok || payload?.ok !== true) {
      console.error('[sst-bootstrap/upstream]', response.status, typeof payload?.error === 'string' ? payload.error : 'unknown')
      return NextResponse.json({ error: 'SST bootstrap failed', code: 'sst_bootstrap_failed' }, { status: 502 })
    }

    const snapshot = payload.snapshot && typeof payload.snapshot === 'object'
      ? payload.snapshot as Record<string, unknown>
      : {}
    const discovery = snapshot.susesoDiscovery && typeof snapshot.susesoDiscovery === 'object'
      ? snapshot.susesoDiscovery as Record<string, unknown>
      : {}
    const persistedCirculars = Array.isArray(snapshot.persistedCirculars) ? snapshot.persistedCirculars : []

    return NextResponse.json({
      ok: true,
      snapshotHash: typeof payload.snapshotHash === 'string' ? payload.snapshotHash : null,
      parserVersion: typeof snapshot.parserVersion === 'string' ? snapshot.parserVersion : null,
      dtPersisted: Boolean(snapshot.dtPersistence),
      susesoPersistedCount: persistedCirculars.length,
      susesoDiscoveredCount: typeof discovery.discovered === 'number' ? discovery.discovered : null,
      susesoRelevantCandidates: typeof discovery.relevantCandidates === 'number' ? discovery.relevantCandidates : null,
    })
  } catch (error) {
    console.error('[sst-bootstrap/execute]', error instanceof Error ? error.name : 'unknown')
    return NextResponse.json({ error: 'SST bootstrap failed', code: 'sst_bootstrap_failed' }, { status: 502 })
  }
}
