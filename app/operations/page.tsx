import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Boxes, FileCheck2, PackageCheck, ShieldCheck, Users } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function OperationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/operations')

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')

  const [{ data: organization }, { data: projects }] = await Promise.all([
    admin.from('organizations').select('name').eq('id', membership.organization_id).maybeSingle(),
    admin
      .from('projects')
      .select('id,name')
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Centro operacional</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Cumplimiento de {organization?.name || 'tu organización'}.
          </h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Un solo lugar para revisar brechas, preparar auditorías, evaluar proveedores y activar capacidades regulatorias.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <OperationCard href="/vendors" icon={Users} title="Proveedores" description="Revisa riesgo, contratos, tratamiento de datos y transferencias." />
          <OperationCard href="/marketplace" icon={PackageCheck} title="Packs regulatorios" description="Activa capacidades versionadas con permisos y trazabilidad." />
          <OperationCard href="/review-center" icon={ShieldCheck} title="Decisiones pendientes" description="Resuelve lo que Kumplio priorizó para revisión humana." />
        </section>

        <section className="mt-10">
          <p className="text-sm font-semibold text-primary">Ámbitos activos</p>
          <h2 className="mt-1 text-2xl font-bold">Preparación por proyecto</h2>
          <div className="mt-5 space-y-4">
            {!projects?.length ? (
              <div className="rounded-2xl border bg-card p-8">
                <Boxes className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-xl font-bold">Todavía no hay proyectos activos.</h3>
                <p className="mt-2 text-sm text-muted-foreground">Completa el onboarding para crear el primer ámbito de cumplimiento.</p>
              </div>
            ) : projects.map((project) => (
              <article key={project.id} className="rounded-2xl border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{project.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Diagnóstico, brechas, plan de acción y paquete de auditoría.</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href={`/readiness/${project.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold hover:bg-muted">
                      <FileCheck2 className="h-4 w-4" /> Ver preparación
                    </Link>
                    <Link href={`/audit-prep/${project.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90">
                      Preparar auditoría <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

function OperationCard({ href, icon: Icon, title, description }: { href: string; icon: typeof Users; title: string; description: string }) {
  return (
    <Link href={href} className="group rounded-2xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-5 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">Abrir <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
    </Link>
  )
}
