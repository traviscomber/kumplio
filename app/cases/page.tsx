import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CasesWorkspace } from '@/components/cases-workspace'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Casos de cumplimiento',
  description: 'Expedientes trazables de cumplimiento en KUMPLIO.',
  robots: { index: false, follow: false },
}

export default async function CasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/cases')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const organizationId = membership?.organization_id
  const [{ data: organization }, { data: projects }, { data: cases, error: casesError }] = organizationId
    ? await Promise.all([
        supabase.from('organizations').select('id, name').eq('id', organizationId).maybeSingle(),
        supabase
          .from('projects')
          .select('id, name')
          .eq('organization_id', organizationId)
          .order('updated_at', { ascending: false })
          .limit(100),
        supabase
          .from('compliance_cases')
          .select('id, title, description, status, priority, project_id, created_at, updated_at')
          .eq('organization_id', organizationId)
          .neq('status', 'archived')
          .order('updated_at', { ascending: false })
          .limit(100),
      ])
    : [{ data: null }, { data: [] }, { data: [], error: null }]

  const migrationPending = casesError?.code === '42P01' || casesError?.message?.includes('compliance_cases')

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">{organization?.name || 'Workspace de cumplimiento'}</p>
          <h1 className="mt-1 text-3xl font-bold">Centro de casos</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Organiza cada objetivo regulatorio como un expediente con contexto, fuentes, análisis, aprobaciones y decisiones trazables.
          </p>
        </div>

        {!organizationId ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
            <p className="font-semibold">Tu cuenta todavía no está vinculada a una organización.</p>
            <p className="mt-2 text-sm text-muted-foreground">Completa el onboarding para crear tu primer workspace.</p>
          </div>
        ) : migrationPending ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
            <p className="font-semibold">El Centro de Casos está listo para activarse.</p>
            <p className="mt-2 text-sm text-muted-foreground">Aplica las migraciones del Agent Control Plane en Supabase.</p>
          </div>
        ) : (
          <CasesWorkspace cases={(cases || []) as any} projects={(projects || []) as any} />
        )}
      </main>
    </>
  )
}
