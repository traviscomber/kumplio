// Export service for generating PDF and Excel reports

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { ComplianceMatrix } from '@/lib/types/documents';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeObligations: boolean;
  includeMatrix: boolean;
  includeCharts: boolean;
}

export function generateExcelReport(
  documentName: string,
  obligations: any[],
  matrix: any[],
  stats: any
): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['KUMPLIO - Reporte de Cumplimiento', ''],
    ['', ''],
    ['Documento', documentName],
    ['Fecha de reporte', new Date().toLocaleDateString('es-CL')],
    ['', ''],
    ['RESUMEN DE ESTADÍSTICAS', ''],
    ['Total de Obligaciones', obligations.length],
    ['Puntuación de Cumplimiento', stats.complianceScore + '%'],
    ['Riesgos Críticos', matrix.filter((m: any) => m.risk_level === 'critical').length],
    ['Riesgos Altos', matrix.filter((m: any) => m.risk_level === 'high').length],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Obligations sheet
  if (obligations.length > 0) {
    const obligationsCols = [
      ['Obligación', 'Tipo', 'Severidad', 'Responsable', 'Vencimiento', 'Notas'],
      ...obligations.map((o: any) => [
        o.obligation_text || '',
        o.type || '',
        o.severity || '',
        o.owner || '',
        o.deadline || '',
        o.evidence_reference || '',
      ]),
    ];

    const obligationsSheet = XLSX.utils.aoa_to_sheet(obligationsCols);
    XLSX.utils.book_append_sheet(workbook, obligationsSheet, 'Obligaciones');
  }

  // Matrix sheet
  if (matrix.length > 0) {
    const matrixCols = [
      ['Obligación', 'Nivel de Riesgo', 'Responsable', 'Vencimiento', 'Estado', 'Evidencia'],
      ...matrix.map((m: any) => [
        m.obligation || '',
        m.risk_level || '',
        m.responsible || '',
        m.due_date || '',
        m.status || '',
        m.evidence || '',
      ]),
    ];

    const matrixSheet = XLSX.utils.aoa_to_sheet(matrixCols);
    XLSX.utils.book_append_sheet(workbook, matrixSheet, 'Matriz Cumplimiento');
  }

  // Set column widths
  const summarySheet2 = workbook.Sheets['Resumen'];
  summarySheet2['!cols'] = [{ wch: 30 }, { wch: 20 }];

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return wbout.buffer;
}

export function generateCSVReport(
  obligations: any[],
  matrix: any[]
): string {
  let csv = 'Obligaciones\n';
  csv += 'Descripción,Tipo,Severidad,Responsable,Vencimiento\n';

  obligations.forEach((o: any) => {
    csv += `"${o.obligation_text || ''}","${o.type || ''}","${o.severity || ''}","${o.owner || ''}","${o.deadline || ''}"\n`;
  });

  csv += '\n\nMatriz de Cumplimiento\n';
  csv += 'Obligación,Riesgo,Responsable,Vencimiento,Estado\n';

  matrix.forEach((m: any) => {
    csv += `"${m.obligation || ''}","${m.risk_level || ''}","${m.responsible || ''}","${m.due_date || ''}","${m.status || ''}"\n`;
  });

  return csv;
}

export async function generatePDFReport(
  documentName: string,
  obligations: any[],
  matrix: any[],
  stats: any
): Promise<Blob> {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text('KUMPLIO - Reporte de Cumplimiento', 20, 20);

  // Document info
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Documento: ${documentName}`, 20, 35);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 20, 42);

  // Stats section
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Resumen Ejecutivo', 20, 55);

  doc.setFontSize(11);
  const statsY = 65;
  doc.text(`Puntuación de Cumplimiento: ${stats.complianceScore}%`, 20, statsY);
  doc.text(`Total de Obligaciones: ${obligations.length}`, 20, statsY + 7);
  doc.text(`Riesgos Críticos: ${matrix.filter((m: any) => m.risk_level === 'critical').length}`, 20, statsY + 14);
  doc.text(`Riesgos Altos: ${matrix.filter((m: any) => m.risk_level === 'high').length}`, 20, statsY + 21);

  // Add page break
  doc.addPage();

  // Obligations section
  doc.setFontSize(14);
  doc.text('Obligaciones Identificadas', 20, 20);

  let y = 30;
  obligations.slice(0, 10).forEach((o: any) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`• ${o.obligation_text?.substring(0, 80) || ''}`, 25, y);

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Tipo: ${o.type} | Severidad: ${o.severity}`, 30, y + 5);

    y += 12;
  });

  if (obligations.length > 10) {
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`... y ${obligations.length - 10} obligaciones más`, 25, y);
  }

  // Convert to Blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}
