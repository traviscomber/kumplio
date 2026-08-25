export type CaseWorkspaceAction = {
  title?: string | null
  href?: string | null
}

export type CaseWorkspaceInput = {
  caseId: string
  caseStatus: string
  summary?: string | null
  whyItMatters?: string | null
  openAction?: CaseWorkspaceAction | null
  evidenceReviewRequired?: boolean
  humanReviewRequired?: boolean
  closureEligible?: boolean
  blockers?: string[]
}

export type CaseWorkspaceModel = {
  status: {
    label: string
    explanation: string
  }
  nextAction: {
    title: string
    href: string
  } | null
  context: {
    summary: string
    whyItMatters: string
  }
  blockers: string[]
}

export function buildCaseWorkspaceModel(input: CaseWorkspaceInput): CaseWorkspaceModel {
  const blockers = input.blockers || []
  const completed = ['approved', 'closed', 'archived'].includes(input.caseStatus)
  const fallbackHref = `/app/casos/${input.caseId}`

  let nextAction: CaseWorkspaceModel['nextAction'] = null
  if (!completed && blockers.length === 0) {
    if (input.openAction?.title) {
      nextAction = {
        title: input.openAction.title,
        href: canonicalCaseHref(input.openAction.href, input.caseId),
      }
    } else if (input.evidenceReviewRequired) {
      nextAction = { title: 'Revisar evidencia pendiente', href: fallbackHref }
    } else if (input.humanReviewRequired) {
      nextAction = { title: 'Completar revisión humana', href: fallbackHref }
    } else if (input.closureEligible) {
      nextAction = { title: 'Cerrar caso', href: fallbackHref }
    }
  }

  return {
    status: completed
      ? {
          label: 'Caso completado',
          explanation: 'No hay una acción pendiente en este expediente.',
        }
      : blockers.length > 0
        ? {
            label: 'Caso bloqueado',
            explanation: 'Hay condiciones pendientes antes de continuar.',
          }
        : {
            label: 'Caso en curso',
            explanation: 'Kumplio conserva el contexto y muestra el siguiente paso disponible.',
          },
    nextAction,
    context: {
      summary: input.summary?.trim() || 'Contexto del caso pendiente de completar.',
      whyItMatters: input.whyItMatters?.trim() || 'La relevancia del caso se mostrará cuando exista contexto persistido suficiente.',
    },
    blockers,
  }
}

function canonicalCaseHref(href: string | null | undefined, caseId: string) {
  if (!href) return `/app/casos/${caseId}`
  if (href.startsWith('/app/')) return href
  if (href === '/cases') return '/app/casos'
  if (href.startsWith('/cases/')) return `/app/casos/${href.slice('/cases/'.length)}`
  if (href === '/documents' || href.startsWith('/documents?')) {
    return href.replace('/documents', '/app/documentos')
  }
  return `/app/casos/${caseId}`
}
