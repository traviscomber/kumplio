import { evaluateComplianceOutcome } from './evaluator'
import { buildComplianceOutcome } from './outcome-contract'

export const OUTCOME_SNAPSHOT_CONTRACT_VERSION = 'outcome-v2'

type SnapshotArtifact = {
  id?: unknown
  artifact_type?: unknown
  content?: unknown
  status?: unknown
}

type SnapshotStage = {
  stage_index?: unknown
  run_id?: unknown
  status?: unknown
}

type SnapshotReview = {
  id?: unknown
  run_id?: unknown
  decision?: unknown
  comment?: unknown
  created_at?: unknown
}

export type ApprovedOutcomeSnapshot = ReturnType<typeof buildApprovedOutcomeSnapshot>

export function buildApprovedOutcomeSnapshot(input: {
  goal?: string | null
  artifacts: SnapshotArtifact[]
  stages: SnapshotStage[]
  reviews: SnapshotReview[]
  finalRunId: string
  finalReviewComment: string | null
  reviewedAt: string
}) {
  const syntheticFinalReview = {
    run_id: input.finalRunId,
    decision: 'approved',
    comment: input.finalReviewComment,
    created_at: input.reviewedAt,
  }

  const outcome = buildComplianceOutcome({
    goal: input.goal || null,
    workflowStatus: 'completed',
    artifacts: input.artifacts,
    stages: input.stages,
    reviews: [...input.reviews, syntheticFinalReview],
  })

  return {
    contractVersion: OUTCOME_SNAPSHOT_CONTRACT_VERSION,
    outcome,
    quality: evaluateComplianceOutcome(outcome),
    sourceArtifactIds: uniqueIds(input.artifacts.map((artifact) => artifact.id)),
    sourceReviewIds: uniqueIds(input.reviews.map((review) => review.id)),
  }
}

function uniqueIds(values: unknown[]) {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && Boolean(value.trim())))]
    .sort((left, right) => left.localeCompare(right))
}
