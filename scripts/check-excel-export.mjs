// Prueba de regresión ejecutada en CI: valida estructura XLSX y neutralización de fórmulas antes de publicar.
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { generateExcelReport } from '../lib/services/export.ts'

const output = await generateExcelReport(
  'Documento de prueba',
  [
    {
      obligation_text: '=HYPERLINK("https://example.com")',
      type: 'Privacidad',
      severity: 'high',
      owner: 'Responsable',
      deadline: '2026-12-01',
      evidence_reference: '@referencia',
    },
  ],
  [
    {
      obligation: '+SUM(1,1)',
      risk_level: 'high',
      responsible: 'Responsable',
      due_date: '2026-12-01',
      status: 'pending',
      evidence: '-evidencia',
    },
  ],
  { complianceScore: 0 },
)

assert.ok(output instanceof Uint8Array, 'La exportación debe devolver bytes')
assert.ok(output.byteLength > 1000, 'El archivo XLSX generado parece vacío')
assert.equal(String.fromCharCode(output[0], output[1]), 'PK', 'El archivo debe ser un contenedor ZIP/XLSX')

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.load(Buffer.from(output))

assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), [
  'Resumen',
  'Obligaciones',
  'Matriz Cumplimiento',
])

assert.equal(
  workbook.getWorksheet('Obligaciones')?.getCell('A2').value,
  "'=HYPERLINK(\"https://example.com\")",
  'Las fórmulas en obligaciones deben neutralizarse como texto',
)
assert.equal(
  workbook.getWorksheet('Matriz Cumplimiento')?.getCell('A2').value,
  "'+SUM(1,1)",
  'Las fórmulas en la matriz deben neutralizarse como texto',
)
assert.equal(
  workbook.getWorksheet('Matriz Cumplimiento')?.getCell('F2').value,
  "'-evidencia",
  'Los prefijos peligrosos deben neutralizarse en todas las columnas',
)

console.log('Excel export validation passed.')
