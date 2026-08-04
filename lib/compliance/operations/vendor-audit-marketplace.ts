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
      id: row.id,
      vendorId: row.vendor_id,
      vendorName: vendor?.name || 'Proveedor',
      serviceCategory: vendor?.service_category || null,
      riskScore: Number(row.risk_score || 0),
      riskLevel: row.risk_level,
      findings: Array.isArray(row.findings) ? row.findings.filter(Boolean) : [],
      recommendedAction: row.recommended_action,
      assessedAt: row.assessed_at,
    }
  })
}

export async function prepareAuditPackage(admin: SupabaseClient, organizationId: string, projectId: string, userId: string) {
  const { data, error } = await admin.rpc('prepare_audit_package_v1', {
    p_organization_id: organizationId,
    p_project_id: projectId,
    p_generated_by: userId,
  })
  if (error) throw new Error(`No fue posible preparar la auditoría: ${error.message}`)
  return data
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
      requiredPermissions: version?.required_permissions || [],
      installed: version ? installedVersionIds.has(version.id) : false,
    }
  })
}
