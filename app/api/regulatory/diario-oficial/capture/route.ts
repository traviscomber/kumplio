import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { captureDiarioOficialEdition } from '@/lib/regulatory/connectors/diario-oficial'
import { canonicalDiarioOficialEditionUrl } from '@/lib/regulatory/diario-oficial-core.mjs'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id || !['owner', 'admin'].includes(membership.role || '')) {
    return NextResponse.json({ error: 'Owner or administrator role required' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const date = String(body.date || '').trim()
  const edition = String(body.edition || '').trim()
  let canonicalUrl: string
  try { canonicalUrl = canonicalDiarioOficialEditionUrl(date, edition) }
  catch { return NextResponse.json({ error: 'Date or edition is invalid' }, { status: 400 }) }

  const admin = createAdminClient()
  const idempotencyKey = `diario-oficial:${date}:${edition}`
  const { data: runId, error: enqueueError } = await admin.rpc('enqueue_scraper_run', {
    target_connector_key: 'diario-oficial-summary',
    target_organization: membership.organization_id,
    target_requested_by: user.id,
    target_trigger_type: 'manual',
    target_requested_url: canonicalUrl,
    target_canonical_url: canonicalUrl,
    target_idempotency_key: idempotencyKey,
    target_parent_run: null,
  })
  if (enqueueError || !runId) return NextResponse.json({ error: enqueueError?.message || 'Unable to enqueue capture' }, { status: 409 })

  const { error: claimError } = await admin.rpc('claim_scraper_run', {
    target_run: runId,
    worker_id: `vercel:${crypto.randomUUID()}`,
    lease_seconds: 300,
  })
  if (claimError) return NextResponse.json({ runId, status: 'queued' }, { status: 202 })

  try {
    const capture = await captureDiarioOficialEdition({ date, edition })
    const { data: source } = await admin
      .from('regulatory_sources')
      .select('id')
      .eq('canonical_url', 'https://www.diariooficial.interior.gob.cl/edicionelectronica/')
      .single()
    if (!source) throw new Error('source_not_registered')

    const isoDate = `${date.slice(6, 10)}-${date.slice(3, 5)}-${date.slice(0, 2)}`
    const { data: record, error: recordError } = await admin.rpc('record_diario_oficial_edition', {
      target_source: source.id,
      target_edition: Number(edition),
      target_date: isoDate,
      target_url: canonicalUrl,
      target_content_hash: capture.contentHash,
      target_parser_version: capture.parsed.parserVersion,
      target_fetch: null,
      target_publications: capture.parsed.publications,
    })
    if (recordError) throw new Error(recordError.message)

    const resultStatus = record?.status === 'unchanged' ? 'unchanged' : 'requires_review'
    await admin.rpc('complete_scraper_run', {
      target_run: runId,
      target_status: resultStatus,
      target_http_status: capture.status,
      target_mime: capture.mimeType,
      target_bytes: capture.byteSize,
      target_hash: capture.contentHash,
      target_document: null,
      target_version: null,
      target_change: null,
      target_sections: capture.parsed.publicationCount,
      target_changes: record?.status === 'unchanged' ? 0 : capture.parsed.publicationCount,
      target_metrics: { edition: Number(edition), publicationCount: capture.parsed.publicationCount },
    })

    return NextResponse.json({ ok: true, runId, status: resultStatus, record, edition: capture.parsed })
  } catch (error) {
    const code = error instanceof Error ? error.message.split(':')[0] : 'capture_failed'
    await admin.rpc('fail_scraper_run', {
      target_run: runId,
      target_error_code: code,
      target_error_message: error instanceof Error ? error.message : 'Capture failed',
      target_retryable: ['timeout', 'network_error', 'http_error'].includes(code),
    })
    return NextResponse.json({ error: 'Diario Oficial capture failed', code, runId }, { status: 502 })
  }
}
