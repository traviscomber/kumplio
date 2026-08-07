import type { Metadata } from 'next'
import { CaseOperationalPlan } from '@/components/cases/case-operational-plan'
import { GuidedCaseWorkspace } from '@/components/cases/guided-case-workspace'
import { SimilarCasesPanel } from '@/components/cases/similar-cases-panel'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Resolver caso',
  description: 'Trabajo, decisiones, resultados y evidencia de un caso guiado en Kumplio.',
  robots: { index: false, follow: false },
}

export default async function CasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params
  return (
    <>
      <GuidedCaseWorkspace caseId={caseId} />
      <SimilarCasesPanel caseId={caseId} />
      <CaseOperationalPlan caseId={caseId} />
    </>
  )
}
