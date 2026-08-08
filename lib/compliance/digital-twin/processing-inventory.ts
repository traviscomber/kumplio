import type { SupabaseClient } from '@supabase/supabase-js'

export type LifecycleDimensionStatus = 'validated' | 'needs_changes' | 'pending_evidence' | 'not_applicable'

export type ProcessingLifecycleReview = {
  id: string
  version: number
  decision: 'approved' | 'changes_requested' | 'rejected'
  statuses: {
    basis: LifecycleDimensionStatus
    retention: LifecycleDimensionStatus
    recipients: LifecycleDimensionStatus
    subprocessors: LifecycleDimensionStatus
    transfers: LifecycleDimensionStatus
  }
  basisType: string | null
  basisSummary: string | null
  retentionRule: string | null
  retentionTrigger: string | null
  retentionPeriod: string | null
  recipients: Array<Record<string, string | null>>
  subprocessors: Array<Record<string, string | null>>
  transfers: Array<Record<string, string | null>>
  sourceRefs: Array<Record<string, string | null>>
  unknowns: string[]
  reviewNote: string
  reviewedAt: string
  reviewedByLabel: string | null
  snapshotHash: string
  evidence: {
    id: string
    validationStatus: string
    integrityStatus: string
    integrityHash: string | null
  } | null
}

export type ProcessingInventoryActivity = {
  id: string
  code: string
  name: string
  description: string | null
  purpose: string | null
  proposedLegalBasis: string | null
  basisStatus: string
  criticality: string
  lifecycleStatus: string
  ownerId: string | null
  ownerLabel: string | null
  projectId: string | null
  caseId: string | null
  controlId: string | null
  completeness: 'partial' | 'complete' | 'unreviewed'
  reviewDecision: string
  reviewNote: string | null
  reviewedAt: string | null
  reviewedByLabel: string | null
  unknowns: string[]
  lifecycleReview: ProcessingLifecycleReview | null
  score: number
  dataset: {
    id: string
    name: string
    dataSubjects: string[]
    dataCategories: string[]
    sensitivity: string
    legalBasis: string | null
    retentionRule: string | null
    crossBorderTransfer: boolean
  } | null
  asset: {
    id: string
    name: string
    type: string
    hostingCountry: string | null
    providerName: string | null
    containsSensitiveData: boolean
  } | null
  vendor: {
    id: string
    name: string
    serviceCategory: string | null
    country: string | null
    processesPersonalData: boolean
    crossBorderTransfer: boolean
    riskTier: string
  } | null
  evidence: {
    id: string
    name: string
    validationStatus: string
    integrityStatus: string
    integrityHash: string | null
    expiresAt: string | null
    source: string | null
  } | null
  source: {
    type: string | null
    label: string | null
    reference: string | null
  }
}

export type ProcessingInventorySummary = {
  activities: number
  reviewed: number
  partial: number
  complete: number
  systems: number
  datasets: number
  vendors: number
  evidence: number
  unknowns: number
  lifecycleReviewed: number
  lifecycleApproved: number
  lifecycleNeedsChanges: number
  averageScore: number | null
}

