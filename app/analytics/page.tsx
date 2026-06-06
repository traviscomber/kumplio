'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TopNav } from '@/components/layout/top-nav';
import { RiskDistributionChart } from '@/components/analytics/risk-chart';
import { DocumentTimelineChart } from '@/components/analytics/timeline-chart';
import { ObligationsByTypeChart } from '@/components/analytics/obligations-chart';
import { AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';
import { getAnalyticsData, getDashboardStats } from '@/lib/services/analytics';

export default function AnalyticsDashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = '/sign-in';
          return;
        }

        setUserId(user.id);

        // Load analytics data
        const analyticsData = await getAnalyticsData(user.id);
        setAnalytics(analyticsData);

        // Load dashboard stats
        const dashboardStats = await getDashboardStats(user.id);
        setStats(dashboardStats);
      } catch (err) {
        console.error('[v0] Error loading analytics:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto px-6 py-8">
          <p className="text-muted-foreground">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto px-6 py-8">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-muted-foreground">
              Dashboard de cumplimiento y análisis de riesgos
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Documentos</p>
                    <p className="text-3xl font-bold">{stats.totalDocuments}</p>
                  </div>
                  <FileText className="w-8 h-8 text-muted-foreground/50" />
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Obligaciones</p>
                    <p className="text-3xl font-bold">{stats.totalObligations}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-muted-foreground/50" />
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Crítico</p>
                    <p className="text-3xl font-bold text-red-600">{stats.criticalItems}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pendientes</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.pendingItems}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>
          )}

          {/* Compliance Score */}
          {analytics && (
            <>
              <div className="bg-card border border-border rounded-lg p-8">
                <h2 className="text-lg font-semibold mb-4">Puntuación de cumplimiento</h2>
                <div className="flex items-center gap-8">
                  <div className="flex-1">
                    <div className="relative w-40 h-40">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="var(--border)"
                          strokeWidth="4"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="var(--chart-1)"
                          strokeWidth="4"
                          strokeDasharray={`${analytics.averageComplianceScore * 2.83} 283`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-3xl font-bold">
                            {analytics.averageComplianceScore}%
                          </p>
                          <p className="text-sm text-muted-foreground">Cumplimiento</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Documentos completados</p>
                      <p className="text-2xl font-bold">
                        {analytics.completedDocuments}/{analytics.totalDocuments}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Próximos vencimientos</p>
                      <p className="text-2xl font-bold">
                        {analytics.upcomingDeadlines?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Risk Distribution */}
                <div className="bg-card border border-border rounded-lg p-8">
                  <h2 className="text-lg font-semibold mb-4">Distribución de riesgos</h2>
                  <RiskDistributionChart data={analytics.riskDistribution} />
                </div>

                {/* Document Timeline */}
                <div className="bg-card border border-border rounded-lg p-8">
                  <h2 className="text-lg font-semibold mb-4">Línea de tiempo de documentos</h2>
                  <DocumentTimelineChart data={analytics.documentTimeline} />
                </div>
              </div>

              {/* Obligations by Type */}
              {analytics.obligationsByType && analytics.obligationsByType.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-8">
                  <h2 className="text-lg font-semibold mb-4">Obligaciones por tipo</h2>
                  <ObligationsByTypeChart data={analytics.obligationsByType} />
                </div>
              )}

              {/* Upcoming Deadlines */}
              {analytics.upcomingDeadlines && analytics.upcomingDeadlines.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-8">
                  <h2 className="text-lg font-semibold mb-4">Próximos vencimientos</h2>
                  <div className="space-y-3">
                    {analytics.upcomingDeadlines.map((deadline: any, idx: number) => (
                      <div key={idx} className="flex items-start justify-between pb-3 border-b border-border last:border-b-0">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{deadline.obligation}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Vencimiento: {new Date(deadline.dueDate).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          deadline.risk === 'critical' 
                            ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                            : deadline.risk === 'high'
                            ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
                            : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                        }`}>
                          {deadline.risk.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
