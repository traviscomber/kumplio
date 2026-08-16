import type { SupabaseClient } from '@supabase/supabase-js'

export type ProviderConfigurationWork = {
  processId: string
  processName: string
  provider: 'Supabase' | 'OpenAI'
  tenantStatus: string
  request: {
    id: string
    status: string
    dueAt: string | null
    submittedEvidenceId: string | null
    reviewedAt: string | null
    reviewComment: string | null
  } | null
  submittedEvidence: {
    id: string
    validationStatus: string
    integrityStatus: string
    snapshotHash: string | null
    configurationKind: string | null
    configurationAsOf: string | null
  } | null
}

export async function getProviderConfigurationWork(
  admin: SupabaseClient,
  organizationId: string,
): Promise<ProviderConfigurationWork[]> {
  // This boundary intentionally reads server-side assurance metadata that evolves independently from generated types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data: processRows, error: processError } = await db.from('organization_processes')
    .select('id,name,attributes')
    .eq('organization_id', organizationId)
    .eq('process_type', 'processing_activity')
    .neq('lifecycle_status', 'retired')
    .order('name', { ascending: true })
    .limit(300)
  if (processError) throw new Error(`No fue posible cargar configuración de proveedores: ${processError.message}`)

  const processes = (processRows || []) as Array<Record<string, unknown>>
  const requestIds = unique(processes.map((row) => asObject(row.attributes).providerTenantConfigurationEvidenceRequestId))
  const { data: requestRows, error: requestError } = requestIds.length
    ? await db.from('evidence_requests')
      .select('id,status,due_at,submitted_evidence_id,reviewed_at,review_comment')
      .eq('organization_id', organizationId)
      .in('id', requestIds)
    : { data: [], error: null }
  if (requestError) throw new Error(`No fue posible cargar solicitudes tenant-specific: ${requestError.message}`)

  const requests = (requestRows || []) as Array<Record<string, unknown>>
  const evidenceIds = unique(requests.map((row) => row.submitted_evidence_id))
  const { data: evidenceRows, error: evidenceError } = evidenceIds.length
    ? await db.from('evidence')
      .select('id,validation_status,integrity_status,integrity_hash,metadata')
      .eq('organization_id', organizationId)
      .in('id', evidenceIds)
    : { data: [], error: null }
  if (evidenceError) throw new Error(`No fue posible cargar evidencia tenant-specific: ${evidenceError.message}`)

  const requestsById = indexBy(requests)
  const evidenceById = indexBy((evidenceRows || []) as Array<Record<string, unknown>>)

  return processes.flatMap((process): ProviderConfigurationWork[] => {
    const attributes = asObject(process.attributes)
    const providerRaw = text(attributes.providerTenantConfigurationVendor)
    if (providerRaw !== 'Supabase' && providerRaw !== 'OpenAI') return []
    const request = text(attributes.providerTenantConfigurationEvidenceRequestId)
      ? requestsById.get(String(attributes.providerTenantConfigurationEvidenceRequestId))
      : undefined
    const evidence = request?.submitted_evidence_id
      ? evidenceById.get(String(request.submitted_evidence_id))
      : undefined
    const metadata = asObject(evidence?.metadata)

    return [{
      processId: String(process.id),
      processName: String(process.name || 'Actividad de tratamiento'),
      provider: providerRaw,
      tenantStatus: String(attributes.providerTenantConfigurationStatus || 'unverified'),
      request: request ? {
        id: String(request.id),
        status: String(request.status || 'open'),
        dueAt: text(request.due_at),
        submittedEvidenceId: text(request.submitted_evidence_id),
        reviewedAt: text(request.reviewed_at),
        reviewComment: text(request.review_comment),
      } : null,
      submittedEvidence: evidence ? {
        id: String(evidence.id),
        validationStatus: String(evidence.validation_status || 'pending'),
        integrityStatus: String(evidence.integrity_status || 'pending'),
        snapshotHash: text(evidence.integrity_hash),
        configurationKind: text(metadata.configurationKind),
        configurationAsOf: text(metadata.configurationAsOf),
      } : null,
    }]
  })
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function text(value: unknown) { return typeof value === 'string' && value.trim() ? value.trim() : null }
function unique(values: unknown[]) { return [...new Set(values.filter(Boolean).map(String))] }
function indexBy(rows: Array<Record<string, unknown>>) { return new Map(rows.map((row): [string, Record<string, unknown>] => [String(row.id), row])) }
