import 'server-only'

import type { AgentId } from './catalog'

type SupabaseClientLike = any

type GroundingScope = {
  organizationId: string
  caseId?: string | null
  workflowId?: string | null
  stageId?: string | null
  runId?: string | null
  userId: string
  agentId: AgentId
}

type GroundingRef = { tool: string; table: string; id?: string }

export type SstRegulatoryGroundingResult = {
  context: string
  sourceRefs: GroundingRef[]
  toolCallId?: string
  warning?: string
}

const ELIGIBLE_AGENTS = new Set<AgentId>(['isidora', 'rodrigo', 'javier', 'beatriz', 'veronica', 'catalina'])
const SOURCE_URLS = [
  'https://www.dt.gob.cl/portal/1626/w3-article-127643.html',
  'https://www.suseso.cl/612/w3-propertyvalue-69181.html',
]
const PARSER_VERSION = 'sst-ds44-suseso-v4'
const MAX_SECTIONS = 40

function compact(value: unknown, max = 2400) {
  if (typeof value !== 'string') return value
  return value.length > max ? `${value.slice(0, max)}…` : value
}

async function startAuditCall(supabase: SupabaseClientLike, scope: GroundingScope) {
  const { data } = await supabase
    .from('agent_tool_calls')
    .insert({
      organization_id: scope.organizationId,
      case_id: scope.caseId || null,
      workflow_id: scope.workflowId || null,
      stage_id: scope.stageId || null,
      run_id: scope.runId || null,
      user_id: scope.userId,
      agent_id: scope.agentId,
      tool_name: 'read_sst_regulatory_grounding',
      arguments: {
        jurisdiction: 'CL',
        parserVersion: PARSER_VERSION,
        sourceCount: SOURCE_URLS.length,
        limit: MAX_SECTIONS,
      },
      status: 'running',
    })
    .select('id')
    .maybeSingle()
  return data?.id as string | undefined
}

async function finishAuditCall(
  supabase: SupabaseClientLike,
  id: string | undefined,
  patch: Record<string, unknown>,
) {
  if (!id) return
  await supabase
    .from('agent_tool_calls')
    .update({ ...patch, completed_at: new Date().toISOString() })
    .eq('id', id)
}

