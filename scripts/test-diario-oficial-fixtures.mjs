import assert from 'node:assert/strict'
import { parseDiarioOficialEdition, diffDiarioOficialPublications } from '../lib/regulatory/diario-oficial-core.mjs'

const fixture = `
<html><body>
<h2>Edición Núm. 44.499.</h2><div>Martes 14 de Julio de 2026</div>
<h3>PODER EJECUTIVO</h3><h4>MINISTERIO DEL INTERIOR</h4>
<table><tr><td>Subsecretaría del Interior</td><td>Resolución exenta número 6.375, de 2026.- Autoriza ediciones extraordinarias del Diario Oficial</td><td><a href="/publicaciones/2026/07/14/01/2834047.pdf">Ver PDF (CVE-2834047)</a></td></tr>
<tr><td>MINISTERIO DE HACIENDA</td><td>Decreto número 292, de 2026.- Fija la tasa de interés promedio</td><td><a href="/publicaciones/2026/07/14/01/2834015.pdf">Ver PDF (CVE-2834015)</a></td></tr></table>
</body></html>`

const parsed = parseDiarioOficialEdition(fixture)
assert.equal(parsed.editionNumber, '44499')
assert.equal(parsed.publicationCount, 2)
assert.equal(parsed.publications[0].cve, '2834047')
assert.match(parsed.publications[0].pdfUrl, /^https:\/\/www\.diariooficial\.interior\.gob\.cl\//)
assert.equal(new Set(parsed.publications.map((item) => item.cve)).size, 2)

const unchanged = diffDiarioOficialPublications(parsed.publications, parsed.publications)
assert.equal(unchanged.changeCount, 0)
const modified = structuredClone(parsed.publications)
modified[0].title += ' modificada'
modified[0].hash = 'changed'
const delta = diffDiarioOficialPublications(parsed.publications, modified)
assert.equal(delta.modified.length, 1)

console.log('Diario Oficial fixtures passed')
