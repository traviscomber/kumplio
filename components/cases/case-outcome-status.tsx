import Link from 'next/link'
import { ArrowRight, CheckCircle2, CircleDot, ShieldCheck } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'

type SnapshotOutcome = {
  headline?: string
  summary?: string
  humanReviewStatus?: string
  actions?: Array<{ title?: string }>
}

export async function CaseOutcomeStatus({ caseId }: { caseId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) return null
  const organizationId = access.organizationId

  const [{ data: workflow }, { data: plan }, { data: similarPlans }] = await Promise.all([
    admin.from('agent_workflows').select('id,status,created_at').eq('organization_id', organizationId).eq('case_id', caseId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('compliance_action_plans').select('id,status,source_workflow_id,source_contract_version,created_at').eq('organization_id', organizationId).eq('case_id', caseId).not('source_snapshot_id', 'is', null).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const [{ data: tasks }, { data: snapshot }] = await Promise.all([
    plan ? admin.from('compliance_action_plan_tasks').select('id,title,status,sequence,verification_status').eq('action_plan_id', plan.id).order('sequence', { ascending: true }) : Promise.resolve({ data: [] }),
    workflow ? admin.from('agent_workflow_outcome_snapshots').select('id,contract_version,outcome,frozen_at').eq('organization_id', organizationId).eq('workflow_id', workflow.id).order('frozen_at', { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null }),
  ])

  const outcome = (snapshot?.outcome || null) as SnapshotOutcome | null
  const activeTasks = (tasks || []).filter((task) => task.status !== 'cancelled')
  const verifiedCount = activeTasks.filter((task) => task.verification_status === 'verified').length
  const nextTask = activeTasks.find((task) => task.verification_status !== 'verified') || null
  const completed = Boolean(plan && activeTasks.length > 0 && verifiedCount === activeTasks.length)
  const approvedOutcome = outcome?.humanReviewStatus === 'approved'
  const hasApprovedActions = approvedOutcome && Array.isArray(outcome?.actions) && outcome.actions.length > 0

  if (!plan && !hasApprovedActions) return null

  const primaryTitle = completed ? 'Cierre verificado' : plan ? nextTask?.title || 'Plan de cierre en curso' : outcome?.headline || 'Resultado aprobado listo para ejecutar'
  const whatHappened = outcome?.summary || (plan ? 'Kumplio convirtió el resultado aprobado en acciones concretas de cierre.' : 'El análisis ya tiene un resultado aprobado y está listo para convertirse en acciones verificables.')
  const whatYouNeed = completed ? 'No necesitas realizar otra acción en este cierre.' : plan && nextTask ? humanNeed(nextTask.verification_status, nextTask.title) : 'Activa el cierre para que Kumplio prepare y ordene las acciones necesarias.'
  const whatKumplioDoes = completed ? 'Kumplio conserva la evidencia y la revisión humana que sustentan este cierre.' : plan ? 'Kumplio mantiene el contexto, la evidencia y el progreso; te mostrará una sola decisión o acción humana a la vez.' : 'Kumplio preparará el plan y conservará la trazabilidad sin obligarte a navegar el workflow interno.'

  return (
    <section className="mb-6 rounded-[4px] border border-primary/30 bg-primary/5 p-5 sm:p-6" id="resultado-del-caso">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-primary">
            {completed ? <CheckCircle2 className="h-5 w-5" /> : plan ? <ShieldCheck className="h-5 w-5" /> : <CircleDot className="h-5 w-5" />}
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Resultado del caso</p>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">{primaryTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{whatHappened}</p>
        </div>
        <Link href={`/app/casos/${caseId}/cierre`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[4px] bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
          {completed ? 'Ver evidencia' : plan ? 'Resolver siguiente paso' : 'Activar cierre'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-3 border-t border-primary/20 pt-5 md:grid-cols-3">
        <OutcomeBlock label="Qué encontramos" value={whatHappened} />
        <OutcomeBlock label="Qué necesitas hacer" value={whatYouNeed} emphasis={!completed} />
        <OutcomeBlock label="Qué hará Kumplio" value={whatKumplioDoes} />
      </div>

      {plan && (
        <div className="mt-5 grid gap-3 border-t border-primary/20 pt-5 md:grid-cols-2">
          <div className="rounded-[4px] border bg-background/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Antes</p>
            <p className="mt-2 text-sm leading-6">{activeTasks.length - verifiedCount} de {activeTasks.length} acciones todavía no tenían cierre verificado.</p>
          </div>
          <div className="rounded-[4px] border border-primary/25 bg-background/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Ahora</p>
            <p className="mt-2 text-sm leading-6">{completed ? `Las ${activeTasks.length} acciones activas tienen cierre verificado.` : `${verifiedCount} acciones ya tienen cierre verificado y ${activeTasks.length - verifiedCount} siguen abiertas.`}</p>
          </div>
        </div>
      )}

      {similarPlans?.length ? (
        <details className="mt-5 border-t border-primary/20 pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">Aprendizaje de resultados anteriores ({similarPlans.length})</summary>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">Kumplio conserva resultados previos del mismo tenant como contexto potencial. No los aplica automáticamente: primero debe comprobar que el caso, la evidencia y los criterios realmente correspondan.</p>
        </details>
      ) : null}

      {plan && (
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-primary/20 pt-4 text-sm">
          <span><strong>{verifiedCount}/{activeTasks.length}</strong> acciones verificadas</span>
          {!completed && nextTask && <span className="text-muted-foreground">Siguiente estado: {closureLabel(nextTask.verification_status)}</span>}
          {completed && <span className="font-semibold text-primary">Resultado demostrado con evidencia y revisión humana</span>}
        </div>
      )}
    </section>
  )
}

function OutcomeBlock({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={emphasis ? 'rounded-[4px] border border-primary/25 bg-background/70 p-4' : 'p-4'}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6">{value}</p>
    </div>
  )
}

function humanNeed(status: string, title: string) {
  if (status === 'pending_evidence') return `Aporta o confirma la evidencia necesaria para “${title}”.`
  if (status === 'ready_for_review') return `Revisa “${title}” y toma la decisión humana pendiente.`
  if (status === 'changes_requested') return `Corrige los cambios solicitados en “${title}”.`
  return `Continúa con “${title}”.`
}

function closureLabel(status: string) {
  if (status === 'pending_evidence') return 'falta evidencia'
  if (status === 'ready_for_review') return 'lista para revisión humana'
  if (status === 'changes_requested') return 'requiere cambios'
  if (status === 'verified') return 'verificada'
  return status
}
