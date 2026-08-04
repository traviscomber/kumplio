import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appCore = readFileSync('lib/regulatory/diario-oficial-core.mjs', 'utf8')
const edgeCore = readFileSync('supabase/functions/diario-oficial-bootstrap/core.mjs', 'utf8')
const edgeIndex = readFileSync('supabase/functions/diario-oficial-bootstrap/index.ts', 'utf8')

assert.equal(
  edgeCore,
  appCore,
  'El parser de la Edge Function debe ser idéntico al parser usado por Next.js.',
)

assert.match(edgeIndex, /service_role_required/)
assert.match(edgeIndex, /jwtRole\(request\) !== "service_role"/)
assert.match(edgeIndex, /canonicalDiarioOficialEditionUrl\(date, edition\)/)
assert.match(edgeIndex, /\^\\d\{2\}-\\d\{2\}-\\d\{4\}\$/)
assert.match(edgeIndex, /\^\\d\{4,6\}\$/)
assert.match(edgeIndex, /redirect: "error"/)
assert.match(edgeIndex, /MAX_BYTES = 8 \* 1024 \* 1024/)
assert.match(edgeIndex, /record_diario_oficial_edition/)
assert.match(edgeIndex, /complete_scraper_run/)
assert.doesNotMatch(edgeIndex, /capture-44496-once/)
assert.doesNotMatch(edgeIndex, /x-kumplio-run/)
assert.doesNotMatch(edgeIndex, /input\?\.url/)
assert.doesNotMatch(edgeIndex, /target_organization:\s*input/)

console.log('Diario Oficial Edge Function guards passed.')
