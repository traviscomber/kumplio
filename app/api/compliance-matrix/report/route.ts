// API endpoint for compliance matrix reporting
// Returns matrix statistics and recommendations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  generateMatrixReport,
  getRecommendations,
  getComplianceStatus,
} from '@/lib/services/matrix-report';

export async function GET(req: NextRequest) {
  try {
    const documentId = req.nextUrl.searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing documentId parameter' },
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

    console.log('[v0] Fetching matrix report for document:', documentId);

    // Get document
    const { data: document } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get matrix entries
    const { data: matrix } = await supabase
      .from('compliance_matrix')
      .select('*')
      .eq('document_id', documentId);

    // Get obligations
    const { data: obligations } = await supabase
      .from('obligations')
      .select('*')
      .eq('document_id', documentId);

    if (!matrix || !obligations) {
      return NextResponse.json(
        { error: 'No analysis data found' },
        { status: 404 }
      );
    }

    console.log('[v0] Generating matrix report with', matrix.length, 'items');

    // Generate report
    const report = generateMatrixReport(matrix, obligations);
    const recommendations = getRecommendations(report);
    const complianceStatus = getComplianceStatus(report.summary.complianceScore);

    return NextResponse.json({
      success: true,
      report,
      recommendations,
      complianceStatus,
      documentName: document.filename,
    });
  } catch (error) {
    console.error('[v0] Report generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
