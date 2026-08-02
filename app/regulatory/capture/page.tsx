import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, DatabaseZap, ShieldCheck } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { LeyChileCaptureButton } from '@/components/regulatory/leychile-capture-button'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Captura LeyChile',
  description: 'Ejecución controlada del scraper oficial de LeyChile.',
  robots: { index: false, follow: false },
}

export default async function LeyChileCapturePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/regulatory/capture')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) redirect('/onboarding')

  const [{ data: source }, { data: latestVersion }] = await Promise.all([
    supabase
      .from('regulatory_sources')
      .select('id, source_name, terms_review_status, health_status, last_successful_fetch_at, last_error_at, last_error_code')
      .eq('canonical_url', 'https://www.bcn.cl/leychile/')
      .maybeSingle(),
    supabase
      .from('regulatory_document_versions')
      .select('version_number, version_label, version_date, content_hash, created_at, regulatory_documents!inner(canonical_identifier, title)')
      .eq('regulatory_documents.canonical_identifier', 'LEY-21719')
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const canCapture = ['owner', 'admin'].includes(membership.role || '')

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <Link href="/regulatory" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver a inteligencia regulatoria
        </Link>

        <section className="mt-5 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><DatabaseZap className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-primary">Conector oficial BCN</p>
              <h1 className="mt-1 text-3xl font-bold">Captura LeyChile</h1>
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
                Ejecución controlada del scraper de la Ley 21.719. Cada corrida conserva el original, hash SHA-256, versión, artículos, incisos y diff sin sobrescribir el historial.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Fuente</p>
            <p className="mt-2 font-bold">{source?.source_name || 'LeyChile'}</p>
            <p className="mt-1 text-xs text-muted-foreground">Términos: {source?.terms_review_status || 'sin registrar'}</p>
          </article>
          <article className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Estado</p>
            <p className="mt-2 font-bold">{source?.health_status || 'unknown'}</p>
            <p className="mt-1 text-xs text-muted-foreground">Última captura: {source?.last_successful_fetch_at ? new Date(source.last_successful_fetch_at).toLocaleString('es-CL') : 'ninguna'}</p>
          </article>
          <article className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Última versión registrada</p>
            <p className="mt-2 font-bold">{latestVersion ? `v${latestVersion.version_number}` : 'Sin versión'}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{latestVersion?.content_hash || 'Sin hash'}</p>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Ejecutar captura</h2>
              <p className="text-sm text-muted-foreground">Disponible solo para propietarios y administradores.</p>
            </div>
          </div>
          <LeyChileCaptureButton enabled={canCapture} />
        </section>
      </main>
    </>
  )
}
