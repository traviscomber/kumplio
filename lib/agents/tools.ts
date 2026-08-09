import 'server-only'

import type { AgentId } from './catalog'
import { buildCommitteeContrast } from './committee'
import { retrieveSstRegulatoryGrounding } from './sst-regulatory-grounding'
import { getOrganizationalMemoryContext } from '@/lib/compliance/context/organizational-memory'

type SupabaseClientLike = any

type ToolScope = {
  organizationId: string
  caseId?: string | null
  projectId?: string | null
  workflowId?: string | null
  stageId?: string | null
  runId?: string | null
  userId: string
  agentId: AgentId
}

type ToolDefinition = {
  name: string
  table: string
  limit: number
}

type ToolRecord = Record<string, unknown>

export type AgentRetrievalResult = {
  context: string
  sourceRefs: Array<{ tool: string; table: string; id?: string }>
  toolCallIds: string[]
  warnings: string[]
}

const MAX_SERIALIZED_CHARS = 60000

const TOOL_REGISTRY: Record<AgentId, ToolDefinition[]> = {
  isidora: [
    { name: 'read_case', table: 'compliance_cases', limit: 1 },
    { name: 'read_documents', table: 'documents', limit: 12 },
    { name: 'read_obligations', table: 'obligations', limit: 40 },
  ],
  rodrigo: [
    { name: 'read_case', table: 'compliance_cases', limit: 1 },
    { name: 'read_obligations', table: 'obligations', limit: 40 },
    { name: 'read_risks', table: 'risks', limit: 40 },
    { name: 'read_controls', table: 'controls', limit: 40 },
  ],
  javier: [
    { name: 'read_risks', table: 'risks', limit: 40 },
    { name: 'read_findings', table: 'findings', limit: 40 },
    { name: 'read_actions', table: 'actions', limit: 60 },
  ],
  beatriz: [
    { name: 'read_documents', table: 'documents', limit: 12 },
    { name: 'read_obligations', table: 'obligations', limit: 40 },
  ],
  veronica: [
    { name: 'read_controls', table: 'controls', limit: 50 },
    { name: 'read_evidence', table: 'evidence', limit: 50 },
    { name: 'read_findings', table: 'findings', limit: 40 },
  ],
  andres: [
    { name: 'read_controls', table: 'controls', limit: 50 },
    { name: 'read_evidence', table: 'evidence', limit: 50 },
    { name: 'read_findings', table: 'findings', limit: 40 },
    { name: 'read_actions', table: 'actions', limit: 60 },
  ],
  catalina: [
    { name: 'read_obligations', table: 'obligations', limit: 40 },
    { name: 'read_controls', table: 'controls', limit: 40 },
    { name: 'read_evidence', table: 'evidence', limit: 40 },
    { name: 'read_risks', table: 'risks', limit: 40 },
    { name: 'read_findings', table: 'findings', limit: 40 },
    { name: 'read_actions', table: 'actions', limit: 40 },
  ],
}

function compactRecord(record: ToolRecord): ToolRecord {
  const blocked = new Set(['embedding', 'vector', 'raw_content', 'binary_data', 'file_bytes'])
  return Object.fromEntries(
    Object.entries(record)
      .filter(([key, value]) => !blocked.has(key) && value !== null && value !== undefined)
      .map(([key, value]) => {
        if (typeof value === 'string' && value.length > 4000) return [key, `${value.slice(0, 4000)}…`]
        return [key, value]
      }),
  )
}

function isOptionalSchemaError(error: { code?: string; message?: string } | null) {
  return error?.code === '42P01' || error?.code === '42703' || error?.code === 'PGRST204' || error?.code === 'PGRST205'
}

