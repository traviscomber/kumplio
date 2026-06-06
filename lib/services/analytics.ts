// Analytics service for BrightScope
// Generates charts data and insights from compliance data

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function getAnalyticsData(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get all documents for user
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);

    if (!documents || documents.length === 0) {
      return {
        totalDocuments: 0,
        completedDocuments: 0,
        averageComplianceScore: 0,
        riskDistribution: [],
        documentTimeline: [],
        obligationsByType: [],
        upcomingDeadlines: [],
      };
    }

    // Get compliance matrix data
    const docIds = documents.map(d => d.id);
    const { data: matrixData } = await supabase
      .from('compliance_matrix')
      .select('*')
      .in('document_id', docIds);

    const { data: obligationsData } = await supabase
      .from('obligations')
      .select('*')
      .in('document_id', docIds);

    // Calculate metrics
    const completedDocs = documents.filter(d => d.status === 'completed').length;
    const totalRisks = matrixData || [];
    
    // Risk distribution
    const riskDistribution = [
      {
        name: 'Crítico',
        value: totalRisks.filter(r => r.risk_level === 'critical').length,
        fill: 'var(--chart-1)',
      },
      {
        name: 'Alto',
        value: totalRisks.filter(r => r.risk_level === 'high').length,
        fill: 'var(--chart-2)',
      },
      {
        name: 'Medio',
        value: totalRisks.filter(r => r.risk_level === 'medium').length,
        fill: 'var(--chart-3)',
      },
      {
        name: 'Bajo',
        value: totalRisks.filter(r => r.risk_level === 'low').length,
        fill: 'var(--chart-4)',
      },
    ];

    // Document timeline
    const documentTimeline = documents
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(doc => ({
        name: doc.filename.substring(0, 15),
        uploaded: 1,
        analyzed: doc.status === 'completed' ? 1 : 0,
        date: new Date(doc.created_at).toLocaleDateString('es-CL'),
      }));

    // Obligations by type
    const typeCount = new Map<string, number>();
    (obligationsData || []).forEach(obl => {
      const type = obl.type || 'General';
      typeCount.set(type, (typeCount.get(type) || 0) + 1);
    });

    const obligationsByType = Array.from(typeCount.entries()).map(([type, count]) => ({
      type,
      count,
      fill: `var(--chart-${Math.floor(Math.random() * 4) + 1})`,
    }));

    // Upcoming deadlines
    const upcoming = totalRisks
      .filter(r => r.due_date && new Date(r.due_date) > new Date())
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5)
      .map(r => ({
        obligation: r.obligation.substring(0, 40),
        dueDate: r.due_date,
        status: r.status,
        risk: r.risk_level,
      }));

    // Average compliance score
    const completedWithMatrix = documents.filter(d => 
      d.status === 'completed' && 
      (matrixData || []).some(m => m.document_id === d.id)
    );
    
    let averageScore = 0;
    if (completedWithMatrix.length > 0) {
      const totalCompleted = (matrixData || [])
        .filter(m => 
          completedWithMatrix.some(d => d.id === m.document_id) &&
          m.status === 'completed'
        ).length;
      
      const totalObligs = (matrixData || [])
        .filter(m => completedWithMatrix.some(d => d.id === m.document_id)).length;
      
      averageScore = totalObligs > 0 
        ? Math.round((totalCompleted / totalObligs) * 100) 
        : 0;
    }

    return {
      totalDocuments: documents.length,
      completedDocuments: completedDocs,
      averageComplianceScore: averageScore,
      riskDistribution,
      documentTimeline,
      obligationsByType,
      upcomingDeadlines: upcoming,
    };
  } catch (error) {
    console.error('[v0] Analytics error:', error);
    throw error;
  }
}

export async function getDashboardStats(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);

    const docIds = documents?.map(d => d.id) || [];
    
    const { data: matrixData } = await supabase
      .from('compliance_matrix')
      .select('*')
      .in('document_id', docIds);

    const { data: obligationsData } = await supabase
      .from('obligations')
      .select('*')
      .in('document_id', docIds);

    const critical = (matrixData || []).filter(m => m.risk_level === 'critical').length;
    const high = (matrixData || []).filter(m => m.risk_level === 'high').length;
    const pending = (matrixData || []).filter(m => m.status === 'pending').length;

    return {
      totalDocuments: documents?.length || 0,
      totalObligations: obligationsData?.length || 0,
      criticalItems: critical,
      highRiskItems: high,
      pendingItems: pending,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[v0] Dashboard stats error:', error);
    throw error;
  }
}
