// API endpoint for exporting documents to various formats

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateExcelReport, generateCSVReport, generatePDFReport } from '@/lib/services/export';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const documentId = req.nextUrl.searchParams.get('documentId');
    const format = req.nextUrl.searchParams.get('format') || 'pdf';

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing documentId' },
        { status: 400 }
      );
    }

    // Get document
    const { data: document } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (!document || document.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get obligations
    const { data: obligations } = await supabase
      .from('obligations')
      .select('*')
      .eq('document_id', documentId);

    // Get matrix
    const { data: matrix } = await supabase
      .from('compliance_matrix')
      .select('*')
      .eq('document_id', documentId);

    // Calculate stats
    const matrixData = matrix || [];
    const criticalCount = matrixData.filter(m => m.risk_level === 'critical').length;
    const highCount = matrixData.filter(m => m.risk_level === 'high').length;
    const completedCount = matrixData.filter(m => m.status === 'completed').length;
    const totalCount = matrixData.length;
    const complianceScore = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const stats = {
      complianceScore,
      totalObligations: obligations?.length || 0,
      criticalItems: criticalCount,
      highRiskItems: highCount,
    };

    let blob: Blob | Buffer;
    let contentType: string;
    let filename: string;

    const timestamp = new Date().toISOString().split('T')[0];
    const baseName = `reporte-${document.filename}-${timestamp}`;

    if (format === 'excel') {
      const buffer = generateExcelReport(
        document.filename,
        obligations || [],
        matrix || [],
        stats
      );
      blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `${baseName}.xlsx`;
    } else if (format === 'csv') {
      const csv = generateCSVReport(obligations || [], matrix || []);
      blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      contentType = 'text/csv';
      filename = `${baseName}.csv`;
    } else {
      // PDF format (default)
      blob = await generatePDFReport(
        document.filename,
        obligations || [],
        matrix || [],
        stats
      );
      contentType = 'application/pdf';
      filename = `${baseName}.pdf`;
    }

    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[v0] Export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
