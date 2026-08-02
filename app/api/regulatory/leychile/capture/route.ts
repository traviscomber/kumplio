import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runControlledLeyChileCapture } from '@/lib/regulatory/services/leychile-capture-pipeline'

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
    .select('id, terms_review_status, health_status')
    .eq('canonical_url', 'https://www.bcn.cl/leychile/')
    .maybeSingle()

  if (sourceError || !source) {
    return NextResponse.json(
      { error: 'LeyChile source is not registered', code: 'source_not_registered' },
      { status: 503 },
    )
  }

  try {
    const result = await runControlledLeyChileCapture({
      sourceId: source.id,
      url: LEY_21719_URL,
      authorization: {
        termsApproved: true,
        approvedMethod: 'controlled_html',
        approvalReference: 'BCN linked open data and LeyChile public interoperability documentation',
      },
      document: {
        canonicalIdentifier: 'LEY-21719',
        title: 'Ley 21.719 — Protección y tratamiento de datos personales',
        documentType: 'law',
        canonicalUrl: LEY_21719_URL,
        externalReference: '1209272',
        publicationDate: '2024-12-13',
        effectiveFrom: LEY_21719_VERSION,
        effectiveTo: null,
        status: 'published',
        versionLabel: `Vigencia diferida ${LEY_21719_VERSION}`,
        versionDate: LEY_21719_VERSION,
      },
    })

    return NextResponse.json({
      ok: true,
      sourceId: source.id,
      law: '21.719',
      ...result,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    console.error('[regulatory/leychile/capture]', message)

    return NextResponse.json(
      { error: 'LeyChile capture failed', code: message.split(':')[0] || 'capture_failed' },
      { status: 502 },
    )
  }
}
