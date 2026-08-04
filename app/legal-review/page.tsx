import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ReviewWorkbench } from './review-workbench'

export const dynamic = 'force-dynamic'

function reviewerEmails() {
  return (process.env.REGULATORY_REVIEWER_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export default async function LegalReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in?next=/legal-review')

  const authorized = user.app_metadata?.regulatory_reviewer === true
    || (user.email ? reviewerEmails().includes(user.email.toLowerCase()) : false)

  if (!authorized) redirect('/dashboard')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('regulatory_review_cases')
    .select(`
      id,
      status,
      current_revision,
      source_snapshot,
      proposed_payload,
      opened_at,
      regulatory_claims!inner (
        claim_text,
        claim_type
      ),
      compliance_applicability_rules (
        rule_key,
        title,
        conditions,
        outcome
      ),
      obligation_rule_links (
        obligation_catalog_versions (
          title,
          obligation_catalog (
            code
          )
        )
      )
    `)
    .in('status', ['new', 'pending', 'in_review'])
    .order('opened_at', { ascending: true })

  if (error) throw new Error(`No fue posible cargar la bandeja jurídica: ${error.message}`)

  const cases = (data || []).map((item) => {
    const claim = Array.isArray(item.regulatory_claims) ? item.regulatory_claims[0] : item.regulatory_claims
    const rule = Array.isArray(item.compliance_applicability_rules)
      ? item.compliance_applicability_rules[0]
      : item.compliance_applicability_rules
    const link = Array.isArray(item.obligation_rule_links) ? item.obligation_rule_links[0] : item.obligation_rule_links
    const version = Array.isArray(link?.obligation_catalog_versions)
      ? link?.obligation_catalog_versions[0]
      : link?.obligation_catalog_versions
    const catalog = Array.isArray(version?.obligation_catalog)
      ? version?.obligation_catalog[0]
      : version?.obligation_catalog
    const source = (item.source_snapshot || {}) as Record<string, unknown>

    return {
      id: item.id,
      status: item.status,
      current_revision: item.current_revision,
      claim_text: claim?.claim_text || String(source.claim_text || ''),
      claim_type: claim?.claim_type || null,
      reference_label: typeof source.reference_label === 'string' ? source.reference_label : null,
      source_title: 'Ley 21.719',
      rule_title: rule?.title || null,
      rule_key: rule?.rule_key || null,
      rule_conditions: (rule?.conditions || null) as Record<string, unknown> | null,
      rule_outcome: (rule?.outcome || null) as Record<string, unknown> | null,
      catalog_code: catalog?.code || null,
      catalog_title: version?.title || null,
      created_at: item.opened_at,
    }
  })

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Control jurídico</p>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Workbench regulatorio</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
              Revisa el texto legal, la regla de aplicabilidad y su obligación operativa antes de activar cualquier resultado.
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
            La aprobación humana es obligatoria
          </div>
        </div>

        <ReviewWorkbench cases={cases} />
      </main>
    </>
  )
}
