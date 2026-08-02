import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeLeyChileUrl } from '@/lib/regulatory/connectors/leychile'
import { runControlledLeyChileCapture } from '@/lib/regulatory/services/leychile-capture-pipeline'
import {
  classifyScraperError,
  completeScraperRun,
  enqueueAndClaimScraperRun,
  failScraperRun,
} from '@/lib/regulatory/scraper-platform'

export const runtime = 'nodejs'
export const maxDuration = 300

const LEY_21719_VERSION = '2026-12-01'
const LEY_21719_URL = `https://www.bcn.cl/leychile/navegar?idNorma=1209272&idVersion=${LEY_21719_VERSION}`

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'authentication_required' },
      { status: 401 },
    )
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id || !['owner', 'admin'].includes(membership.role || '')) {
    return NextResponse.json(
      { error: 'Owner or administrator role required', code: 'insufficient_role' },
      { status: 403 },
    )
  }

  const admin = createAdminClient()
  const { data: source, error: sourceError } = await admin
    .from('regulatory_sources')
    .select('id')
    .eq('canonical_url', 'https://www.bcn.cl/leychile/')
    .maybeSingle()

  if (sourceError || !source) {
    return NextResponse.json(
      { error: 'LeyChile source is not registered', code: 'source_not_registered' },
      { status: 503 },
    )
  }

  const canonicalUrl = normalizeLeyChileUrl(LEY_21719_URL)
  let runId: string | null = null

  try {
    const claimed = await enqueueAndClaimScraperRun({
      connectorKey: 'leychile-controlled-html',
      organizationId: membership.organization_id,
      requestedBy: user.id,
      triggerType: 'manual',
      requestedUrl: LEY_21719_URL,
      canonicalUrl,
      idempotencyScope: `law-21719:${LEY_21719_VERSION}`,
    })
    runId = claimed.runId

    const result = await runControlledLeyChileCapture({
      sourceId: source.id,
      url: canonicalUrl,
      authorization: {
        termsApproved: true,
        approvedMethod: 'controlled_html',
        approvalReference: 'BCN linked open data and LeyChile public interoperability documentation',
      },
      document: {
        canonicalIdentifier: 'LEY-21719',
        title: 'Ley 21.719 — Protección y tratamiento de datos personales',
        documentType: 'law',
        canonicalUrl,
        externalReference: '1209272',
        publicationDate: '2024-12-13',
        effectiveFrom: LEY_21719_VERSION,
        effectiveTo: null,
        status: 'published',
        versionLabel: `Vigencia diferida ${LEY_21719_VERSION}`,
        versionDate: LEY_21719_VERSION,
      },
    })

    const record = (result.record || {}) as Record<string, unknown>
    const recordStatus = String(record.fetch_status || record.status || '')
    const status = recordStatus === 'unchanged' ? 'unchanged' : 'requires_review'

    await completeScraperRun({
      runId,
      status,
      httpStatus: 200,
      mimeType: 'text/html',
      byteSize: result.capture.byteSize,
      contentHash: result.capture.contentHash,
      documentId: typeof record.document_id === 'string' ? record.document_id : null,
      versionId: typeof record.version_id === 'string' ? record.version_id : null,
      sourceChangeId: typeof record.source_change_id === 'string' ? record.source_change_id : null,
      sectionCount: result.capture.sectionCount,
      changeCount: typeof record.change_count === 'number' ? record.change_count : null,
      metrics: {
        articleCount: result.capture.articleCount,
        parserVersion: result.capture.parserVersion,
        finalUrl: result.capture.finalUrl,
      },
    })

    return NextResponse.json({
      ok: true,
      runId,
      status,
      sourceId: source.id,
      law: '21.719',
      ...result,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    const classified = classifyScraperError(error)
    let retryRunId: string | null = null

    if (runId) {
      try {
        retryRunId = await failScraperRun({
          runId,
          errorCode: classified.code,
          errorMessage: classified.message,
          retryable: classified.retryable,
        })
      } catch (recordingError) {
        console.error('[regulatory/leychile/capture] failure-recording-error', recordingError)
      }
    }

    console.error('[regulatory/leychile/capture]', classified.code)
    return NextResponse.json(
      {
        error: 'LeyChile capture failed',
        code: classified.code,
        runId,
        retryRunId,
      },
      { status: classified.retryable ? 502 : 422 },
    )
  }
}
