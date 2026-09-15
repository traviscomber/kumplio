import assert from 'node:assert/strict'
import fs from 'node:fs'

const page = fs.readFileSync('app/ai-platform/page.tsx', 'utf8')
const metrics = fs.readFileSync('lib/compliance-copilot/routing-metrics.ts', 'utf8')

assert.match(page, /ai_platform_admin/, 'AI Platform telemetry must remain admin-gated')
assert.match(page, /regulatory_reviewer/, 'reviewer authorization must remain explicit')
assert.match(page, /\.from\('organization_members'\)/, 'routing observability must resolve the active workspace')
assert.match(page, /\.eq\('user_id', user\.id\)/, 'workspace resolution must be user-scoped')
assert.match(page, /\.from\('ai_platform_runs'\)[\s\S]*?\.eq\('organization_id', currentOrganizationId\)[\s\S]*?\.eq\('surface', 'copilot'\)/, 'routing telemetry query must be explicitly organization and Copilot scoped')
assert.match(page, /summarizeRoutingTelemetry\(workspaceRoutingRows\)/, 'tenant-scoped rows must feed the routing aggregator')
assert.doesNotMatch(page, /workspaceCopilotRuns\s*=\s*currentOrganizationId\s*\?\s*runs\.filter/, 'workspace metrics must not be derived from a globally truncated telemetry result')
assert.match(page, /Boolean\(run\.fallback_reason\)/, 'intentional deterministic FastTrack runs must not be counted as fallback')
assert.match(page, /no se usa como score de cumplimiento/, 'UI must explicitly avoid compliance-score framing')

assert.match(metrics, /const MINIMUM_SAMPLES_PER_TRACK = 20/, 'track comparison must require a minimum sample')
assert.match(metrics, /fast\.length >= MINIMUM_SAMPLES_PER_TRACK && full\.length >= MINIMUM_SAMPLES_PER_TRACK/, 'both tracks must meet the sample threshold')
assert.match(metrics, /track: 'fast_track' \| 'full_agentic'/, 'metrics must keep FastTrack and FullAgentic distinct')
assert.match(metrics, /unknownRouteCount/, 'legacy or unclassified routing events must remain visible')
assert.match(metrics, /fallback_reason \|\| row\.error_code/, 'fallback rate must reflect actual fallback or error signals')
assert.match(metrics, /generationSkippedRate/, 'generation avoidance must remain observable')
assert.match(metrics, /no son un score de cumplimiento/, 'metrics must not be presented as a compliance score')
assert.match(metrics, /No se debe afirmar superioridad entre tracks/, 'routing metrics must not imply superiority before evidence is sufficient')

console.log('Routing observability tenant-scope contract: PASS')
