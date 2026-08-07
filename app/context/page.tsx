import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Brain, GitBranch, History, Network } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { getOrganizationContext } from '@/lib/compliance/context/context-graph'
import { getMemoryPrecedents } from '@/lib/compliance/context/organizational-memory'

export const dynamic = 'force-dynamic'

export default async function ContextPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/context')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  const [context, deepMemory] = await Promise.all([
    getOrganizationContext(admin, access.organizationId),
    getMemoryPrecedents(admin, access.organizationId, 20),
  ])
  const situationNodes = context.nodes.filter((node) => node.nodeType === 'situation')

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Contexto organizacional</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Kumplio recuerda cómo tu organización resolvió antes.</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Situaciones, misiones y decisiones comparten un contexto único. Los especialistas reciben estos precedentes y casos similares antes de preparar una nueva respuesta.
          </p>
          <Link href="/map" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90">
            Abrir mapa de cumplimiento <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Nodos" value={context.nodes.length} icon={Network} />
          <Metric label="Relaciones" value={context.edges.length} icon={GitBranch} />
          <Metric label="Situaciones conectadas" value={situationNodes.length} icon={Brain} />
          <Metric label="Precedentes utilizables" value={deepMemory.length} icon={History} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="text-xl font-bold">Contexto reciente</h2>
            <div className="mt-5 space-y-4">
              {context.nodes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Las nuevas situaciones crearán el primer contexto automáticamente.</p>
              ) : context.nodes.slice(0, 20).map((node) => {
                const links = context.edges.filter((edge) => edge.fromNodeId === node.id || edge.toNodeId === node.id).length
                return (
                  <article key={node.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{node.label}</p>
                      <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">{typeLabel(node.nodeType)}</span>
                    </div>
                    {node.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{node.summary}</p>}
                    <p className="mt-3 text-xs font-semibold text-primary">{links} relaciones</p>
                  </article>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="text-xl font-bold">Memoria y precedentes</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Primero usamos la memoria estructurada; si todavía no está disponible, Kumplio recupera decisiones humanas resueltas como respaldo compatible.
            </p>
            <div className="mt-5 space-y-4">
              {deepMemory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Cuando existan decisiones resueltas aparecerán aquí y podrán alimentar casos futuros.</p>
              ) : deepMemory.map((memory) => (
                <article key={`${memory.source}-${memory.id}`} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{memory.title}</p>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {memory.source === 'organization_memory' ? 'Memoria' : 'Decisión'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{memory.summary || 'Sin resumen adicional.'}</p>
                  {memory.outcome && <p className="mt-3 text-sm"><span className="font-semibold">Resultado:</span> {memory.outcome}</p>}
                  <p className="mt-3 text-xs text-muted-foreground">{new Date(memory.occurredAt).toLocaleDateString('es-CL')}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Network }) {
  return (
    <article className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-4 text-3xl font-extrabold">{value}</p>
    </article>
  )
}

function typeLabel(value: string) {
  if (value === 'situation') return 'Situación'
  if (value === 'mission') return 'Misión'
  if (value === 'decision') return 'Decisión'
  return value.replaceAll('_', ' ')
}
