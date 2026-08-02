import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runLeyChileScraper } from '@/lib/regulatory/services/run-leychile-scraper'

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

  const result = await runLeyChileScraper('manual')

  if (result.status === 'failed') {
    return NextResponse.json(
      { error: 'LeyChile capture failed', code: result.error?.split(':')[0] || 'capture_failed', result },
      { status: 502 },
    )
  }

  return NextResponse.json({
    ok: true,
    law: '21.719',
    result,
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
