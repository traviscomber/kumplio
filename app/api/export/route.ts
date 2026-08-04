import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateCSVReport, generateExcelReport, generatePDFReport } from '@/lib/services/export'
import { createClient } from '@/lib/supabase/server'
import type { Obligation } from '@/lib/types/documents'

export const runtime = 'nodejs'

const formatSchema = z.enum(['pdf', 'excel', 'csv'])
const documentIdSchema = z.string().uuid()

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

  const parsedDocumentId = documentIdSchema.safeParse(
    request.nextUrl.searchParams.get('documentId')?.trim(),
  )
  if (!parsedDocumentId.success) {
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

  const documentId = parsedDocumentId.data
  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('id, name, status')
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

  if (document.status !== 'analyzed') {
    return NextResponse.json(
      { error: 'El documento debe estar analizado antes de exportarlo.', code: 'document_not_analyzed' },
      { status: 409 },
    )
  }

  const { data: obligationRows, error: obligationsError } = await supabase
    .from('obligations')
    .select('id, project_id, document_id, obligation_text, responsible_party, due_date, priority, status, is1dora_confidence, created_at')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })

  if (obligationsError) {
    console.error('[export] obligations lookup failed', obligationsError.code)
    return NextResponse.json(
      { error: 'No fue posible preparar los datos del reporte.', code: 'export_data_failed' },
      { status: 500 },
    )
  }

  const obligations = (obligationRows || []) as Obligation[]
  const stats = {
    totalObligations: obligations.length,
    criticalItems: obligations.filter((item) => item.priority === 'critical').length,
    highPriorityItems: obligations.filter((item) => item.priority === 'high').length,
  }

  const timestamp = new Date().toISOString().slice(0, 10)
  const baseName = `reporte-${safeBaseName(document.name || 'documento')}-${timestamp}`

  try {
    if (parsedFormat.data === 'excel') {
      const body = generateExcelReport(document.name || 'Documento', obligations, stats)
      const filename = `${baseName}.xlsx`
      return new NextResponse(body, {
        headers: downloadHeaders(
          filename,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ),
      })
    }

    if (parsedFormat.data === 'csv') {
      const body = generateCSVReport(obligations)
      const filename = `${baseName}.csv`
      return new NextResponse(body, {
        headers: downloadHeaders(filename, 'text/csv; charset=utf-8'),
      })
    }

    const body = await generatePDFReport(document.name || 'Documento', obligations, stats)
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
