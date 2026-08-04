import assert from 'node:assert/strict'
import { parsePayload, sha256 } from '../supabase/functions/leychile-bootstrap/parser.mjs'

const html = [
  '<p>Artículo primero</p>',
  '<p>"Artículo 14 quinquies.- Deber de seguridad.</p>',
  '<p>El responsable debe adoptar medidas.</p>',
  '<p>"Artículo 14 sexies.- Deber de reportar.</p>',
  '<p>El responsable deberá registrar las comunicaciones.</p>',
  '<p>"Artículo 14 septies.- Diferenciación de estándares.</p>',
  '<p>"Artículo 16 sexies.- Datos de geolocalización.</p>',
  '<p>El titular deberá ser informado.</p>',
  '<p>9) En el artículo 17:</p>',
  '<p>a) Reemplázase una frase.</p>',
  '<p>"Artículo 30 octies.- Estatutos Agencia.</p>',
  '<p>"Artículo 30 nonies.- Funciones del presidente.</p>',
].join('')

const payload = {
  estructura: [{ i: 1, n: 'Artículo primero' }],
  html: [{ i: 1, t: html }],
}

const parsed = await parsePayload(payload)
const articles = parsed.sections.filter((section) => section.type === 'article')
const labels = articles.map((section) => section.referenceLabel)

assert.deepEqual(labels, [
  'Artículo 14 quinquies',
  'Artículo 14 sexies',
  'Artículo 14 septies',
  'Artículo 16 sexies',
  'Artículo 30 octies',
  'Artículo 30 nonies',
])

for (const suffix of [
  '14-quinquies',
  '14-sexies',
  '14-septies',
  '16-sexies',
  '30-octies',
  '30-nonies',
]) {
  assert.ok(articles.some((section) => section.key.endsWith(suffix)), suffix)
}

const geolocation = articles.find((section) => section.referenceLabel === 'Artículo 16 sexies')
assert.ok(geolocation)
assert.equal(parsed.sections.filter((section) => section.parentKey === geolocation.key).length, 2)
assert.doesNotMatch(geolocation.bodyText, /En el artículo 17/)
assert.ok(!parsed.sections.some((section) => /Artículo (?:14|16|30) [qson](?:,|$)/.test(section.referenceLabel)))

for (const section of parsed.sections) {
  assert.equal(section.hash, await sha256(`${section.key}\n${section.normalizedText}`))
}

console.log('LeyChile parser v2 fixtures passed')
