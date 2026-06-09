export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import DocumentsPageClient from './client'

export default async function DocumentsPage() {
  // Server-side auth check using service role (verifies session)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase config')
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/sign-in')
  }

  return <DocumentsPageClient />
}
