import { redirect } from 'next/navigation'
import { CasesPageContent } from '@/app/cases/page'

type SearchParams = Record<string, string | string[] | undefined>

export default async function CanonicalCasesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams
  const activation = query.activation
  const caseParam = query.case
  const caseId = typeof caseParam === 'string' ? caseParam.trim() : ''

  if (activation === '1' && caseId) {
    redirect(`/app/casos/${encodeURIComponent(caseId)}?activation=1`)
  }

  return <CasesPageContent />
}
