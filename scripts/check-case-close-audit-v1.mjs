import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const workflowClose = await readFile('app/api/agents/workflows/[workflowId]/close-case/route.ts', 'utf8')
const caseClose = await readFile('app/api/cases/[caseId]/close/route.ts', 'utf8')
const archive = await readFile('app/api/cases/[caseId]/archive/route.ts', 'utf8')
const migration = await readFile('supabase/migrations/20260806013000_atomic_case_close_archive.sql', 'utf8')

for (const source of [workflowClose, caseClose]) {
  assert.match(source, /createAdminClient/)
  assert.match(source, /close_compliance_case_record/)
  assert.doesNotMatch(source, /from\('compliance_case_events'\)[.]insert/)
}

assert.match(archive, /createAdminClient/)
assert.match(archive, /archive_compliance_case_record/)
assert.doesNotMatch(archive, /from\('compliance_case_events'\)[.]insert/)

assert.match(migration, /for update/)
assert.match(migration, /alreadyClosed/)
assert.match(migration, /alreadyArchived/)
assert.match(migration, /event_type[\s\S]*case_closed/)
assert.match(migration, /event_type[\s\S]*case_archived/)
assert.match(migration, /grant execute[\s\S]*service_role/)
assert.match(migration, /revoke all[\s\S]*authenticated/)

console.log('Atomic case close and archive validation passed')
