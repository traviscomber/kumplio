// API endpoint for document processing
// Handles: extract text → extract obligations → generate matrix → update status

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractDocumentText, cleanText, chunkText } from '@/lib/services/pdf-extraction';
import { extractObligations, generateComplianceMatrix, formatExtractionForStorage } from '@/lib/services/openai-extraction';

export async function POST(req: NextRequest) {
  try {
    const { documentId, userId } = await req.json();

    if (!documentId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[v0] Processing document:', documentId);

    // Get document info
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select()
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('[v0] Document not found:', docError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    try {
      // 1. Download file from storage
      console.log('[v0] Downloading file from storage:', document.s3_key);
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(document.s3_key);

      if (downloadError || !fileData) {
        throw new Error('Failed to download document');
      }

      // 2. Extract text from document
      console.log('[v0] Extracting text from', document.file_type);
      const buffer = Buffer.from(await fileData.arrayBuffer());
      let extractedText = await extractDocumentText(buffer, document.file_type);

      // 3. Clean text
      extractedText = cleanText(extractedText);

      // 4. Extract obligations using AI
      console.log('[v0] Calling AI for obligation extraction');
      const extractionResult = await extractObligations(extractedText, document.industry);

      // 5. Save extracted text and content
      await supabase
        .from('documents')
        .update({
          content_text: extractedText,
          extraction_complete: true,
        })
        .eq('id', documentId);

      // 6. Insert obligations
      const formattedExtraction = formatExtractionForStorage(extractionResult);
      const obligationsToInsert = formattedExtraction.obligations.map((o) => ({
        document_id: documentId,
        ...o,
      }));

      if (obligationsToInsert.length > 0) {
        const { error: obligError } = await supabase
          .from('obligations')
          .insert(obligationsToInsert);

        if (obligError) console.error('[v0] Error inserting obligations:', obligError);
      }

      // 7. Generate and insert compliance matrix
      const complianceMatrix = generateComplianceMatrix(extractionResult.obligations);
      const matrixToInsert = extractionResult.obligations.map((o) => ({
        document_id: documentId,
        obligation: o.text,
        risk_level: o.severity,
        responsible: o.owner,
        due_date: o.deadline,
        evidence: o.evidence_reference,
        status: 'pending',
      }));

      if (matrixToInsert.length > 0) {
        const { error: matrixError } = await supabase
          .from('compliance_matrix')
          .insert(matrixToInsert);

        if (matrixError) console.error('[v0] Error inserting matrix:', matrixError);
      }

      // 8. Update document status to completed
      await supabase
        .from('documents')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      console.log('[v0] Document processing completed successfully');

      return NextResponse.json({
        success: true,
        documentId,
        obligations: extractionResult.obligations.length,
        complianceScore: complianceMatrix.complianceScore,
        message: 'Document processed successfully',
      });
    } catch (processingError) {
      console.error('[v0] Processing error:', processingError);

      // Update document with error status
      const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown error';
      await supabase
        .from('documents')
        .update({
          status: 'error',
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      throw processingError;
    }
  } catch (error) {
    console.error('[v0] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