async function createAuditCall(supabase: SupabaseClientLike, scope: ToolScope, tool: ToolDefinition) {
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
      tool_name: tool.name,
      arguments: { table: tool.table, projectId: scope.projectId || null, limit: tool.limit },
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

async function queryTool(
  supabase: SupabaseClientLike,
  scope: ToolScope,
  tool: ToolDefinition,
): Promise<{ records: ToolRecord[]; callId?: string; warning?: string }> {
  const callId = await createAuditCall(supabase, scope, tool)
  let query = supabase.from(tool.table).select('*').limit(tool.limit)

  if (tool.table === 'compliance_cases') {
    if (scope.caseId) {
      query = query.eq('id', scope.caseId)
    } else {
      query = query.eq('organization_id', scope.organizationId)
    }
  } else if (scope.projectId) {
    query = query.eq('project_id', scope.projectId)
  } else {
    query = query.eq('organization_id', scope.organizationId)
  }

  const { data, error } = await query
  if (error) {
    const optional = isOptionalSchemaError(error)
    await finishAuditCall(supabase, callId, {
      status: optional ? 'skipped' : 'failed',
      error_code: error.code || 'tool_query_failed',
      result_summary: { optionalSchemaMismatch: optional },
    })
    if (optional) return { records: [], callId, warning: `${tool.name}: unavailable in the current schema` }
    return { records: [], callId, warning: `${tool.name}: query failed` }
  }

  const records = ((data || []) as ToolRecord[]).map(compactRecord)
  const sourceRefs = records.map((record) => ({
    tool: tool.name,
    table: tool.table,
    id: typeof record.id === 'string' ? record.id : undefined,
  }))
  await finishAuditCall(supabase, callId, {
    status: 'completed',
    result_count: records.length,
    result_summary: { fields: [...new Set(records.flatMap((record) => Object.keys(record)))].slice(0, 40) },
    source_refs: sourceRefs,
  })
  return { records, callId }
}

export async function retrieveAgentContext(
  supabase: SupabaseClientLike,
  scope: ToolScope,
): Promise<AgentRetrievalResult> {
  const sections: string[] = []
  const sourceRefs: AgentRetrievalResult['sourceRefs'] = []
  const toolCallIds: string[] = []
  const warnings: string[] = []

  for (const tool of TOOL_REGISTRY[scope.agentId]) {
    const result = await queryTool(supabase, scope, tool)
    if (result.callId) toolCallIds.push(result.callId)
    if (result.warning) warnings.push(result.warning)
    if (!result.records.length) continue

    const refs = result.records.map((record) => ({
      tool: tool.name,
      table: tool.table,
      id: typeof record.id === 'string' ? record.id : undefined,
    }))
    sourceRefs.push(...refs)
    sections.push(`HERRAMIENTA ${tool.name} (${result.records.length} registros):\n${JSON.stringify(result.records, null, 2)}`)
  }

  try {
    const memory = await getOrganizationalMemoryContext(supabase, {
      organizationId: scope.organizationId,
      caseId: scope.caseId || null,
    })

    if (memory.precedents.length) {
      sections.push(`MEMORIA ORGANIZACIONAL — PRECEDENTES Y DECISIONES HUMANAS:\n${JSON.stringify(memory.precedents, null, 2)}`)
      sourceRefs.push(...memory.precedents.map((item) => ({
        tool: 'read_organizational_memory',
        table: item.source === 'organization_memory' ? 'organization_memory' : 'mission_decisions',
        id: item.id,
      })))
    }

    if (memory.similarCases.length) {
      sections.push(`CASOS SIMILARES DE ESTA ORGANIZACIÓN (usar como precedente, no como autoridad normativa):\n${JSON.stringify(memory.similarCases, null, 2)}`)
      sourceRefs.push(...memory.similarCases.map((item) => ({
        tool: 'read_similar_cases',
        table: 'compliance_cases',
        id: item.id,
      })))
    }
  } catch {
    warnings.push('organizational_memory: unavailable')
  }

  try {
    const grounding = await retrieveSstRegulatoryGrounding(supabase, scope)
    if (grounding.context) sections.push(grounding.context)
    sourceRefs.push(...grounding.sourceRefs)
    if (grounding.toolCallId) toolCallIds.push(grounding.toolCallId)
    if (grounding.warning) warnings.push(grounding.warning)
  } catch {
    warnings.push('sst_regulatory_grounding: unavailable')
  }

  if (scope.caseId) {
    const { data: committeeArtifacts, error: committeeError } = await supabase
      .from('agent_artifacts')
      .select('artifact_type,title,content,status,created_at')
      .eq('organization_id', scope.organizationId)
      .eq('case_id', scope.caseId)
      .neq('status', 'superseded')
      .order('created_at', { ascending: true })
      .limit(12)

    if (committeeError) {
      warnings.push('committee_context: unavailable')
    } else {
      const contrast = buildCommitteeContrast(scope.agentId, committeeArtifacts || [])
      if (contrast) sections.push(contrast)
    }
  }

  const serialized = sections.join('\n\n')
  return {
    context: serialized.length > MAX_SERIALIZED_CHARS ? `${serialized.slice(0, MAX_SERIALIZED_CHARS)}\n[CONTEXTO TRUNCADO]` : serialized,
    sourceRefs,
    toolCallIds,
    warnings,
  }
}
