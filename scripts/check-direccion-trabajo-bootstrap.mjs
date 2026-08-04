import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const entrypoint = await readFile('supabase/functions/direccion-trabajo-bootstrap/index.ts', 'utf8')
const core = await readFile('supabase/functions/direccion-trabajo-bootstrap/core.mjs', 'utf8')

assert.match(entrypoint, /jwtRole\(request\)\s*!==\s*["']service_role["']/)
assert.match(entrypoint, /redirect:\s*["']error["']/)
assert.match(entrypoint, /MAX_BYTES\s*=\s*3\s*\*\s*1024\s*\*\s*1024/)
assert.match(entrypoint, /direccion-trabajo-doctrina/)
assert.match(entrypoint, /record_regulatory_source_capture/)
assert.match(entrypoint, /record_dt_pronouncement_metadata/)
assert.match(entrypoint, /dt_initial_discovery_count_mismatch/)
assert.match(entrypoint, /REQUEST_DELAY_MS\s*=\s*350/)
assert.doesNotMatch(entrypoint, /input\?\.url/)
assert.doesNotMatch(entrypoint, /request\.url\s*\)/)
assert.doesNotMatch(entrypoint, /redirect:\s*["']follow["']/)
assert.doesNotMatch(entrypoint, /verify_jwt\s*:\s*false/)

assert.match(core, /dt_host_not_allowed/)
assert.match(core, /dt_detail_path_not_allowed/)
assert.match(core, /dt_index_year_not_supported/)
assert.match(core, /requiresHumanReview:\s*true/)
assert.doesNotMatch(core, /eval\s*\(/)
assert.doesNotMatch(core, /new\s+Function\s*\(/)

console.log('Dirección del Trabajo internal runner validation passed')
