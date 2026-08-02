import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  const admin = createAdminClient()

  try {
    const { data, error } = await admin.functions.invoke('leychile-bootstrap', {
      body: {},
    })

    if (error) {
      throw new Error(`leychile_edge_function_failed:${error.message}`)
    }

    if (!data?.ok) {
      throw new Error(`leychile_capture_failed:${data?.error || 'unknown'}`)
    }

    return NextResponse.json({
      ok: true,
      law: '21.719',
      ...data,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    console.error('[regulatory/leychile/capture]', message)

    await admin
      .from('regulatory_sources')
      .update({
        health_status: 'failed',
        last_error_at: new Date().toISOString(),
        last_error_code: message.split(':')[0] || 'capture_failed',
      })
      .eq('canonical_url', 'https://www.bcn.cl/leychile/')

    return NextResponse.json(
      { error: 'LeyChile capture failed', code: message.split(':')[0] || 'capture_failed' },
      { status: 502 },
    )
  }
}
