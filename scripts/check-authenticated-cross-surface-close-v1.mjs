import assert from 'node:assert/strict'
import fs from 'node:fs'

const documents = fs.readFileSync('app/documents/content.tsx', 'utf8')
const guided = fs.readFileSync('components/cases/guided-case-workspace.tsx', 'utf8')

assert.match(documents, /href=\{`\/app\/casos\/\$\{encodeURIComponent\(activationCaseId\)\}`\}/, 'Documents must offer a canonical return to the active case')
assert.match(documents, /Volver al caso/, 'Documents must make case continuity explicit')

assert.doesNotMatch(guided, /next=\/cases\/\$\{caseId\}/, 'Auth return context must not escape to legacy /cases')
assert.match(guided, /next=\/app\/casos\/\$\{caseId\}/, 'Auth return context must preserve canonical case route')
assert.doesNotMatch(guided, /href="\/cases"/, 'Case back-link must stay in canonical authenticated navigation')
assert.match(guided, /href="\/app\/casos"/, 'Case back-link must use /app/casos')

console.log('Authenticated cross-surface close: PASS')
