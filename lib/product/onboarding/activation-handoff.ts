import type { OnboardingDiagnosis } from './contextual-diagnosis'

type HandoffDiagnosis = Pick<OnboardingDiagnosis, 'caseTitle' | 'status' | 'nextAction'>

export function buildActivationHandoff(diagnosis: HandoffDiagnosis, caseId?: string | null) {
  const safeCaseId = caseId?.trim()
  const allowed = diagnosis.nextAction.href === '/app/casos' || diagnosis.nextAction.href === '/app/documentos'
  const primaryHref = allowed && safeCaseId
    ? `${diagnosis.nextAction.href}?case=${encodeURIComponent(safeCaseId)}&activation=1`
    : '/app/inicio'

  return {
    title: diagnosis.caseTitle,
    explanation: explanationFor(diagnosis.status),
    primaryHref,
    primaryLabel: diagnosis.nextAction.title,
    secondaryHref: '/app/inicio' as const,
  }
}

function explanationFor(status: HandoffDiagnosis['status']) {
  if (status === 'action_required') return 'Hay una acción prioritaria que conviene resolver primero antes de seguir ampliando el diagnóstico.'
  if (status === 'information_incomplete') return 'Falta confirmar contexto o antecedentes antes de sacar conclusiones; esta es la mejor siguiente acción.'
  return 'Ya existe suficiente contexto inicial para avanzar con una primera acción concreta y trazable.'
}