export async function getProcessingInventory(
  admin: SupabaseClient,
  organizationId: string,
): Promise<{ activities: ProcessingInventoryActivity[]; summary: ProcessingInventorySummary }> {
  // Digital-twin tables evolve independently from generated Supabase types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  const [processesResult, reviewsResult, lifecycleReviewsResult, evidenceLinksResult] = await Promise.all([
    db.from('organization_processes')
      .select('id,code,name,description,criticality,owner_user_id,lifecycle_status,attributes,created_at,updated_at')
      .eq('organization_id', organizationId)
      .eq('process_type', 'processing_activity')
      .neq('lifecycle_status', 'retired')
      .order('updated_at', { ascending: false })
      .limit(300),
    db.from('processing_activity_reviews')
      .select('id,project_id,case_id,process_id,evidence_id,control_id,decision,completeness,review_note,unknowns,reviewed_by,reviewed_at,snapshot_hash')
      .eq('organization_id', organizationId)
      .order('reviewed_at', { ascending: false })
      .limit(1000),
    db.from('processing_activity_lifecycle_reviews')
      .select('id,project_id,case_id,process_id,evidence_id,control_id,version,decision,basis_status,retention_status,recipients_status,subprocessors_status,transfers_status,basis_type,basis_summary,retention_rule,retention_trigger,retention_period,recipients,subprocessors,transfers,source_refs,unknowns,review_note,snapshot_hash,reviewed_by,reviewed_at')
      .eq('organization_id', organizationId)
      .order('reviewed_at', { ascending: false })
      .limit(1000),
    db.from('processing_activity_evidence')
      .select('process_id,evidence_id,relationship_type,linked_at')
      .eq('organization_id', organizationId)
      .order('linked_at', { ascending: false })
      .limit(1000),
  ])

  const processes = requiredRows(processesResult, 'actividades de tratamiento')
  const reviews = optionalRows(reviewsResult)
  const lifecycleReviews = optionalRows(lifecycleReviewsResult)
  const evidenceLinks = optionalRows(evidenceLinksResult)
  const processIds = processes.map((row) => String(row.id))

  if (processIds.length === 0) {
    return {
      activities: [],
      summary: emptySummary(),
    }
  }

  const [processDatasetsResult, processAssetsResult] = await Promise.all([
    db.from('organization_process_datasets')
      .select('process_id,dataset_id,relationship_type')
      .in('process_id', processIds)
      .limit(1000),
    db.from('organization_process_assets')
      .select('process_id,asset_id,relationship_type')
      .in('process_id', processIds)
      .limit(1000),
  ])

  const processDatasets = optionalRows(processDatasetsResult)
  const processAssets = optionalRows(processAssetsResult)
  const datasetIds = unique(processDatasets.map((row) => row.dataset_id))
  const assetIds = unique(processAssets.map((row) => row.asset_id))
  const reviewEvidenceIds = unique([
    ...reviews.map((row) => row.evidence_id),
    ...lifecycleReviews.map((row) => row.evidence_id),
    ...evidenceLinks.map((row) => row.evidence_id),
  ])

  const [datasetsResult, assetsResult, vendorAssetsResult, evidenceResult] = await Promise.all([
    datasetIds.length
      ? db.from('organization_datasets')
        .select('id,name,data_subjects,data_categories,sensitivity,legal_basis,retention_rule,cross_border_transfer')
        .in('id', datasetIds)
      : Promise.resolve({ data: [], error: null }),
    assetIds.length
      ? db.from('organization_assets')
        .select('id,name,asset_type,hosting_country,provider_name,contains_sensitive_data')
        .in('id', assetIds)
      : Promise.resolve({ data: [], error: null }),
    assetIds.length
      ? db.from('organization_vendor_assets')
        .select('vendor_id,asset_id,relationship_type')
        .in('asset_id', assetIds)
      : Promise.resolve({ data: [], error: null }),
    reviewEvidenceIds.length
      ? db.from('evidence')
        .select('id,name,validation_status,integrity_status,integrity_hash,expires_at,source')
        .eq('organization_id', organizationId)
        .in('id', reviewEvidenceIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const datasets = optionalRows(datasetsResult)
  const assets = optionalRows(assetsResult)
  const vendorAssets = optionalRows(vendorAssetsResult)
  const evidence = optionalRows(evidenceResult)
  const vendorIds = unique(vendorAssets.map((row) => row.vendor_id))

  const vendorsResult = vendorIds.length
    ? await db.from('organization_vendors')
      .select('id,name,service_category,country,processes_personal_data,cross_border_transfer,risk_tier')
      .eq('organization_id', organizationId)
      .in('id', vendorIds)
    : { data: [], error: null }
  const vendors = optionalRows(vendorsResult)

  const userIds = unique([
    ...processes.map((row) => row.owner_user_id),
    ...reviews.map((row) => row.reviewed_by),
    ...lifecycleReviews.map((row) => row.reviewed_by),
  ])
  const profilesResult = userIds.length
    ? await db.from('profiles').select('id,first_name,last_name,email').in('id', userIds)
    : { data: [], error: null }
  const profiles = optionalRows(profilesResult)
  const profileLabels = new Map(profiles.map((row): [string, string] => [
    String(row.id),
    [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || String(row.email || 'Miembro'),
  ]))

  const latestReviewByProcess = firstBy(reviews, 'process_id')
  const latestLifecycleByProcess = firstBy(lifecycleReviews, 'process_id')
  const datasetById = indexBy(datasets)
  const assetById = indexBy(assets)
  const vendorById = indexBy(vendors)
  const evidenceById = indexBy(evidence)
  const processDatasetByProcess = firstBy(processDatasets, 'process_id')
  const processAssetByProcess = firstBy(processAssets, 'process_id')
  const vendorByAsset = firstBy(vendorAssets, 'asset_id')
  const evidenceLinkByProcess = firstBy(evidenceLinks, 'process_id')

  const activities = processes.map((process): ProcessingInventoryActivity => {
    const attributes = asObject(process.attributes)
    const source = asObject(attributes.source)
    const review = latestReviewByProcess.get(String(process.id))
    const lifecycle = latestLifecycleByProcess.get(String(process.id))
    const processDataset = processDatasetByProcess.get(String(process.id))
    const processAsset = processAssetByProcess.get(String(process.id))
    const dataset = processDataset ? datasetById.get(String(processDataset.dataset_id)) : undefined
    const asset = processAsset ? assetById.get(String(processAsset.asset_id)) : undefined
    const vendorLink = asset ? vendorByAsset.get(String(asset.id)) : undefined
    const vendor = vendorLink ? vendorById.get(String(vendorLink.vendor_id)) : undefined
    const evidenceLink = evidenceLinkByProcess.get(String(process.id))
    const evidenceRow = review?.evidence_id
      ? evidenceById.get(String(review.evidence_id))
      : evidenceLink?.evidence_id
        ? evidenceById.get(String(evidenceLink.evidence_id))
        : undefined
    const lifecycleEvidence = lifecycle?.evidence_id
      ? evidenceById.get(String(lifecycle.evidence_id))
      : undefined
    const completeness = review?.completeness === 'complete'
      ? 'complete'
      : review?.completeness === 'partial'
        ? 'partial'
        : 'unreviewed'
    const unknowns = arrayOfStrings(review?.unknowns ?? attributes.unknowns)

    const lifecycleReview: ProcessingLifecycleReview | null = lifecycle ? {
      id: String(lifecycle.id),
      version: Number(lifecycle.version || 1),
      decision: lifecycle.decision === 'approved'
        ? 'approved'
        : lifecycle.decision === 'rejected'
          ? 'rejected'
          : 'changes_requested',
      statuses: {
        basis: lifecycleStatus(lifecycle.basis_status),
        retention: lifecycleStatus(lifecycle.retention_status),
        recipients: lifecycleStatus(lifecycle.recipients_status),
        subprocessors: lifecycleStatus(lifecycle.subprocessors_status),
        transfers: lifecycleStatus(lifecycle.transfers_status),
      },
      basisType: text(lifecycle.basis_type),
      basisSummary: text(lifecycle.basis_summary),
      retentionRule: text(lifecycle.retention_rule),
      retentionTrigger: text(lifecycle.retention_trigger),
      retentionPeriod: text(lifecycle.retention_period),
      recipients: objectArray(lifecycle.recipients),
      subprocessors: objectArray(lifecycle.subprocessors),
      transfers: objectArray(lifecycle.transfers),
      sourceRefs: objectArray(lifecycle.source_refs),
      unknowns: arrayOfStrings(lifecycle.unknowns),
      reviewNote: String(lifecycle.review_note || ''),
      reviewedAt: String(lifecycle.reviewed_at || ''),
      reviewedByLabel: lifecycle.reviewed_by ? profileLabels.get(String(lifecycle.reviewed_by)) || 'Revisor' : null,
      snapshotHash: String(lifecycle.snapshot_hash || ''),
      evidence: lifecycleEvidence ? {
        id: String(lifecycleEvidence.id),
        validationStatus: String(lifecycleEvidence.validation_status || 'pending'),
        integrityStatus: String(lifecycleEvidence.integrity_status || 'pending'),
        integrityHash: text(lifecycleEvidence.integrity_hash),
      } : null,
    } : null

    const activity: ProcessingInventoryActivity = {
      id: String(process.id),
      code: String(process.code || ''),
      name: String(process.name || 'Actividad de tratamiento'),
      description: text(process.description),
      purpose: text(attributes.purpose),
      proposedLegalBasis: text(attributes.proposedLegalBasis),
      basisStatus: String(attributes.basisStatus || 'proposed'),
      criticality: String(process.criticality || 'medium'),
      lifecycleStatus: String(process.lifecycle_status || 'active'),
      ownerId: text(process.owner_user_id),
      ownerLabel: process.owner_user_id ? profileLabels.get(String(process.owner_user_id)) || 'Miembro asignado' : null,
      projectId: review?.project_id ? String(review.project_id) : text(attributes.projectId),
      caseId: review?.case_id ? String(review.case_id) : text(attributes.caseId),
      controlId: review?.control_id ? String(review.control_id) : text(attributes.controlId),
      completeness,
      reviewDecision: String(review?.decision || attributes.reviewDecision || 'unreviewed'),
      reviewNote: text(review?.review_note),
      reviewedAt: text(review?.reviewed_at),
      reviewedByLabel: review?.reviewed_by ? profileLabels.get(String(review.reviewed_by)) || 'Revisor' : null,
      unknowns,
      lifecycleReview,
      score: 0,
      dataset: dataset ? {
        id: String(dataset.id),
        name: String(dataset.name || 'Conjunto de datos'),
        dataSubjects: arrayOfStrings(dataset.data_subjects),
        dataCategories: arrayOfStrings(dataset.data_categories),
        sensitivity: String(dataset.sensitivity || 'internal'),
        legalBasis: text(dataset.legal_basis),
        retentionRule: text(dataset.retention_rule),
        crossBorderTransfer: Boolean(dataset.cross_border_transfer),
      } : null,
      asset: asset ? {
        id: String(asset.id),
        name: String(asset.name || 'Sistema'),
        type: String(asset.asset_type || 'system'),
        hostingCountry: text(asset.hosting_country),
        providerName: text(asset.provider_name),
        containsSensitiveData: Boolean(asset.contains_sensitive_data),
      } : null,
      vendor: vendor ? {
        id: String(vendor.id),
        name: String(vendor.name || 'Tercero'),
        serviceCategory: text(vendor.service_category),
        country: text(vendor.country),
        processesPersonalData: Boolean(vendor.processes_personal_data),
        crossBorderTransfer: Boolean(vendor.cross_border_transfer),
        riskTier: String(vendor.risk_tier || 'medium'),
      } : null,
      evidence: evidenceRow ? {
        id: String(evidenceRow.id),
        name: String(evidenceRow.name || 'Evidencia'),
        validationStatus: String(evidenceRow.validation_status || 'pending'),
        integrityStatus: String(evidenceRow.integrity_status || 'pending'),
        integrityHash: text(evidenceRow.integrity_hash),
        expiresAt: text(evidenceRow.expires_at),
        source: text(evidenceRow.source),
      } : null,
      source: {
        type: text(source.type),
        label: text(source.label),
        reference: text(source.reference),
      },
    }
    activity.score = activityScore(activity)
    return activity
  })

  return {
    activities,
    summary: {
      activities: activities.length,
      reviewed: activities.filter((item) => item.reviewDecision === 'approved').length,
      partial: activities.filter((item) => item.completeness === 'partial').length,
      complete: activities.filter((item) => item.completeness === 'complete').length,
      systems: new Set(activities.flatMap((item) => item.asset ? [item.asset.id] : [])).size,
      datasets: new Set(activities.flatMap((item) => item.dataset ? [item.dataset.id] : [])).size,
      vendors: new Set(activities.flatMap((item) => item.vendor ? [item.vendor.id] : [])).size,
      evidence: new Set(activities.flatMap((item) => [item.evidence?.id, item.lifecycleReview?.evidence?.id].filter(Boolean) as string[])).size,
      unknowns: activities.reduce((sum, item) => sum + item.unknowns.length + (item.lifecycleReview?.unknowns.length || 0), 0),
      lifecycleReviewed: activities.filter((item) => item.lifecycleReview).length,
      lifecycleApproved: activities.filter((item) => item.lifecycleReview?.decision === 'approved').length,
      lifecycleNeedsChanges: activities.filter((item) => item.lifecycleReview?.decision === 'changes_requested').length,
      averageScore: activities.length
        ? Math.round(activities.reduce((sum, item) => sum + item.score, 0) / activities.length)
        : null,
    },
  }
}

function activityScore(activity: ProcessingInventoryActivity) {
  let score = 0
  if (activity.purpose) score += 10
  if (activity.proposedLegalBasis) score += 5
  if (activity.lifecycleReview?.statuses.basis === 'validated') score += 5
  if (activity.ownerId) score += 10
  if (activity.dataset?.dataSubjects.length) score += 10
  if (activity.dataset?.dataCategories.length) score += 10
  if (activity.dataset?.retentionRule) score += 5
  if (activity.lifecycleReview?.statuses.retention === 'validated') score += 5
  if (activity.asset) score += 10
  if (activity.vendor) score += 5
  if (activity.evidence?.validationStatus === 'accepted' && activity.evidence.integrityStatus === 'verified') score += 10
  if (activity.reviewDecision === 'approved') score += 10
  if (finalDimension(activity.lifecycleReview?.statuses.recipients)) score += 2
  if (finalDimension(activity.lifecycleReview?.statuses.subprocessors)) score += 2
  if (finalDimension(activity.lifecycleReview?.statuses.transfers)) score += 1

  if (!activity.lifecycleReview || activity.lifecycleReview.decision !== 'approved') return Math.min(score, 65)
  if (activity.completeness === 'partial') return Math.min(score, 80)
  if (activity.completeness === 'unreviewed') return Math.min(score, 50)
  return score
}

function emptySummary(): ProcessingInventorySummary {
  return {
    activities: 0,
    reviewed: 0,
    partial: 0,
    complete: 0,
    systems: 0,
    datasets: 0,
    vendors: 0,
    evidence: 0,
    unknowns: 0,
    lifecycleReviewed: 0,
    lifecycleApproved: 0,
    lifecycleNeedsChanges: 0,
    averageScore: null,
  }
}

function requiredRows(result: { data?: unknown[] | null; error?: { message?: string } | null }, label: string) {
  if (result.error) throw new Error(`No fue posible cargar ${label}: ${result.error.message || 'error desconocido'}`)
  return (result.data || []) as Array<Record<string, unknown>>
}

function optionalRows(result: { data?: unknown[] | null; error?: { code?: string; message?: string } | null }) {
  if (!result.error) return (result.data || []) as Array<Record<string, unknown>>
  if (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(String(result.error.code || ''))) return []
  throw new Error(result.error.message || 'No fue posible cargar el inventario de tratamientos.')
}

function unique(values: unknown[]) {
  return [...new Set(values.filter(Boolean).map(String))]
}

function firstBy(rows: Array<Record<string, unknown>>, key: string) {
  const result = new Map<string, Record<string, unknown>>()
  for (const row of rows) {
    const value = row[key]
    if (value && !result.has(String(value))) result.set(String(value), row)
  }
  return result
}

function indexBy(rows: Array<Record<string, unknown>>) {
  return new Map(rows.map((row): [string, Record<string, unknown>] => [String(row.id), row]))
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function objectArray(value: unknown): Array<Record<string, string | null>> {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    .map((item) => Object.fromEntries(
      Object.entries(item as Record<string, unknown>)
        .map(([key, entry]) => [key, text(entry)]),
    ))
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function lifecycleStatus(value: unknown): LifecycleDimensionStatus {
  return value === 'validated' || value === 'needs_changes' || value === 'not_applicable'
    ? value
    : 'pending_evidence'
}

function finalDimension(value: LifecycleDimensionStatus | undefined) {
  return value === 'validated' || value === 'not_applicable'
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}
