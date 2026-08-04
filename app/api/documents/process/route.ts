import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cleanText, extractDocumentText } from '@/lib/services/pdf-extraction'
import { extractObligations } from '@/lib/services/openai-extraction'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 300

const requestSchema = z.object({
  documentId: z.string().uuid(),
})

function fileFormat(name: string, path: string | null) {
  const value = `${name} ${path || ''}`.toLowerCase()
  if (value.includes('.pdf')) return 'pdf'
  if (value.includes('.txt')) return 'txt'
  return null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'authentication_required' },
      { status: 401 },
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request', code: 'invalid_json' },
      { status: 400 },
    )
  }

  const parsed = requestSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid documentId', code: 'invalid_document_id' },
      { status: 400 },
    )
  }

  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('id, project_id, name, file_url, document_type, status')
    .eq('id', parsed.data.documentId)
    .maybeSingle()

  if (documentError) {
    console.error('[documents/process] lookup failed', documentError.code)
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

  if (document.status === 'analyzing') {
    return NextResponse.json(
      { error: 'El documento ya está siendo analizado.', code: 'analysis_in_progress' },
      { status: 409 },
    )
  }

  if (document.status === 'analyzed') {
    return NextResponse.json(
      { error: 'El documento ya fue analizado.', code: 'already_analyzed' },
      { status: 409 },
    )
  }

  if (!document.file_url) {
    return NextResponse.json(
      { error: 'El documento no tiene un archivo asociado.', code: 'missing_file' },
      { status: 422 },
    )
  }

  const format = fileFormat(document.name, document.file_url)
  if (!format) {
    return NextResponse.json(
      { error: 'Actualmente solo se procesan archivos PDF y TXT.', code: 'unsupported_file_type' },
      { status: 415 },
    )
  }

  const { error: analyzingError } = await supabase
    .from('documents')
    .update({ status: 'analyzing' })
    .eq('id', document.id)

  if (analyzingError) {
    console.error('[documents/process] status update failed', analyzingError.code)
    return NextResponse.json(
      { error: 'No fue posible iniciar el análisis.', code: 'analysis_start_failed' },
      { status: 500 },
    )
  }

  try {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_url)

    if (downloadError || !fileData) {
      throw new Error(downloadError?.message || 'missing storage object')
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const extractedText = cleanText(await extractDocumentText(buffer, format))
    if (extractedText.length < 20) {
      throw new Error('El archivo no contiene texto suficiente para analizar.')
    }

    const result = await extractObligations(extractedText, document.document_type || undefined)
    const obligations = result.obligations.slice(0, 500)
    const admin = createAdminClient()

    const { error: cleanupError } = await admin
      .from('obligations')
      .delete()
      .eq('document_id', document.id)

    if (cleanupError) throw cleanupError

    if (obligations.length > 0) {
      const { error: insertError } = await admin
        .from('obligations')
        .insert(obligations.map((item) => ({
          project_id: document.project_id,
          document_id: document.id,
          obligation_text: item.obligation_text,
          responsible_party: item.responsible_party,
          due_date: null,
          priority: item.priority,
          status: 'identified',
          is1dora_confidence: item.confidence ?? null,
        })))

      if (insertError) throw insertError
    }

    const { error: completedError } = await supabase
      .from('documents')
      .update({ status: 'analyzed' })
      .eq('id', document.id)

    if (completedError) throw completedError

    return NextResponse.json({
      success: true,
      documentId: document.id,
      obligationsCreated: obligations.length,
      limitations: result.limitations || [],
    }, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    console.error('[documents/process] failed', message)

    await supabase
      .from('documents')
      .update({ status: 'error' })
      .eq('id', document.id)

    return NextResponse.json(
      { error: 'No fue posible procesar el documento.', code: 'document_processing_failed' },
      { status: 500 },
    )
  }
}
