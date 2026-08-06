// Prueba de regresión ejecutada en CI: valida estructura XLSX y neutralización de fórmulas antes de publicar.
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { generateExcelReport } from '../lib/services/export.ts'

const output = await generateExcelReport(
  '=Documento de prueba',
  [
    {
      id: '00000000-0000-0000-0000-000000000001',
      project_id: '00000000-0000-0000-0000-000000000002',
      document_id: '00000000-0000-0000-0000-000000000003',
      obligation_text: '=HYPERLINK("https://example.com")',
      responsible_party: '@responsable',
      due_date: '2026-12-01',
      priority: 'critical',
      status: 'pending',
      is1dora_confidence: 0.91,
      created_at: '2026-08-06T00:00:00.000Z',
    },
  ],
  { totalObligations: 1, criticalItems: 1, highPriorityItems: 0 },
)

assert.ok(output instanceof Uint8Array, 'La exportación debe devolver bytes')
assert.ok(output.byteLength > 1000, 'El archivo XLSX generado parece vacío')
assert.equal(String.fromCharCode(output[0], output[1]), 'PK', 'El archivo debe ser un contenedor ZIP/XLSX')

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.load(Buffer.from(output))

assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ['Resumen', 'Obligaciones'])
assert.equal(
  workbook.getWorksheet('Resumen')?.getCell('B3').value,
  "'=Documento de prueba",
  'El nombre del documento debe neutralizar fórmulas',
)
assert.equal(
  workbook.getWorksheet('Obligaciones')?.getCell('A2').value,
  "'=HYPERLINK(\"https://example.com\")",
  'Las fórmulas en obligaciones deben neutralizarse como texto',
)
assert.equal(
  workbook.getWorksheet('Obligaciones')?.getCell('C2').value,
  "'@responsable",
  'Los prefijos peligrosos deben neutralizarse en todas las columnas',
)

console.log('Excel export validation passed.')
