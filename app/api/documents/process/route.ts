// API endpoint for document upload and processing
// This will be called after file is uploaded to storage

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { documentId, userId } = await req.json();

    if (!documentId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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

    // TODO: Extract text from PDF/DOCX using pdf-parse
    // TODO: Call OpenAI API to extract obligations
    // TODO: Insert obligations into database
    // TODO: Generate compliance matrix
    // TODO: Update document status to completed

    console.log('[v0] Document processing started');

    return NextResponse.json({
      success: true,
      documentId,
      message: 'Document processing started',
    });
  } catch (error) {
    console.error('[v0] Processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
