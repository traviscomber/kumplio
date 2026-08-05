import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, Brain, BriefcaseBusiness, FileCheck2, Gavel, ShieldAlert } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { getOrganizationContext, findRelatedNodes } from '@/lib/compliance/context/context-graph'

export const dynamic = 'force-dynamic'
type PageProps = { params: Promise<{ id: string }> }

export default async function SituationDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/situations/${id}`)

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data: situation, error } = await db.from('compliance_situations')
    .select('id,title,summary,status,severity,confidence,context,evidence_ids,recommendation,mission_id,decision_id,owner_id,due_at,created_at,updated_at')
    .eq('id', id)
    .eq('organization_id', access.organizationId)
    .maybeSingle()

  if (error) throw new Error(`No fue posible cargar la situación: ${error.message}`)
  if (!situation) notFound()

  const graph = await getOrganizationContext(admin, access.organizationId)
  const situationNode = graph.nodes.find((node) => node.nodeType === 'situation' && node.externalId === id)
  const related = situationNode ? findRelatedNodes(situationNode.id, graph.nodes, graph.edges) : []
  const memories = graph.memories.slice(0, 5)

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/situations" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a situaciones
        </Link>

        <header className="mt-6 rounded-3xl border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
            <span>Impacto {String(situation.severity)}</span>
            <span>{statusLabel(String(situation.status))}</span>
            <span>Confianza {Math.round(Number(situation.confidence || 0) * 100)}%</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{String(situation.title)}</h1>
          {situation.summary && <p className="mt-4 max-w-4xl text-lg leading-8 text-muted-foreground">{String(situation.summary)}</p>}
          {situation.recommendation && (
            <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-5">
              <p className="text-sm font-semibold text-primary">Recomendación</p>
              <p className="mt-2 leading-7">{String(situation.recommendation)}</p>
            </div>
          )}
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <Panel icon={FileCheck2} title="Evidencia">
            <p>{Array.isArray(situation.evidence_ids) ? situation.evidence_ids.length : 0} evidencias relacionadas.</p>
          </Panel>
          <Panel icon={BriefcaseBusiness} title="Ejecución">
            {situation.mission_id ? <Link className="font-semibold text-primary" href={`/missions/${situation.mission_id}`}>Abrir misión <ArrowRight className="inline h-4 w-4" /></Link> : <p>No existe una misión vinculada.</p>}
          </Panel>
          <Panel icon={Gavel} title="Decisión">
            {situation.decision_id ? <Link className="font-semibold text-primary" href="/decisions">Abrir decisión <ArrowRight className="inline h-4 w-4" /></Link> : <p>No existe una decisión vinculada.</p>}
          </Panel>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /><h2 className="font-bold">Contexto relacionado</h2></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {related.length === 0 ? <p className="text-sm text-muted-foreground">Aún no existen relaciones navegables.</p> : related.map((node) => (
                <Link key={node.id} href={`/context/${node.id}`} className="rounded-xl border p-4 hover:bg-muted/60">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{node.nodeType}</p>
                  <p className="mt-1 font-bold">{node.label}</p>
                  {node.summary && <p className="mt-2 text-sm text-muted-foreground">{node.summary}</p>}
                </Link>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" /><h2 className="font-bold">Precedentes</h2></div>
            <div className="mt-5 space-y-4">
              {memories.length === 0 ? <p className="text-sm text-muted-foreground">No hay precedentes registrados.</p> : memories.map((memory) => (
                <article key={memory.id} className="border-l-2 border-primary/30 pl-4">
                  <p className="font-semibold">{memory.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{memory.summary}</p>
                </article>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </>
  )
}

function Panel({ icon: Icon, title, children }: { icon: typeof FileCheck2; title: string; children: React.ReactNode }) {
  return <article className="rounded-2xl border bg-card p-5"><Icon className="h-5 w-5 text-primary" /><h2 className="mt-4 font-bold">{title}</h2><div className="mt-2 text-sm leading-6 text-muted-foreground">{children}</div></article>
}

function statusLabel(status: string) {
  if (status === 'waiting_decision') return 'Espera decisión'
  if (status === 'in_progress') return 'En ejecución'
  if (status === 'analyzing') return 'En análisis'
  return 'Abierta'
}
