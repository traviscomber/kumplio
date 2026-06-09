// API endpoint for document processing
// Handles: download → extract text → extract obligations → insert results → update status

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractDocumentText, cleanText } from '@/lib/services/pdf-extraction'
import { extractObligations } from '@/lib/services/openai-extraction'
import { updateDocumentStatus } from '@/lib/services/documents'

export async function POST(req: NextRequest) {
  try {
    const { documentId } = await req.json()

    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })
    }

    // Create service-role client for backend operations (INSERT to obligations, risks, roadmaps)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[process] Starting document processing:', documentId)

    // 1. Get document info
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*, projects(id)')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      console.error('[process] Document not found:', docError)
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const projectId = doc.project_id

    try {
      // 2. Download file from storage
      console.log('[process] Downloading:', doc.file_url)
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(doc.file_url)

      if (downloadError || !fileData) {
        throw new Error(`Storage download failed: ${downloadError?.message || 'unknown'}`)
      }

      // 3. Extract text from document
      const buffer = Buffer.from(await fileData.arrayBuffer())
      const fileExt = doc.name.split('.').pop()?.toLowerCase() || 'txt'
      let extractedText = await extractDocumentText(buffer, fileExt)
      extractedText = cleanText(extractedText)

      // 4. Extract obligations using OpenAI GPT-4o
      console.log('[process] Extracting obligations with GPT-4o...')
      const extractionResult = await extractObligations(extractedText, doc.document_type)

      // 5. Insert obligations into the obligations table
      if (extractionResult.obligations.length > 0) {
        const obligationsData = extractionResult.obligations.map((o) => ({
          project_id: projectId,
          obligation_text: o.obligation_text,
          type: o.type,
          severity: o.severity,
          responsible_party: o.responsible_party,
          priority: o.priority,
          status: 'pending',
          created_at: new Date().toISOString(),
        }))

        const { error: obligError } = await supabase
          .from('obligations')
          .insert(obligationsData)

        if (obligError) {
          console.error('[process] Error inserting obligations:', obligError)
          throw new Error(`Failed to insert obligations: ${obligError.message}`)
        }

        console.log('[process] Inserted', obligationsData.length, 'obligations')
      }

      // 6. Insert risks based on high-priority obligations
      const criticalObligations = extractionResult.obligations.filter(
        (o) => o.priority === 'critical' || o.severity === 'critical'
      )

      if (criticalObligations.length > 0) {
        const risksData = criticalObligations.map((o, idx) => ({
          project_id: projectId,
          risk_name: `Risk: ${o.obligation_text.slice(0, 80)}`,
          risk_description: o.obligation_text,
          impact: 'high',
          likelihood: 'high',
          mitigation: `Address: ${o.responsible_party || 'owner'}`,
          priority: o.priority,
          status: 'open',
          created_at: new Date().toISOString(),
        }))

        const { error: risksError } = await supabase.from('risks').insert(risksData)

        if (risksError) {
          console.warn('[process] Warning inserting risks:', risksError)
        } else {
          console.log('[process] Inserted', risksData.length, 'risks')
        }
      }

      // 7. Insert roadmap actions for critical items
      if (criticalObligations.length > 0) {
        const roadmapData = criticalObligations.map((o, idx) => ({
          project_id: projectId,
          phase: idx < 2 ? 'immediate' : idx < 5 ? 'short-term' : 'long-term',
          action: o.obligation_text,
          owner: o.responsible_party || 'TBD',
          target_date: new Date(Date.now() + (idx + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          created_at: new Date().toISOString(),
        }))

        const { error: roadmapError } = await supabase
          .from('roadmaps')
          .insert(roadmapData)

        if (roadmapError) {
          console.warn('[process] Warning inserting roadmap:', roadmapError)
        } else {
          console.log('[process] Inserted', roadmapData.length, 'roadmap items')
        }
      }

      // 8. Update document status to completed
      await updateDocumentStatus(supabase, documentId, 'completed')

      console.log('[process] Document processing completed')

      return NextResponse.json({
        success: true,
        documentId,
        obligationsExtracted: extractionResult.obligations.length,
        riskSummary: extractionResult.riskSummary,
      })
    } catch (processingError) {
      const errorMsg = processingError instanceof Error ? processingError.message : 'Unknown error'
      console.error('[process] Processing error:', errorMsg)

      // Update document with error status
      await updateDocumentStatus(supabase, documentId, 'error', errorMsg)

      return NextResponse.json(
        { error: errorMsg, documentId },
        { status: 500 }
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('[process] API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

