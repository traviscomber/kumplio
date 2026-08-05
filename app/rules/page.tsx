import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CheckCircle2, Power, SlidersHorizontal } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { listRules, setRuleEnabled, setRulePriority } from '@/lib/compliance/autonomy/rules-admin'

export const dynamic = 'force-dynamic'

export default async function RulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/rules')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  async function toggleRule(formData: FormData) {
    'use server'
    const serverSupabase = await createClient()
    const { data: { user: currentUser } } = await serverSupabase.auth.getUser()
    if (!currentUser) redirect('/sign-in?next=/rules')
    const serverAdmin = createAdminClient()
    const currentAccess = await getWorkspaceAccess(serverAdmin, currentUser.id)
    if (!currentAccess || !currentAccess.canAssignWork) throw new Error('Tu rol no permite administrar reglas.')
    await setRuleEnabled(
      serverAdmin,
      currentAccess.organizationId,
      String(formData.get('ruleId') || ''),
      String(formData.get('enabled')) === 'true',
    )
    revalidatePath('/rules')
  }

  async function updatePriority(formData: FormData) {
    'use server'
    const serverSupabase = await createClient()
    const { data: { user: currentUser } } = await serverSupabase.auth.getUser()
    if (!currentUser) redirect('/sign-in?next=/rules')
    const serverAdmin = createAdminClient()
    const currentAccess = await getWorkspaceAccess(serverAdmin, currentUser.id)
    if (!currentAccess || !currentAccess.canAssignWork) throw new Error('Tu rol no permite administrar reglas.')
    await setRulePriority(
      serverAdmin,
      currentAccess.organizationId,
      String(formData.get('ruleId') || ''),
      Number(formData.get('priority') || 100),
    )
    revalidatePath('/rules')
  }

  const rules = await listRules(admin, access.organizationId)

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Reglas automáticas</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {rules.length === 0 ? 'No hay reglas configuradas.' : `${rules.length} reglas están disponibles.`}
          </h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Activa, pausa y ordena las reglas que convierten eventos en situaciones de cumplimiento.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          {rules.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
              <h2 className="mt-4 text-xl font-bold">Todavía no hay reglas para administrar.</h2>
            </div>
          ) : rules.map((rule) => (
            <article key={rule.id} className="rounded-2xl border bg-card p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <span>{rule.eventType}</span>
                    <span>Prioridad {rule.priority}</span>
                    <span>{rule.enabled ? 'Activa' : 'Pausada'}</span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold">{rule.ruleKey}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {rule.conditions.length} condiciones · {rule.actions.length} acciones
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <form action={updatePriority} className="flex items-center gap-2">
                    <input type="hidden" name="ruleId" value={rule.id} />
                    <input
                      name="priority"
                      type="number"
                      min={1}
                      max={9999}
                      defaultValue={rule.priority}
                      className="w-24 rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                    <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold">
                      <SlidersHorizontal className="h-4 w-4" /> Guardar
                    </button>
                  </form>
                  <form action={toggleRule}>
                    <input type="hidden" name="ruleId" value={rule.id} />
                    <input type="hidden" name="enabled" value={String(!rule.enabled)} />
                    <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                      <Power className="h-4 w-4" /> {rule.enabled ? 'Pausar' : 'Activar'}
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  )
}
