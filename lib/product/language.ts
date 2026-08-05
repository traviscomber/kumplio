export const PRODUCT_LANGUAGE = {
  areas: {
    today: 'Hoy',
    work: 'Trabajo',
    organization: 'Organización',
    compliance: 'Cumplimiento',
    executive: 'Ejecutivo',
  },
  actions: {
    start: 'Comenzar',
    continue: 'Continuar',
    resolve: 'Resolver',
    review: 'Revisar',
    explore: 'Explorar',
  },
  empty: {
    noAction: 'No necesitas hacer nada ahora.',
    noEvidence: 'Todavía no tenemos evidencia suficiente.',
    noContext: 'Todavía no existen relaciones de contexto.',
    noPrecedent: 'No existe un precedente comparable.',
  },
} as const

export function humanStatus(status: string) {
  if (status === 'analyzing') return 'Analizando'
  if (status === 'waiting_decision') return 'Espera decisión'
  if (status === 'in_progress') return 'En ejecución'
  if (status === 'verifying') return 'Verificando'
  if (status === 'resolved' || status === 'completed') return 'Resuelto'
  if (status === 'dismissed' || status === 'cancelled') return 'Descartado'
  return 'Abierto'
}

export function humanSeverity(severity: string) {
  if (severity === 'critical') return 'Crítico'
  if (severity === 'high') return 'Alto'
  if (severity === 'low') return 'Bajo'
  return 'Medio'
}
