import { CaseBaselineAssurance } from '@/components/cases/case-baseline-assurance'
import { CaseOperationalPlan } from '@/components/cases/case-operational-plan'
import { CaseOutcomeStatus } from '@/components/cases/case-outcome-status'
import { GuidedCaseWorkspace } from '@/components/cases/guided-case-workspace'
import { SimilarCasesPanel } from '@/components/cases/similar-cases-panel'

export function CanonicalCasePage({ caseId }: { caseId: string }) {
  return (
    <div className="kumplio-work-surface">
      <CaseOutcomeStatus caseId={caseId} />
      <GuidedCaseWorkspace caseId={caseId} />
      <CaseBaselineAssurance caseId={caseId} />
      <SimilarCasesPanel caseId={caseId} />
      <CaseOperationalPlan caseId={caseId} />
    </div>
  )
}
