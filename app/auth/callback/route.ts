import type { EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { safeInternalPath } from '@/lib/navigation/safe-internal-path'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const next = safeInternalPath(url.searchParams.get('next'))
  const supabase = await createClient()

  let error: Error | null = null

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code)
    error = result.error
  } else if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    error = result.error
  } else {
    error = new Error('Missing authentication confirmation data')
  }

  if (error) {
    const target = new URL('/auth/error', request.url)
    target.searchParams.set('code', 'confirmation_failed')
    return NextResponse.redirect(target)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
