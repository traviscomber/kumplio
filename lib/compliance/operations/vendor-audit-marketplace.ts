import type { SupabaseClient } from '@supabase/supabase-js'

export type VendorAssessment = {
  id: string
  vendorId: string
  vendorName: string
  serviceCategory: string | null
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  findings: Array<{ code: string; label: string }>
  recommendedAction: string
  assessedAt: string
}

export type VendorDetail = VendorAssessment & {
  country: string | null
  processesPersonalData: boolean
  crossBorderTransfer: boolean
  contractExpiresAt: string | null
  lifecycleStatus: string
  attributes: Record<string, unknown>
}

export type AuditEvidenceItem = {
  id: string
  name: string
  type: string | null
  status: string | null
}

export type AuditFindingItem = {
  id: string
  description: string
  type: string | null
  status: string | null
}

export type AuditPackage = {
  id: string
  status: string
  summary: Record<string, number>
  evidenceSnapshot: AuditEvidenceItem[]
  findingsSnapshot: AuditFindingItem[]
  generatedAt: string
}

export async function refreshVendorAssessments(admin: SupabaseClient, organizationId: string): Promise<VendorAssessment[]> {
  const { data, error } = await admin.rpc('refresh_vendor_assessments_v1', { p_organization_id: organizationId })
  if (error) throw new Error(`No fue posible evaluar proveedores: ${error.message}`)

  const rows = Array.isArray(data) ? data : []
  const vendorIds = rows.map((row) => row.vendor_id).filter(Boolean)
  const { data: vendors, error: vendorError } = vendorIds.length
    ? await admin.from('organization_vendors').select('id,name,service_category').in('id', vendorIds)
    : { data: [], error: null }
  if (vendorError) throw new Error(`No fue posible cargar proveedores: ${vendorError.message}`)

  const vendorMap = new Map((vendors || []).map((vendor) => [vendor.id, vendor]))
  return rows.map((row) => {
    const vendor = vendorMap.get(row.vendor_id)
    return {
      id: String(row.id),
      vendorId: String(row.vendor_id),
      vendorName: vendor?.name || 'Proveedor',
      serviceCategory: vendor?.service_category || null,
      riskScore: Number(row.risk_score || 0),
      riskLevel: normalizeRiskLevel(row.risk_level),
      findings: normalizeVendorFindings(row.findings),
      recommendedAction: String(row.recommended_action || 'Revisar antecedentes del proveedor.'),
      assessedAt: String(row.assessed_at || new Date().toISOString()),
    }
  })
}

export async function getVendorDetail(
  admin: SupabaseClient,
  organizationId: string,
  vendorId: string,
): Promise<VendorDetail | null> {
  const assessments = await refreshVendorAssessments(admin, organizationId)
  const assessment = assessments.find((item) => item.vendorId === vendorId)
  if (!assessment) return null

  const { data, error } = await admin
    .from('organization_vendors')
    .select('id,country,processes_personal_data,cross_border_transfer,contract_expires_at,lifecycle_status,attributes')
    .eq('id', vendorId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error) throw new Error(`No fue posible cargar el proveedor: ${error.message}`)
  if (!data) return null

  return {
    ...assessment,
    country: data.country || null,
    processesPersonalData: Boolean(data.processes_personal_data),
    crossBorderTransfer: Boolean(data.cross_border_transfer),
    contractExpiresAt: data.contract_expires_at || null,
    lifecycleStatus: data.lifecycle_status || 'active',
    attributes: data.attributes && typeof data.attributes === 'object' ? data.attributes as Record<string, unknown> : {},
  }
}

export async function getLatestAuditPackage(
  admin: SupabaseClient,
  organizationId: string,
  projectId: string,
): Promise<AuditPackage | null> {
  const { data, error } = await admin
    .from('audit_preparation_packages')
    .select('id,status,summary,evidence_snapshot,findings_snapshot,generated_at')
    .eq('organization_id', organizationId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) throw new Error(`No fue posible cargar el paquete de auditoría: ${error.message}`)
  return data ? normalizeAuditPackage(data) : null
}

export async function prepareAuditPackage(
  admin: SupabaseClient,
  organizationId: string,
  projectId: string,
  userId: string,
): Promise<AuditPackage> {
  const { data, error } = await admin.rpc('prepare_audit_package_v1', {
    p_organization_id: organizationId,
    p_project_id: projectId,
    p_generated_by: userId,
  })
  if (error) throw new Error(`No fue posible preparar la auditoría: ${error.message}`)
  if (!data || typeof data !== 'object') throw new Error('La preparación de auditoría no devolvió un paquete válido.')
  return normalizeAuditPackage(data)
}

