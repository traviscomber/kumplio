import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { FileClock } from 'lucide-react'
import { CaseArtifactHistory } from '@/components/cases/case-artifact-history'
import { CaseResourceWorkspace } from '@/components/cases/case-resource-workspace'
import { CaseWorkflowPanel } from '@/components/cases/case-workflow-panel'
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
      <div className="container mx-auto space-y-6 px-6 pb-8">
        <section className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><FileClock className="h-5 w-5" /></div>
            <div>
              <h2 className="font-bold">Solicitar respaldo para este expediente</h2>
              <p className="mt-1 text-sm text-muted-foreground">Asigna responsable y fecha, y registra entrega y revisión en el timeline.</p>
            </div>
          </div>
          <Link href={`/evidence/requests?caseId=${caseId}`} className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground">
            Crear solicitud
          </Link>
        </section>

        <CaseResourceWorkspace
          caseId={caseId}
          organizationId={membership.organization_id}
          projectId={complianceCase.project_id}
          projectName={projectResult.data?.name || null}
          reviewCount={reviewCountResult.count || 0}
          artifactCount={artifactCountResult.count || 0}
        />

        <CaseWorkflowPanel caseId={caseId} />

        <CaseArtifactHistory
          caseId={caseId}
          organizationId={membership.organization_id}
        />
      </div>
    </>
  )
}
