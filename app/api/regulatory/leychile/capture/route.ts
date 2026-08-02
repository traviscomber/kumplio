import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  LeyChileRunError,
  runLeyChileOfficialJson,
} from '@/lib/regulatory/services/run-leychile-official-json'

export const runtime = 'nodejs'
export const maxDuration = 300

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

  try {
    const result = await runLeyChileOfficialJson({
      organizationId: membership.organization_id,
      requestedBy: user.id,
      triggerType: 'manual',
      idempotencyScope: 'law-21719:2026-12-01:manual',
    })

    return NextResponse.json({
      ok: true,
      law: '21.719',
      result,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof LeyChileRunError) {
      return NextResponse.json({
        error: 'LeyChile capture failed',
        code: error.code,
        runId: error.runId,
        retryRunId: error.retryRunId,
      }, {
        status: error.retryable ? 502 : 422,
      })
    }

    console.error('[regulatory/leychile/capture] unexpected-error', error)
    return NextResponse.json(
      { error: 'LeyChile capture failed', code: 'unexpected_error' },
      { status: 500 },
    )
  }
}
