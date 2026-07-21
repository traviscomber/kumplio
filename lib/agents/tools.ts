import 'server-only'

import type { AgentId } from './catalog'

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
  requiresProject?: boolean
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
    { name: 'read_documents', table: 'documents', limit: 12, requiresProject: true },
    { name: 'read_obligations', table: 'obligations', limit: 40, requiresProject: true },
  ],
  rodrigo: [
    { name: 'read_obligations', table: 'obligations', limit: 40, requiresProject: true },
    { name: 'read_risks', table: 'risks', limit: 40, requiresProject: true },
    { name: 'read_controls', table: 'controls', limit: 40, requiresProject: true },
  ],
  javier: [
    { name: 'read_risks', table: 'risks', limit: 40, requiresProject: true },
    { name: 'read_findings', table: 'findings', limit: 40, requiresProject: true },
    { name: 'read_actions', table: 'actions', limit: 60, requiresProject: true },
  ],
  beatriz: [
    { name: 'read_documents', table: 'documents', limit: 12, requiresProject: true },
    { name: 'read_obligations', table: 'obligations', limit: 40, requiresProject: true },
  ],
  veronica: [
    { name: 'read_controls', table: 'controls', limit: 50, requiresProject: true },
    { name: 'read_evidence', table: 'evidence', limit: 50, requiresProject: true },
    { name: 'read_findings', table: 'findings', limit: 40, requiresProject: true },
  ],
  andres: [
    { name: 'read_controls', table: 'controls', limit: 50, requiresProject: true },
    { name: 'read_evidence', table: 'evidence', limit: 50, requiresProject: true },
    { name: 'read_findings', table: 'findings', limit: 40, requiresProject: true },
    { name: 'read_actions', table: 'actions', limit: 60, requiresProject: true },
  ],
  catalina: [
    { name: 'read_obligations', table: 'obligations', limit: 40, requiresProject: true },
    { name: 'read_controls', table: 'controls', limit: 40, requiresProject: true },
    { name: 'read_evidence', table: 'evidence', limit: 40, requiresProject: true },
    { name: 'read_risks', table: 'risks', limit: 40, requiresProject: true },
    { name: 'read_findings', table: 'findings', limit: 40, requiresProject: true },
    { name: 'read_actions', table: 'actions', limit: 40, requiresProject: true },
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
  if (tool.requiresProject && !scope.projectId) {
    return { records: [], warning: `${tool.name}: skipped because the case has no project scope` }
  }

  const callId = await createAuditCall(supabase, scope, tool)
  let query = supabase.from(tool.table).select('*').limit(tool.limit)
  if (scope.projectId) query = query.eq('project_id', scope.projectId)
  else query = query.eq('organization_id', scope.organizationId)

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

  const serialized = sections.join('\n\n')
  return {
    context: serialized.length > MAX_SERIALIZED_CHARS ? `${serialized.slice(0, MAX_SERIALIZED_CHARS)}\n[CONTEXTO TRUNCADO]` : serialized,
    sourceRefs,
    toolCallIds,
    warnings,
  }
}
