import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import type { Obligation } from '@/lib/types/documents'

type ExportStats = {
  totalObligations: number
  criticalItems: number
  highPriorityItems: number
}

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

function priorityLabel(priority: Obligation['priority']) {
  return priority || 'sin prioridad'
}

export function generateExcelReport(
  documentName: string,
  obligations: Obligation[],
  stats: ExportStats,
): ArrayBuffer {
  const workbook = XLSX.utils.book_new()

  const summaryData = [
    ['KUMPLIO - Reporte de obligaciones identificadas', ''],
    ['', ''],
    ['Documento', safeWorksheetCell(documentName)],
    ['Fecha de reporte', new Date().toLocaleDateString('es-CL')],
    ['', ''],
    ['RESUMEN', ''],
    ['Total de obligaciones', stats.totalObligations],
    ['Prioridad crítica', stats.criticalItems],
    ['Prioridad alta', stats.highPriorityItems],
    ['', ''],
    ['Advertencia', 'Resultados preliminares sujetos a revisión humana y a las fuentes originales.'],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 80 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')

  const obligationsRows = [
    ['Obligación', 'Prioridad', 'Responsable', 'Vencimiento', 'Estado', 'Confianza técnica'],
    ...obligations.map((item) => [
      safeWorksheetCell(item.obligation_text),
      safeWorksheetCell(priorityLabel(item.priority)),
      safeWorksheetCell(item.responsible_party),
      safeWorksheetCell(item.due_date),
      safeWorksheetCell(item.status),
      typeof item.is1dora_confidence === 'number'
        ? Math.round(item.is1dora_confidence * 100) / 100
        : '',
    ]),
  ]

  const obligationsSheet = XLSX.utils.aoa_to_sheet(obligationsRows)
  obligationsSheet['!cols'] = [
    { wch: 80 },
    { wch: 18 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
  ]
  XLSX.utils.book_append_sheet(workbook, obligationsSheet, 'Obligaciones')

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
}

export function generateCSVReport(obligations: Obligation[]) {
  const rows: unknown[][] = [
    ['Obligaciones identificadas'],
    ['Descripción', 'Prioridad', 'Responsable', 'Vencimiento', 'Estado', 'Confianza técnica'],
    ...obligations.map((item) => [
      item.obligation_text,
      priorityLabel(item.priority),
      item.responsible_party,
      item.due_date,
      item.status,
      typeof item.is1dora_confidence === 'number'
        ? Math.round(item.is1dora_confidence * 100) / 100
        : '',
    ]),
    [],
    ['Advertencia', 'Resultados preliminares sujetos a revisión humana y a las fuentes originales.'],
  ]

  return `\uFEFF${rows.map(csvRow).join('\r\n')}\r\n`
}

export async function generatePDFReport(
  documentName: string,
  obligations: Obligation[],
  stats: ExportStats,
): Promise<Blob> {
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.text('KUMPLIO - Reporte de obligaciones', 20, 20)

  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Documento: ${documentName}`, 20, 35)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 20, 42)

  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text('Resumen', 20, 55)

  doc.setFontSize(11)
  doc.text(`Total de obligaciones: ${stats.totalObligations}`, 20, 65)
  doc.text(`Prioridad crítica: ${stats.criticalItems}`, 20, 72)
  doc.text(`Prioridad alta: ${stats.highPriorityItems}`, 20, 79)

  doc.setFontSize(9)
  doc.setTextColor(120)
  const warning = doc.splitTextToSize(
    'Resultados preliminares sujetos a revisión humana y a las fuentes originales. Este reporte no demuestra cumplimiento ni reemplaza asesoría profesional.',
    170,
  )
  doc.text(warning, 20, 92)

  doc.addPage()
  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text('Obligaciones identificadas', 20, 20)

  let y = 32
  obligations.forEach((item, index) => {
    const description = doc.splitTextToSize(`${index + 1}. ${item.obligation_text}`, 165)
    const metadata = [
      `Prioridad: ${priorityLabel(item.priority)}`,
      item.responsible_party ? `Responsable: ${item.responsible_party}` : null,
      item.due_date ? `Vencimiento: ${new Date(item.due_date).toLocaleDateString('es-CL')}` : null,
    ].filter(Boolean).join(' · ')

    const requiredHeight = description.length * 5 + 12
    if (y + requiredHeight > 275) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text(description, 20, y)
    y += description.length * 5 + 2

    doc.setFontSize(8)
    doc.setTextColor(120)
    doc.text(doc.splitTextToSize(metadata || 'Sin metadatos adicionales', 165), 20, y)
    y += 10
  })

  return doc.output('blob')
}
