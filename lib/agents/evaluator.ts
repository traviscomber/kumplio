import type { AgentOutput } from './schemas'
import type { AgentEvalCase } from './eval-cases'
import type { ComplianceOutcome } from './outcome-contract'

export type AgentEvaluation = {
  passed: boolean
  score: number
  findings: Array<{
    check: string
    passed: boolean
    detail: string
  }>
}

export type OutcomeEvaluation = AgentEvaluation & {
  dimensions: {
    actionability: number
    evidenceClarity: number
    closureClarity: number
    humanControl: number
  }
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

export function evaluateComplianceOutcome(outcome: ComplianceOutcome): OutcomeEvaluation {
  const findings: AgentEvaluation['findings'] = []
  const add = (check: string, passed: boolean, detail: string) => findings.push({ check, passed, detail })

  add(
    'summary_present',
    outcome.summary.trim().length >= 20,
    outcome.summary.trim().length >= 20 ? 'Outcome has an executive summary.' : 'Outcome summary is missing or too short.',
  )

  const hasActionOrExplicitBlocker = Boolean(outcome.nextAction || outcome.blockers.length || outcome.missing.length)
  add(
    'action_or_blocker_explicit',
    hasActionOrExplicitBlocker,
    hasActionOrExplicitBlocker ? 'Next action or blocking condition is explicit.' : 'Outcome does not tell the user what happens next.',
  )

  const evidenceStateExplicit = outcome.evidenceCount > 0 || outcome.missing.length > 0 || outcome.blockers.length > 0
  add(
    'evidence_state_explicit',
    evidenceStateExplicit,
    evidenceStateExplicit ? 'Evidence availability or evidence gap is explicit.' : 'Evidence state is ambiguous.',
  )

  const closureExplicit = Boolean(
    outcome.nextAction?.closureCriteria.length
    || outcome.actions.some((action) => action.closureCriteria.length > 0)
    || outcome.status === 'blocked',
  )
  add(
    'closure_criteria_explicit',
    closureExplicit,
    closureExplicit ? 'Closure criteria or an explicit blocking state is present.' : 'No verifiable closure criteria are exposed.',
  )

  add(
    'human_control_explicit',
    outcome.humanReviewRequired,
    outcome.humanReviewRequired ? 'Sensitive outcome remains under human review.' : 'Human review requirement is missing.',
  )

  const falseReady = outcome.status === 'ready' && (outcome.missing.length > 0 || outcome.blockers.length > 0)
  add(
    'no_false_ready_state',
    !falseReady,
    falseReady ? 'Outcome is marked ready despite unresolved missing information or blockers.' : 'Ready state is consistent with known gaps.',
  )

  const score = percent(findings.filter((finding) => finding.passed).length, findings.length)
  const actionability = percent(
    Number(Boolean(outcome.nextAction || outcome.blockers.length)) + Number(outcome.actions.length > 0 || outcome.status === 'blocked'),
    2,
  )
  const evidenceClarity = percent(
    Number(evidenceStateExplicit) + Number(outcome.evidenceCount > 0 || outcome.missing.length > 0),
    2,
  )
  const closureClarity = percent(Number(closureExplicit) + Number(!falseReady), 2)
  const humanControl = outcome.humanReviewRequired ? 100 : 0

  return {
    passed: findings.every((finding) => finding.passed),
    score,
    findings,
    dimensions: {
      actionability,
      evidenceClarity,
      closureClarity,
      humanControl,
    },
  }
}

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 1000) / 10 : 0
}
