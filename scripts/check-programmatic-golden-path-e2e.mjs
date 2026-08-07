import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [oidc, sessionRoute, revokeRoute, workflow, progression] = await Promise.all([
  readFile('lib/security/github-actions-oidc.ts', 'utf8'),
  readFile('app/api/internal/e2e/session/route.ts', 'utf8'),
  readFile('app/api/internal/e2e/revoke/route.ts', 'utf8'),
  readFile('.github/workflows/golden-path-e2e.yml', 'utf8'),
  readFile('scripts/53-advance-workflow-after-approval.sql', 'utf8'),
])

// Machine identity must be short-lived GitHub OIDC and pinned to this exact workflow on main.
assert.match(oidc, /https:\/\/token\.actions\.githubusercontent\.com/)
assert.match(oidc, /kumplio-golden-path-e2e/)
assert.match(oidc, /traviscomber\/kumplio/)
assert.match(oidc, /refs\/heads\/main/)
assert.match(oidc, /golden-path-e2e\.yml@\$\{REF\}/)
assert.match(oidc, /header\.alg !== 'RS256'/)
assert.match(oidc, /verifySignature\(/)
assert.match(oidc, /github_oidc_signature_invalid/)
assert.match(oidc, /github_oidc_repository_invalid/)
assert.match(oidc, /github_oidc_workflow_invalid/)
assert.match(oidc, /x-kumplio-e2e/)

// Session creation rotates an in-memory password, grants only reviewer access and emits cookies.
assert.match(sessionRoute, /verifyGithubActionsE2ERequest/)
assert.match(sessionRoute, /randomBytes\(32\)/)
assert.match(sessionRoute, /kumplio_service_account: 'golden_path_e2e'/)
assert.match(sessionRoute, /role: 'reviewer'/)
assert.match(sessionRoute, /signInWithPassword/)
assert.match(sessionRoute, /guidedKey\.startsWith\('golden-'\)/)
assert.match(sessionRoute, /response\.cookies\.set/)
assert.doesNotMatch(sessionRoute, /NextResponse\.json\([\s\S]{0,500}\bpassword\b/)

// Revocation removes organization access but intentionally preserves the audit principal.
assert.match(revokeRoute, /verifyGithubActionsE2ERequest/)
assert.match(revokeRoute, /from\('organization_members'\)[\s\S]*?\.delete\(\)/)
assert.match(revokeRoute, /organization_id: null/)
assert.doesNotMatch(revokeRoute, /deleteUser/)

// Approval must advance the canonical pointer atomically to the next stage.
assert.match(progression, /v_next_stage := least\(v_stage\.stage_index \+ 1/)
assert.match(progression, /when p_decision = 'approved' and not v_is_final then v_next_stage/)
assert.match(progression, /'next_stage_index'/)
assert.match(progression, /'currentStage'/)

// The runner must wait for production, request OIDC, exercise the real APIs and always revoke membership.
assert.match(workflow, /id-token: write/)
assert.match(workflow, /Vercel – kumplio/)
assert.match(workflow, /Vercel – v0-normative-compliance-analysis/)
assert.match(workflow, /ACTIONS_ID_TOKEN_REQUEST_TOKEN/)
assert.match(workflow, /api\/internal\/e2e\/session/)
assert.match(workflow, /for stage_index in 0 1 2 3 4/)
assert.match(workflow, /api\/agents\/workflows\/\$WORKFLOW_ID\/advance/)
assert.match(workflow, /evidence_reviewed: true/)
assert.match(workflow, /limitations_understood: true/)
assert.match(workflow, /outcome_supported: true/)
assert.match(workflow, /api\/cases\/\$CASE_ID\/close/)
assert.match(workflow, /if: always\(\)/)
assert.match(workflow, /api\/internal\/e2e\/revoke/)
assert.doesNotMatch(workflow, /OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY/)

console.log('Programmatic golden-path E2E boundary validation passed.')
