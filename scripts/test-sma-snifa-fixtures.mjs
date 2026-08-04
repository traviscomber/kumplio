import assert from 'node:assert/strict'
import {
  EXPECTED_HEADERS,
  chunkRows,
  parseDelimitedCsv,
  parseSmaDate,
  parseSmaSanctioningCsv,
} from '../supabase/functions/sma-snifa-bootstrap/core.mjs'

function csv(rows) {
  return [EXPECTED_HEADERS.join(';'), ...rows].join('\n')
}

const rows = [
  '1;A-002-2013;Autodenuncia;En curso;27-03-2013;23-06-2026;No;7021.0;https://snifa.sma.gob.cl/Sancionatorio/Ficha/1   ;1078;BARRICK - PASCUA LAMA;Región de Atacama;Alto del Carmen;-29.282648;-70.063014;Minería;Minera metálica;http://snifa.sma.gob.cl/UnidadFiscalizable/Ficha/1078  ;03-08-26',
  '1;A-002-2013;Autodenuncia;En curso;27-03-2013;23-06-2026;No;7021.0;https://snifa.sma.gob.cl/Sancionatorio/Ficha/1;2000;"CENTRO ""CALEUCHE""";Región Metropolitana;Providencia;-33.431439;-70.609251;Equipamiento;Otros equipamientos;http://snifa.sma.gob.cl/UnidadFiscalizable/Ficha/2000;03-08-26',
  '2;F-002-2013;Fiscalización;Terminado - Sanción;01-04-2013;13-08-2013;No;94.0;https://snifa.sma.gob.cl/Sancionatorio/Ficha/2;162;MALL PLAZA EGAÑA - LA REINA;Región Metropolitana;La Reina;-33.453;-70.57;;;http://snifa.sma.gob.cl/UnidadFiscalizable/Ficha/162;03-08-26',
  '3;D-242-2023;Denuncia;Terminado - Sanción;30-10-2023;25-05-2026;No;2.3;https://snifa.sma.gob.cl/Sancionatorio/Ficha/3;22011;RESTOBAR HUANHUALI 430;Región de Coquimbo;La Serena;;-71.253729;Equipamiento;Discoteca / pub;http://snifa.sma.gob.cl/UnidadFiscalizable/Ficha/22011;03-08-26',
]

const parsed = parseSmaSanctioningCsv(csv(rows), { minimumRows: 1 })

assert.equal(parsed.parserVersion, 'sma-snifa-sanctioning-v1')
assert.equal(parsed.headers.length, 19)
assert.equal(parsed.metrics.rawRowCount, 4)
assert.equal(parsed.metrics.proceedingCount, 3)
assert.equal(parsed.metrics.fiscalizableUnitCount, 4)
assert.equal(parsed.metrics.relationCount, 4)
assert.equal(parsed.metrics.sourceUpdateDate, '2026-08-03')
assert.equal(parsed.metrics.blankCategoryCount, 1)
assert.equal(parsed.metrics.missingCoordinateCount, 1)
assert.equal(parsed.metrics.partialCoordinateCount, 1)
assert.equal(parsed.metrics.states['Terminado - Sanción'], 2)

assert.equal(parsed.rows[0].unit_url, 'https://snifa.sma.gob.cl/UnidadFiscalizable/Ficha/1078')
assert.equal(parsed.rows[1].unit_name, 'CENTRO "CALEUCHE"')
assert.equal(parsed.rows[2].economic_category, null)
assert.equal(parsed.rows[2].economic_subcategory, null)
assert.equal(parsed.rows[3].latitude, null)
assert.equal(parsed.rows[3].longitude, -71.253729)
assert.equal(parsed.rows[0].start_date, '2013-03-27')
assert.equal(parsed.rows[0].source_update_date, '2026-08-03')

assert.equal(parseSmaDate('03-08-26'), '2026-08-03')
assert.equal(parseSmaDate('', { optional: true }), null)
assert.deepEqual(chunkRows(parsed.rows, 3).map((batch) => batch.length), [3, 1])
assert.equal(parseDelimitedCsv('"A;B";C\n"D""E";F')[0][0], 'A;B')
assert.equal(parseDelimitedCsv('"A;B";C\n"D""E";F')[1][0], 'D"E')

const badHeader = csv(rows).replace('ProcesoSancionId', 'ProcesoId')
assert.throws(
  () => parseSmaSanctioningCsv(badHeader, { minimumRows: 1 }),
  /sma_csv_headers_changed/,
)

const inconsistent = csv([
  rows[0],
  rows[1].replace(';En curso;', ';Suspendido;'),
])
assert.throws(
  () => parseSmaSanctioningCsv(inconsistent, { minimumRows: 1 }),
  /sma_inconsistent_process_fields/,
)

const duplicate = csv([rows[0], rows[0]])
assert.throws(
  () => parseSmaSanctioningCsv(duplicate, { minimumRows: 1 }),
  /sma_duplicate_process_unit/,
)

const externalUrl = csv([
  rows[0].replace(
    'https://snifa.sma.gob.cl/Sancionatorio/Ficha/1',
    'https://example.com/Sancionatorio/Ficha/1',
  ),
])
assert.throws(
  () => parseSmaSanctioningCsv(externalUrl, { minimumRows: 1 }),
  /sma_invalid_proceeding_url/,
)

const unknownState = csv([
  rows[0].replace(';En curso;', ';Estado desconocido;'),
])
assert.throws(
  () => parseSmaSanctioningCsv(unknownState, { minimumRows: 1 }),
  /sma_unknown_process_state/,
)

console.log('SMA SNIFA sanctioning fixtures passed')
