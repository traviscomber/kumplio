import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateCSVReport, generateExcelReport, generatePDFReport } from '@/lib/services/export'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const formatSchema = z.enum(['pdf', 'excel', 'csv'])

function safeBaseName(value: string) {
  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)

  return cleaned || 'documento'
}

function encodeRFC5987(value: string) {
  return encodeURIComponent(value).replace(/['()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

function downloadHeaders(filename: string, contentType: string) {
  const asciiFilename = filename
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/["\\]/g, '_') || 'reporte'

  return {
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeRFC5987(filename)}`,
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'authentication_required' },
      { status: 401 },
    )
  }

  const documentId = request.nextUrl.searchParams.get('documentId')?.trim()
  if (!documentId || documentId.length > 128) {
    return NextResponse.json(
      { error: 'Invalid documentId', code: 'invalid_document_id' },
      { status: 400 },
    )
  }

  const parsedFormat = formatSchema.safeParse(request.nextUrl.searchParams.get('format') || 'pdf')
  if (!parsedFormat.success) {
    return NextResponse.json(
      { error: 'Unsupported export format', code: 'unsupported_format' },
      { status: 400 },
    )
  }

  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('id, filename')
    .eq('id', documentId)
    .maybeSingle()

  if (documentError) {
    console.error('[export] document lookup failed', documentError.code)
    return NextResponse.json(
      { error: 'No fue posible consultar el documento.', code: 'document_lookup_failed' },
      { status: 500 },
    )
  }

  if (!document) {
    return NextResponse.json(
      { error: 'Documento no encontrado.', code: 'document_not_found' },
      { status: 404 },
    )
  }

  const [obligationsResult, matrixResult] = await Promise.all([
    supabase
      .from('obligations')
      .select('obligation_text, type, severity, owner, deadline, evidence_reference')
      .eq('document_id', documentId),
    supabase
      .from('compliance_matrix')
      .select('obligation, risk_level, responsible, due_date, status, evidence')
      .eq('document_id', documentId),
  ])

  if (obligationsResult.error || matrixResult.error) {
    console.error(
      '[export] related data lookup failed',
      obligationsResult.error?.code || matrixResult.error?.code,
    )
    return NextResponse.json(
      { error: 'No fue posible preparar los datos del reporte.', code: 'export_data_failed' },
      { status: 500 },
    )
  }

  const obligations = obligationsResult.data || []
  const matrix = matrixResult.data || []
  const completedCount = matrix.filter((item) => item.status === 'completed').length
  const complianceScore = matrix.length > 0
    ? Math.round((completedCount / matrix.length) * 100)
    : 0

  const stats = {
    complianceScore,
    totalObligations: obligations.length,
    criticalItems: matrix.filter((item) => item.risk_level === 'critical').length,
    highRiskItems: matrix.filter((item) => item.risk_level === 'high').length,
  }

  const timestamp = new Date().toISOString().slice(0, 10)
  const baseName = `reporte-${safeBaseName(document.filename || 'documento')}-${timestamp}`

  try {
    if (parsedFormat.data === 'excel') {
      const body = generateExcelReport(document.filename || 'Documento', obligations, matrix, stats)
      const filename = `${baseName}.xlsx`
      return new NextResponse(body, {
        headers: downloadHeaders(
          filename,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ),
      })
    }

    if (parsedFormat.data === 'csv') {
      const body = generateCSVReport(obligations, matrix)
      const filename = `${baseName}.csv`
      return new NextResponse(body, {
        headers: downloadHeaders(filename, 'text/csv; charset=utf-8'),
      })
    }

    const body = await generatePDFReport(document.filename || 'Documento', obligations, matrix, stats)
    const filename = `${baseName}.pdf`
    return new NextResponse(body, {
      headers: downloadHeaders(filename, 'application/pdf'),
    })
  } catch (error) {
    console.error('[export] generation failed', error instanceof Error ? error.message : 'unknown_error')
    return NextResponse.json(
      { error: 'No fue posible generar el reporte.', code: 'export_generation_failed' },
      { status: 500 },
    )
  }
}
