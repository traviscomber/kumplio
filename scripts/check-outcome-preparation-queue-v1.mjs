import assert from 'node:assert/strict'
import fs from 'node:fs'
const migration = fs.readFileSync('supabase/migrations/20260920153000_outcome_closure_preparation_queue_v1.sql', 'utf8')
const route = fs.readFileSync('app/api/agents/workflows/[workflowId]/closure-plan/route.ts', 'utf8')
for (const marker of [
  'outcome_closure_preparation_queue',
  'unique (task_id, preparation_type)',
  "verification_status",
  "requiresHumanVerification",
  'organization_membership_required',
]) assert.ok(migration.includes(marker), `Queue guard missing: ${marker}`)
for (const marker of ['enqueue_outcome_closure_preparation', 'enqueuedPreparations', '.filter((item) => item.executable)']) assert.ok(route.includes(marker), `Queue integration missing: ${marker}`)
assert.ok(!migration.includes("verification_status = 'verified'"), 'Preparation queue must never auto-verify a task')
console.log('Outcome safe preparation queue v1: PASS')
