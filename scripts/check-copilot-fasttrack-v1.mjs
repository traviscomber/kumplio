import assert from 'node:assert/strict'
import fs from 'node:fs'

const route = fs.readFileSync('app/api/copilot/route.ts', 'utf8')
const fastTrack = fs.readFileSync('lib/compliance-copilot/fast-track.ts', 'utf8')
const engine = fs.readFileSync('lib/compliance-copilot/engine.ts', 'utf8')
const orchestrator = fs.readFileSync('lib/ai-platform/orchestrator.ts', 'utf8')
const aiTypes = fs.readFileSync('lib/ai-platform/types.ts', 'utf8')

assert.doesNotMatch(route, /createAdminClient/, 'Copilot operational reads must not bypass RLS with the admin client')
assert.match(route, /organization_members/, 'Copilot must resolve the active organization')
assert.match(route, /\.eq\('user_id', user\.id\)/, 'Copilot membership lookup must be user-scoped')
assert.match(route, /\.eq\('organization_id', organizationId\)/, 'impact target reads must be explicitly organization-scoped')
assert.match(route, /allowedRunIds/, 'dependent run and plan reads must be bounded by tenant-visible impact runs')
assert.match(route, /\.in\('id', allowedRunIds\)/, 'impact run lookup must use tenant-visible ids')
assert.match(route, /\.in\('impact_run_id', allowedRunIds\)/, 'action plan lookup must use tenant-visible run ids')
assert.match(route, /tenant_context_unavailable/, 'unsafe or unavailable tenant context must fail closed')

const fastTrackPosition = route.indexOf('buildOfficialFastTrackResponse(message)')
const targetReadPosition = route.indexOf(".from('regulatory_impact_targets')")
assert.ok(fastTrackPosition >= 0 && targetReadPosition > fastTrackPosition, 'FastTrack must route before operational reads')
assert.match(route, /skipGeneration: true/, 'FastTrack must avoid unnecessary model generation')
assert.match(route, /organizationId,\n\s+surface: 'copilot'/, 'Copilot telemetry must carry organization id')
assert.match(route, /operationalReads: 0/, 'FastTrack telemetry must state that no operational datasets were read')
assert.match(route, /tenantScoped: true/, 'FullAgentic telemetry must record tenant scoping')

assert.match(fastTrack, /chileComplianceGuides/, 'FastTrack must use the curated Chile compliance corpus')
assert.match(fastTrack, /officialLey21719Reference/, 'FastTrack must expose an official-law source')
assert.match(fastTrack, /evaluacion de impacto/, 'FastTrack must recognize evaluation-of-impact guidance')
assert.match(fastTrack, /mi empresa/, 'FastTrack must reject internal-context language')
assert.match(fastTrack, /if \(!normalized \|\| includesAny\(normalized, INTERNAL_CONTEXT_TERMS\)\) return null/, 'internal context must force FastTrack miss')
assert.match(fastTrack, /best\.score < 4/, 'FastTrack must use a conservative minimum relevance threshold')
assert.match(fastTrack, /best\.score - second\.score < 2/, 'ambiguous curated matches must not use FastTrack')

assert.match(engine, /track: 'fast_track' \| 'full_agentic'/, 'Copilot response contract must expose the route')
assert.match(aiTypes, /routing\?: AIPlatformRouting/, 'AI platform response must preserve routing metadata')
assert.match(orchestrator, /skipGeneration\?: boolean/, 'orchestrator must support deterministic FastTrack')
assert.match(orchestrator, /generationSkipped: true/, 'FastTrack generation skip must be observable in telemetry')
assert.match(orchestrator, /routing: input\.deterministic\.routing/, 'routing decision must be persisted with telemetry')

console.log('Copilot FastTrack + tenant safety contract: PASS')
