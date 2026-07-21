import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/workspace-nav'

export const dynamic = 'force-dynamic'

export default async function EvidencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const organizationId = membership?.organization_id
  const evidenceResult = organizationId
    ? await supabase
        .from('evidence')
        .select('id, name, evidence_type, source, validation_status, issued_at, expires_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [], error: null }

  const migrationPending = evidenceResult.error?.code === '42P01' || evidenceResult.error?.message?.includes('evidence')

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Respaldo verificable</p>
            <h1 className="mt-1 text-3xl font-bold">Evidencias</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Centraliza documentos y registros, controla su vigencia y vincúlalos con los controles que respaldan.
            </p>
          </div>
          <Link href="/documents" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Cargar documento
          </Link>
        </div>

        <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
          {migrationPending ? (
            <div className="p-12 text-center">
              <p className="font-semibold">El módulo está listo para activarse.</p>
              <p className="mt-2 text-sm text-muted-foreground">Aplica las migraciones 04 y 05 para habilitar la biblioteca de evidencias.</p>
            </div>
          ) : !evidenceResult.data?.length ? (
            <div className="p-12 text-center">
              <p className="font-semibold">No hay evidencias registradas.</p>
              <p className="mt-2 text-sm text-muted-foreground">Carga un documento y vincúlalo a un control para comenzar.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {evidenceResult.data.map((item) => (
                <article key={item.id} className="p-5">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2.5 py-1">{item.evidence_type}</span>
                    <span className="rounded-full bg-muted px-2.5 py-1">{item.validation_status}</span>
                    {item.source && <span className="rounded-full bg-muted px-2.5 py-1">{item.source}</span>}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold">{item.name}</h2>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <span>Emitida: {item.issued_at ? new Date(item.issued_at).toLocaleDateString('es-CL') : 'sin fecha'}</span>
                    <span>Vence: {item.expires_at ? new Date(item.expires_at).toLocaleDateString('es-CL') : 'sin vencimiento'}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
