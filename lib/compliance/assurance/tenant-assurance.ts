import type { SupabaseClient } from '@supabase/supabase-js'

export type TenantAssuranceRun = {
  id: string
  runKey: string
  status: 'prepared' | 'running' | 'passed' | 'failed'
  primaryOrganizationId: string
  sandboxOrganizationId: string
  sandboxOrganizationName: string
  sandboxUserId: string
  sandboxUserLabel: string
  sandboxProjectId: string
  guidedCaseId: string
  workflowId: string
  missionId: string
  evidenceRequestId: string
  processingActivityId: string
  checkResults: Record<string, boolean>
  metrics: Record<string, unknown>
  latestError: string | null
  startedAt: string
  completedAt: string | null
  lastCheckedAt: string
}

export async function getLatestTenantAssuranceRun(
  admin: SupabaseClient,
  organizationId: string,
): Promise<TenantAssuranceRun | null> {
  // Internal assurance tables are deliberately outside generated client types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  const { data: row, error } = await db
    .from('tenant_assurance_runs')
    .select([
      'id',
      'run_key',
      'status',
      'primary_organization_id',
      'sandbox_organization_id',
      'sandbox_user_id',
      'sandbox_project_id',
      'guided_case_id',
      'workflow_id',
      'mission_id',
      'evidence_request_id',
      'processing_activity_id',
      'check_results',
      'metrics',
      'latest_error',
      'started_at',
      'completed_at',
      'last_checked_at',
    ].join(','))
    .or(`primary_organization_id.eq.${organizationId},sandbox_organization_id.eq.${organizationId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (['42P01', 'PGRST204', 'PGRST205'].includes(String(error.code || ''))) return null
    throw new Error(`No fue posible cargar tenant assurance: ${error.message}`)
  }
  if (!row) return null

  const [{ data: sandboxOrganization }, { data: sandboxProfile }] = await Promise.all([
    db.from('organizations')
      .select('name')
      .eq('id', row.sandbox_organization_id)
      .maybeSingle(),
    db.from('profiles')
      .select('first_name,last_name,email')
      .eq('id', row.sandbox_user_id)
      .maybeSingle(),
  ])

  const sandboxUserLabel = [sandboxProfile?.first_name, sandboxProfile?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || String(sandboxProfile?.email || 'Cuenta E2E interna')

  return {
    id: String(row.id),
    runKey: String(row.run_key),
    status: normalizeStatus(row.status),
    primaryOrganizationId: String(row.primary_organization_id),
    sandboxOrganizationId: String(row.sandbox_organization_id),
    sandboxOrganizationName: String(sandboxOrganization?.name || 'Tenant de assurance'),
    sandboxUserId: String(row.sandbox_user_id),
    sandboxUserLabel,
    sandboxProjectId: String(row.sandbox_project_id),
    guidedCaseId: String(row.guided_case_id),
    workflowId: String(row.workflow_id),
    missionId: String(row.mission_id),
    evidenceRequestId: String(row.evidence_request_id),
    processingActivityId: String(row.processing_activity_id),
    checkResults: booleanObject(row.check_results),
    metrics: object(row.metrics),
    latestError: text(row.latest_error),
    startedAt: String(row.started_at),
    completedAt: text(row.completed_at),
    lastCheckedAt: String(row.last_checked_at),
  }
}

function normalizeStatus(value: unknown): TenantAssuranceRun['status'] {
  if (value === 'running' || value === 'passed' || value === 'failed') return value
  return 'prepared'
}

function booleanObject(value: unknown) {
  const source = object(value)
  return Object.fromEntries(Object.entries(source).map(([key, item]) => [key, item === true]))
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}
