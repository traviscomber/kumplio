import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  captureDiarioOficialEdition,
  DiarioOficialConnectorError,
} from '@/lib/regulatory/connectors/diario-oficial'
import { canonicalDiarioOficialEditionUrl } from '@/lib/regulatory/diario-oficial-core.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const requestSchema = z.object({
  date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/),
  edition: z.string().regex(/^\d{4,6}$/),
})

type CaptureRecord = {
  editionId?: string
  status?: 'captured' | 'requires_review' | 'unchanged'
  revisionNumber?: number
  publicationCount?: number
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'authentication_required' },
      { status: 401 },
    )
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .maybeSingle()

  if (membershipError) {
    console.error('[diario-oficial] membership lookup failed', membershipError.code)
    return NextResponse.json(
      { error: 'No fue posible verificar tus permisos.', code: 'membership_lookup_failed' },
      { status: 500 },
    )
  }

  if (!membership?.organization_id) {
    return NextResponse.json(
      { error: 'Se requiere rol owner o admin.', code: 'owner_or_admin_required' },
      { status: 403 },
    )
  }

  const parsedRequest = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: 'Fecha o edición inválida.', code: 'invalid_capture_request' },
      { status: 400 },
    )
  }

  const { date, edition } = parsedRequest.data
  const canonicalUrl = canonicalDiarioOficialEditionUrl(date, edition)
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

  if (enqueueError || !runId) {
    console.error('[diario-oficial] enqueue failed', enqueueError?.code)
    return NextResponse.json(
      { error: 'No fue posible crear la captura.', code: 'capture_enqueue_failed' },
      { status: 409 },
    )
  }

  const workerId = `vercel:${crypto.randomUUID()}`
  const { error: claimError } = await admin.rpc('claim_scraper_run', {
    target_run: runId,
    worker_id: workerId,
    lease_seconds: 60,
  })

  if (claimError) {
    return NextResponse.json({ runId, status: 'queued' }, { status: 202 })
  }

  try {
    const capture = await captureDiarioOficialEdition({ date, edition })

    const { data: source, error: sourceError } = await admin
      .from('regulatory_sources')
      .select('id')
      .eq('canonical_url', 'https://www.diariooficial.interior.gob.cl/')
      .single()

    if (sourceError || !source) {
      throw new DiarioOficialConnectorError('source_not_registered', 'La fuente no está registrada.')
    }

    const { data: previousFetch } = await admin
      .from('regulatory_source_fetches')
      .select('id')
      .eq('source_id', source.id)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: fetchRecord, error: fetchError } = await admin
      .from('regulatory_source_fetches')
      .insert({
        source_id: source.id,
        previous_fetch_id: previousFetch?.id || null,
        requested_url: capture.requestedUrl,
        final_url: capture.finalUrl,
        fetched_at: new Date().toISOString(),
        status: 'succeeded',
        http_status: capture.status,
        mime_type: capture.mimeType,
        byte_size: capture.byteSize,
        content_hash: capture.contentHash,
        raw_content: capture.rawHtml,
        response_headers: capture.responseHeaders,
        connector_version: capture.connectorVersion,
      })
      .select('id')
      .single()

    if (fetchError || !fetchRecord) {
      throw new DiarioOficialConnectorError('fetch_persistence_failed', fetchError?.message || 'No se pudo guardar la captura.')
    }

    const { data: recordData, error: recordError } = await admin.rpc('record_diario_oficial_edition', {
      target_source: source.id,
      target_fetch: fetchRecord.id,
      target_edition: Number(edition),
      target_date: capture.parsed.publicationDateIso,
      target_url: capture.finalUrl,
      target_summary_pdf_url: capture.parsed.summaryPdfUrl,
      target_content_hash: capture.contentHash,
      target_parser_version: capture.connectorVersion,
      target_publications: capture.parsed.publications,
    })

    if (recordError) {
      throw new DiarioOficialConnectorError('edition_persistence_failed', recordError.message)
    }

    const record = (recordData || {}) as CaptureRecord
    const completionStatus = record.status === 'unchanged'
      ? 'unchanged'
      : record.status === 'requires_review'
        ? 'requires_review'
        : 'succeeded'

    if (completionStatus === 'unchanged') {
      await admin
        .from('regulatory_source_fetches')
        .update({ status: 'unchanged' })
        .eq('id', fetchRecord.id)
    }

    await admin.rpc('complete_scraper_run', {
      target_run: runId,
      target_status: completionStatus,
      target_http_status: capture.status,
      target_mime: capture.mimeType,
      target_bytes: capture.byteSize,
      target_hash: capture.contentHash,
      target_document: null,
      target_version: null,
      target_change: null,
      target_sections: capture.parsed.publicationCount,
      target_changes: completionStatus === 'unchanged' ? 0 : capture.parsed.publicationCount,
      target_metrics: {
        edition: Number(edition),
        publicationDate: capture.parsed.publicationDateIso,
        publicationCount: capture.parsed.publicationCount,
        revisionNumber: record.revisionNumber || 1,
      },
    })

    return NextResponse.json({
      ok: true,
      runId,
      status: completionStatus,
      edition: {
        id: record.editionId,
        number: Number(edition),
        publicationDate: capture.parsed.publicationDateIso,
        revisionNumber: record.revisionNumber,
        publicationCount: capture.parsed.publicationCount,
        contentHash: capture.contentHash,
        source: 'Diario Oficial de la República de Chile',
        sourceUrl: capture.finalUrl,
        summaryPdfUrl: capture.parsed.summaryPdfUrl,
      },
    }, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    const connectorError = error instanceof DiarioOficialConnectorError
      ? error
      : new DiarioOficialConnectorError(
          'capture_failed',
          error instanceof Error ? error.message : 'La captura falló.',
        )

    await admin.rpc('fail_scraper_run', {
      target_run: runId,
      target_error_code: connectorError.code,
      target_error_message: connectorError.message,
      target_retryable: ['timeout', 'network_error', 'http_error'].includes(connectorError.code),
    })

    console.error('[diario-oficial] capture failed', connectorError.code)
    return NextResponse.json(
      { error: 'No fue posible capturar la edición.', code: connectorError.code, runId },
      { status: 502 },
    )
  }
}
