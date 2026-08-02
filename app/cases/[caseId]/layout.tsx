import type { ReactNode } from 'react'
import { notFound, redirect } from 'next/navigation'
import { CaseResourceWorkspace } from '@/components/cases/case-resource-workspace'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ComplianceCaseLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ caseId: string }>
}) {
  const { caseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/sign-in?next=/cases/${caseId}`)

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) notFound()

  const { data: complianceCase } = await supabase
    .from('compliance_cases')
    .select('id, project_id')
    .eq('id', caseId)
    .eq('organization_id', membership.organization_id)
    .maybeSingle()

  if (!complianceCase) notFound()

  const [projectResult, reviewCountResult, artifactCountResult] = await Promise.all([
    complianceCase.project_id
      ? supabase
          .from('projects')
          .select('id, name')
          .eq('id', complianceCase.project_id)
          .eq('organization_id', membership.organization_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('agent_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('case_id', caseId)
      .eq('organization_id', membership.organization_id),
    supabase
      .from('agent_artifacts')
      .select('id', { count: 'exact', head: true })
      .eq('case_id', caseId)
      .eq('organization_id', membership.organization_id),
  ])

  return (
    <>
      {children}
      <div className="container mx-auto px-6 pb-8">
        <CaseResourceWorkspace
          caseId={caseId}
          organizationId={membership.organization_id}
          projectId={complianceCase.project_id}
          projectName={projectResult.data?.name || null}
          reviewCount={reviewCountResult.count || 0}
          artifactCount={artifactCountResult.count || 0}
        />
      </div>
    </>
  )
}
