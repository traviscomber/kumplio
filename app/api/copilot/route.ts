import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildCopilotPlan,
  classifyCopilotIntent,
  type CopilotResponse,
} from '@/lib/compliance-copilot/engine'

export const runtime = 'nodejs'

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

  const intent = classifyCopilotIntent(message)
  const plan = buildCopilotPlan(intent)
  const admin = createAdminClient()

  const [{ data: runs }, { data: targets }, { data: plans }, { data: evidence }] = await Promise.all([
    admin
      .from('regulatory_impact_runs')
      .select('id,status,metrics,trigger_reference,queued_at')
      .order('queued_at', { ascending: false })
      .limit(5),
    admin
      .from('regulatory_impact_targets')
      .select('id,impact_run_id,severity,review_status,impact_kind,node_snapshot,organization_id')
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('compliance_action_plans')
      .select('id,title,status,priority,due_date,impact_run_id')
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('evidence')
      .select('id,name,validation_status,integrity_status,expires_at')
      .order('created_at', { ascending: false })
      .limit(25),
  ])

  const latestRun = runs?.[0]
  const activeTargets = (targets || []).filter((target) => target.review_status === 'review_required')
  const critical = activeTargets.filter((target) => target.severity === 'critical').length
  const high = activeTargets.filter((target) => target.severity === 'high').length
  const openPlans = (plans || []).filter((item) => !['completed', 'cancelled'].includes(item.status))
  const expiredEvidence = (evidence || []).filter((item) => item.expires_at && new Date(item.expires_at) < new Date())

  let answer = 'Kumplio no encontró suficiente contexto para una respuesta operativa todavía.'
  const facts: CopilotResponse['facts'] = []
  const sources: CopilotResponse['sources'] = []
  const actions: CopilotResponse['actions'] = []

  if (intent === 'impact_summary') {
    const total = asNumber(latestRun?.metrics?.targets) || activeTargets.length
    answer = latestRun
      ? `El último impacto regulatorio detectó ${total} objetivo${total === 1 ? '' : 's'} afectado${total === 1 ? '' : 's'}. ${critical + high} requieren atención prioritaria y no se aplicaron cambios automáticos.`
      : 'Aún no existen impactos regulatorios procesados.'
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
      ? `Hay ${openPlans.length} plan${openPlans.length === 1 ? '' : 'es'} de acción abierto${openPlans.length === 1 ? '' : 's'}. La prioridad es revisar responsables, fechas y tareas aún pendientes.`
      : activeTargets.length
        ? `Existen ${activeTargets.length} objetivos afectados que todavía requieren revisión. Puedes convertir el impacto más reciente en un plan de acción.`
        : 'No hay planes abiertos ni impactos pendientes de convertir en trabajo.'
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
        ? `No hay objetivos críticos, pero existen ${high} impactos de severidad alta que requieren revisión.`
        : 'No hay impactos críticos o altos abiertos en este momento.'
    facts.push(
      { label: 'Críticos', value: String(critical) },
      { label: 'Altos', value: String(high) },
      { label: 'Organizaciones afectadas', value: String(new Set(activeTargets.map((item) => item.organization_id).filter(Boolean)).size) },
    )
    actions.push({ label: 'Revisar prioridades', href: '/roc' })
  } else if (intent === 'evidence_query') {
    answer = evidence?.length
      ? `Se revisaron ${evidence.length} evidencias recientes. ${expiredEvidence.length} están vencidas y requieren reemplazo o revalidación.`
      : 'Todavía no existen evidencias registradas para analizar.'
    facts.push(
      { label: 'Evidencias recientes', value: String(evidence?.length || 0) },
      { label: 'Vencidas', value: String(expiredEvidence.length) },
      { label: 'Validadas', value: String((evidence || []).filter((item) => item.validation_status === 'validated').length) },
    )
    for (const item of expiredEvidence.slice(0, 3)) {
      sources.push({ type: 'evidence', id: item.id, label: item.name })
    }
    actions.push({ label: 'Ver trabajo', href: '/missions' })
  } else if (intent === 'version_compare') {
    answer = latestRun
      ? 'El comparador visual todavía no está activado, pero el último run ya identifica los nodos afectados y permite reconstruir el recorrido del cambio.'
      : 'No hay un cambio regulatorio procesado para comparar todavía.'
    facts.push(
      { label: 'Nodos afectados', value: String(asNumber(latestRun?.metrics?.targets)) },
      { label: 'Motor', value: 'Compliance Graph v2' },
    )
    if (latestRun) actions.push({ label: 'Abrir recorrido', href: `/roc/${latestRun.id}` })
  } else {
    answer = `Kumplio tiene ${activeTargets.length} impactos pendientes, ${openPlans.length} planes abiertos y ${expiredEvidence.length} evidencias vencidas. Puedes preguntar “¿qué cambió?”, “¿qué debo hacer?”, “¿cuál es el mayor riesgo?” o “muéstrame evidencia”.`
    facts.push(
      { label: 'Impactos pendientes', value: String(activeTargets.length) },
      { label: 'Planes abiertos', value: String(openPlans.length) },
      { label: 'Evidencias vencidas', value: String(expiredEvidence.length) },
    )
    actions.push({ label: 'Abrir ROC', href: '/roc' })
  }

  const response: CopilotResponse = { intent, answer, facts, sources, actions, plan }
  return NextResponse.json(response)
}
