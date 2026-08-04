import assert from 'node:assert/strict'
import {
  canonicalDiarioOficialEditionUrl,
  diffDiarioOficialPublications,
  parseDiarioOficialEdition,
} from '../lib/regulatory/diario-oficial-core.mjs'

const fixture = `
<!doctype html>
<html><body>
  <div class="containerdate">
    <ul>
      <li class="alignleft">Edición Núm. 44.476.</li>
      <li class="date"><strong>Martes 16 de Junio de 2026</strong></li>
      <li class="alignright"><a class="summary" href="/publicaciones/2026/06/16/sumarios/44476.pdf">Sumario de la Edición</a></li>
    </ul>
  </div>
  <table>
    <tr><td class="title3">PODER EJECUTIVO</td><td></td></tr>
    <tr><td class="title4">MINISTERIO DEL INTERIOR</td><td></td></tr>
    <tr><td class="title5">Subsecretaría del Interior</td><td></td></tr>
    <tr class="content">
      <td>Decreto número 68, de 2026.- Prorroga declaración de estado de latencia en el territorio especial de Isla de Pascua <span class="border dotted"></span></td>
      <td><a target="_blank" href="https://www.diariooficial.interior.gob.cl/publicaciones/2026/06/16/44476/01/2824287.pdf">Ver PDF (CVE-2824287)</a></td>
    </tr>
    <tr><td class="title4">MINISTERIO DE HACIENDA</td><td></td></tr>
    <tr class="content">
      <td>Decreto número 300, de 2026.- Nombra abogado integrante reemplazante del Tribunal de Cuentas de Segunda Instancia</td>
      <td><a href="/publicaciones/2026/06/16/44476/01/2821857.pdf">Ver PDF (CVE-2821857)</a></td>
    </tr>
  </table>
</body></html>`

const parsed = parseDiarioOficialEdition(fixture)
assert.equal(parsed.editionNumber, '44476')
assert.equal(parsed.publicationDateIso, '2026-06-16')
assert.equal(parsed.publicationCount, 2)
assert.equal(parsed.summaryPdfUrl, 'https://www.diariooficial.interior.gob.cl/publicaciones/2026/06/16/sumarios/44476.pdf')
assert.equal(parsed.publications[0].cve, '2824287')
assert.equal(parsed.publications[0].power, 'PODER EJECUTIVO')
assert.equal(parsed.publications[0].ministry, 'MINISTERIO DEL INTERIOR')
assert.equal(parsed.publications[0].agency, 'Subsecretaría del Interior')
assert.equal(parsed.publications[1].ministry, 'MINISTERIO DE HACIENDA')
assert.equal(parsed.publications[1].agency, null)
assert.match(parsed.publications[1].pdfUrl, /^https:\/\/www\.diariooficial\.interior\.gob\.cl\//)
assert.equal(new Set(parsed.publications.map((publication) => publication.cve)).size, 2)
assert.match(parsed.publications[0].hash, /^[0-9a-f]{64}$/)

const unchanged = diffDiarioOficialPublications(parsed.publications, parsed.publications)
assert.equal(unchanged.changeCount, 0)

const modified = structuredClone(parsed.publications)
modified[0].title += ' modificada'
modified[0].hash = 'changed'
const delta = diffDiarioOficialPublications(parsed.publications, modified)
assert.equal(delta.modified.length, 1)

assert.equal(
  canonicalDiarioOficialEditionUrl('16-06-2026', '44476'),
  'https://www.diariooficial.interior.gob.cl/edicionelectronica/index.php/index.php?date=16-06-2026&edition=44476',
)
assert.throws(() => canonicalDiarioOficialEditionUrl('2026-06-16', '44476'))
assert.throws(() => canonicalDiarioOficialEditionUrl('16-06-2026', '../44476'))

console.log('Diario Oficial fixtures passed.')
