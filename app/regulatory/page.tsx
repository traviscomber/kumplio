import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  AlertTriangle,
  BookOpenCheck,
  DatabaseZap,
  FileDiff,
  FileSearch,
  Landmark,
  ShieldCheck,
} from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Inteligencia regulatoria',
  description: 'Fuentes oficiales, capturas, versiones, cambios y claims verificables en KUMPLIO.',
  robots: { index: false, follow: false },
}

const healthLabels: Record<string, string> = {
  unknown: 'Sin comprobar',
  healthy: 'Saludable',
  degraded: 'Degradada',
  failed: 'Con error',
  disabled: 'Deshabilitada',
}

const healthClasses: Record<string, string> = {
  healthy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  degraded: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  failed: 'border-destructive/30 bg-destructive/10 text-destructive',
  disabled: 'border-border bg-muted text-muted-foreground',
  unknown: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
}

export default async function RegulatoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/regulatory')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')

  const [sourcesResult, fetchCount, documentCount, versionCount, changeCount, claimCount, pendingClaimsResult, pendingChangesResult] = await Promise.all([
    supabase
      .from('regulatory_sources')
      .select('id, authority_name, source_name, canonical_url, domain, source_type, authority_level, ingestion_method, terms_review_status, health_status, connector_version, is_active, last_successful_fetch_at, last_error_at, last_error_code, created_at')
      .eq('is_active', true)
      .order('authority_name', { ascending: true })
      .limit(100),
    supabase.from('regulatory_source_fetches').select('id', { count: 'exact', head: true }),
    supabase.from('regulatory_documents').select('id', { count: 'exact', head: true }),
    supabase.from('regulatory_document_versions').select('id', { count: 'exact', head: true }),
    supabase.from('regulatory_source_changes').select('id', { count: 'exact', head: true }),
    supabase.from('regulatory_claims').select('id', { count: 'exact', head: true }),
    supabase
      .from('regulatory_claims')
      .select('id, claim_type, claim_text, subject, confidence, validation_status, created_at, regulatory_document_sections(reference_label, heading), regulatory_document_versions(version_number, regulatory_documents(title))')
      .in('validation_status', ['pending', 'partial'])
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('regulatory_source_changes')
      .select('id, change_type, summary, validation_status, detected_at, regulatory_documents(title), regulatory_document_versions!regulatory_source_changes_to_version_id_fkey(version_number)')
      .in('validation_status', ['pending', 'requires_review'])
      .order('detected_at', { ascending: false })
      .limit(20),
  ])

  const migrationPending = sourcesResult.error?.code === '42P01'
    || sourcesResult.error?.message?.includes('regulatory_sources')

  const metrics = [
    ['Fuentes oficiales', sourcesResult.data?.length || 0, Landmark],
    ['Capturas', fetchCount.count || 0, DatabaseZap],
    ['Documentos', documentCount.count || 0, FileSearch],
    ['Versiones', versionCount.count || 0, BookOpenCheck],
    ['Cambios', changeCount.count || 0, FileDiff],
    ['Claims', claimCount.count || 0, ShieldCheck],
  ] as const

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Regulatory Evidence Engine</p>
              <h1 className="mt-1 text-3xl font-bold md:text-4xl">Inteligencia regulatoria</h1>
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
                Registro verificable de fuentes oficiales, capturas, documentos, versiones, cambios, secciones, claims y citas exactas.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm lg:max-w-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
                <div>
                  <p className="font-semibold">Foundation manual-first</p>
                  <p className="mt-1 leading-6 text-muted-foreground">
                    No hay scrapers ni alertas automáticas activas. Las fuentes, términos y claims deben revisarse antes de publicar conclusiones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {migrationPending ? (
          <section className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-10 text-center">
            <p className="font-semibold">La foundation regulatoria está lista para instalarse.</p>
            <p className="mt-2 text-sm text-muted-foreground">Aplica las migraciones 32–36 en Supabase.</p>
          </section>
        ) : (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {metrics.map(([label, value, Icon]) => (
                <article key={label} className="rounded-xl border border-border bg-card p-5">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">{label}</p>
                  <p className="mt-1 text-3xl font-bold">{value}</p>
                </article>
              ))}
            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-6 md:p-8">
              <h2 className="text-xl font-bold">Registro de fuentes</h2>
              <p className="mt-1 text-sm text-muted-foreground">La disponibilidad de una fuente no implica que sus términos o conectores estén aprobados.</p>

              {!sourcesResult.data?.length ? (
                <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center">
                  <p className="font-semibold">No hay fuentes registradas.</p>
                  <p className="mt-2 text-sm text-muted-foreground">Ejecuta el seed de registro oficial sin crear todavía claims regulatorios.</p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {sourcesResult.data.map((source) => (
                    <article key={source.id} className="rounded-xl border border-border bg-background p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{source.authority_name}</p>
                          <h3 className="mt-2 text-lg font-bold">{source.source_name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{source.domain}</p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${healthClasses[source.health_status] || healthClasses.unknown}`}>
                          {healthLabels[source.health_status] || source.health_status}
                        </span>
                      </div>

                      <dl className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <div><dt>Nivel</dt><dd className="mt-1 font-semibold text-foreground">{source.authority_level}</dd></div>
                        <div><dt>Ingesta</dt><dd className="mt-1 font-semibold text-foreground">{source.ingestion_method}</dd></div>
                        <div><dt>Términos</dt><dd className="mt-1 font-semibold text-foreground">{source.terms_review_status}</dd></div>
                        <div><dt>Última captura</dt><dd className="mt-1 font-semibold text-foreground">{source.last_successful_fetch_at ? new Date(source.last_successful_fetch_at).toLocaleString('es-CL') : 'Sin capturar'}</dd></div>
                      </dl>

                      <a href={source.canonical_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">
                        Abrir fuente oficial
                      </a>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-2">
              <article className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <h2 className="text-xl font-bold">Cambios pendientes de revisión</h2>
                <div className="mt-5 space-y-3">
                  {!pendingChangesResult.data?.length ? (
                    <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No hay cambios capturados.</p>
                  ) : pendingChangesResult.data.map((change) => {
                    const document = Array.isArray(change.regulatory_documents) ? change.regulatory_documents[0] : change.regulatory_documents
                    const version = Array.isArray(change.regulatory_document_versions) ? change.regulatory_document_versions[0] : change.regulatory_document_versions
                    return (
                      <div key={change.id} className="rounded-xl border border-border bg-background p-4">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-semibold text-primary">{change.change_type}</span>
                          <span className="text-muted-foreground">{new Date(change.detected_at).toLocaleString('es-CL')}</span>
                        </div>
                        <p className="mt-2 font-semibold">{document?.title || 'Documento regulatorio'} · v{version?.version_number || '?'}</p>
                        {change.summary && <p className="mt-2 text-sm text-muted-foreground">{change.summary}</p>}
                      </div>
                    )
                  })}
                </div>
              </article>

              <article className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <h2 className="text-xl font-bold">Claims pendientes de validación</h2>
                <div className="mt-5 space-y-3">
                  {!pendingClaimsResult.data?.length ? (
                    <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No hay claims extraídos.</p>
                  ) : pendingClaimsResult.data.map((claim) => {
                    const section = Array.isArray(claim.regulatory_document_sections) ? claim.regulatory_document_sections[0] : claim.regulatory_document_sections
                    const version = Array.isArray(claim.regulatory_document_versions) ? claim.regulatory_document_versions[0] : claim.regulatory_document_versions
                    const document = version && !Array.isArray(version.regulatory_documents)
                      ? version.regulatory_documents
                      : Array.isArray(version?.regulatory_documents)
                        ? version?.regulatory_documents[0]
                        : null
                    return (
                      <div key={claim.id} className="rounded-xl border border-border bg-background p-4">
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">{claim.claim_type}</span>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{claim.validation_status}</span>
                        </div>
                        <p className="mt-3 text-sm font-semibold">{claim.claim_text}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{document?.title || 'Documento'} · {section?.reference_label || section?.heading || 'Sección sin referencia'}</p>
                      </div>
                    )
                  })}
                </div>
              </article>
            </section>
          </>
        )}
      </main>
    </>
  )
}
