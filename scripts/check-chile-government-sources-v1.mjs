import assert from 'node:assert/strict'
import fs from 'node:fs'

const catalog = JSON.parse(fs.readFileSync(new URL('../data/chile-government-sources.v1.json', import.meta.url), 'utf8'))

assert.equal(catalog.country, 'CL')
assert.equal(catalog.version, 1)
assert.ok(Array.isArray(catalog.sources))
assert.ok(catalog.sources.length >= 12)

const keys = new Set()
for (const source of catalog.sources) {
  assert.equal(typeof source.key, 'string')
  assert.ok(source.key.length >= 3)
  assert.ok(!keys.has(source.key), `duplicate source key: ${source.key}`)
  keys.add(source.key)

  assert.equal(typeof source.authority, 'string')
  assert.equal(typeof source.domain, 'string')
  assert.ok(['api', 'html', 'html_pdf', 'open_data_html'].includes(source.ingestion), `unsupported ingestion: ${source.ingestion}`)
  assert.ok(['active', 'implementation', 'planned'].includes(source.status), `unsupported status: ${source.status}`)
  assert.ok([1, 2, 3].includes(source.priority), `unsupported priority: ${source.priority}`)
  assert.ok(['daily', 'weekly'].includes(source.cadence), `unsupported cadence: ${source.cadence}`)
  assert.ok(Array.isArray(source.signals) && source.signals.length > 0)
  assert.ok(Array.isArray(source.consumerOutcomes) && source.consumerOutcomes.length > 0)
}

for (const required of [
  'diario-oficial',
  'leychile',
  'direccion-trabajo-doctrina',
  'direccion-trabajo-ds44',
  'suseso-sst',
  'sma-snifa',
  'mercado-publico',
]) {
  assert.ok(keys.has(required), `required Chile source missing: ${required}`)
}

const mercadoPublico = catalog.sources.find((source) => source.key === 'mercado-publico')
assert.equal(mercadoPublico.ingestion, 'api')
assert.equal(mercadoPublico.priority, 1)

const snifa = catalog.sources.find((source) => source.key === 'sma-snifa')
assert.equal(snifa.ingestion, 'open_data_html')
assert.equal(snifa.status, 'active')

console.log(`Chile government source catalog passed (${catalog.sources.length} sources)`)
