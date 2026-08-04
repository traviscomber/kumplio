import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'

function neutralizeSpreadsheetFormula(value: unknown) {
  const text = value == null ? '' : String(value)
  return /^\s*[=+\-@]/.test(text) || /^[\t\r]/.test(text)
    ? `'${text}`
    : text
}

function safeWorksheetCell(value: unknown) {
  if (typeof value === 'number' || typeof value === 'boolean') return value
  return neutralizeSpreadsheetFormula(value)
}

function escapeCsvCell(value: unknown) {
  const safeValue = neutralizeSpreadsheetFormula(value)
  return `"${safeValue.replace(/"/g, '""')}"`
}

function csvRow(values: unknown[]) {
  return values.map(escapeCsvCell).join(',')
}

function addWorksheet(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: Array<Array<string | number | boolean>>,
  widths: number[],
) {
  const worksheet = workbook.addWorksheet(name, {
    properties: { defaultRowHeight: 18 },
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  worksheet.addRows(rows)
  worksheet.columns = widths.map((width) => ({ width }))

  const header = worksheet.getRow(1)
  header.font = { bold: true }
  header.alignment = { vertical: 'middle', wrapText: true }

  worksheet.eachRow((row) => {
    row.alignment = { vertical: 'top', wrapText: true }
  })

  return worksheet
}

export async function generateExcelReport(
  documentName: string,
  obligations: any[],
  matrix: any[],
  stats: any,
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Kumplio'
  workbook.company = 'n3uralia'
  workbook.created = new Date()
  workbook.modified = new Date()

  const summaryData = [
    ['KUMPLIO - Reporte de Cumplimiento', ''],
    ['', ''],
    ['Documento', safeWorksheetCell(documentName)],
    ['Fecha de reporte', new Date().toLocaleDateString('es-CL')],
    ['', ''],
    ['RESUMEN DE ESTADÍSTICAS', ''],
    ['Total de Obligaciones', obligations.length],
    ['Puntuación de Cumplimiento', `${stats.complianceScore}%`],
    ['Riesgos Críticos', matrix.filter((item: any) => item.risk_level === 'critical').length],
    ['Riesgos Altos', matrix.filter((item: any) => item.risk_level === 'high').length],
  ]

  addWorksheet(workbook, 'Resumen', summaryData, [30, 24])

  if (obligations.length > 0) {
    const obligationsRows = [
      ['Obligación', 'Tipo', 'Severidad', 'Responsable', 'Vencimiento', 'Notas'],
      ...obligations.map((item: any) => [
        safeWorksheetCell(item.obligation_text),
        safeWorksheetCell(item.type),
        safeWorksheetCell(item.severity),
        safeWorksheetCell(item.owner),
        safeWorksheetCell(item.deadline),
        safeWorksheetCell(item.evidence_reference),
      ]),
    ]

    addWorksheet(workbook, 'Obligaciones', obligationsRows, [60, 18, 14, 24, 18, 45])
  }

  if (matrix.length > 0) {
    const matrixRows = [
      ['Obligación', 'Nivel de Riesgo', 'Responsable', 'Vencimiento', 'Estado', 'Evidencia'],
      ...matrix.map((item: any) => [
        safeWorksheetCell(item.obligation),
        safeWorksheetCell(item.risk_level),
        safeWorksheetCell(item.responsible),
        safeWorksheetCell(item.due_date),
        safeWorksheetCell(item.status),
        safeWorksheetCell(item.evidence),
      ]),
    ]

    addWorksheet(workbook, 'Matriz Cumplimiento', matrixRows, [60, 18, 24, 18, 18, 45])
  }

  const output = await workbook.xlsx.writeBuffer()
  return new Uint8Array(output)
}

export function generateCSVReport(obligations: any[], matrix: any[]) {
  const rows: unknown[][] = [
    ['Obligaciones'],
    ['Descripción', 'Tipo', 'Severidad', 'Responsable', 'Vencimiento', 'Notas'],
    ...obligations.map((item: any) => [
      item.obligation_text,
      item.type,
      item.severity,
      item.owner,
      item.deadline,
      item.evidence_reference,
    ]),
    [],
    ['Matriz de Cumplimiento'],
    ['Obligación', 'Riesgo', 'Responsable', 'Vencimiento', 'Estado', 'Evidencia'],
    ...matrix.map((item: any) => [
      item.obligation,
      item.risk_level,
      item.responsible,
      item.due_date,
      item.status,
      item.evidence,
    ]),
  ]

  return `\uFEFF${rows.map(csvRow).join('\r\n')}\r\n`
}

export async function generatePDFReport(
  documentName: string,
  obligations: any[],
  matrix: any[],
  stats: any,
): Promise<Blob> {
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.text('KUMPLIO - Reporte de Cumplimiento', 20, 20)

  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Documento: ${documentName}`, 20, 35)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 20, 42)

  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text('Resumen Ejecutivo', 20, 55)

  doc.setFontSize(11)
  const statsY = 65
  doc.text(`Puntuación de Cumplimiento: ${stats.complianceScore}%`, 20, statsY)
  doc.text(`Total de Obligaciones: ${obligations.length}`, 20, statsY + 7)
  doc.text(`Riesgos Críticos: ${matrix.filter((item: any) => item.risk_level === 'critical').length}`, 20, statsY + 14)
  doc.text(`Riesgos Altos: ${matrix.filter((item: any) => item.risk_level === 'high').length}`, 20, statsY + 21)

  doc.addPage()
  doc.setFontSize(14)
  doc.text('Obligaciones Identificadas', 20, 20)

  let y = 30
  obligations.slice(0, 10).forEach((item: any) => {
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text(`• ${String(item.obligation_text || '').slice(0, 80)}`, 25, y)

    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text(`Tipo: ${String(item.type || '')} | Severidad: ${String(item.severity || '')}`, 30, y + 5)
    y += 12
  })

  if (obligations.length > 10) {
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text(`... y ${obligations.length - 10} obligaciones más`, 25, y)
  }

  return doc.output('blob')
}
