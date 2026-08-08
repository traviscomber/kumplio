import { spawnSync } from 'node:child_process'

const checks = [
  ['typecheck'],
  ['check:canonical-roadmap'],
  ['check:discovery'],
  ['check:boundaries'],
  ['check:auth'],
  ['check:leychile'],
  ['check:claims'],
  ['check:compliance-core'],
  ['check:case-lifecycle'],
  ['check:operational-security'],
  ['check:agent-dashboard'],
  ['check:workflow-persistence'],
  ['check:case-close-audit'],
  ['check:agent-retry-versioning'],
  ['check:workflow-concurrency'],
  ['check:atomic-agent-review'],
  ['check:stale-workflow-recovery'],
  ['check:guided-resolution'],
  ['check:authenticated-resolution'],
  ['check:durable-agent-queue'],
  ['check:control-evidence-lifecycle'],
  ['check:knowledge-graph'],
  ['check:insights'],
  ['check:organizational-memory'],
  ['check:agent-committee'],
  ['check:operating-desk'],
  ['check:case-operational-plan'],
  ['check:baseline-assurance'],
  ['check:processing-inventory'],
  ['check:processing-lifecycle'],
  ['check:tenant-assurance'],
  ['check:ui-golden-path'],
  ['check:e2e-data-lifecycle'],
  ['build'],
]

for (const [script] of checks) {
  console.log(`\n=== ${script} ===`)
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], { stdio: 'inherit', env: process.env })
  if (result.status !== 0) process.exit(result.status || 1)
}

console.log('\nRelease qualification: PASS')
