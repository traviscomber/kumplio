// Regulatory database service for searching and matching regulations

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface RegulatoryFramework {
  id: string;
  country: string;
  industry: string;
  title: string;
  description: string;
  type: 'law' | 'regulation' | 'standard' | 'guideline';
  year_enacted: number;
}

export interface RegulatoryRequirement {
  id: string;
  framework_id: string;
  requirement_code: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency?: string;
  deadline_days?: number;
  resources?: string[];
  compliance_evidence?: string[];
}

export interface RegulationMapping {
  id: string;
  requirement_id: string;
  document_obligation_id?: string;
  mapping_confidence: number;
  notes?: string;
}

export async function searchRegulatoryFrameworks(
  industry?: string,
  country: string = 'Chile'
): Promise<RegulatoryFramework[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let query = supabase
    .from('regulatory_frameworks')
    .select('*')
    .eq('country', country);

  if (industry) {
    query = query.eq('industry', industry);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[v0] Search frameworks error:', error);
    throw error;
  }

  return data || [];
}

export async function searchRegulatoryRequirements(
  frameworkId?: string,
  category?: string,
  severity?: string
): Promise<RegulatoryRequirement[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let query = supabase.from('regulatory_requirements').select('*');

  if (frameworkId) {
    query = query.eq('framework_id', frameworkId);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[v0] Search requirements error:', error);
    throw error;
  }

  return data || [];
}

export async function getFrameworkRequirements(
  frameworkId: string
): Promise<RegulatoryRequirement[]> {
  return searchRegulatoryRequirements(frameworkId);
}

export async function matchObligationsToRegulations(
  obligations: any[],
  industry: string
): Promise<RegulationMapping[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get relevant regulatory requirements for the industry
  const frameworks = await searchRegulatoryFrameworks(industry);
  const frameworkIds = frameworks.map(f => f.id);

  let query = supabase.from('regulatory_requirements').select('*');

  if (frameworkIds.length > 0) {
    query = query.in('framework_id', frameworkIds);
  }

  const { data: requirements } = await query;

  if (!requirements) return [];

  const mappings: RegulationMapping[] = [];

  // Simple text matching algorithm
  for (const obligation of obligations) {
    const obligationText = obligation.obligation_text?.toLowerCase() || '';

    for (const requirement of requirements) {
      // Calculate similarity score
      const titleMatch = requirement.title.toLowerCase().includes(
        obligationText.substring(0, Math.min(20, obligationText.length))
      );
      const descMatch = requirement.description.toLowerCase().includes(
        obligationText.substring(0, Math.min(15, obligationText.length))
      );

      let confidence = 0;
      if (titleMatch) confidence += 0.7;
      if (descMatch) confidence += 0.3;

      // If there's a reasonable match, create a mapping
      if (confidence >= 0.5) {
        mappings.push({
          id: crypto.randomUUID(),
          requirement_id: requirement.id,
          document_obligation_id: obligation.id,
          mapping_confidence: confidence,
          notes: `Auto-matched based on text similarity (${Math.round(confidence * 100)}% confidence)`,
        });
      }
    }
  }

  // Save mappings to database
  if (mappings.length > 0) {
    for (const mapping of mappings) {
      await supabase.from('regulation_mappings').insert({
        requirement_id: mapping.requirement_id,
        mapping_confidence: mapping.mapping_confidence,
        notes: mapping.notes,
        mapped_by: 'ai-system',
      });
    }
  }

  return mappings;
}

export async function getIndustries(): Promise<string[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data } = await supabase
    .from('regulatory_frameworks')
    .select('industry')
    .eq('country', 'Chile')
    .distinct();

  const industries = data?.map(d => d.industry).filter(Boolean) || [];
  return [...new Set(industries)];
}

export async function getRegulatoryStats(industry?: string): Promise<{
  totalFrameworks: number;
  totalRequirements: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const frameworks = await searchRegulatoryFrameworks(industry);
  const frameworkIds = frameworks.map(f => f.id);

  let query = supabase.from('regulatory_requirements').select('severity, category');

  if (frameworkIds.length > 0) {
    query = query.in('framework_id', frameworkIds);
  }

  const { data: requirements } = await query;

  const bySeverity: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  (requirements || []).forEach(req => {
    bySeverity[req.severity] = (bySeverity[req.severity] || 0) + 1;
    byCategory[req.category] = (byCategory[req.category] || 0) + 1;
  });

  return {
    totalFrameworks: frameworks.length,
    totalRequirements: requirements?.length || 0,
    bySeverity,
    byCategory,
  };
}
