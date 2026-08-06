import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { CasePostResultActions } from '@/components/cases/case-post-result-actions'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ManageCasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/cases/${caseId}/manage`)

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) notFound()

  const { data: complianceCase } = await supabase
    .from('compliance_cases')
    .select('id, title, description, status, updated_at')
    .eq('id', caseId)
    .eq('organization_id', membership.organization_id)
    .maybeSingle()

  if (!complianceCase || !['approved', 'archived'].includes(complianceCase.status)) notFound()

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href={`/cases/${caseId}`} className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al resultado
        </Link>
        <section className="mt-6 rounded-[28px] border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Caso {complianceCase.status === 'approved' ? 'resuelto' : 'archivado'}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">{complianceCase.title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {complianceCase.description || 'El expediente conserva su resultado, revisiones, artefactos y bitácora.'}
          </p>
          <div className="mt-7">
            <CasePostResultActions caseId={complianceCase.id} caseStatus={complianceCase.status} title={complianceCase.title} />
          </div>
        </section>
      </main>
    </>
  )
}
