import assert from 'node:assert/strict'
import { parseDtDetailPage } from '../supabase/functions/direccion-trabajo-bootstrap/core.mjs'

const html = `
<html><body>
  <p>Ordinarios</p>
  <p>Alerta sanitaria; Complementa los Ordinarios N°2000/44737, de 17.07.2026, y N°2000/45139, de 20.07.2026;</p>
  <h3>ORD.N°2000-46007/2026</h3>
  <p>23-jul-2026</p>
  <a href="articles-129471_recurso_pdf.pdf">ORD.N°2000-46007/2026</a>
  <p>DEPARTAMENTO JURÍDICO</p>
  <p>E196220/2026</p>
  <p>MAT.:</p>
  <p>Primero está la seguridad de las personas. Complementa los Ordinarios N°2000/44737, de 17.07.2026, y N°2000/45139, de 20.07.2026.</p>
  <p>SANTIAGO,23/07/2026</p>
  <p>DE:</p>
  <p>JEFE DEPARTAMENTO JURÍDICO</p>
  <p>A:</p>
  <p>DIRECTORES REGIONALES</p>
  <p>En el cuerpo se citan ORD. N°1041, ORD. N°1175, ORD. N°1184 y muchos otros pronunciamientos que no forman parte de la materia resumida.</p>
  <p>Ministerio del Trabajo y Previsión Social</p>
</body></html>`

const parsed = await parseDtDetailPage(html, {
  pronouncementType: 'ordinario',
  officialNumber: 'ORD.N°2000-46007/2026',
  normalizedNumber: '2000-46007/2026',
  canonicalIdentifier: 'dt:ordinario:2000-46007/2026',
  publicationDate: '2026-07-23',
  abstract: 'Resumen de descubrimiento.',
  detailUrl: 'https://www.dt.gob.cl/legislacion/1624/w3-article-129471.html',
})

assert.equal(parsed.parserVersion, 'direccion-trabajo-doctrina-v2')
assert.equal(parsed.summary, 'Primero está la seguridad de las personas. Complementa los Ordinarios N°2000/44737, de 17.07.2026, y N°2000/45139, de 20.07.2026.')
assert.doesNotMatch(parsed.summary, /ORD\. N°1041/)
assert.equal(parsed.relations.length, 1)
assert.equal(parsed.relations[0].targetIdentifier, 'dt:ordinario:2000-44737/2026')
assert.equal(parsed.relations[0].type, 'complements')
assert.ok(parsed.relations[0].metadata.sourceBlock === 'catalogacion' || parsed.relations[0].metadata.sourceBlock === 'resumen')
assert.notEqual(parsed.relations[0].targetIdentifier, parsed.canonicalIdentifier)

console.log('Dirección del Trabajo v2 boundaries passed')
