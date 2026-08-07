import { getWorkspaceAccess } from '@/lib/compliance/accountability/workspace-access'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  CaseOperationalPlanClient,
  type ExistingEvidenceRequest,
  type ExistingOperationalMission,
  type OperationalPlanMember,
  type OperationalPlanPlaybook,
  type OperationalPlanProject,
} from './case-operational-plan-client'

export async function CaseOperationalPlan({ caseId }: { caseId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const access = await getWorkspaceAccess(admin, user.id)
  if (!access) return null

  const { data: caseRecord, error: caseError } = await admin
    .from('compliance_cases')
    .select('id,title,description,status,project_id,owner_id')
    .eq('id', caseId)
    .eq('organization_id', access.organizationId)
    .maybeSingle()

  if (caseError || !caseRecord) return null

  const [projectsResult, playbooksResult, membersResult, missionResult, requestResult] = await Promise.all([
    admin
      .from('projects')
      .select('id,name,status')
      .eq('organization_id', access.organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(100),
    admin
      .from('mission_playbooks')
      .select('id,name,objective,status')
      .eq('status', 'published')
      .order('name')
      .limit(100),
    admin
      .from('organization_members')
      .select('user_id,role')
      .eq('organization_id', access.organizationId)
      .order('joined_at', { ascending: true })
      .limit(200),
    admin
      .from('missions')
      .select('id,title,status,due_at,owner_id')
      .eq('organization_id', access.organizationId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('evidence_requests')
      .select('id,title,status,due_at,requested_from')
      .eq('organization_id', access.organizationId)
      .eq('case_id', caseId)
      .not('status', 'in', '(cancelled,rejected)')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (projectsResult.error || playbooksResult.error || membersResult.error) return null

  const memberRows = membersResult.data || []
  const memberIds = memberRows.map((member) => String(member.user_id))
  const { data: profiles } = memberIds.length
    ? await admin.from('profiles').select('id,first_name,last_name,email').in('id', memberIds)
    : { data: [] }

  const names = new Map<string, string>((profiles || []).map((profile) => [
    String(profile.id),
    [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || String(profile.email || 'Miembro'),
  ]))

  const projects: OperationalPlanProject[] = (projectsResult.data || []).map((project) => ({
    id: String(project.id),
    name: String(project.name || 'Ámbito de cumplimiento'),
  }))
  const playbooks: OperationalPlanPlaybook[] = (playbooksResult.data || []).map((playbook) => ({
    id: String(playbook.id),
    name: String(playbook.name || 'Playbook'),
    objective: typeof playbook.objective === 'string' ? playbook.objective : null,
  }))
  const members: OperationalPlanMember[] = memberRows.map((member) => ({
    id: String(member.user_id),
    name: names.get(String(member.user_id)) || `Miembro ${String(member.user_id).slice(0, 8)}`,
    role: String(member.role || 'member'),
  }))

  const mission = missionResult.data
  const request = requestResult.data
  const existingMission: ExistingOperationalMission | null = mission ? {
    id: String(mission.id),
    title: String(mission.title || 'Misión de cumplimiento'),
    status: String(mission.status || 'ready'),
    dueAt: mission.due_at ? String(mission.due_at) : null,
    ownerName: mission.owner_id ? names.get(String(mission.owner_id)) || null : null,
  } : null
  const existingRequest: ExistingEvidenceRequest | null = request ? {
    id: String(request.id),
    title: String(request.title || 'Solicitud de evidencia'),
    status: String(request.status || 'open'),
    dueAt: request.due_at ? String(request.due_at) : null,
    ownerName: request.requested_from ? names.get(String(request.requested_from)) || null : null,
  } : null

  const candidateOwnerId = caseRecord.owner_id ? String(caseRecord.owner_id) : user.id
  const defaultOwnerId = members.some((member) => member.id === candidateOwnerId)
    ? candidateOwnerId
    : members[0]?.id || user.id
  const terminal = ['closed', 'cancelled', 'archived'].includes(String(caseRecord.status))
  const canCreate = access.canAssignWork && !terminal && projects.length > 0 && playbooks.length > 0 && members.length > 0

  return (
    <CaseOperationalPlanClient
      caseId={caseId}
      caseTitle={String(caseRecord.title || 'Expediente de cumplimiento')}
      caseDescription={typeof caseRecord.description === 'string' ? caseRecord.description : null}
      caseProjectId={caseRecord.project_id ? String(caseRecord.project_id) : null}
      projects={projects}
      playbooks={playbooks}
      members={members}
      defaultOwnerId={defaultOwnerId}
      canCreate={canCreate}
      existingMission={existingMission}
      existingRequest={existingRequest}
    />
  )
}
