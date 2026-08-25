type PriorityInput = { id: string; title: string; summary: string; href?: string | null; severity: string }
type ChangeInput = { id: string; headline: string; changesFound: number; criticalItems: number }
type CaseInput = { id: string; title: string; status: string }
type ExpirationInput = { id: string; title: string; expiresAt: string | null }

export function buildAuthenticatedHomeModel<P extends PriorityInput, C extends ChangeInput>(input: {
  health: { status: string; label: string; explanation: string }
  priorities: P[]
  changes: C[]
  cases?: CaseInput[]
  expirations?: ExpirationInput[]
  initialNextAction?: { title: string; href: string } | null
}) {
  const priorities = input.priorities.slice(0, 3).map(item => ({ ...item, href: canonicalHref(item.href) }))
  const nextAction = priorities[0]
    ? { title: priorities[0].title, href: priorities[0].href }
    : input.initialNextAction || { title: 'Crear o revisar un caso', href: '/app/casos' }
  return {
    primaryStatus: { status: input.health.status, label: input.health.label, explanation: input.health.explanation },
    nextAction,
    priorities,
    changes: input.changes.filter(item => item.changesFound > 0 || item.criticalItems > 0).slice(0, 5),
    cases: (input.cases || []).slice(0, 4).map(item => ({ ...item, href: `/app/casos/${item.id}` })),
    expirations: (input.expirations || []).filter(item => Boolean(item.expiresAt)).slice(0, 4),
  }
}

function canonicalHref(href?: string | null) {
  if (!href) return '/app/inicio'
  const match = href.match(/^\/cases\/([^/]+)$/)
  if (match) return `/app/casos/${match[1]}`
  if (href === '/documents') return '/app/documentos'
  if (href === '/evidence') return '/app/evidencia'
  return href
}