export async function retrieveSstRegulatoryGrounding(
  supabase: SupabaseClientLike,
  scope: GroundingScope,
): Promise<SstRegulatoryGroundingResult> {
  if (!ELIGIBLE_AGENTS.has(scope.agentId)) return { context: '', sourceRefs: [] }

  const callId = await startAuditCall(supabase, scope)

  try {
    const { data: sources, error: sourceError } = await supabase
      .from('regulatory_sources')
      .select('id, authority_name, source_name, canonical_url, authority_level, terms_review_status, health_status, connector_version')
      .in('canonical_url', SOURCE_URLS)
      .eq('is_active', true)

    if (sourceError || !sources?.length) {
      await finishAuditCall(supabase, callId, {
        status: 'failed',
        error_code: sourceError?.code || 'sst_sources_unavailable',
      })
      return { context: '', sourceRefs: [], toolCallId: callId, warning: 'sst_regulatory_grounding: official sources unavailable' }
    }

    const sourceIds = sources.map((source: { id: string }) => source.id)
    const { data: documents, error: documentError } = await supabase
      .from('regulatory_documents')
      .select('id, source_id, canonical_identifier, title, document_type, canonical_url, external_reference, publication_date, status')
      .in('source_id', sourceIds)
      .order('publication_date', { ascending: false, nullsFirst: false })
      .limit(24)

    if (documentError) throw Object.assign(new Error('sst_documents_query_failed'), { code: documentError.code })

    const documentIds = (documents || []).map((document: { id: string }) => document.id)
    const { data: versions, error: versionError } = documentIds.length
      ? await supabase
        .from('regulatory_document_versions')
        .select('id, document_id, version_number, parser_version, status, created_at')
        .in('document_id', documentIds)
        .eq('parser_version', PARSER_VERSION)
        .in('status', ['parsed', 'verified'])
        .order('version_number', { ascending: false })
      : { data: [], error: null }

    if (versionError) throw Object.assign(new Error('sst_versions_query_failed'), { code: versionError.code })

    const latestByDocument = new Map<string, any>()
    for (const version of versions || []) {
      if (!latestByDocument.has(version.document_id)) latestByDocument.set(version.document_id, version)
    }
    const versionIds = [...latestByDocument.values()].map((version) => version.id)

    const { data: sections, error: sectionError } = versionIds.length
      ? await supabase
        .from('regulatory_document_sections')
        .select('id, version_id, section_key, section_type, ordinal, reference_label, heading, body_text, section_hash')
        .in('version_id', versionIds)
        .order('ordinal', { ascending: true })
        .limit(MAX_SECTIONS)
      : { data: [], error: null }

    if (sectionError) throw Object.assign(new Error('sst_sections_query_failed'), { code: sectionError.code })

    const sourceById = new Map((sources || []).map((source: any) => [source.id, source]))
    const documentById = new Map((documents || []).map((document: any) => [document.id, document]))
    const versionById = new Map([...latestByDocument.values()].map((version: any) => [version.id, version]))

    const records = (sections || []).map((section: any) => {
      const version = versionById.get(section.version_id)
      const document = version ? documentById.get(version.document_id) : null
      const source = document ? sourceById.get(document.source_id) : null
      return {
        authority: source?.authority_name || null,
        sourceName: source?.source_name || null,
        sourceUrl: source?.canonical_url || null,
        authorityLevel: source?.authority_level || null,
        termsReviewStatus: source?.terms_review_status || null,
        documentId: document?.id || null,
        canonicalIdentifier: document?.canonical_identifier || null,
        documentTitle: compact(document?.title || null, 1200),
        documentType: document?.document_type || null,
        publicationDate: document?.publication_date || null,
        versionNumber: version?.version_number || null,
        parserVersion: version?.parser_version || null,
        sectionId: section.id,
        referenceLabel: section.reference_label || null,
        heading: compact(section.heading || null, 1200),
        bodyText: compact(section.body_text || null),
        sectionHash: section.section_hash || null,
      }
    })

    const sourceRefs = records.flatMap((record) => record.sectionId
      ? [{ tool: 'read_sst_regulatory_grounding', table: 'regulatory_document_sections', id: record.sectionId }]
      : [])

    await finishAuditCall(supabase, callId, {
      status: 'completed',
      result_count: records.length,
      result_summary: {
        parserVersion: PARSER_VERSION,
        authorities: [...new Set(records.map((record) => record.authority).filter(Boolean))],
        documentCount: new Set(records.map((record) => record.documentId).filter(Boolean)).size,
      },
      source_refs: sourceRefs,
    })

    if (!records.length) {
      return { context: '', sourceRefs, toolCallId: callId, warning: 'sst_regulatory_grounding: no verified parser-v4 sections available' }
    }

    const policy = [
      'GROUNDING REGULATORIO SST CHILE — FUENTES OFICIALES, SOLO LECTURA.',
      'POLÍTICA DE USO OBLIGATORIA:',
      '- Esta evidencia puede fundamentar preguntas, brechas, priorización y outcomes candidatos.',
      '- Una guía técnica, formulario, material de fiscalización o circular NO se transforma automáticamente en obligación aplicable al cliente.',
      '- No declares aplicabilidad legal sin una fuente con efecto suficiente, contexto del cliente y revisión humana.',
      '- Distingue siempre: norma/efecto legal, instrucción supervisora, material oficial, guía técnica e inferencia del agente.',
      `- Parser de evidencia: ${PARSER_VERSION}.`,
    ].join('\n')

    return {
      context: `${policy}\n\nEVIDENCIA RECUPERADA (${records.length} secciones):\n${JSON.stringify(records, null, 2)}`,
      sourceRefs,
      toolCallId: callId,
    }
  } catch (error) {
    const code = typeof (error as { code?: unknown })?.code === 'string'
      ? String((error as { code: string }).code)
      : error instanceof Error
        ? error.name
        : 'sst_grounding_failed'
    await finishAuditCall(supabase, callId, { status: 'failed', error_code: code })
    return { context: '', sourceRefs: [], toolCallId: callId, warning: 'sst_regulatory_grounding: retrieval failed' }
  }
}
