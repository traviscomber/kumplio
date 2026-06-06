// Compliance matrix report generator
// Creates detailed analysis and summaries from matrix data

import { ComplianceMatrix, Obligation } from '@/lib/types/documents';

export interface MatrixReport {
  summary: {
    totalObligations: number;
    byRiskLevel: Record<string, number>;
    byStatus: Record<string, number>;
    complianceScore: number;
    riskScore: number;
  };
  criticalItems: ComplianceMatrix[];
  upcomingDeadlines: ComplianceMatrix[];
  pendingItems: ComplianceMatrix[];
  statistics: {
    averageCompletionDays: number;
    oldestPending: ComplianceMatrix | null;
    mostCommonRisk: string;
  };
}

/**
 * Generate comprehensive matrix report
 */
export function generateMatrixReport(
  matrix: ComplianceMatrix[],
  obligations: Obligation[]
): MatrixReport {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Summary stats
  const byRiskLevel = {
    critical: matrix.filter((m) => m.risk_level === 'critical').length,
    high: matrix.filter((m) => m.risk_level === 'high').length,
    medium: matrix.filter((m) => m.risk_level === 'medium').length,
    low: matrix.filter((m) => m.risk_level === 'low').length,
  };

  const byStatus = {
    pending: matrix.filter((m) => m.status === 'pending').length,
    in_progress: matrix.filter((m) => m.status === 'in_progress').length,
    completed: matrix.filter((m) => m.status === 'completed').length,
  };

  // Compliance score (0-100)
  const complianceScore = calculateComplianceScore(byRiskLevel, byStatus);

  // Risk score (0-100, higher = more risky)
  const riskScore = calculateRiskScore(byRiskLevel);

  // Critical items
  const criticalItems = matrix
    .filter((m) => m.risk_level === 'critical')
    .sort((a, b) => {
      const aDate = new Date(a.due_date || new Date()).getTime();
      const bDate = new Date(b.due_date || new Date()).getTime();
      return aDate - bDate;
    });

  // Upcoming deadlines (next 30 days)
  const upcomingDeadlines = matrix
    .filter((m) => {
      if (!m.due_date) return false;
      const dueDate = new Date(m.due_date);
      return dueDate >= now && dueDate <= thirtyDaysFromNow;
    })
    .sort((a, b) => {
      const aDate = new Date(a.due_date!).getTime();
      const bDate = new Date(b.due_date!).getTime();
      return aDate - bDate;
    });

  // Pending items
  const pendingItems = matrix
    .filter((m) => m.status === 'pending')
    .sort((a, b) => {
      const aDate = new Date(a.due_date || new Date()).getTime();
      const bDate = new Date(b.due_date || new Date()).getTime();
      return aDate - bDate;
    });

  // Statistics
  const oldestPending = pendingItems[0] || null;

  // Most common risk
  const riskCounts = Object.entries(byRiskLevel).sort(([, a], [, b]) => b - a);
  const mostCommonRisk = riskCounts[0]?.[0] || 'low';

  // Average completion days (from created to now for completed items)
  const completedItems = matrix.filter((m) => m.status === 'completed');
  const averageCompletionDays =
    completedItems.length > 0
      ? Math.round(
          completedItems.reduce((sum, m) => {
            const created = new Date(m.created_at).getTime();
            const current = new Date(m.updated_at).getTime();
            return sum + (current - created) / (1000 * 60 * 60 * 24);
          }, 0) / completedItems.length
        )
      : 0;

  return {
    summary: {
      totalObligations: matrix.length,
      byRiskLevel,
      byStatus,
      complianceScore,
      riskScore,
    },
    criticalItems,
    upcomingDeadlines,
    pendingItems,
    statistics: {
      averageCompletionDays,
      oldestPending,
      mostCommonRisk,
    },
  };
}

/**
 * Calculate compliance score (0-100)
 * Higher = better compliance
 */
