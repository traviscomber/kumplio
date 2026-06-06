import { AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface SeverityBadgeProps {
  severity: string
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = {
    critical: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-200', label: 'Crítico' },
    high: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-200', label: 'Alto' },
    medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-200', label: 'Medio' },
    low: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-200', label: 'Bajo' },
    info: { bg: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-200', label: 'Info' },
  }

  const config_severity = config[severity as keyof typeof config] || config.info

  return (
    <span className={`px-2.5 py-1.5 rounded-md text-xs font-medium border ${config_severity.bg} ${config_severity.text} ${config_severity.border}`}>
      {config_severity.label}
    </span>
  )
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    open: { bg: 'bg-red-500/10', text: 'text-red-600', icon: AlertTriangle, label: 'Abierto' },
    'in-progress': { bg: 'bg-blue-500/10', text: 'text-blue-600', icon: AlertCircle, label: 'En progreso' },
    resolved: { bg: 'bg-green-500/10', text: 'text-green-600', icon: CheckCircle, label: 'Resuelto' },
    'false-positive': { bg: 'bg-slate-500/10', text: 'text-slate-600', icon: Info, label: 'Falso positivo' },
  }

  const config_status = config[status as keyof typeof config] || config.open
  const Icon = config_status.icon

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium ${config_status.bg} ${config_status.text}`}>
      <Icon className="w-3 h-3" />
      {config_status.label}
    </div>
  )
}

interface ComplianceStatusProps {
  status: string
}

export function ComplianceStatus({ status }: ComplianceStatusProps) {
  const config = {
    compliant: { bg: 'bg-green-500/10', text: 'text-green-600', label: 'Cumple' },
    partial: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', label: 'Parcial' },
    'non-compliant': { bg: 'bg-red-500/10', text: 'text-red-600', label: 'No cumple' },
    'not-assessed': { bg: 'bg-slate-500/10', text: 'text-slate-600', label: 'No evaluado' },
  }

  const config_status = config[status as keyof typeof config] || config['not-assessed']

  return (
    <span className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${config_status.bg} ${config_status.text}`}>
      {config_status.label}
    </span>
  )
}
