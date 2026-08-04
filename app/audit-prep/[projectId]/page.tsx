import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CheckCircle2, FileArchive, RefreshCw } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prepareAuditPackage } from '@/lib/compliance/operations/vendor-audit-marketplace'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ projectId: string }> }

export default async function AuditPrepPage({ params }: PageProps) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/audit-prep/${projectId}`)

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')

  const { data: project } = await admin
    .from('projects')
    .select('id,name,organization_id')
    .eq('id', projectId)
    .eq('organization_id', membership.organization_id)
    .maybeSingle()
  if (!project) redirect('/dashboard')

  let { data: auditPackage } = await admin
    .from('audit_preparation_packages')
    .select('id,status,summary,evidence_snapshot,findings_snapshot,generated_at')
    .eq('organization_id', membership.organization_id)
    .eq('project_id', projectId)
    .maybeSingle()

  async function rebuild() {
    'use server'
    const serverSupabase = await createClient()
    const { data: { user: currentUser } } = await serverSupabase.auth.getUser()
    if (!currentUser) redirect(`/sign-in?next=/audit-prep/${projectId}`)
    const serverAdmin = createAdminClient()
    const { data: currentMembership } = await serverAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', currentUser.id)
      .limit(1)
      .maybeSingle()
    if (!currentMembership?.organization_id) redirect('/onboarding')
    await prepareAuditPackage(serverAdmin, currentMembership.organization_id, projectId, currentUser.id)
    revalidatePath(`/audit-prep/${projectId}`)
  }

  if (!auditPackage) {
    auditPackage = await prepareAuditPackage(admin, membership.organization_id, projectId, user.id)
  }

  const summary = (auditPackage?.summary || {}) as Record<string, number>
  const evidence = Array.isArray(auditPackage?.evidence_snapshot) ? auditPackage.evidence_snapshot : []
  const findings = Array.isArray(auditPackage?.findings_snapshot) ? auditPackage.findings_snapshot : []

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Preparación de auditoría</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{project.name}</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            El paquete conserva una fotografía reproducible de obligaciones, controles, evidencia y hallazgos.
          </p>
          <form action={rebuild} className="mt-6">
            <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
              <RefreshCw className="h-4 w-4" /> Actualizar paquete
            </button>
          </form>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Obligaciones', summary.obligations || 0],
            ['Controles', summary.controls || 0],
            ['Evidencias', summary.evidence || 0],
            ['Hallazgos abiertos', summary.open_findings || 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-black">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-3"><FileArchive className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold">Evidencia incluida</h2></div>
            <div className="mt-5 space-y-3">
              {evidence.length === 0 ? <p className="text-sm text-muted-foreground">No hay evidencia registrada todavía.</p> : evidence.slice(0, 10).map((item: any) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.type || 'Evidencia'} · {item.status || 'sin validar'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold">Hallazgos</h2></div>
            <div className="mt-5 space-y-3">
              {findings.length === 0 ? <p className="text-sm text-muted-foreground">No hay hallazgos registrados.</p> : findings.slice(0, 10).map((item: any) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <p className="font-semibold">{item.description}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.type || 'Hallazgo'} · {item.status}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <p className="mt-6 text-sm text-muted-foreground">Generado: {new Date(auditPackage.generated_at).toLocaleString('es-CL')}</p>
      </main>
    </>
  )
}
