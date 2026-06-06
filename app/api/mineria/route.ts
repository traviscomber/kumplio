// API endpoint for mining compliance evaluation (Ley 21.800)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { evaluateMiningCompliance, getMiningCategoryStats, LEY_21800_REQUIREMENTS } from '@/lib/services/mineria';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') || 'requirements';
    const category = req.nextUrl.searchParams.get('category');

    if (type === 'requirements') {
      if (category) {
        const filtered = LEY_21800_REQUIREMENTS.filter(r => r.category === category);
        return NextResponse.json({ requirements: filtered });
      }
      return NextResponse.json({ requirements: LEY_21800_REQUIREMENTS });
    }

    if (type === 'categories') {
      const categories = ['seguridad', 'salud', 'ambiente', 'reporte', 'capacitacion'];
      const categoryStats = categories.map(cat => {
        const reqs = LEY_21800_REQUIREMENTS.filter(r => r.category === cat);
        return {
          category: cat,
          count: reqs.length,
          requirements: reqs,
        };
      });
      return NextResponse.json({ categories: categoryStats });
    }

    return NextResponse.json(
      { error: 'Invalid query type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[v0] Mining API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, documentId } = body;

    if (action === 'evaluate-compliance') {
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

      // Evaluate compliance
      const complianceResults = evaluateMiningCompliance(obligations || [], document.industry);
      const categoryStats = getMiningCategoryStats(complianceResults);

      // Calculate overall score
      const totalResults = complianceResults.length;
      const completedResults = complianceResults.filter(r => r.status === 'cumplido').length;
      const overallPercentage = totalResults > 0 ? Math.round((completedResults / totalResults) * 100) : 0;

      return NextResponse.json({
        documentId,
        complianceResults,
        categoryStats,
        overallPercentage,
        lastEvaluated: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[v0] Mining API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
