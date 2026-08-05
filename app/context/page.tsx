import { redirect } from 'next/navigation'
import { Brain, GitBranch, History, Network } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { getOrganizationContext } from '@/lib/compliance/context/context-graph'

export const dynamic = 'force-dynamic'

export default async function ContextPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/context')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  const context = await getOrganizationContext(admin, access.organizationId)
  const situationNodes = context.nodes.filter((node) => node.nodeType === 'situation')
  const precedents = context.memories.filter((memory) => memory.memoryType === 'decision_precedent')

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Contexto organizacional</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Kumplio ya recuerda cómo se relaciona el trabajo.</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Situaciones, misiones y decisiones comparten un contexto único. Las decisiones resueltas quedan disponibles como precedentes.
          </p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Nodos" value={context.nodes.length} icon={Network} />
          <Metric label="Relaciones" value={context.edges.length} icon={GitBranch} />
          <Metric label="Situaciones conectadas" value={situationNodes.length} icon={Brain} />
          <Metric label="Precedentes" value={precedents.length} icon={History} />
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
            <div className="mt-5 space-y-4">
              {context.memories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Las decisiones resueltas desde ahora quedarán guardadas como precedentes.</p>
              ) : context.memories.map((memory) => (
                <article key={memory.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{memory.title}</p>
                    <span className="text-xs text-muted-foreground">{new Date(memory.occurredAt).toLocaleDateString('es-CL')}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{memory.summary}</p>
                  {memory.outcome && <p className="mt-3 text-sm"><span className="font-semibold">Resultado:</span> {memory.outcome}</p>}
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
