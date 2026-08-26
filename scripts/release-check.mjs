import { spawnSync } from 'node:child_process'

console.log('\n=== final brand system contract ===')
const brandSystem = spawnSync(process.execPath, ['scripts/check-brand-system-v1.mjs'], { stdio: 'inherit', env: process.env })
if (brandSystem.status !== 0) process.exit(brandSystem.status || 1)

console.log('\n=== authenticated brand surfaces ===')
const authenticatedBrand = spawnSync(process.execPath, ['scripts/check-authenticated-brand-surfaces-v1.mjs'], { stdio: 'inherit', env: process.env })
if (authenticatedBrand.status !== 0) process.exit(authenticatedBrand.status || 1)

console.log('\n=== operational brand surfaces ===')
const operationalBrand = spawnSync(process.execPath, ['scripts/check-operational-brand-surfaces-v1.mjs'], { stdio: 'inherit', env: process.env })
if (operationalBrand.status !== 0) process.exit(operationalBrand.status || 1)

console.log('\n=== secondary authenticated brand surfaces ===')
const secondaryBrand = spawnSync(process.execPath, ['scripts/check-secondary-app-brand-v1.mjs'], { stdio: 'inherit', env: process.env })
if (secondaryBrand.status !== 0) process.exit(secondaryBrand.status || 1)

console.log('\n=== landing clarity contract ===')
const landingClarity = spawnSync(process.execPath, ['scripts/check-landing-clarity-v1.mjs'], { stdio: 'inherit', env: process.env })
if (landingClarity.status !== 0) process.exit(landingClarity.status || 1)

console.log('\n=== landing polish contract ===')
const landingPolish = spawnSync(process.execPath, ['scripts/check-landing-polish-v1.mjs'], { stdio: 'inherit', env: process.env })
if (landingPolish.status !== 0) process.exit(landingPolish.status || 1)

const checks = [
  ['typecheck'], ['check:canonical-roadmap'], ['check:final-app-closure'], ['check:discovery'], ['check:boundaries'], ['check:auth'], ['check:chile-sources'], ['check:mercado-publico'], ['check:sst-ds44'], ['check:sst-agent-grounding'], ['check:isidora-case-relevance'], ['check:sst-input-domain-isolation'], ['check:isidora-applicability'], ['check:sst-committee-domain-isolation'], ['check:compliance-domain-tagging'], ['check:leychile'], ['check:claims'], ['check:compliance-core'], ['check:case-lifecycle'], ['check:operational-security'], ['check:agent-dashboard'], ['check:workflow-persistence'], ['check:case-close-audit'], ['check:agent-retry-versioning'], ['check:workflow-concurrency'], ['check:atomic-agent-review'], ['check:stale-workflow-recovery'], ['check:guided-resolution'], ['check:authenticated-resolution'], ['check:durable-agent-queue'], ['check:control-evidence-lifecycle'], ['check:knowledge-graph'], ['check:insights'], ['check:organizational-memory'], ['check:agent-committee'], ['check:operating-desk'], ['check:case-operational-plan'], ['check:baseline-assurance'], ['check:processing-inventory'], ['check:processing-lifecycle'], ['check:processing-privacy-remediation'], ['check:processing-notice-mapping'], ['check:processing-deletion-evidence'], ['check:processing-provider-tenant-config'], ['check:provider-config-intake'], ['check:openai-provider-trace'], ['check:openai-retention-probe'], ['check:tenant-assurance'], ['check:ui-golden-path'], ['check:e2e-data-lifecycle'], ['check:contextual-onboarding'], ['check:contextual-onboarding-persistence'], ['check:contextual-onboarding-ui'], ['check:authenticated-home'], ['check:contextual-onboarding-home'], ['check:guided-onboarding-entry'], ['build'],
]

for (const [script] of checks) {
  console.log(`\n=== ${script} ===`)
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], { stdio: 'inherit', env: process.env })
  if (result.status !== 0) process.exit(result.status || 1)
}

console.log('\nRelease qualification: PASS')
