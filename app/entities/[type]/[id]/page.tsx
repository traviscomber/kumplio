import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Activity, Bot, FileText, History, Link2, ListChecks, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/workspace-nav'

export const dynamic = 'force-dynamic'

type EntityType = 'control' | 'evidence' | 'risk' | 'document' | 'playbook'

type EntityConfig = {
  table: string
  label: string
  titleFields: string[]
  descriptionFields: string[]
}

const configs: Record<EntityType, EntityConfig> = {
  control: { table: 'controls', label: 'Control', titleFields: ['name', 'title'], descriptionFields: ['description', 'objective'] },
  evidence: { table: 'evidence', label: 'Evidencia', titleFields: ['title', 'name'], descriptionFields: ['description', 'notes'] },
  risk: { table: 'risks', label: 'Riesgo', titleFields: ['title', 'name'], descriptionFields: ['description', 'impact'] },
  document: { table: 'documents', label: 'Documento', titleFields: ['name', 'file_name', 'title'], descriptionFields: ['description', 'summary'] },
  playbook: { table: 'mission_playbooks', label: 'Playbook', titleFields: ['name', 'title'], descriptionFields: ['objective', 'description'] },
}

export default async function EntityWorkspacePage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params
  const config = configs[type as EntityType]
  if (!config) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle()
  if (!membership?.organization_id) redirect('/dashboard')

  const { data: entity } = await supabase.from(config.table).select('*').eq('id', id).maybeSingle()
  if (!entity) notFound()
  if (type !== 'playbook' && entity.organization_id && entity.organization_id !== membership.organization_id) notFound()

  const title = pick(entity, config.titleFields) || config.label
  const description = pick(entity, config.descriptionFields) || `Información conectada de ${config.label.toLowerCase()} dentro de tu organización.`
  const status = entity.status || entity.state || 'Disponible'
  const createdAt = entity.created_at || null
  const updatedAt = entity.updated_at || createdAt

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-bold text-primary">{config.label}</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{title}</h1>
                <p className="mt-3 max-w-3xl text-muted-foreground">{description}</p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{String(status)}</span>
                  {entity.priority && <span className="rounded-full bg-muted px-3 py-1">Prioridad: {String(entity.priority)}</span>}
                  {entity.version && <span className="rounded-full bg-muted px-3 py-1">Versión: {String(entity.version)}</span>}
                </div>
              </div>
              <Link href={`/missions/new?sourceType=${encodeURIComponent(type)}&sourceId=${encodeURIComponent(id)}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm">
                <Sparkles className="h-4 w-4" />Crear misión contextual
              </Link>
            </div>
          </header>

          <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2" aria-label="Secciones del workspace">
            {['Resumen', 'Actividad', 'Relaciones', 'Archivos', 'IA', 'Historial'].map((item, index) => <a key={item} href={`#${slug(item)}`} className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold ${index === 0 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{item}</a>)}
          </nav>

          <section id="resumen" className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <WorkspaceCard icon={ListChecks} title="Resumen">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Fact label="Tipo" value={config.label} />
                <Fact label="Estado" value={String(status)} />
                <Fact label="Creado" value={formatDate(createdAt)} />
                <Fact label="Última actualización" value={formatDate(updatedAt)} />
              </dl>
            </WorkspaceCard>
            <WorkspaceCard icon={Bot} title="IA contextual">
              <p className="text-sm text-muted-foreground">Kumplio utilizará esta entidad como contexto al analizar, explicar o preparar una misión. No necesitas volver a describirla.</p>
              <button className="mt-4 w-full rounded-xl border border-border px-4 py-3 text-sm font-bold hover:bg-muted">Preguntar sobre {config.label.toLowerCase()}</button>
            </WorkspaceCard>
          </section>

          <section id="actividad"><WorkspaceCard icon={Activity} title="Actividad"><Empty text="Los eventos relevantes de esta entidad aparecerán aquí en orden de impacto." /></WorkspaceCard></section>
          <section id="relaciones"><WorkspaceCard icon={Link2} title="Relaciones"><Empty text="Aquí se mostrarán personas, procesos, controles, riesgos, documentos y misiones conectadas." /></WorkspaceCard></section>
          <section id="archivos"><WorkspaceCard icon={FileText} title="Archivos"><Empty text="Los archivos vinculados conservarán su origen, versión y trazabilidad." /></WorkspaceCard></section>
          <section id="ia"><WorkspaceCard icon={Bot} title="IA"><Empty text="Las respuestas incluirán fundamento, evidencia y acciones disponibles dentro de esta entidad." /></WorkspaceCard></section>
          <section id="historial"><WorkspaceCard icon={History} title="Historial"><Empty text="Cada cambio importante quedará registrado sin reemplazar la historia anterior." /></WorkspaceCard></section>
        </div>
      </main>
    </>
  )
}

function pick(entity: Record<string, unknown>, fields: string[]) {
  for (const field of fields) if (typeof entity[field] === 'string' && entity[field]) return entity[field] as string
  return null
}

function slug(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() }
function formatDate(value: unknown) { return typeof value === 'string' ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(value)) : 'Sin registro' }

function WorkspaceCard({ icon: Icon, title, children }: { icon: typeof Activity; title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><h2 className="font-bold">{title}</h2></div>{children}</div>
}
function Fact({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div> }
function Empty({ text }: { text: string }) { return <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">{text}</p> }
