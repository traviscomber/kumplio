import assert from 'node:assert/strict'
import fs from 'node:fs'

const casePage = fs.readFileSync('components/cases/canonical-case-page.tsx', 'utf8')
const summary = fs.readFileSync('components/cases/case-outcome-status.tsx', 'utf8')

assert.ok(casePage.includes("CaseOutcomeStatus"), 'Canonical case must include the outcome summary')
assert.ok(
  casePage.indexOf('<CaseOutcomeStatus') < casePage.indexOf('<GuidedCaseWorkspace'),
  'Outcome/closure state must appear before workflow internals on the canonical case page',
)

for (const marker of [
  "getWorkspaceAccess",
  ".eq('organization_id', organizationId)",
  ".eq('case_id', caseId)",
  "from('compliance_action_plans')",
  ".not('source_snapshot_id', 'is', null)",
  "from('agent_workflow_outcome_snapshots')",
  "humanReviewStatus === 'approved'",
  "verification_status === 'verified'",
  "/app/casos/",
  "/cierre",
  "Cierre verificado",
]) {
  assert.ok(summary.includes(marker), `Canonical case outcome summary missing marker: ${marker}`)
}

for (const forbidden of [
  'service_role',
  '/dashboard/agents',
  '/agents/workflows',
  'cumplimiento total',
  'certificado',
]) {
  assert.ok(!summary.toLowerCase().includes(forbidden.toLowerCase()), `Canonical case outcome summary exposes forbidden surface: ${forbidden}`)
}

console.log('Canonical case outcome-first surface: PASS')
