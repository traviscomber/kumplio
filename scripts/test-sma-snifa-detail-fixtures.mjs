import assert from 'node:assert/strict'
import { parseSnifaSanctioningDetail } from '../supabase/functions/sma-snifa-detail-bootstrap/parser.mjs'

function page({
  expediente = 'D-147-2026',
  startDate = '29-07-2026',
  endDate = '',
  state = 'En curso',
  documents = '',
  documentCount = 0,
  facts = '',
  factCount = 0,
  inspections = '',
  inspectionCount = 0,
  measures = '',
  measureCount = 0,
  sanctions = '',
  sanctionCount = 0,
} = {}) {
  return `<!doctype html>
  <html><head><title>SNIFA - Sistema Nacional de Información de Fiscalización Ambiental</title></head><body>
    <h3>Expediente: ${expediente}</h3>
    <h4><b>Fecha Inicio :</b> <i>${startDate}</i></h4>
    <h4><b>Fecha Término: </b> <i>${endDate}</i></h4>
    <h4><b>Estado: </b> <i>${state}</i></h4>
    <div class="box-unidad-fiscalizable">
      <h4><i class="fa fa-building"></i> Unidad fiscalizable</h4>
      <ul><li><a href="/UnidadFiscalizable/Ficha/25065">A la Lime&#241;a- Pollo a las brasas</a><br />Arica - Regi&#243;n de Arica y Parinacota</li></ul>
      <input type="hidden" id="tLat_25065" value="-18.475056" />
      <input type="hidden" id="tLng_25065" value="-70.294911" />
      <input type="hidden" id="tNombre_25065" value="A la Lime&#241;a- Pollo a las brasas" />
    </div>
    <div class="box-unidad-fiscalizable">
      <h4><i class="fa fa-user"></i> Titular</h4>
      <ul><li><i class="fa fa-caret-right"></i>A LA LIME&#209;A SPA<br /></li></ul>
    </div>
    <ul class="nav nav-tabs responsive">
      <li><a href="#documentos">Documentos (${documentCount})</a></li>
      <li><a href="#instrumentos-considerados">Hechos considerados (${factCount})</a></li>
      <li><a href="#fiscalizaciones-asociadas">Fiscalizaciones asociadas (${inspectionCount})</a></li>
      <li><a href="#medidas-provisionales-asociadas">Medidas provisionales<br /> asociadas (${measureCount})</a></li>
      <li><a href="#sanciones">Sanciones (${sanctionCount})</a></li>
    </ul>
    <div id="documentos"><table><tbody>${documents}</tbody></table></div>
    <div id="instrumentos-considerados"><table><tbody>${facts}</tbody></table></div>
    <div id="fiscalizaciones-asociadas"><table><tbody>${inspections}</tbody></table></div>
    <div id="medidas-provisionales-asociadas">${measures || '<div>No se registran medidas provisionales asociadas.</div>'}</div>
    <div id="sanciones">${sanctions || '<div>No se registran sanciones.</div>'}</div>
    <script>void 0</script>
  </body></html>`
}

const recentHtml = page({
  documentCount: 2,
  documents: `
    <tr>
      <td data-label="#">1</td>
      <td data-label="Nombre Documento">Designa Fiscal Instructora y Suplente</td>
      <td data-label="Tipo Documento">Otros</td>
      <td data-label="Fecha">27-07-2026</td>
      <td data-label="Link"><a href="/General/Descargar/2061200096714">Descargar</a></td>
    </tr>
    <tr>
      <td data-label="#">2</td>
      <td data-label="Nombre Documento">Formulaci&#243;n de Cargos</td>
      <td data-label="Tipo Documento">Formulaci&#243;n de Cargos</td>
      <td data-label="Fecha">29-07-2026</td>
      <td data-label="Link"><a href="/General/Descargar/2060100096733">Descargar</a></td>
    </tr>`,
  factCount: 1,
  facts: `
    <tr>
      <td data-label="#">1</td>
      <td data-label="Hecho">La obtenci&#243;n de un Nivel de Presi&#243;n Sonora Corregido de 61 dB(A).</td>
      <td data-label="Instrumento Infringido">NE:38/2011<br/><a href="http://bcn.cl/lmkm">Link Detalle</a></td>
      <td data-label="Infracción (Art.35 LOSMA)">h) El incumplimiento de las Normas de Emisi&#243;n</td>
      <td data-label="Clasificación (Art. 36 LOSMA)"><b>Leves</b><br/><i>Hechos que no constituyan infracci&#243;n grave o grav&#237;sima.</i></td>
    </tr>`,
  inspectionCount: 1,
  inspections: `
    <tr>
      <td data-label="#">1</td>
      <td data-label="Expediente de fiscalización">DFZ-2026-813-XV-NE</td>
      <td data-label="Año actividad">2026</td>
      <td data-label="Detalle"><a href="/Fiscalizacion/Ficha/1075169">Ver detalle</a></td>
    </tr>`,
})

const recent = await parseSnifaSanctioningDetail(recentHtml, {
  smaProcessId: 4577,
  expediente: 'D-147-2026',
  startDate: '2026-07-29',
  processState: 'En curso',
})

