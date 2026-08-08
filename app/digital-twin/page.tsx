import { randomUUID } from 'node:crypto'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ProcessingInventoryWorkspace } from '@/components/digital-twin/processing-inventory-workspace'
import { ProcessingLifecycleReviewWorkspace } from '@/components/digital-twin/processing-lifecycle-review-workspace'
import { ProcessingPrivacyRemediationWorkspace } from '@/components/digital-twin/processing-privacy-remediation-workspace'
import { WorkspaceNav } from '@/components/workspace-nav'
import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { listTeamMembers } from '@/lib/compliance/accountability/team'
import { getProcessingInventory } from '@/lib/compliance/digital-twin/processing-inventory'
import { getProcessingPrivacyRemediation } from '@/lib/compliance/digital-twin/privacy-remediation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Inventario de tratamientos',
  description: 'Actividades, datos, sistemas, terceros, fuentes y revisión humana del alcance organizacional.',
  robots: { index: false, follow: false },
}

export default async function DigitalTwinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/digital-twin')

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) redirect('/onboarding')

  const [inventory, privacyRemediation, members, projectsResult, casesResult, controlsResult] = await Promise.all([
    getProcessingInventory(admin, access.organizationId),
    getProcessingPrivacyRemediation(admin, access.organizationId),
    listTeamMembers(admin, access.organizationId),
    admin.from('projects')
      .select('id,name')
      .eq('organization_id', access.organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(100),
    admin.from('compliance_cases')
      .select('id,project_id,title,status')
      .eq('organization_id', access.organizationId)
      .not('status', 'in', '(cancelled,archived)')
      .order('updated_at', { ascending: false })
      .limit(200),
    admin.from('controls')
      .select('id,project_id,name,code,lifecycle_status')
      .eq('organization_id', access.organizationId)
      .eq('lifecycle_status', 'active')
      .order('created_at', { ascending: true })
      .limit(300),
  ])

  if (projectsResult.error) throw new Error(`No fue posible cargar los ámbitos: ${projectsResult.error.message}`)
  if (casesResult.error) throw new Error(`No fue posible cargar los expedientes: ${casesResult.error.message}`)
  if (controlsResult.error) throw new Error(`No fue posible cargar los controles: ${controlsResult.error.message}`)

  const projects = (projectsResult.data || []).map((row) => ({ id: String(row.id), name: String(row.name || 'Ámbito') }))
  const cases = (casesResult.data || []).map((row) => ({
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title || 'Expediente'),
  }))
  const controls = (controlsResult.data || []).map((row) => ({
    id: String(row.id),
    projectId: String(row.project_id),
    name: String(row.name || 'Control'),
    code: typeof row.code === 'string' ? row.code : null,
  }))

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <ProcessingInventoryWorkspace
          activities={inventory.activities}
          summary={inventory.summary}
          projects={projects}
          members={members.map((member) => ({ id: member.userId, label: member.displayName }))}
          cases={cases}
          controls={controls}
          currentUserId={user.id}
          initialRequestKey={randomUUID()}
          canManage={access.canAssignWork}
        />
        <ProcessingLifecycleReviewWorkspace
          activities={inventory.activities}
          canManage={access.canAssignWork}
        />
        <ProcessingPrivacyRemediationWorkspace
          actions={privacyRemediation.actions}
          summary={privacyRemediation.summary}
          canManage={access.canAssignWork}
        />
      </main>
    </>
  )
}
