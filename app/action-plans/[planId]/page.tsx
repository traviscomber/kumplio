import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, CalendarDays, CheckCircle2, Circle, ListTodo, ShieldCheck } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ planId: string }> }

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  sequence: number
}

function badgeClass(priority: string) {
  if (priority === 'critical') return 'border-red-500/30 bg-red-500/10 text-red-200'
  if (priority === 'high') return 'border-orange-500/30 bg-orange-500/10 text-orange-200'
  return 'border-amber-500/30 bg-amber-500/10 text-amber-100'
}

export default async function ActionPlanPage({ params }: PageProps) {
  const { planId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/action-plans/${planId}`)

  const admin = createAdminClient()
  const [{ data: plan, error: planError }, { data: tasks, error: tasksError }] = await Promise.all([
    admin
      .from('compliance_action_plans')
      .select('id,impact_run_id,title,description,status,priority,due_date,source_snapshot,created_at,updated_at')
      .eq('id', planId)
      .maybeSingle(),
    admin
      .from('compliance_action_plan_tasks')
      .select('id,title,description,status,priority,due_date,sequence')
      .eq('action_plan_id', planId)
      .order('sequence', { ascending: true }),
  ])

  if (planError) throw new Error(`No fue posible cargar el plan: ${planError.message}`)
  if (tasksError) throw new Error(`No fue posible cargar las tareas: ${tasksError.message}`)
  if (!plan) notFound()

  const planTasks = (tasks || []) as Task[]
  const completed = planTasks.filter((task) => task.status === 'completed').length
  const progress = planTasks.length ? Math.round((completed / planTasks.length) * 100) : 0

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
        <header>
          <Link href={`/roc/${plan.impact_run_id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver al impacto
          </Link>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-xs font-bold uppercase tracking-[0.2em]">Plan de respuesta regulatoria</p>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{plan.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{plan.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(plan.priority)}`}>{plan.priority}</span>
              <span className="rounded-full border px-3 py-1 text-xs font-semibold">{plan.status}</span>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Avance</p><CheckCircle2 className="h-5 w-5 text-primary" /></div>
            <p className="mt-4 text-3xl font-extrabold">{progress}%</p>
            <p className="mt-2 text-xs text-muted-foreground">{completed} de {planTasks.length} tareas completadas</p>
          </article>
          <article className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Tareas</p><ListTodo className="h-5 w-5 text-primary" /></div>
            <p className="mt-4 text-3xl font-extrabold">{planTasks.length}</p>
            <p className="mt-2 text-xs text-muted-foreground">Generadas desde objetivos revisables</p>
          </article>
          <article className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Vencimiento</p><CalendarDays className="h-5 w-5 text-primary" /></div>
            <p className="mt-4 text-xl font-extrabold">{plan.due_date || 'Sin definir'}</p>
            <p className="mt-2 text-xs text-muted-foreground">Debe acordarse antes de aprobar el plan</p>
          </article>
        </section>

        <section className="rounded-2xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-bold">Tareas propuestas</h2>
            <p className="mt-1 text-xs text-muted-foreground">Todas nacen pendientes y sin responsable asignado.</p>
          </div>
          <div className="divide-y">
            {planTasks.map((task) => (
              <article key={task.id} className="grid gap-4 p-5 md:grid-cols-[auto_1fr_auto] md:items-start">
                {task.status === 'completed' ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" /> : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{task.sequence}. {task.title}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeClass(task.priority)}`}>{task.priority}</span>
                  </div>
                  {task.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p>}
                </div>
                <span className="rounded-full border px-3 py-1 text-xs font-semibold">{task.status}</span>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
