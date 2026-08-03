import type { SupabaseClient } from '@supabase/supabase-js'

type AppSupabaseClient = SupabaseClient<any, any, any>

/**
 * Check if a free-tier user can upload a document.
 * Free tier: 1 document per 7-day rolling window.
 * Paid tiers: unlimited.
 */
export async function checkDocumentLimit(userId: string, supabase: AppSupabaseClient) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) throw new Error(`Failed to fetch profile: ${profileError.message}`)

  const subscriptionTier = typeof profile?.subscription_tier === 'string'
    ? profile.subscription_tier
    : 'free'

  if (subscriptionTier !== 'free') {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY, nextResetAt: null as Date | null }
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const { data: recentDocs, error: docsError, count } = await supabase
    .from('documents')
    .select('id, upload_date', { count: 'exact' })
    .eq('user_id', userId)
    .gte('upload_date', sevenDaysAgo.toISOString())
    .order('upload_date', { ascending: true })
    .limit(1)

  if (docsError) throw new Error(`Failed to fetch recent documents: ${docsError.message}`)

  const uploaded = count || 0
  const allowed = uploaded < 1
  const oldestUpload = recentDocs?.[0]?.upload_date
  const nextResetAt = !allowed && oldestUpload
    ? new Date(new Date(oldestUpload).getTime() + 7 * 24 * 60 * 60 * 1000)
    : null

  return {
    allowed,
    remaining: allowed ? 1 : 0,
    nextResetAt,
  }
}
