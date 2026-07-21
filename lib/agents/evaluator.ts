import type { AgentOutput } from './schemas'
import type { AgentEvalCase } from './eval-cases'

export type AgentEvaluation = {
  passed: boolean
  score: number
  findings: Array<{
    check: string
    passed: boolean
    detail: string
  }>
}

function normalize(value: unknown) {
  return JSON.stringify(value).toLocaleLowerCase('es-CL')
}

function countSourceReferences(value: unknown): number {
  if (!value || typeof value !== 'object') return 0
  if (Array.isArray(value)) return value.reduce((total, item) => total + countSourceReferences(item), 0)

  const record = value as Record<string, unknown>
  let count = 0
  if (Array.isArray(record.sources)) {
    count += record.sources.filter((source) => source && typeof source === 'object').length
  }
  for (const nested of Object.values(record)) count += countSourceReferences(nested)
  return count
}

export function evaluateAgentOutput(testCase: AgentEvalCase, output: AgentOutput): AgentEvaluation {
  const text = normalize(output)
  const findings: AgentEvaluation['findings'] = []

  for (const term of testCase.expectedTerms) {
    const passed = text.includes(term.toLocaleLowerCase('es-CL'))
    findings.push({
      check: `expected_term:${term}`,
      passed,
      detail: passed ? 'Expected concept was present.' : 'Expected concept was absent.',
    })
  }

  for (const claim of testCase.forbiddenClaims) {
    const passed = !text.includes(claim.toLocaleLowerCase('es-CL'))
    findings.push({
      check: `forbidden_claim:${claim}`,
      passed,
      detail: passed ? 'Forbidden unsupported claim was absent.' : 'Forbidden unsupported claim was present.',
    })
  }

  const sourceCount = countSourceReferences(output)
  findings.push({
    check: 'minimum_source_references',
    passed: sourceCount >= testCase.minimumSourceReferences,
    detail: `${sourceCount} source references found; ${testCase.minimumSourceReferences} required.`,
  })

  const serialized = output as unknown as Record<string, unknown>
  const limitations = Array.isArray(serialized.limitations) ? serialized.limitations : []
  findings.push({
    check: 'limitations_present',
    passed: limitations.length > 0,
    detail: `${limitations.length} limitations declared.`,
  })

  const humanReview = serialized.humanReview as Record<string, unknown> | undefined
  findings.push({
    check: 'human_review_required',
    passed: humanReview?.required === true,
    detail: humanReview?.required === true ? 'Human review is explicitly required.' : 'Human review requirement is missing.',
  })

  const passedChecks = findings.filter((finding) => finding.passed).length
  const score = findings.length ? Math.round((passedChecks / findings.length) * 1000) / 10 : 0

  return {
    passed: findings.every((finding) => finding.passed),
    score,
    findings,
  }
}