export function calculateComplianceScore(
  byRiskLevel: Record<string, number>,
  byStatus: Record<string, number>
): number {
  const totalItems = Object.values(byRiskLevel).reduce((a, b) => a + b, 0);

  if (totalItems === 0) return 100;

  // Penalize based on critical/high items
  let score = 100;
  score -= byRiskLevel.critical * 20;
  score -= byRiskLevel.high * 10;

  // Reward completion
  const completionRate = (byStatus.completed / totalItems) * 100;
  score = score * (completionRate / 100);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate risk score (0-100)
 * Higher = more risky
 */
export function calculateRiskScore(byRiskLevel: Record<string, number>): number {
  const totalItems = Object.values(byRiskLevel).reduce((a, b) => a + b, 0);

  if (totalItems === 0) return 0;

  const weightedScore =
    byRiskLevel.critical * 100 +
    byRiskLevel.high * 60 +
    byRiskLevel.medium * 30 +
    byRiskLevel.low * 10;

  return Math.round((weightedScore / (totalItems * 100)) * 100);
}

/**
 * Get compliance status label
 */
export function getComplianceStatus(score: number): string {
  if (score >= 90) return 'Excelente';
  if (score >= 70) return 'Bueno';
  if (score >= 50) return 'Aceptable';
  if (score >= 30) return 'Deficiente';
  return 'Crítico';
}

/**
 * Get recommendations based on report
 */
export function getRecommendations(report: MatrixReport): string[] {
  const recommendations: string[] = [];

  // Critical items
  if (report.summary.byRiskLevel.critical > 0) {
    recommendations.push(
      `Revisar inmediatamente los ${report.summary.byRiskLevel.critical} item(s) crítico(s)`
    );
  }

  // Upcoming deadlines
  if (report.upcomingDeadlines.length > 0) {
    recommendations.push(
      `Acelerar ${report.upcomingDeadlines.length} obligacione(s) con vencimiento en los próximos 30 días`
    );
  }

  // Many pending
  if (report.summary.byStatus.pending > report.summary.byStatus.in_progress) {
    recommendations.push(
      `Asignar más recursos: ${report.summary.byStatus.pending} item(s) aún pendiente(s)`
    );
  }

  // Low compliance score
  if (report.summary.complianceScore < 50) {
    recommendations.push(
      'Implementar plan de acción de cumplimiento inmediato'
    );
  }

  // High risk score
  if (report.summary.riskScore > 70) {
    recommendations.push(
      'Realizar auditoría de cumplimiento para identificar brechas'
    );
  }

  return recommendations;
}

/**
 * Format matrix report for export
 */
export function formatReportForExport(
  report: MatrixReport,
  documentName: string
): string {
  const lines: string[] = [];

  lines.push(`Reporte de Matriz de Cumplimiento`);
  lines.push(`Documento: ${documentName}`);
  lines.push(`Fecha: ${new Date().toLocaleDateString('es-CL')}`);
  lines.push('');

  // Summary
  lines.push('=== RESUMEN ===');
  lines.push(`Total de obligaciones: ${report.summary.totalObligations}`);
  lines.push(`Puntuación de cumplimiento: ${report.summary.complianceScore}%`);
  lines.push(`Puntuación de riesgo: ${report.summary.riskScore}%`);
  lines.push('');

  lines.push('Obligaciones por riesgo:');
  lines.push(`  Críticas: ${report.summary.byRiskLevel.critical}`);
  lines.push(`  Altas: ${report.summary.byRiskLevel.high}`);
  lines.push(`  Medias: ${report.summary.byRiskLevel.medium}`);
  lines.push(`  Bajas: ${report.summary.byRiskLevel.low}`);
  lines.push('');

  lines.push('Obligaciones por estado:');
  lines.push(`  Pendientes: ${report.summary.byStatus.pending}`);
  lines.push(`  En progreso: ${report.summary.byStatus.in_progress}`);
  lines.push(`  Completadas: ${report.summary.byStatus.completed}`);
  lines.push('');

  // Critical items
  if (report.criticalItems.length > 0) {
    lines.push('=== ITEMS CRÍTICOS ===');
    report.criticalItems.forEach((item) => {
      lines.push(`- ${item.obligation}`);
      if (item.due_date) {
        lines.push(`  Vencimiento: ${item.due_date}`);
      }
      if (item.responsible) {
        lines.push(`  Responsable: ${item.responsible}`);
      }
    });
    lines.push('');
  }

  // Upcoming deadlines
  if (report.upcomingDeadlines.length > 0) {
    lines.push('=== VENCIMIENTOS PRÓXIMOS (30 días) ===');
    report.upcomingDeadlines.forEach((item) => {
      lines.push(`- ${item.obligation} (${item.due_date})`);
    });
    lines.push('');
  }

  return lines.join('\n');
}
