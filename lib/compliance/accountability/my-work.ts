import type { SupabaseClient } from '@supabase/supabase-js'

export type WorkUrgency = 'overdue' | 'today' | 'soon' | 'scheduled' | 'unscheduled'

export type PersonalWorkItem = {
  id: string
  kind: 'mission' | 'decision'
  title: string
  summary: string | null
  priority: string
  status: string
  dueAt: string | null
  urgency: WorkUrgency
  href: string
}

export type PersonalWorkSummary = {
  items: PersonalWorkItem[]
  overdue: number
  dueToday: number
  dueSoon: number
  unassignedDates: number
}

export async function getPersonalWork(
  admin: SupabaseClient,
  organizationId: string,
  userId: string,
  now = new Date(),
): Promise<PersonalWorkSummary> {
  const [{ data: missions, error: missionError }, { data: decisions, error: decisionError }] = await Promise.all([
    admin
      .from('missions')
      .select('id,title,objective,priority,status,due_at')
      .eq('organization_id', organizationId)
      .eq('owner_id', userId)
      .not('status', 'in', '(completed,cancelled)')
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(100),
    admin
      .from('mission_decisions')
      .select('id,title,description,priority,status,requested_at')
      .eq('organization_id', organizationId)
      .eq('assigned_to', userId)
      .neq('status', 'resolved')
      .order('requested_at', { ascending: true })
      .limit(100),
  ])

  if (missionError) throw new Error(`No fue posible cargar tu trabajo: ${missionError.message}`)
  if (decisionError) throw new Error(`No fue posible cargar tus decisiones: ${decisionError.message}`)

  const missionItems: PersonalWorkItem[] = (missions || []).map((row) => ({
    id: String(row.id),
    kind: 'mission',
    title: String(row.title || 'Trabajo de cumplimiento'),
    summary: typeof row.objective === 'string' ? row.objective : null,
    priority: String(row.priority || 'medium'),
    status: String(row.status || 'pending'),
    dueAt: row.due_at ? String(row.due_at) : null,
    urgency: calculateUrgency(row.due_at ? String(row.due_at) : null, now),
    href: `/missions/${row.id}`,
  }))

  const decisionItems: PersonalWorkItem[] = (decisions || []).map((row) => ({
    id: String(row.id),
    kind: 'decision',
    title: String(row.title || 'Decisión pendiente'),
    summary: typeof row.description === 'string' ? row.description : null,
    priority: String(row.priority || 'medium'),
    status: String(row.status || 'pending'),
    dueAt: null,
    urgency: priorityUrgency(String(row.priority || 'medium')),
    href: '/decisions',
  }))

  const items = [...missionItems, ...decisionItems].sort(compareWorkItems)
  return {
    items,
    overdue: items.filter((item) => item.urgency === 'overdue').length,
    dueToday: items.filter((item) => item.urgency === 'today').length,
    dueSoon: items.filter((item) => item.urgency === 'soon').length,
    unassignedDates: missionItems.filter((item) => item.urgency === 'unscheduled').length,
  }
}

function calculateUrgency(value: string | null, now: Date): WorkUrgency {
  if (!value) return 'unscheduled'
  const due = new Date(value)
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  const soonLimit = new Date(todayStart)
  soonLimit.setDate(soonLimit.getDate() + 8)

  if (due < todayStart) return 'overdue'
  if (due < tomorrowStart) return 'today'
  if (due < soonLimit) return 'soon'
  return 'scheduled'
}

function priorityUrgency(priority: string): WorkUrgency {
  if (priority === 'critical') return 'today'
  if (priority === 'high') return 'soon'
  return 'unscheduled'
}

function compareWorkItems(left: PersonalWorkItem, right: PersonalWorkItem) {
  const rank: Record<WorkUrgency, number> = {
    overdue: 0,
    today: 1,
    soon: 2,
    unscheduled: 3,
    scheduled: 4,
  }
  const urgencyDifference = rank[left.urgency] - rank[right.urgency]
  if (urgencyDifference !== 0) return urgencyDifference
  if (left.dueAt && right.dueAt) return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime()
  return left.title.localeCompare(right.title, 'es')
}
