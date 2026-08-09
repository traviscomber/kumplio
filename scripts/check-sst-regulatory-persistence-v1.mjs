import fs from 'node:fs'

const bootstrap = fs.readFileSync('supabase/functions/sst-ds44-bootstrap/index.ts', 'utf8')
const migration = fs.readFileSync('supabase/migrations/20260809171000_sst_regulatory_sources_v1.sql', 'utf8')

for (const token of [
  'record_regulatory_source_capture',
  'record_regulatory_parser_revision',
  'regulatory_sources',
  'dt:ds44:operational-materials',
  'suseso_sst_circular',
  'supervisory_instruction',
  'not_automatic_obligation',
]) {
  if (!bootstrap.includes(token)) throw new Error(`SST persistence missing contract: ${token}`)
}

for (const token of [
  'direccion-trabajo-ds44',
  'suseso-sst',
  'technical_guidance_not_automatically_legal_obligation',
  'preserve_explicit_sources_and_review_state',
]) {
  if (!migration.includes(token)) throw new Error(`SST source registration missing contract: ${token}`)
}

if (bootstrap.includes('.from("obligations").insert') || bootstrap.includes(".from('obligations').insert")) {
  throw new Error('SST bootstrap must not auto-create tenant obligations')
}
if (bootstrap.includes('.from("regulatory_claims").insert') || bootstrap.includes(".from('regulatory_claims').insert")) {
  throw new Error('SST bootstrap must not auto-create legal claims')
}

console.log('SST regulatory persistence v1: PASS')
