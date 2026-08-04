import assert from 'node:assert/strict'
import { parseDtDetailPage } from '../supabase/functions/direccion-trabajo-bootstrap/core.mjs'

function detailHtml(number, date, href) {
  return `<html><body>
    <p>Ordinarios</p>
    <p>Jornada; Seguridad;</p>
    <h3>${number}</h3>
    <p>${date}</p>
    <a href="${href}">${number}</a>
    <p>DEPTO. JURIDICO</p>
    <p>E196220/2026</p>
    <p>RESUMEN:</p><p>Pronunciamiento oficial de prueba.</p>
    <p>SANTIAGO, 17 JULIO 2026</p>
    <p>Texto oficial.</p>
    <p>Ministerio del Trabajo y Previsión Social</p>
  </body></html>`
}

const variants = [
  ['ORD.N°319/30', '03-jul-2026', 'articles-129427_recurso_1.pdf', '2026-07-03'],
  ['ORD.N°321', '08-jul-2026', 'articles-129458_recurso_pdf.pdf', '2026-07-08'],
  ['ORD.N°2000-44737/2026', '17-jul-2026', 'articles-129461_recurso_pdf.', '2026-07-17'],
]

for (const [number, date, href, publicationDate] of variants) {
  const parsed = await parseDtDetailPage(detailHtml(number, date, href), {
    pronouncementType: 'ordinario',
    officialNumber: number,
    publicationDate,
    abstract: 'Pronunciamiento oficial de prueba.',
    detailUrl: `https://www.dt.gob.cl/legislacion/1624/w3-article-${href.match(/articles-(\d+)/)[1]}.html`,
    canonicalIdentifier: `dt:ordinario:${number}`,
  })
  assert.equal(parsed.pdfUrl, `https://www.dt.gob.cl/legislacion/1624/${href}`)
}

console.log('Dirección del Trabajo PDF variants passed')
