import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CheckCircle2, Clock3, ShieldCheck } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getWorkspaceAccess,
  listOrganizationDecisions,
  resolveDecision,
} from '@/lib/compliance/accountability/workspace-access'

export const dynamic = 'force-dynamic'

export default async function DecisionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/decisions')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  async function resolve(formData: FormData) {
    'use server'
    const serverSupabase = await createClient()
    const { data: { user: currentUser } } = await serverSupabase.auth.getUser()
    if (!currentUser) redirect('/sign-in?next=/decisions')

    const serverAdmin = createAdminClient()
    const currentAccess = await getWorkspaceAccess(serverAdmin, currentUser.id)
    if (!currentAccess) redirect('/onboarding')

    const decisionId = String(formData.get('decisionId') || '')
    const notes = String(formData.get('resolutionNotes') || '')
    await resolveDecision(serverAdmin, currentAccess, decisionId, notes)
    revalidatePath('/decisions')
    revalidatePath('/dashboard')
  }

  const decisions = await listOrganizationDecisions(admin, access.organizationId)
  const pending = decisions.filter((item) => item.status !== 'resolved')
  const resolved = decisions.filter((item) => item.status === 'resolved')

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Decisiones de cumplimiento</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {pending.length > 0 ? `${pending.length} decisiones esperan una respuesta.` : 'No hay decisiones pendientes.'}
          </h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Cada decisión conserva responsable, recomendación, justificación y fecha. Tu rol actual es {roleLabel(access.role)}.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          {pending.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
              <h2 className="mt-4 text-xl font-bold">Todo está resuelto por ahora.</h2>
            </div>
          ) : pending.map((decision) => (
            <article key={decision.id} className="rounded-2xl border bg-card p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                    <span>{decision.missionTitle}</span>
                    <span>Prioridad {priorityLabel(decision.priority)}</span>
                    <span>{new Date(decision.requestedAt).toLocaleString('es-CL')}</span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold">{decision.title}</h2>
                  {decision.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{decision.description}</p>}
                  {decision.recommendation && (
                    <p className="mt-4 text-sm leading-6"><span className="font-semibold">Recomendación preparada:</span> {decision.recommendation}</p>
                  )}

                  {access.canResolveDecisions ? (
                    <form action={resolve} className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <input type="hidden" name="decisionId" value={decision.id} />
                      <input
                        name="resolutionNotes"
                        required
                        minLength={3}
                        placeholder="Justificación de la decisión"
                        className="min-w-0 flex-1 rounded-xl border bg-background px-4 py-3 text-sm"
                      />
                      <button className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
                        Registrar decisión
                      </button>
                    </form>
                  ) : (
                    <p className="mt-5 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                      Puedes revisar esta decisión, pero tu rol no permite resolverla.
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-primary">Historial</p>
              <h2 className="text-xl font-bold">Decisiones resueltas</h2>
            </div>
          </div>
          <div className="mt-5 divide-y">
            {resolved.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Todavía no hay decisiones resueltas.</p>
            ) : resolved.slice(0, 25).map((decision) => (
              <div key={decision.id} className="py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{decision.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{decision.resolutionNotes || 'Sin nota registrada'}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {decision.resolvedAt ? new Date(decision.resolvedAt).toLocaleString('es-CL') : 'Resuelta'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

function roleLabel(role: string) {
  if (role === 'owner') return 'propietario'
  if (role === 'admin') return 'administrador'
  if (role === 'compliance') return 'responsable de cumplimiento'
  if (role === 'reviewer') return 'revisor'
  return 'miembro'
}

function priorityLabel(priority: string) {
  if (priority === 'critical') return 'crítica'
  if (priority === 'high') return 'alta'
  if (priority === 'low') return 'baja'
  return 'media'
}
