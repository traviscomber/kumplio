import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, Brain, GitBranch, History, Network } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { findRelatedNodes, getOrganizationContext } from '@/lib/compliance/context/context-graph'

export const dynamic = 'force-dynamic'
type PageProps = { params: Promise<{ nodeId: string }> }

export default async function ContextNodePage({ params }: PageProps) {
  const { nodeId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/context/${nodeId}`)

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  const graph = await getOrganizationContext(admin, access.organizationId)
  const node = graph.nodes.find((item) => item.id === nodeId)
  if (!node) notFound()
  const related = findRelatedNodes(node.id, graph.nodes, graph.edges)
  const edges = graph.edges.filter((edge) => edge.fromNodeId === node.id || edge.toNodeId === node.id)
  const inbound = edges.filter((edge) => edge.toNodeId === node.id).length
  const outbound = edges.filter((edge) => edge.fromNodeId === node.id).length
  const relevantMemories = graph.memories.filter((memory) => memory.tags.includes(node.nodeType) || memory.summary.toLowerCase().includes(node.label.toLowerCase())).slice(0, 10)

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link href="/context" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Volver al contexto</Link>

        <header className="mt-6 rounded-3xl border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-primary"><Brain className="h-5 w-5" /><p className="text-sm font-semibold">{node.nodeType}</p></div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{node.label}</h1>
          {node.summary && <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{node.summary}</p>}
          {node.externalId && <p className="mt-4 text-xs text-muted-foreground">Referencia: {node.externalId}</p>}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Relaciones" value={edges.length} />
            <Metric label="Impactos recibidos" value={inbound} />
            <Metric label="Impactos propagados" value={outbound} />
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2"><GitBranch className="h-5 w-5 text-primary" /><h2 className="font-bold">Relaciones directas</h2></div>
            <div className="mt-5 space-y-3">
              {related.length === 0 ? <p className="text-sm text-muted-foreground">Este nodo aún no tiene relaciones.</p> : related.map((item) => {
                const edge = edges.find((candidate) => (candidate.fromNodeId === node.id && candidate.toNodeId === item.id) || (candidate.toNodeId === node.id && candidate.fromNodeId === item.id))
                const direction = edge?.fromNodeId === node.id ? 'Propaga hacia' : 'Recibe desde'
                return (
                  <Link key={item.id} href={`/context/${item.id}`} className="flex items-start justify-between gap-4 rounded-xl border p-4 hover:bg-muted/60">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{direction} · {edge?.relationType || 'relacionado'} · {item.nodeType}</p>
                      <p className="mt-1 font-bold">{item.label}</p>
                      {item.summary && <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>}
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  </Link>
                )
              })}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border bg-card p-5 sm:p-6">
              <div className="flex items-center gap-2"><Network className="h-5 w-5 text-primary" /><h2 className="font-bold">Lectura de impacto</h2></div>
              <div className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
                <p>{inbound === 0 ? 'No recibe impactos directos registrados.' : `Recibe ${inbound} impactos directos desde otros elementos.`}</p>
                <p>{outbound === 0 ? 'No propaga impactos directos registrados.' : `Puede propagar impacto hacia ${outbound} elementos.`}</p>
                <p>{edges.length >= 4 ? 'Es un nodo relevante dentro del contexto y conviene revisarlo antes de cerrar una situación relacionada.' : 'Su alcance actual es acotado dentro del contexto registrado.'}</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 sm:p-6">
              <div className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /><h2 className="font-bold">Memoria relacionada</h2></div>
              <div className="mt-5 space-y-4">
                {relevantMemories.length === 0 ? <p className="text-sm text-muted-foreground">No existen precedentes específicos para este elemento.</p> : relevantMemories.map((memory) => (
                  <article key={memory.id} className="border-l-2 border-primary/30 pl-4"><p className="font-semibold">{memory.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{memory.summary}</p>{memory.outcome && <p className="mt-2 text-xs font-semibold">Resultado: {memory.outcome}</p>}</article>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-background/50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>
}
