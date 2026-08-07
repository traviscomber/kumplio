import Link from 'next/link'
import { ArrowRight, History } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSimilarCases } from '@/lib/compliance/context/organizational-memory'

export async function SimilarCasesPanel({ caseId }: { caseId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) return null

  const { data: currentCase } = await supabase
    .from('compliance_cases')
    .select('id,title,description')
    .eq('organization_id', membership.organization_id)
    .eq('id', caseId)
    .maybeSingle()
  if (!currentCase) return null

  const similar = await getSimilarCases(supabase, membership.organization_id, currentCase, 5)
  if (!similar.length) return null

  return (
    <section className="container mx-auto max-w-6xl px-4 pb-10 sm:px-6">
      <div className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-black">Casos similares</h2>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Kumplio encontró precedentes de esta misma organización que pueden ayudar a revisar el enfoque actual. Son contexto operativo, no autoridad normativa.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {similar.map((item) => (
            <Link key={item.id} href={`/cases/${item.id}`} className="group rounded-xl border p-4 transition hover:border-primary/40 hover:bg-muted/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{item.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description || 'Sin descripción adicional.'}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span>{Math.round(item.similarity * 100)}% similitud</span>
                <span>·</span>
                <span>{item.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
