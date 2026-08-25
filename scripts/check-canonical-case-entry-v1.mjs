import assert from 'node:assert/strict'
import fs from 'node:fs'

const canonical = fs.readFileSync('app/app/casos/[id]/page.tsx', 'utf8')
const legacy = fs.readFileSync('app/cases/[caseId]/page.tsx', 'utf8')

assert.ok(!canonical.includes('redirect(`/cases/${id}`)'), 'Canonical case route must not escape to legacy /cases')
assert.ok(canonical.includes('CanonicalCasePage'), 'Canonical case route must render the canonical case experience')
assert.ok(legacy.includes('redirect(`/app/casos/${caseId}`)'), 'Legacy case route must redirect into /app/casos')

console.log('Canonical case entry: PASS')
