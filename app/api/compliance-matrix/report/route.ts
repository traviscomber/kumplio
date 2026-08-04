import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'authentication_required' },
      { status: 401 },
    )
  }

  return NextResponse.json(
    {
      error: 'La matriz heredada fue retirada. Utiliza las obligaciones identificadas y sus evidencias verificables.',
      code: 'legacy_compliance_matrix_retired',
    },
    {
      status: 410,
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}
