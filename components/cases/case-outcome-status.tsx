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

  const [{ data: workflow }, { data: plan }] = await Promise.all([
    admin
      .from('agent_workflows')
      .select('id,status,created_at')
      .eq('organization_id', organizationId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('compliance_action_plans')
      .select('id,status,source_workflow_id,source_contract_version,created_at')
      .eq('organization_id', organizationId)
      .eq('case_id', caseId)
      .not('source_snapshot_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const [{ data: tasks }, { data: snapshot }] = await Promise.all([
    plan
      ? admin
          .from('compliance_action_plan_tasks')
          .select('id,title,status,sequence,verification_status')
          .eq('action_plan_id', plan.id)
          .order('sequence', { ascending: true })
      : Promise.resolve({ data: [] }),
    workflow
      ? admin
          .from('agent_workflow_outcome_snapshots')
          .select('id,contract_version,outcome,frozen_at')
          .eq('organization_id', organizationId)
          .eq('workflow_id', workflow.id)
          .order('frozen_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const outcome = (snapshot?.outcome || null) as SnapshotOutcome | null
  const planTasks = tasks || []
  const activeTasks = planTasks.filter((task) => task.status !== 'cancelled')
  const verifiedCount = activeTasks.filter((task) => task.verification_status === 'verified').length
  const nextTask = activeTasks.find((task) => task.verification_status !== 'verified') || null
  const completed = Boolean(plan && activeTasks.length > 0 && verifiedCount === activeTasks.length)
  const approvedOutcome = outcome?.humanReviewStatus === 'approved'
  const hasApprovedActions = approvedOutcome && Array.isArray(outcome?.actions) && outcome.actions.length > 0

  if (!plan && !hasApprovedActions) return null

  return (
    <section className="mb-6 rounded-[4px] border border-primary/30 bg-primary/5 p-5 sm:p-6" id="resultado-del-caso">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-primary">
            {completed ? <CheckCircle2 className="h-5 w-5" /> : plan ? <ShieldCheck className="h-5 w-5" /> : <CircleDot className="h-5 w-5" />}
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Resultado y cierre</p>
          </div>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            {completed
              ? 'Cierre verificado'
              : plan
                ? nextTask?.title || 'Plan de cierre en curso'
                : outcome?.headline || 'Resultado aprobado listo para ejecutar'}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {completed
              ? `Las ${verifiedCount} acciones activas quedaron verificadas contra evidencia aceptada y revisión humana.`
              : plan
                ? `${verifiedCount} de ${activeTasks.length} acciones verificadas. Kumplio mantiene visible una sola siguiente acción hasta demostrar el cierre.`
                : outcome?.summary || 'El resultado ya fue aprobado humanamente y puede convertirse en un plan de cierre verificable.'}
          </p>

          {plan && !completed && nextTask && (
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              Estado de la siguiente acción: {closureLabel(nextTask.verification_status)}
            </p>
          )}
        </div>

        <Link
          href={`/app/casos/${caseId}/cierre`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[4px] bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {completed ? 'Ver evidencia de cierre' : plan ? 'Continuar cierre' : 'Activar cierre'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {plan && (
        <div className="mt-5 grid gap-3 border-t border-primary/20 pt-4 sm:grid-cols-3">
          <Metric label="Verificadas" value={`${verifiedCount}/${activeTasks.length}`} />
          <Metric label="Plan" value={plan.status} />
          <Metric label="Contrato" value={plan.source_contract_version || snapshot?.contract_version || 'outcome-v2'} />
        </div>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

function closureLabel(status: string) {
  if (status === 'pending_evidence') return 'falta evidencia'
  if (status === 'ready_for_review') return 'lista para revisión humana'
  if (status === 'changes_requested') return 'requiere cambios'
  if (status === 'verified') return 'verificada'
  return status
}