export async function installMarketplacePack(
  admin: SupabaseClient,
  organizationId: string,
  versionId: string,
  userId: string,
): Promise<void> {
  const { data: version, error: versionError } = await admin
    .from('marketplace_item_versions')
    .select('id,release_status,required_permissions')
    .eq('id', versionId)
    .eq('release_status', 'released')
    .maybeSingle()
  if (versionError) throw new Error(`No fue posible validar el pack: ${versionError.message}`)
  if (!version) throw new Error('El pack solicitado no tiene una versión publicada disponible.')

  const permissions = Array.isArray(version.required_permissions)
    ? version.required_permissions.filter((value): value is string => typeof value === 'string')
    : []

  const { error } = await admin.from('organization_marketplace_installations').upsert({
    organization_id: organizationId,
    marketplace_item_version_id: versionId,
    installation_status: 'installed',
    configuration: {},
    granted_permissions: permissions,
    installed_resources: {},
    installed_by: userId,
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
    installed_at: new Date().toISOString(),
  }, { onConflict: 'organization_id,marketplace_item_version_id' })
  if (error) throw new Error(`No fue posible instalar el pack: ${error.message}`)
}

export async function getMarketplace(admin: SupabaseClient, organizationId: string) {
  const [{ data: items, error: itemsError }, { data: installations, error: installError }] = await Promise.all([
    admin
      .from('marketplace_items')
      .select('id,slug,item_type,name,summary,domain,publisher_name,current_version,pricing_model,metadata,lifecycle_status,visibility')
      .eq('lifecycle_status', 'active')
      .in('visibility', ['public', 'private'])
      .order('name'),
    admin
      .from('organization_marketplace_installations')
      .select('id,marketplace_item_version_id,installation_status,installed_at')
      .eq('organization_id', organizationId),
  ])
  if (itemsError) throw new Error(`No fue posible cargar el marketplace: ${itemsError.message}`)
  if (installError) throw new Error(`No fue posible cargar instalaciones: ${installError.message}`)

  const versions = (items || []).map((item) => ({ itemId: item.id, version: item.current_version }))
  const { data: versionRows, error: versionError } = versions.length
    ? await admin
        .from('marketplace_item_versions')
        .select('id,marketplace_item_id,version,release_status,manifest,required_permissions')
        .in('marketplace_item_id', versions.map((item) => item.itemId))
        .eq('release_status', 'released')
    : { data: [], error: null }
  if (versionError) throw new Error(`No fue posible cargar versiones: ${versionError.message}`)

  const installedVersionIds = new Set((installations || []).map((row) => row.marketplace_item_version_id))
  return (items || []).map((item) => {
    const version = (versionRows || []).find((row) => row.marketplace_item_id === item.id && row.version === item.current_version)
    return {
      ...item,
      versionId: version?.id || null,
      manifest: version?.manifest || {},
      requiredPermissions: Array.isArray(version?.required_permissions) ? version.required_permissions.filter((value): value is string => typeof value === 'string') : [],
      installed: version ? installedVersionIds.has(version.id) : false,
    }
  })
}

function normalizeAuditPackage(value: unknown): AuditPackage {
  const row = value as Record<string, unknown>
  return {
    id: String(row.id || ''),
    status: String(row.status || 'ready'),
    summary: normalizeSummary(row.summary),
    evidenceSnapshot: normalizeEvidence(row.evidence_snapshot),
    findingsSnapshot: normalizeFindings(row.findings_snapshot),
    generatedAt: String(row.generated_at || new Date().toISOString()),
  }
}

function normalizeSummary(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(Object.entries(value).map(([key, amount]) => [key, Number(amount || 0)]))
}

function normalizeEvidence(value: unknown): AuditEvidenceItem[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    return [{
      id: String(row.id || ''),
      name: String(row.name || 'Evidencia'),
      type: typeof row.type === 'string' ? row.type : null,
      status: typeof row.status === 'string' ? row.status : null,
    }]
  })
}

function normalizeFindings(value: unknown): AuditFindingItem[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    return [{
      id: String(row.id || ''),
      description: String(row.description || 'Hallazgo'),
      type: typeof row.type === 'string' ? row.type : null,
      status: typeof row.status === 'string' ? row.status : null,
    }]
  })
}

function normalizeVendorFindings(value: unknown): Array<{ code: string; label: string }> {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    return [{ code: String(row.code || 'finding'), label: String(row.label || 'Revisión pendiente') }]
  })
}

function normalizeRiskLevel(value: unknown): VendorAssessment['riskLevel'] {
  if (value === 'critical' || value === 'high' || value === 'medium' || value === 'low') return value
  return 'medium'
}
