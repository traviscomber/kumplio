import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsData, getDashboardStats } from '@/lib/services/analytics'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'authentication_required' },
      { status: 401 },
    )
  }

  const type = request.nextUrl.searchParams.get('type') || 'full'
  if (type !== 'full' && type !== 'stats') {
    return NextResponse.json(
      { error: 'Unsupported analytics type', code: 'unsupported_analytics_type' },
      { status: 400 },
    )
  }

  try {
    const payload = type === 'stats'
      ? await getDashboardStats(supabase, user.id)
      : await getAnalyticsData(supabase, user.id)

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    console.error('[analytics] request failed', error instanceof Error ? error.message : 'unknown_error')
    return NextResponse.json(
      { error: 'No fue posible obtener Analytics.', code: 'analytics_failed' },
      { status: 500 },
    )
  }
}
