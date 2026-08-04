import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
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
      error: 'El análisis jurídico automatizado está deshabilitado hasta contar con un corpus oficial, versionado y verificable.',
      code: 'legal_expert_not_verified',
    },
    {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store' },
    },
  )
}
