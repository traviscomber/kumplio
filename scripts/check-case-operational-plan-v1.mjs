import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync('supabase/migrations/20260807040815_create_case_operational_plan.sql', 'utf8')
const api = readFileSync('app/api/cases/[caseId]/operational-plan/route.ts', 'utf8')
const serverComponent = readFileSync('components/cases/case-operational-plan.tsx', 'utf8')
const clientComponent = readFileSync('components/cases/case-operational-plan-client.tsx', 'utf8')
const casePage = readFileSync('app/cases/[caseId]/page.tsx', 'utf8')
const verifier = readFileSync('scripts/56-verify-case-operational-plan.sql', 'utf8')

for (const marker of [
  'create_case_operational_plan_record',
  'pg_advisory_xact_lock',
  'create_mission_from_playbook',
  'create_evidence_request_record',
  'case_project_assigned',
  'operational_plan_ready',
  'grant execute',
  'to service_role',
]) assert.match(migration, new RegExp(marker))

assert.match(migration, /revoke all[\s\S]*from public, anon, authenticated/)
assert.match(migration, /request\.status not in \('cancelled', 'rejected'\)/)
assert.match(api, /getWorkspaceAccess/)
assert.match(api, /access\.canAssignWork/)
assert.match(api, /create_case_operational_plan_record/)
assert.doesNotMatch(api, /\.from\(['"]missions['"]\)\.insert/)
assert.doesNotMatch(api, /\.from\(['"]evidence_requests['"]\)\.insert/)

for (const marker of [
  "from('projects')",
  "from('mission_playbooks')",
  "from('organization_members')",
  "from('missions')",
  "from('evidence_requests')",
]) assert.match(serverComponent, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

assert.match(clientComponent, /Convertir en plan operativo/)
assert.match(clientComponent, /Crear misión y solicitud/)
assert.match(clientComponent, /\/api\/cases\/\$\{caseId\}\/operational-plan/)
assert.match(clientComponent, /evidenceDueAt/)
assert.match(clientComponent, /missionDueAt/)
assert.match(casePage, /CaseOperationalPlan/)

assert.match(verifier, /begin;/)
assert.match(verifier, /rollback;/)
assert.match(verifier, /v_repeat/)
assert.match(verifier, /operational_plan_ready/)

console.log('Case operational plan guardrail: PASS')
