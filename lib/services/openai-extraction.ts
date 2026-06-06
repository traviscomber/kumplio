// OpenAI extraction service for analyzing documents
// Uses GPT-4 to extract obligations, risks, and requirements

import OpenAI from 'openai';
import { Obligation } from '@/lib/types/documents';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ExtractionResult {
  obligations: Obligation[];
  riskSummary: string;
  keyPoints: string[];
}

const EXTRACTION_PROMPT = `You are a legal compliance expert analyzing regulatory documents in Spanish.

Extract the following from the provided document text:
1. OBLIGATIONS: Identify all obligations, requirements, deadlines, and responsibilities
2. RISKS: Identify compliance risks and critical issues
3. KEY POINTS: Summarize the most important aspects

Format your response as JSON with this structure:
{
  "obligations": [
    {
      "text": "Obligation description",
      "type": "deadline|responsibility|requirement|risk",
      "severity": "critical|high|medium|low",
      "owner": "Responsible person/role or null",
      "deadline": "YYYY-MM-DD or null"
    }
  ],
  "riskSummary": "Overall risk assessment",
  "keyPoints": ["Point 1", "Point 2", ...]
}

IMPORTANT:
- Extract ALL obligations, even implicit ones
- Dates should be in YYYY-MM-DD format, use relative dates if absolute not found
- Set severity based on consequences of non-compliance
- Owner should be clear role/person if mentioned, null otherwise
- Be thorough but accurate
- Respond ONLY with valid JSON, no markdown
`;

/**
 * Extract obligations from document text using GPT-4
 */
export async function extractObligations(
  documentText: string,
  industry?: string
): Promise<ExtractionResult> {
  try {
    console.log('[v0] Calling OpenAI for obligation extraction');

    const systemPrompt = industry
      ? `${EXTRACTION_PROMPT}\n\nDOCUMENT TYPE: ${industry} industry document`
      : EXTRACTION_PROMPT;

    const message = await openai.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\nDOCUMENT TEXT:\n\n${documentText}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from OpenAI');
    }

    console.log('[v0] OpenAI response received, parsing...');

    // Parse JSON response
    let jsonStr = content.text.trim();

    // Remove markdown code blocks if present
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }

    const result = JSON.parse(jsonStr) as ExtractionResult;

    console.log('[v0] Extracted', result.obligations.length, 'obligations');

    return result;
  } catch (error) {
    console.error('[v0] OpenAI extraction error:', error);
    throw new Error('Failed to extract obligations from document');
  }
}

/**
 * Generate compliance matrix from obligations
 */
export function generateComplianceMatrix(
  obligations: Obligation[]
) {
  console.log('[v0] Generating compliance matrix');

  // Group by risk level
  const critical = obligations.filter((o) => o.severity === 'critical');
  const high = obligations.filter((o) => o.severity === 'high');
  const medium = obligations.filter((o) => o.severity === 'medium');
  const low = obligations.filter((o) => o.severity === 'low');

  return {
    totalObligations: obligations.length,
    byRisk: {
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      low: low.length,
    },
    criticalObligations: critical,
    complianceScore: calculateComplianceScore(obligations),
  };
}

/**
 * Calculate compliance score (0-100)
 * Based on obligation count and severity distribution
 */
function calculateComplianceScore(obligations: Obligation[]): number {
  if (obligations.length === 0) return 100;

  const critical = obligations.filter((o) => o.severity === 'critical').length;
  const high = obligations.filter((o) => o.severity === 'high').length;

  // Simple scoring: penalize based on critical/high obligations
  let score = 100;
  score -= critical * 15; // Each critical obligation reduces by 15
  score -= high * 5; // Each high obligation reduces by 5

  return Math.max(0, score);
}

/**
 * Format extraction result for storage
 */
export function formatExtractionForStorage(result: ExtractionResult) {
  return {
    obligations: result.obligations.map((o) => ({
      obligation_text: o.text,
      type: o.type,
      severity: o.severity,
      owner: o.owner,
      deadline: o.deadline,
      evidence_reference: null,
    })),
    riskSummary: result.riskSummary,
    keyPoints: result.keyPoints,
    extractedAt: new Date().toISOString(),
  };
}
