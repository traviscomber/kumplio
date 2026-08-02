import { createBrowserClient } from '@supabase/ssr'

function getPublishableKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('Missing public Supabase key')
  return key
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getPublishableKey(),
  )
}
