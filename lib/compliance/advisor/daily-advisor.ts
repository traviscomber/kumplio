import type { SupabaseClient } from '@supabase/supabase-js'
import { buildAdvisorReasoning, type AdvisorReasoning } from './reasoning'

export type AdvisorItem = {
  id: string
  title: string
  summary: string | null
  severity: string
  href: string
  reasoning: AdvisorReasoning
}

export type AdvisorSummary = {
  status: 'stable' | 'attention' | 'critical'
  openSituations: number
  pendingDecisions: number
  assignedWork: number
  estimatedMinutes: number
  priorities: AdvisorItem[]
  recentMemories: Array<{ id: string; title: string; summary: string; occurredAt: string }>
}

export async function getDailyAdvisorSummary(
  admin: SupabaseClient,
  organizationId: string,
  userId: string,
): Promise<AdvisorSummary> {
  // Newer domain tables may not yet be present in generated Supabase types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const [{ data: situations, error: situationError }, { data: decisions, error: decisionError }, { data: missions, error: missionError }, { data: memories, error: memoryError }] = await Promise.all([
    db.from('compliance_situations')
      .select('id,title,summary,severity,status,confidence,evidence_ids,mission_id,decision_id,recommendation,created_at')
      .eq('organization_id', organizationId)
      .not('status', 'in', '(resolved,dismissed)')
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('mission_decisions')
      .select('id,title,description,priority,status,assigned_to,requested_at,evidence_ids,recommendation')
      .eq('organization_id', organizationId)
      .neq('status', 'resolved')
      .order('requested_at', { ascending: true })
      .limit(50),
    db.from('missions')
      .select('id,title,objective,priority,status,owner_id,due_at')
      .eq('organization_id', organizationId)
      .eq('owner_id', userId)
      .not('status', 'in', '(completed,cancelled)')
      .limit(50),
    db.from('organization_memory')
      .select('id,title,summary,occurred_at')
      .eq('organization_id', organizationId)
      .order('occurred_at', { ascending: false })
      .limit(3),
  ])

  if (situationError) throw new Error(`No fue posible preparar el resumen: ${situationError.message}`)
  if (decisionError) throw new Error(`No fue posible preparar las decisiones: ${decisionError.message}`)
  if (missionError) throw new Error(`No fue posible preparar el trabajo: ${missionError.message}`)
  if (memoryError) throw new Error(`No fue posible preparar los precedentes: ${memoryError.message}`)

  const openSituations = situations || []
  const pendingDecisions = decisions || []
  const assignedWork = missions || []
  const critical = openSituations.filter((item: Record<string, unknown>) => item.severity === 'critical').length
  const high = openSituations.filter((item: Record<string, unknown>) => item.severity === 'high').length
  const status: AdvisorSummary['status'] = critical > 0 ? 'critical' : high > 0 || pendingDecisions.length > 0 ? 'attention' : 'stable'
  const precedentCount = (memories || []).length

  const priorities: AdvisorItem[] = [
    ...openSituations.map((item: Record<string, unknown>) => ({
      id: String(item.id),
      title: String(item.title || 'Situación pendiente'),
      summary: typeof item.summary === 'string' ? item.summary : null,
      severity: String(item.severity || 'medium'),
      href: `/situations/${item.id}`,
      reasoning: buildAdvisorReasoning({
        severity: String(item.severity || 'medium'),
        confidence: typeof item.confidence === 'number' ? item.confidence : null,
        evidenceCount: Array.isArray(item.evidence_ids) ? item.evidence_ids.length : 0,
        relatedCount: 0,
        precedentCount,
        hasMission: Boolean(item.mission_id),
        hasDecision: Boolean(item.decision_id),
        recommendation: typeof item.recommendation === 'string' ? item.recommendation : null,
      }),
    })),
    ...pendingDecisions
      .filter((item: Record<string, unknown>) => !item.assigned_to || item.assigned_to === userId)
      .map((item: Record<string, unknown>) => ({
        id: String(item.id),
        title: String(item.title || 'Decisión pendiente'),
        summary: typeof item.description === 'string' ? item.description : null,
        severity: String(item.priority || 'medium'),
        href: '/decisions',
        reasoning: buildAdvisorReasoning({
          severity: String(item.priority || 'medium'),
          confidence: null,
          evidenceCount: Array.isArray(item.evidence_ids) ? item.evidence_ids.length : 0,
          relatedCount: 0,
          precedentCount,
          hasMission: false,
          hasDecision: true,
          recommendation: typeof item.recommendation === 'string' ? item.recommendation : null,
        }),
      })),
  ].sort((left, right) => severityRank(left.severity) - severityRank(right.severity)).slice(0, 3)

  return {
    status,
    openSituations: openSituations.length,
    pendingDecisions: pendingDecisions.length,
    assignedWork: assignedWork.length,
    estimatedMinutes: Math.max(0, priorities.length * 4 + Math.min(assignedWork.length, 3) * 3),
    priorities,
    recentMemories: (memories || []).map((item: Record<string, unknown>) => ({
      id: String(item.id),
      title: String(item.title || 'Precedente'),
      summary: String(item.summary || ''),
      occurredAt: String(item.occurred_at),
    })),
  }
}

function severityRank(value: string) {
  if (value === 'critical') return 0
  if (value === 'high') return 1
  if (value === 'medium') return 2
  return 3
}
