import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, CheckSquare2, ClipboardCheck, Scale, UserRoundCheck } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'

export const dynamic = 'force-dynamic'

export default async function FollowUpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/follow-up')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  const [missionsResult, decisionsResult, reviewsResult, overdueResult] = await Promise.all([
    admin.from('missions').select('id', { count: 'exact', head: true })
      .eq('organization_id', access.organizationId)
      .eq('owner_id', user.id)
      .not('status', 'in', '(completed,cancelled)'),
    admin.from('mission_decisions').select('id', { count: 'exact', head: true })
      .eq('organization_id', access.organizationId)
      .neq('status', 'resolved'),
    admin.from('agent_workflow_stages').select('id', { count: 'exact', head: true })
      .eq('organization_id', access.organizationId)
      .eq('status', 'pending_review'),
    admin.from('missions').select('id', { count: 'exact', head: true })
      .eq('organization_id', access.organizationId)
      .not('status', 'in', '(completed,cancelled)')
      .lt('due_at', new Date().toISOString()),
  ])

  const areas = [
    {
      href: '/my-work',
      title: 'Mi trabajo',
      description: 'Misiones y decisiones que necesitan una acción tuya.',
      value: missionsResult.count || 0,
      label: 'asuntos asignados',
      icon: CheckSquare2,
    },
    {
      href: '/review-center',
      title: 'Revisiones',
      description: 'Resultados de especialistas que requieren validación humana.',
      value: reviewsResult.count || 0,
      label: 'resultados por revisar',
      icon: ClipboardCheck,
    },
    {
      href: '/decisions',
      title: 'Decisiones',
      description: 'Materias que necesitan una resolución y una justificación trazable.',
      value: decisionsResult.count || 0,
      label: 'decisiones abiertas',
      icon: Scale,
    },
    {
      href: '/accountability',
      title: 'Responsables y plazos',
      description: 'Quién debe hacer qué y qué compromisos necesitan atención.',
      value: overdueResult.count || 0,
      label: 'asuntos vencidos',
      icon: UserRoundCheck,
    },
  ]

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-[28px] border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Seguimiento</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Todo lo que necesita una decisión o un próximo paso, en un solo lugar.</h1>
          <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
            No necesitas conocer la arquitectura de Kumplio. Empieza por lo que requiere atención y entra al detalle solo cuando sea necesario.
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {areas.map(({ href, title, description, value, label, icon: Icon }) => (
            <Link key={href} href={href} className="group rounded-2xl border bg-card p-5 transition hover:border-primary/35 hover:shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h2 className="mt-5 text-xl font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              <p className="mt-5 text-3xl font-black">{value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
            </Link>
          ))}
        </section>
      </main>
    </>
  )
}
