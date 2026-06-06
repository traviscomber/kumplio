// Compliance Matrix visualization component
'use client';

import { ComplianceMatrix } from '@/lib/types/documents';
import { useState } from 'react';

interface ComplianceMatrixViewProps {
  matrix: ComplianceMatrix[];
  onStatusChange?: (id: string, newStatus: string) => void;
}

export function ComplianceMatrixView({
  matrix,
  onStatusChange,
}: ComplianceMatrixViewProps) {
  const [sortBy, setSortBy] = useState<'risk' | 'date' | 'status'>('risk');

  // Calculate stats
  const critical = matrix.filter((m) => m.risk_level === 'critical').length;
  const high = matrix.filter((m) => m.risk_level === 'high').length;
  const medium = matrix.filter((m) => m.risk_level === 'medium').length;
  const low = matrix.filter((m) => m.risk_level === 'low').length;

  const pending = matrix.filter((m) => m.status === 'pending').length;
  const inProgress = matrix.filter((m) => m.status === 'in_progress').length;
  const completed = matrix.filter((m) => m.status === 'completed').length;

  // Sort matrix
  const sortedMatrix = [...matrix].sort((a, b) => {
    if (sortBy === 'risk') {
      const riskOrder: Record<string, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      return riskOrder[a.risk_level] - riskOrder[b.risk_level];
    } else if (sortBy === 'date') {
      return (
        new Date(b.due_date || '').getTime() -
        new Date(a.due_date || '').getTime()
      );
    } else {
      const statusOrder: Record<string, number> = {
        pending: 0,
        in_progress: 1,
        completed: 2,
      };
      return statusOrder[a.status] - statusOrder[b.status];
    }
  });

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Críticas" value={critical} color="destructive" />
        <StatCard label="Altas" value={high} color="orange" />
        <StatCard label="Medias" value={medium} color="yellow" />
        <StatCard label="Bajas" value={low} color="green" />
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Progreso de cumplimiento</span>
          <span className="text-sm font-bold">
            {completed}/{matrix.length}
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{
              width: `${matrix.length > 0 ? (completed / matrix.length) * 100 : 0}%`,
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{pending} pendientes</span>
          <span>{inProgress} en progreso</span>
          <span>{completed} completadas</span>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy('risk')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            sortBy === 'risk'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          Por riesgo
        </button>
        <button
          onClick={() => setSortBy('date')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            sortBy === 'date'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          Por fecha
        </button>
        <button
          onClick={() => setSortBy('status')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            sortBy === 'status'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          Por estado
        </button>
      </div>

      {/* Matrix table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left py-3 px-4 font-semibold">Obligación</th>
              <th className="text-left py-3 px-4 font-semibold">Riesgo</th>
              <th className="text-left py-3 px-4 font-semibold">Responsable</th>
              <th className="text-left py-3 px-4 font-semibold">Vencimiento</th>
              <th className="text-left py-3 px-4 font-semibold">Estado</th>
              {onStatusChange && (
                <th className="text-left py-3 px-4 font-semibold">Acción</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedMatrix.map((row) => (
              <tr key={row.id} className="border-b border-border hover:bg-secondary/30">
                <td className="py-3 px-4 max-w-xs">
                  <div className="truncate" title={row.obligation}>
                    {row.obligation}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getRiskColor(
                      row.risk_level
                    )}`}
                  >
                    {row.risk_level}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {row.responsible || '—'}
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {row.due_date ? new Date(row.due_date).toLocaleDateString('es-CL') : '—'}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(
                      row.status
                    )}`}
                  >
                    {getStatusLabel(row.status)}
                  </span>
                </td>
                {onStatusChange && (
                  <td className="py-3 px-4">
                    <select
                      value={row.status}
                      onChange={(e) => onStatusChange(row.id, e.target.value)}
                      className="text-xs bg-secondary rounded px-2 py-1 border border-border"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="in_progress">En progreso</option>
                      <option value="completed">Completado</option>
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedMatrix.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No hay obligaciones en la matriz
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorClass: Record<string, string> = {
    destructive: 'bg-red-500/10 text-red-700 dark:text-red-400',
    orange: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    yellow: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    green: 'bg-green-500/10 text-green-700 dark:text-green-400',
  };

  return (
    <div className={`${colorClass[color]} rounded-lg p-3`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function getRiskColor(risk: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-700 dark:text-red-400',
    high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    low: 'bg-green-500/10 text-green-700 dark:text-green-400',
  };
  return colors[risk] || colors.low;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
    in_progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    completed: 'bg-green-500/10 text-green-700 dark:text-green-400',
  };
  return colors[status] || colors.pending;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En progreso',
    completed: 'Completado',
  };
  return labels[status] || status;
}
