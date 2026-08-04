import type { SupabaseClient } from '@supabase/supabase-js'

type AppSupabaseClient = SupabaseClient<any, any, any>

export interface RegulatoryFramework {
  id: string
  country: string
  industry: string
  title: string
  description: string
  type: 'law' | 'regulation' | 'standard' | 'guideline'
  year_enacted: number
}

export interface RegulatoryRequirement {
  id: string
  framework_id: string
  requirement_code: string
  title: string
  description: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  frequency?: string
  deadline_days?: number
  resources?: string[]
  compliance_evidence?: string[]
}

export interface RegulationMapping {
  id: string
  requirement_id: string
  document_obligation_id?: string
  mapping_confidence: number
  notes?: string
}

type ObligationInput = {
  id: string
  obligation_text: string
}

export async function searchRegulatoryFrameworks(
  supabase: AppSupabaseClient,
  industry?: string,
  country = 'Chile',
): Promise<RegulatoryFramework[]> {
  let query = supabase
    .from('regulatory_frameworks')
    .select('*')
    .eq('country', country)

  if (industry) query = query.eq('industry', industry)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as RegulatoryFramework[]
}

export async function searchRegulatoryRequirements(
  supabase: AppSupabaseClient,
  frameworkId?: string,
  category?: string,
  severity?: string,
): Promise<RegulatoryRequirement[]> {
  let query = supabase.from('regulatory_requirements').select('*')

  if (frameworkId) query = query.eq('framework_id', frameworkId)
  if (category) query = query.eq('category', category)
  if (severity) query = query.eq('severity', severity)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as RegulatoryRequirement[]
}

export async function getFrameworkRequirements(
  supabase: AppSupabaseClient,
  frameworkId: string,
): Promise<RegulatoryRequirement[]> {
  return searchRegulatoryRequirements(supabase, frameworkId)
}

export async function matchObligationsToRegulations(
  supabase: AppSupabaseClient,
  obligations: ObligationInput[],
  industry: string,
): Promise<RegulationMapping[]> {
  const frameworks = await searchRegulatoryFrameworks(supabase, industry)
  const frameworkIds = frameworks.map((framework) => framework.id)
  if (frameworkIds.length === 0 || obligations.length === 0) return []

  const { data: requirements, error: requirementError } = await supabase
    .from('regulatory_requirements')
    .select('id, title, description')
    .in('framework_id', frameworkIds)

  if (requirementError) throw requirementError
  if (!requirements?.length) return []

  const mappings: RegulationMapping[] = []

  for (const obligation of obligations) {
    const obligationText = obligation.obligation_text.trim().toLowerCase()
    if (!obligationText) continue

    for (const requirement of requirements) {
      const title = typeof requirement.title === 'string' ? requirement.title.toLowerCase() : ''
      const description = typeof requirement.description === 'string' ? requirement.description.toLowerCase() : ''
      const titleNeedle = obligationText.slice(0, Math.min(20, obligationText.length))
      const descriptionNeedle = obligationText.slice(0, Math.min(15, obligationText.length))
      const titleMatch = Boolean(titleNeedle && title.includes(titleNeedle))
      const descriptionMatch = Boolean(descriptionNeedle && description.includes(descriptionNeedle))

      let confidence = 0
      if (titleMatch) confidence += 0.7
      if (descriptionMatch) confidence += 0.3

      if (confidence >= 0.5) {
        mappings.push({
          id: crypto.randomUUID(),
          requirement_id: String(requirement.id),
          document_obligation_id: obligation.id,
          mapping_confidence: confidence,
          notes: `Coincidencia automática por similitud textual (${Math.round(confidence * 100)}%).`,
        })
      }
    }
  }

  if (mappings.length > 0) {
    const { error: mappingError } = await supabase
      .from('regulation_mappings')
      .insert(mappings.map((mapping) => ({
        requirement_id: mapping.requirement_id,
        document_obligation_id: mapping.document_obligation_id,
        mapping_confidence: mapping.mapping_confidence,
        notes: mapping.notes,
        mapped_by: 'authenticated-user',
      })))

    if (mappingError) throw mappingError
  }

  return mappings
}

export async function getIndustries(supabase: AppSupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from('regulatory_frameworks')
    .select('industry')
    .eq('country', 'Chile')

  if (error) throw error

  const industries = (data || [])
    .map((row) => row.industry)
    .filter((industry): industry is string => typeof industry === 'string' && industry.trim().length > 0)
    .map((industry) => industry.trim())

  return [...new Set(industries)].sort((left, right) => left.localeCompare(right, 'es-CL'))
}

export async function getRegulatoryStats(
  supabase: AppSupabaseClient,
  industry?: string,
): Promise<{
  totalFrameworks: number
  totalRequirements: number
  bySeverity: Record<string, number>
  byCategory: Record<string, number>
}> {
  const frameworks = await searchRegulatoryFrameworks(supabase, industry)
  const frameworkIds = frameworks.map((framework) => framework.id)

  if (frameworkIds.length === 0) {
    return { totalFrameworks: 0, totalRequirements: 0, bySeverity: {}, byCategory: {} }
  }

  const { data: requirements, error } = await supabase
    .from('regulatory_requirements')
    .select('severity, category')
    .in('framework_id', frameworkIds)

  if (error) throw error

  const bySeverity: Record<string, number> = {}
  const byCategory: Record<string, number> = {}

  for (const requirement of requirements || []) {
    if (typeof requirement.severity === 'string') {
      bySeverity[requirement.severity] = (bySeverity[requirement.severity] || 0) + 1
    }
    if (typeof requirement.category === 'string') {
      byCategory[requirement.category] = (byCategory[requirement.category] || 0) + 1
    }
  }

  return {
    totalFrameworks: frameworks.length,
    totalRequirements: requirements?.length || 0,
    bySeverity,
    byCategory,
  }
}
