export type UserContextType = 'persona' | 'profesional' | 'empresa'
export type OnboardingUrgency = 'low' | 'medium' | 'high' | 'critical'
export type DocumentAvailability = 'none' | 'some' | 'most'

export type OnboardingContext = {
  userType: UserContextType
  problem: string
  intent?: string
  urgency: OnboardingUrgency
  documentsAvailable: DocumentAvailability
  targetDate?: string | null
  region?: string
  industry?: string
  organizationName?: string
  organizationSize?: string
  workerCount?: number | null
  professionalActivity?: string
  activeClients?: number | null
}

export type OnboardingDiagnosis = {
  userType: UserContextType
  caseTitle: string
  status: 'information_incomplete' | 'attention_required' | 'action_required'
  summary: string
  gaps: Array<{ key: string; title: string }>
  actions: Array<{ key: string; title: string; priority: OnboardingUrgency; evidenceRequired: boolean }>
  recommendedDocuments: string[]
  nextAction: { title: string; href: string }
  evidenceStatus: 'not_verified'
  complianceVerified: false
}

export function buildInitialDiagnosis(input: OnboardingContext): OnboardingDiagnosis {
  const problem = input.problem.trim()
  if (!problem) throw new Error('problem_required')

  const critical = input.urgency === 'critical'
  const noDocuments = input.documentsAvailable === 'none'
  const gaps = [
    ...(noDocuments ? [{ key: 'documents', title: 'Falta revisar documentación de respaldo' }] : []),
    ...(!input.region ? [{ key: 'region', title: 'Falta confirmar la región aplicable' }] : []),
    ...(!input.targetDate ? [{ key: 'target_date', title: 'Falta definir una fecha objetivo' }] : []),
  ].slice(0, 3)

  const subject = input.userType === 'empresa' ? 'tu organización' : input.userType === 'profesional' ? 'tu trabajo profesional' : 'tu situación personal'
  const actions = [
    { key: 'review_context', title: `Revisar el contexto de ${subject}`, priority: input.urgency, evidenceRequired: false },
    ...(noDocuments ? [{ key: 'upload_document', title: 'Subir el primer documento disponible', priority: critical ? 'critical' as const : 'high' as const, evidenceRequired: true }] : []),
    { key: 'confirm_scope', title: 'Confirmar el alcance del diagnóstico', priority: critical ? 'high' as const : 'medium' as const, evidenceRequired: false },
  ].sort((a, b) => urgencyRank(b.priority) - urgencyRank(a.priority)).slice(0, 3)

  return {
    userType: input.userType,
    caseTitle: titleFor(input.userType, problem),
    status: critical ? 'action_required' : gaps.length ? 'information_incomplete' : 'attention_required',
    summary: `Kumplio organizará “${problem}” y distinguirá contexto, acciones y evidencia antes de validar resultados.`,
    gaps,
    actions,
    recommendedDocuments: input.userType === 'empresa'
      ? ['Contratos y anexos', 'Políticas y procedimientos', 'Registros vigentes']
      : input.userType === 'profesional'
        ? ['Antecedentes profesionales', 'Documentos del caso', 'Registros de respaldo']
        : ['Documento principal', 'Comprobantes y registros', 'Antecedentes relacionados'],
    nextAction: { title: actions[0]?.title || 'Confirmar el alcance del diagnóstico', href: '/app/documentos' },
    evidenceStatus: 'not_verified',
    complianceVerified: false,
  }
}

function titleFor(userType: UserContextType, problem: string) {
  const prefix = userType === 'empresa' ? 'Resolver para la organización' : userType === 'profesional' ? 'Resolver trabajo profesional' : 'Resolver situación personal'
  return `${prefix}: ${problem}`.slice(0, 160)
}

function urgencyRank(value: OnboardingUrgency) {
  return { low: 0, medium: 1, high: 2, critical: 3 }[value]
}
