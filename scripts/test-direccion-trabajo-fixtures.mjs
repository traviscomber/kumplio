import assert from 'node:assert/strict'
import {
  dtCanonicalIdentifier,
  normalizeOfficialNumber,
  parseDtDetailPage,
  parseDtIndexPage,
} from '../supabase/functions/direccion-trabajo-bootstrap/core.mjs'

const dictamenIndex = `
<div id="articulos_periodo">
  <ul class="indice"><li><a href="#articulos_periodo_group_pvid_193897">Julio</a></li><li><a href="#articulos_periodo_group_pvid_193898">Junio</a></li></ul>
  <div id="articulos_periodo_group_pvid_193897" class="grupo">
    <div class="recuadro">
      <p class="fecha"><span>Dictámenes</span></p>
      <h3 class="titulo"><a href="w3-article-129427.html">ORD.N°319/30</a></h3>
      <p class="fecha iso8601-20260703T0000000400">03/07/2026 </p>
      <p class="abstract">Se deja sin efecto una doctrina anterior.</p>
    </div>
  </div>
  <div id="articulos_periodo_group_pvid_193898" class="grupo"></div>
</div>`

const ordinarioIndex = `
<div id="articulos_periodo">
  <ul class="indice"><li><a href="#articulos_periodo_group_pvid_193897">Julio</a></li><li><a href="#articulos_periodo_group_pvid_193898">Junio</a></li></ul>
  <div id="articulos_periodo_group_pvid_193897" class="grupo">
    <div class="recuadro">
      <p class="fecha"><span>Ordinarios</span></p>
      <h3 class="titulo"><a href="w3-article-129471.html">ORD.N°2000-46007/2026</a></h3>
      <p class="fecha iso8601-20260723T0000000400">23/07/2026 </p>
      <p class="abstract">Complementa ordinarios anteriores.</p>
    </div>
    <div class="recuadro">
      <p class="fecha"><span>Ordinarios</span></p>
      <h3 class="titulo"><a href="w3-article-129458.html">ORD.N°321</a></h3>
      <p class="fecha iso8601-20260708T0000000400">08/07/2026 </p>
      <p class="abstract">Resuelve una consulta sobre jornada.</p>
    </div>
  </div>
  <div id="articulos_periodo_group_pvid_193898" class="grupo"></div>
</div>`

const dictamenEntries = parseDtIndexPage(dictamenIndex, { year: 2026, month: 7, pronouncementType: 'dictamen' })
const ordinarioEntries = parseDtIndexPage(ordinarioIndex, { year: 2026, month: 7, pronouncementType: 'ordinario' })

assert.equal(dictamenEntries.length, 1)
assert.equal(ordinarioEntries.length, 2)
assert.equal(dictamenEntries[0].canonicalIdentifier, 'dt:dictamen:319/30')
assert.equal(ordinarioEntries[0].publicationDate, '2026-07-08')
assert.equal(ordinarioEntries[1].normalizedNumber, '2000-46007/2026')
assert.equal(normalizeOfficialNumber('ORD. N° 319/30'), '319/30')
assert.equal(dtCanonicalIdentifier('ordinario', 'ORD.N°321'), 'dt:ordinario:321')

const detailHtml = `
<html><body>
  <main>
    <p>Dictámenes</p>
    <p>Libertad sindical; Negociación colectiva; Se deja sin efecto doctrina anterior;</p>
    <h3>ORD.N°319/30</h3>
    <p>03-jul-2026</p>
    <a href="articles-129427_recurso_1.pdf">ORD.N°319/30 pdf</a>
    <p>OFICINA DIRECTOR NACIONAL</p>
    <p>E115482/2026</p>
    <p>DICTAMEN: 319/30</p>
    <p>ACTUACIÓN:</p>
    <p>Se deja sin efecto la doctrina contenida en el Dictamen N°747/39 de 17.11.2025.</p>
    <p>MATERIAS:</p>
    <p>Negociación colectiva; instrumento colectivo; competencia de la Dirección del Trabajo.</p>
    <p>RESUMEN:</p>
    <p>Se acoge la solicitud de reconsideración y se deja sin efecto la doctrina anterior.</p>
    <p>ANTECEDENTES:</p>
    <p>Presentación de la asociación gremial.</p>
    <p>FUENTES:</p>
    <p>Constitución Política de la República, artículos 6° y 7°.</p>
    <p>Código del Trabajo, artículos 292 y 320.</p>
    <p>CONCORDANCIA:</p>
    <p>Dictamen N°214/4 de 15.01.2009.</p>
    <p>SANTIAGO, 03 JULIO 2026</p>
    <p>Texto íntegro del pronunciamiento.</p>
  </main>
  <footer><p>Ministerio del Trabajo y Previsión Social</p></footer>
</body></html>`

const parsed = await parseDtDetailPage(detailHtml, dictamenEntries[0])
assert.equal(parsed.pronouncementType, 'dictamen')
assert.equal(parsed.normalizedNumber, '319/30')
assert.equal(parsed.publicationDate, '2026-07-03')
assert.equal(parsed.internalReference, 'E115482/2026')
assert.equal(parsed.issuingUnit, 'OFICINA DIRECTOR NACIONAL')
assert.equal(parsed.pdfUrl, 'https://www.dt.gob.cl/legislacion/1624/articles-129427_recurso_1.pdf')
assert.ok(parsed.summary.includes('reconsideración'))
assert.ok(parsed.topics.some((topic) => topic.normalizedTopic === 'negociación colectiva'))
assert.equal(parsed.legalReferences.length, 2)
assert.ok(parsed.legalReferences.some((reference) => reference.type === 'constitucion'))
assert.ok(parsed.legalReferences.some((reference) => reference.type === 'codigo_trabajo'))
assert.ok(parsed.relations.some((relation) => relation.type === 'leaves_without_effect' && relation.targetIdentifier === 'dt:dictamen:747/39'))
assert.ok(parsed.relations.some((relation) => relation.type === 'concordance' && relation.targetIdentifier === 'dt:dictamen:214/4'))
assert.ok(parsed.blocks.some((block) => block.type === 'cuerpo'))
assert.match(parsed.hash, /^[0-9a-f]{64}$/)

const recursoPdfDetail = detailHtml
  .replaceAll('ORD.N°319/30', 'ORD.N°321')
  .replaceAll('03-jul-2026', '08-jul-2026')
  .replaceAll('03 JULIO 2026', '08 JULIO 2026')
  .replace('articles-129427_recurso_1.pdf', 'articles-129458_recurso_pdf.pdf')
  .replace('E115482/2026', 'E118000/2026')

const recursoPdfParsed = await parseDtDetailPage(recursoPdfDetail, ordinarioEntries[0])
assert.equal(recursoPdfParsed.pdfUrl, 'https://www.dt.gob.cl/legislacion/1624/articles-129458_recurso_pdf.pdf')
assert.equal(recursoPdfParsed.normalizedNumber, '321')

assert.throws(
  () => parseDtIndexPage(dictamenIndex, { year: 2025, month: 7, pronouncementType: 'dictamen' }),
  /dt_index_year_not_supported/,
)

console.log('Dirección del Trabajo fixtures passed')
