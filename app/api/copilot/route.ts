import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildCopilotPlan,
  classifyCopilotIntent,
  type CopilotResponse,
  type CopilotRouting,
} from '@/lib/compliance-copilot/engine'
import { buildOfficialFastTrackResponse } from '@/lib/compliance-copilot/fast-track'
import { orchestrateGroundedResponse } from '@/lib/ai-platform/orchestrator'

export const runtime = 'nodejs'

type ImpactRun = {
  id: string
  status: string | null
  metrics: Record<string, unknown> | null
  trigger_reference: string | null
  queued_at: string | null
}

type ImpactTarget = {
  id: string
  impact_run_id: string | null
  severity: string | null
  review_status: string | null
  impact_kind: string | null
  node_snapshot: Record<string, unknown> | null
  organization_id: string | null
}

type ActionPlan = {
  id: string
  title: string
  status: string
  priority: string | null
  due_date: string | null
  impact_run_id: string | null
}

type EvidenceRow = {
  id: string
  name: string
  validation_status: string | null
  integrity_status: string | null
  expires_at: string | null
}

function asNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })

  const body = await request.json().catch(() => null) as { message?: unknown } | null
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  if (message.length < 3) return NextResponse.json({ error: 'Escribe una consulta más específica.' }, { status: 400 })

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (membershipError || !membership?.organization_id) {
    return NextResponse.json({ error: 'Necesitas un workspace activo para usar Kumplio.' }, { status: 403 })
  }
  const organizationId = membership.organization_id

  const fastTrack = buildOfficialFastTrackResponse(message)
  if (fastTrack) {
    const response = await orchestrateGroundedResponse({
      userMessage: message,
      deterministic: fastTrack.response,
      actorUserId: user.id,
      organizationId,
      surface: 'copilot',
      skipGeneration: true,
      metadata: {
        track: 'fast_track',
        guideSlug: fastTrack.guide.slug,
        officialSource: true,
        operationalReads: 0,
      },
    })
    return NextResponse.json(response)
  }

  const intent = classifyCopilotIntent(message)
  const plan = buildCopilotPlan(intent)
  const routing: CopilotRouting = {
    track: 'full_agentic',
    complexity: intent === 'general_navigation' ? 'contextual' : 'multi_step',
    confidence: intent === 'general_navigation' ? 0.82 : 0.94,
    reason: intent === 'general_navigation'
      ? 'No hubo una coincidencia oficial suficientemente clara para FastTrack; la consulta se resuelve con contexto operacional tenant-scoped.'
      : 'La consulta requiere contexto operacional de la organización o una respuesta compuesta.',
    signals: intent === 'general_navigation'
      ? ['fast_track_miss', 'tenant_context_required']
      : [`intent:${intent}`, 'tenant_context_required'],
    escalated: intent === 'general_navigation',
    retrievalHitCount: 0,
  }

  let runs: ImpactRun[] = []
  let targets: ImpactTarget[] = []
  let plans: ActionPlan[] = []
  let evidence: EvidenceRow[] = []

  try {
    const needsTargets = ['impact_summary', 'action_plan', 'risk_analysis', 'version_compare', 'general_navigation'].includes(intent)
    const needsEvidence = ['evidence_query', 'general_navigation'].includes(intent)
    const needsPlans = ['action_plan', 'general_navigation'].includes(intent)
    const needsRuns = ['impact_summary', 'action_plan', 'version_compare'].includes(intent)

    if (needsTargets) {
      const result = await supabase
        .from('regulatory_impact_targets')
        .select('id,impact_run_id,severity,review_status,impact_kind,node_snapshot,organization_id')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (result.error) throw new Error('targets_unavailable')
      targets = (result.data || []) as ImpactTarget[]
    }

    const allowedRunIds = [...new Set(targets.map((target) => target.impact_run_id).filter((id): id is string => Boolean(id)))]

    if (needsRuns && allowedRunIds.length) {
      const result = await supabase
        .from('regulatory_impact_runs')
        .select('id,status,metrics,trigger_reference,queued_at')
        .in('id', allowedRunIds)
        .order('queued_at', { ascending: false })
        .limit(5)
      if (result.error) throw new Error('runs_unavailable')
      runs = (result.data || []) as ImpactRun[]
    }

    if (needsPlans && allowedRunIds.length) {
      const result = await supabase
        .from('compliance_action_plans')
        .select('id,title,status,priority,due_date,impact_run_id')
        .in('impact_run_id', allowedRunIds)
        .order('created_at', { ascending: false })
        .limit(20)
      if (result.error) throw new Error('plans_unavailable')
      plans = (result.data || []) as ActionPlan[]
    }

    if (needsEvidence) {
      const result = await supabase
        .from('evidence')
        .select('id,name,validation_status,integrity_status,expires_at')
        .order('created_at', { ascending: false })
        .limit(25)
      if (result.error) throw new Error('evidence_unavailable')
      evidence = (result.data || []) as EvidenceRow[]
    }
  } catch (error) {
    console.error('[copilot/context]', error instanceof Error ? error.message : 'context_unavailable')
    return NextResponse.json({
      error: 'No fue posible consultar el contexto de tu organización de forma segura. Intenta nuevamente.',
      code: 'tenant_context_unavailable',
    }, { status: 503 })
  }

  const latestRun = runs[0]
  const activeTargets = targets.filter((target) => target.review_status === 'review_required')
  const critical = activeTargets.filter((target) => target.severity === 'critical').length
  const high = activeTargets.filter((target) => target.severity === 'high').length
  const openPlans = plans.filter((item) => !['completed', 'cancelled'].includes(item.status))
  const expiredEvidence = evidence.filter((item) => item.expires_at && new Date(item.expires_at) < new Date())

  let answer = 'Kumplio no encontró suficiente contexto para una respuesta operativa todavía.'
  const facts: CopilotResponse['facts'] = []
  const sources: CopilotResponse['sources'] = []
  const actions: CopilotResponse['actions'] = []

  if (intent === 'impact_summary') {
    const total = asNumber(latestRun?.metrics?.targets) || activeTargets.length
    answer = latestRun
      ? `El último impacto regulatorio detectó ${total} objetivo${total === 1 ? '' : 's'} afectado${total === 1 ? '' : 's'}. ${critical + high} requieren atención prioritaria y no se aplicaron cambios automáticos.`
      : activeTargets.length
        ? `Hay ${activeTargets.length} impacto${activeTargets.length === 1 ? '' : 's'} de tu organización pendiente${activeTargets.length === 1 ? '' : 's'} de revisión. No se encontró un run asociado visible para este workspace.`
        : 'Aún no existen impactos regulatorios pendientes visibles para tu organización.'
    facts.push(
      { label: 'Impactos prioritarios', value: String(critical + high) },
      { label: 'Revisión requerida', value: String(activeTargets.length) },
      { label: 'Mutaciones automáticas', value: String(asNumber(latestRun?.metrics?.mutations_applied)) },
    )
    if (latestRun) {
      sources.push({ type: 'impact_run', id: latestRun.id, label: 'Último run de impacto' })
      actions.push({ label: 'Abrir impacto', href: `/roc/${latestRun.id}` })
    }
    actions.push({ label: 'Ver ROC', href: '/roc' })
  } else if (intent === 'action_plan') {
    answer = openPlans.length
      ? `Hay ${openPlans.length} plan${openPlans.length === 1 ? '' : 'es'} de acción abierto${openPlans.length === 1 ? '' : 's'} para impactos visibles de tu organización. La prioridad es revisar responsables, fechas y tareas aún pendientes.`
      : activeTargets.length
        ? `Existen ${activeTargets.length} objetivos afectados que todavía requieren revisión. Puedes convertir el impacto más reciente en un plan de acción.`
        : 'No hay planes abiertos ni impactos pendientes visibles para tu organización.'
    facts.push(
      { label: 'Planes abiertos', value: String(openPlans.length) },
      { label: 'Impactos sin resolver', value: String(activeTargets.length) },
    )
    if (openPlans[0]) {
      sources.push({ type: 'action_plan', id: openPlans[0].id, label: openPlans[0].title })
      actions.push({ label: 'Abrir plan', href: `/action-plans/${openPlans[0].id}` })
    } else if (latestRun) {
      actions.push({ label: 'Crear plan desde impacto', href: `/roc/${latestRun.id}` })
    }
  } else if (intent === 'risk_analysis') {
    answer = critical
      ? `El mayor riesgo actual está concentrado en ${critical} objetivo${critical === 1 ? '' : 's'} crítico${critical === 1 ? '' : 's'} y ${high} de severidad alta. Todos continúan sujetos a revisión humana.`
      : high
        ? `No hay objetivos críticos visibles, pero existen ${high} impactos de severidad alta que requieren revisión.`
        : 'No hay impactos críticos o altos abiertos visibles para tu organización en este momento.'
    facts.push(
      { label: 'Críticos', value: String(critical) },
      { label: 'Altos', value: String(high) },
      { label: 'Organización analizada', value: 'Tu workspace actual' },
    )
    actions.push({ label: 'Revisar prioridades', href: '/roc' })
  } else if (intent === 'evidence_query') {
    answer = evidence.length
      ? `Se revisaron ${evidence.length} evidencias recientes visibles para tu workspace. ${expiredEvidence.length} están vencidas y requieren reemplazo o revalidación.`
      : 'Todavía no existen evidencias visibles para tu workspace que Kumplio pueda analizar.'
    facts.push(
      { label: 'Evidencias recientes', value: String(evidence.length) },
      { label: 'Vencidas', value: String(expiredEvidence.length) },
      { label: 'Validadas', value: String(evidence.filter((item) => item.validation_status === 'validated').length) },
    )
    for (const item of expiredEvidence.slice(0, 3)) {
      sources.push({ type: 'evidence', id: item.id, label: item.name })
    }
    actions.push({ label: 'Ver trabajo', href: '/missions' })
  } else if (intent === 'version_compare') {
    answer = latestRun
      ? 'El comparador visual todavía no está activado, pero el último run visible para tu organización identifica nodos afectados y permite reconstruir el recorrido del cambio.'
      : 'No hay un cambio regulatorio procesado visible para tu organización que pueda compararse todavía.'
    facts.push(
      { label: 'Nodos afectados', value: String(asNumber(latestRun?.metrics?.targets)) },
      { label: 'Motor', value: 'Compliance Graph v2' },
    )
    if (latestRun) actions.push({ label: 'Abrir recorrido', href: `/roc/${latestRun.id}` })
  } else {
    answer = `Kumplio tiene ${activeTargets.length} impactos pendientes, ${openPlans.length} planes abiertos y ${expiredEvidence.length} evidencias vencidas visibles para tu workspace. Puedes preguntar “¿qué cambió?”, “¿qué debo hacer?”, “¿cuál es el mayor riesgo?” o “muéstrame evidencia”.`
    facts.push(
      { label: 'Impactos pendientes', value: String(activeTargets.length) },
      { label: 'Planes abiertos', value: String(openPlans.length) },
      { label: 'Evidencias vencidas', value: String(expiredEvidence.length) },
    )
    actions.push({ label: 'Abrir ROC', href: '/roc' })
  }

  const deterministic: CopilotResponse = {
    intent,
    answer,
    facts,
    sources,
    actions,
    plan,
    routing,
    generation: { mode: 'deterministic' },
  }

  const response = await orchestrateGroundedResponse({
    userMessage: message,
    deterministic,
    actorUserId: user.id,
    organizationId,
    surface: 'copilot',
    metadata: {
      track: 'full_agentic',
      operationalReads: Number(targets.length > 0) + Number(runs.length > 0) + Number(plans.length > 0) + Number(evidence.length > 0),
      tenantScoped: true,
    },
  })
  return NextResponse.json(response)
}
