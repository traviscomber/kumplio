import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

export type MemoryPrecedent = {
  id: string
  title: string
  summary: string
  outcome: string | null
  occurredAt: string
  source: 'organization_memory' | 'decision'
}

export type SimilarCase = {
  id: string
  title: string
  description: string | null
  status: string
  similarity: number
  createdAt: string
}

type CaseSeed = { id: string; title: string; description: string | null }

const STOPWORDS = new Set([
  'para', 'como', 'desde', 'este', 'esta', 'estos', 'estas', 'sobre', 'entre', 'donde', 'cuando', 'porque',
  'tiene', 'tener', 'debe', 'deben', 'datos', 'caso', 'cumplimiento', 'empresa', 'organizacion', 'organización',
])

function normalize(value: string) {
  return value
    .toLocaleLowerCase('es-CL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9áéíóúñü\s]/gi, ' ')
}

function tokens(value: string) {
  return new Set(
    normalize(value)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4 && !STOPWORDS.has(token)),
  )
}

function similarityScore(left: string, right: string) {
  const a = tokens(left)
  const b = tokens(right)
  if (!a.size || !b.size) return 0
  let overlap = 0
  for (const token of a) if (b.has(token)) overlap += 1
  return overlap / Math.max(1, Math.min(a.size, b.size))
}

function optionalSchemaError(error: { code?: string } | null) {
  return error?.code === '42P01' || error?.code === '42703' || error?.code === 'PGRST204' || error?.code === 'PGRST205'
}

export async function getMemoryPrecedents(
  db: SupabaseClient,
  organizationId: string,
  limit = 12,
): Promise<MemoryPrecedent[]> {
  const memoryResult = await db
    .from('organization_memory')
    .select('id,title,summary,outcome,occurred_at')
    .eq('organization_id', organizationId)
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (!memoryResult.error) {
    return (memoryResult.data || []).map((row) => ({
      id: row.id,
      title: row.title || 'Precedente',
      summary: row.summary || '',
      outcome: row.outcome || null,
      occurredAt: row.occurred_at,
      source: 'organization_memory' as const,
    }))
  }

  if (!optionalSchemaError(memoryResult.error)) return []

  const decisionResult = await db
    .from('mission_decisions')
    .select('id,title,description,recommendation,resolution_notes,resolved_at,created_at')
    .eq('organization_id', organizationId)
    .eq('status', 'resolved')
    .order('resolved_at', { ascending: false })
    .limit(limit)

  if (decisionResult.error) return []
  return (decisionResult.data || []).map((row) => ({
    id: row.id,
    title: row.title || 'Decisión resuelta',
    summary: row.resolution_notes || row.description || row.recommendation || '',
    outcome: row.recommendation || null,
    occurredAt: row.resolved_at || row.created_at,
    source: 'decision' as const,
  }))
}

export async function getSimilarCases(
  db: SupabaseClient,
  organizationId: string,
  seed: CaseSeed,
  limit = 5,
): Promise<SimilarCase[]> {
  const { data, error } = await db
    .from('compliance_cases')
    .select('id,title,description,status,created_at')
    .eq('organization_id', organizationId)
    .neq('id', seed.id)
    .order('created_at', { ascending: false })
    .limit(80)

  if (error) return []
  const seedText = `${seed.title} ${seed.description || ''}`

  return (data || [])
    .map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || null,
      status: row.status,
      similarity: similarityScore(seedText, `${row.title} ${row.description || ''}`),
      createdAt: row.created_at,
    }))
    .filter((row) => row.similarity >= 0.18)
    .sort((a, b) => b.similarity - a.similarity || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export async function getOrganizationalMemoryContext(
  db: SupabaseClient,
  input: { organizationId: string; caseId?: string | null },
) {
  let seed: CaseSeed | null = null
  if (input.caseId) {
    const { data } = await db
      .from('compliance_cases')
      .select('id,title,description')
      .eq('organization_id', input.organizationId)
      .eq('id', input.caseId)
      .maybeSingle()
    seed = data || null
  }

  const [precedents, similarCases] = await Promise.all([
    getMemoryPrecedents(db, input.organizationId, 10),
    seed ? getSimilarCases(db, input.organizationId, seed, 5) : Promise.resolve([]),
  ])

  return { precedents, similarCases }
}