assert.equal(recent.parserVersion, 'sma-snifa-detail-v1')
assert.equal(recent.expediente, 'D-147-2026')
assert.equal(recent.counts.units, 1)
assert.equal(recent.counts.holders, 1)
assert.equal(recent.counts.documents, 2)
assert.equal(recent.counts.facts, 1)
assert.equal(recent.counts.inspections, 1)
assert.equal(recent.counts.provisionalMeasures, 0)
assert.equal(recent.counts.sanctions, 0)
assert.equal(recent.units[0].unit_name, 'A la Limeña- Pollo a las brasas')
assert.equal(recent.holders[0].holder_name, 'A LA LIMEÑA SPA')
assert.equal(recent.documents[1].document_name, 'Formulación de Cargos')
assert.equal(recent.documents[1].download_url, 'https://snifa.sma.gob.cl/General/Descargar/2060100096733')
assert.equal(recent.facts[0].classification_label, 'Leves')
assert.equal(recent.facts[0].instrument_url, 'http://bcn.cl/lmkm')
assert.equal(recent.inspections[0].detail_url, 'https://snifa.sma.gob.cl/Fiscalizacion/Ficha/1075169')
assert.match(recent.payloadHash, /^[0-9a-f]{64}$/)

const sanctionHtml = page({
  expediente: 'F-025-2013',
  startDate: '05-11-2013',
  endDate: '18-03-2015',
  state: 'Terminado - Sanción',
  documentCount: 1,
  documents: `
    <tr>
      <td data-label="#">1</td>
      <td data-label="Nombre Documento">Resoluci&#243;n Sancionatoria</td>
      <td data-label="Tipo Documento">Resoluci&#243;n Sancionatoria</td>
      <td data-label="Fecha">18-03-2015</td>
      <td data-label="Link"><a href="/General/Descargar/2015000000001">Descargar</a></td>
    </tr>`,
  factCount: 2,
  facts: `
    <tr>
      <td data-label="#">1</td><td data-label="Hecho">B4: Operaci&#243;n sin plan de acci&#243;n validado.</td>
      <td data-label="Instrumento Infringido">RCA:13/2010<br/><a href="http://seia.sea.gob.cl/expediente/ficha/fichaPrincipal.php?id_expediente=3281058">Link Detalle</a></td>
      <td data-label="Infracción (Art.35 LOSMA)">a) Incumplimiento de condiciones de la RCA</td>
      <td data-label="Clasificación (Art. 36 LOSMA)"><b>Graves</b><i>Incumplimiento grave.</i></td>
    </tr>
    <tr>
      <td data-label="#">2</td><td data-label="Hecho">C1: Sistema de aguas lluvia distinto.</td>
      <td data-label="Instrumento Infringido">RCA:13/2010</td>
      <td data-label="Infracción (Art.35 LOSMA)">a) Incumplimiento de condiciones de la RCA</td>
      <td data-label="Clasificación (Art. 36 LOSMA)"><b>Leves</b><i>Contravenci&#243;n no grave.</i></td>
    </tr>`,
  sanctionCount: 2,
  sanctions: `<table><tbody>
    <tr>
      <td data-label="#">1</td><td data-label="Hecho">B4: Operaci&#243;n sin plan de acci&#243;n validado.</td>
      <td data-label="Instrumento Infringido">RCA:13/2010</td>
      <td data-label="Infracción (Art.35 LOSMA)">a) Incumplimiento de condiciones de la RCA</td>
      <td data-label="Clasificación (Art. 36 LOSMA)"><b>Graves</b><i>Incumplimiento grave.</i></td>
      <td data-label="Sanción">Absoluci&#243;n</td><td data-label="Multa"><i>No aplica</i></td>
    </tr>
    <tr>
      <td data-label="#">2</td><td data-label="Hecho">C1: Sistema de aguas lluvia distinto.</td>
      <td data-label="Instrumento Infringido">RCA:13/2010</td>
      <td data-label="Infracción (Art.35 LOSMA)">a) Incumplimiento de condiciones de la RCA</td>
      <td data-label="Clasificación (Art. 36 LOSMA)"><b>Leves</b><i>Contravenci&#243;n no grave.</i></td>
      <td data-label="Sanción">Multa de una a diez mil U.T.A.</td><td data-label="Multa"><i>58.5</i></td>
    </tr>
  </tbody></table>`,
})

const sanction = await parseSnifaSanctioningDetail(sanctionHtml, {
  smaProcessId: 61,
  expediente: 'F-025-2013',
  startDate: '2013-11-05',
  processState: 'Terminado - Sanción',
})

assert.equal(sanction.endDate, '2015-03-18')
assert.equal(sanction.counts.sanctions, 2)
assert.equal(sanction.sanctions[0].fine_uta, null)
assert.equal(sanction.sanctions[1].fine_uta, 58.5)
assert.equal(sanction.sanctions[1].classification_label, 'Leves')
assert.match(sanction.sanctions[1].item_hash, /^[0-9a-f]{64}$/)

await assert.rejects(
  parseSnifaSanctioningDetail(recentHtml.replace('Documentos (2)', 'Documentos (3)'), {
    smaProcessId: 4577,
    expediente: 'D-147-2026',
    startDate: '2026-07-29',
    processState: 'En curso',
  }),
  /snifa_detail_count_mismatch:documents/,
)

await assert.rejects(
  parseSnifaSanctioningDetail(recentHtml, {
    smaProcessId: 4577,
    expediente: 'D-999-2026',
    startDate: '2026-07-29',
    processState: 'En curso',
  }),
  /snifa_detail_expediente_mismatch/,
)

await assert.rejects(
  parseSnifaSanctioningDetail(
    recentHtml.replace('/General/Descargar/2060100096733', 'https://example.com/document.pdf'),
    {
      smaProcessId: 4577,
      expediente: 'D-147-2026',
      startDate: '2026-07-29',
      processState: 'En curso',
    },
  ),
  /snifa_detail_document_url_invalid/,
)

console.log('SMA SNIFA detail fixtures passed')
