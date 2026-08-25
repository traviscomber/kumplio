import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const packageJson = fs.readFileSync('package.json', 'utf8')
assert.ok(packageJson.includes('"check:app-close"'), 'package.json missing check:app-close script')
assert.ok(packageJson.includes('"check:product-polish"'), 'package.json missing check:product-polish script')
assert.ok(packageJson.includes('"check:three-agent-core"'), 'package.json missing check:three-agent-core script')

const checks = [
  ['scripts/check-canonical-case-entry-v1.mjs'],
  ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', 'scripts/test-case-workspace-model.mjs'],
  ['scripts/check-case-grounding-chain-v1.mjs'],
  ['scripts/check-case-specialist-surface-v1.mjs'],
  ['scripts/check-case-evidence-review-surface-v1.mjs'],
  ['scripts/check-case-close-experience-v1.mjs'],
  ['scripts/check-authenticated-cross-surface-close-v1.mjs'],
  ['scripts/check-daily-operations-close-v1.mjs'],
  ['scripts/check-activation-first-action-v1.mjs'],
  ['scripts/check-product-polish-v1.mjs'],
  ['scripts/check-three-agent-core-v1.mjs'],
]

for (const args of checks) execFileSync(process.execPath, args, { stdio: 'inherit' })

const productSources = [
  'components/cases/canonical-case-page.tsx',
  'components/cases/guided-case-workspace.tsx',
  'components/cases/case-specialist-contributions.tsx',
  'components/cases/case-baseline-assurance-client.tsx',
  'components/cases/live-workflow-actions.tsx',
  'app/documents/content.tsx',
  'app/dashboard/daily-content.tsx',
].map((file) => [file, fs.readFileSync(file, 'utf8')])

for (const [file, source] of productSources) {
  const normalized = source.toLowerCase()
  for (const forbidden of [
    'cumplimiento confirmado',
    'todo en regla',
    'certificación garantizada',
    'beta autoservicio lista',
    'pitr observado',
    'tenant verification 3/3',
    'openai standard/mam confirmado',
  ]) {
    assert.ok(!normalized.includes(forbidden), `${file} contains unsupported app-close claim: ${forbidden}`)
  }
}

const guided = fs.readFileSync('components/cases/guided-case-workspace.tsx', 'utf8')
assert.doesNotMatch(guided, /href="\/cases"/, 'Canonical case surface must not link back to legacy case index')
assert.doesNotMatch(guided, /next=\/cases\//, 'Canonical auth return must not target legacy case route')
assert.doesNotMatch(guided, /\/cases\/\$\{caseId\}\/live/, 'Canonical case surface must not escape to legacy technical trace UI')
assert.doesNotMatch(guided, /Ver trazabilidad/, 'Primary case flow must use bounded product history instead of technical trace navigation')

console.log('Authenticated app close: PASS')
