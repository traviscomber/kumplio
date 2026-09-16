import assert from 'node:assert/strict'
import fs from 'node:fs'

const migration = fs.readFileSync('supabase/migrations/20260916102000_durable_agent_workflow_outcome_snapshots.sql', 'utf8')
const snapshotBuilder = fs.readFileSync('lib/agents/outcome-snapshot.ts', 'utf8')
const reviewRoute = fs.readFileSync('app/api/agents/runs/[runId]/review/route.ts', 'utf8')
const workflowRoute = fs.readFileSync('app/api/agents/workflows/[workflowId]/route.ts', 'utf8')
const goldenPath = fs.readFileSync('.github/workflows/golden-path-e2e.yml', 'utf8')

assert.match(migration, /create table if not exists public\.agent_workflow_outcome_snapshots/, 'Durable snapshot table must exist')
assert.match(migration, /unique \(workflow_id, contract_version\)/, 'Snapshots must be version-idempotent per workflow')
assert.match(migration, /The legacy agent_workflows\.final_payload remains untouched/, 'Migration must preserve the historical final_payload contract')
assert.match(migration, /enable row level security/, 'Outcome snapshots must use RLS')
assert.match(migration, /grant select on table public\.agent_workflow_outcome_snapshots to authenticated/, 'Authenticated users may only receive snapshot read access')
assert.doesNotMatch(migration, /grant (insert|update|delete|all) on table public\.agent_workflow_outcome_snapshots to authenticated/i, 'Authenticated users must never write frozen outcome snapshots')
assert.match(migration, /is_organization_member\(organization_id\)/, 'Snapshot reads must remain tenant scoped')
assert.match(migration, /review_agent_workflow_run\(uuid,uuid,uuid,text,text,jsonb,jsonb\)/, 'A backward-compatible seven-argument review RPC must be added')
assert.match(migration, /v_result := public\.review_agent_workflow_run\(/, 'The new RPC must delegate to the existing atomic review transaction')
assert.match(migration, /final_outcome_snapshot_required/, 'Final approval must fail closed without a snapshot')
assert.match(migration, /outcome_snapshot_stale/, 'Snapshot persistence must reject stale source sets')
assert.match(migration, /p_outcome_snapshot #>> '\{outcome,humanReviewStatus\}' <> 'approved'/, 'Frozen outcomes must represent an approved final human review')
assert.match(migration, /extensions\.digest\(/, 'Snapshot content must be fingerprinted')

assert.match(snapshotBuilder, /OUTCOME_SNAPSHOT_CONTRACT_VERSION = 'outcome-v2'/, 'Snapshot builder must pin the outcome contract version')
assert.match(snapshotBuilder, /workflowStatus: 'completed'/, 'Snapshot builder must model the post-approval workflow state')
assert.match(snapshotBuilder, /decision: 'approved'/, 'Snapshot builder must include the atomic final approval in the frozen outcome')
assert.match(snapshotBuilder, /sourceArtifactIds:/, 'Snapshot envelope must carry source artifact ids')
assert.match(snapshotBuilder, /sourceReviewIds:/, 'Snapshot envelope must carry source review ids')

assert.match(reviewRoute, /buildApprovedOutcomeSnapshot/, 'Final review route must prepare the durable outcome snapshot')
assert.match(reviewRoute, /p_outcome_snapshot: outcomeSnapshot/, 'Review RPC call must carry the snapshot envelope')
assert.match(reviewRoute, /\.eq\('organization_id', organizationId\)/, 'Snapshot preparation must stay tenant scoped')
assert.match(reviewRoute, /outcome_snapshot_stale/, 'Review route must expose a safe stale-snapshot conflict')

assert.match(workflowRoute, /from\('agent_workflow_outcome_snapshots'\)/, 'Workflow detail must load durable outcome snapshots')
assert.match(workflowRoute, /const outcome = frozenSnapshot\?\.outcome \|\| liveOutcome/, 'Frozen outcome must take precedence over recomputation')
assert.match(workflowRoute, /legacyFallback: workflow\.status === 'completed'/, 'Legacy completed workflows must retain a transparent live fallback')
assert.match(workflowRoute, /frozen: true/, 'Workflow response must expose frozen snapshot provenance')

assert.match(goldenPath, /outcomeSnapshot/, 'Production Golden Path must verify durable outcome snapshot persistence')

console.log('Durable workflow outcome snapshot contract: PASS')
