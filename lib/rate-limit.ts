import { createClient } from '@supabase/supabase-js'

/**
 * Check if a free-tier user can upload a document.
 * Free tier: 1 document per 7-day rolling window
 * Paid tiers: unlimited
 */
export async function checkDocumentLimit(userId: string, supabase: ReturnType<typeof createClient>) {
  // Get user's subscription tier
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  if (profileError) throw new Error(`Failed to fetch profile: ${profileError.message}`)

  // If not free tier, no limit
  if (profile?.subscription_tier !== 'free') {
    return { allowed: true, remaining: Infinity, nextResetAt: null }
  }

  // Free tier: check documents uploaded in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const { data: recentDocs, error: docsError, count } = await supabase
    .from('documents')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('upload_date', sevenDaysAgo.toISOString())

  if (docsError) throw new Error(`Failed to fetch recent documents: ${docsError.message}`)

  const uploaded = count || 0
  const allowed = uploaded < 1 // 1 document per week

  // Calculate next reset time (7 days after the oldest document)
  let nextResetAt: Date | null = null
  if (uploaded >= 1 && recentDocs && recentDocs.length > 0) {
    const oldestDocTime = new Date(recentDocs[0].upload_date)
    nextResetAt = new Date(oldestDocTime.getTime() + 7 * 24 * 60 * 60 * 1000)
  }

  return {
    allowed,
    remaining: allowed ? 1 : 0,
    nextResetAt,
  }
}
