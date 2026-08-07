import type { User } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyGithubActionsUiRequest } from '@/lib/security/github-actions-ui-oidc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const identitySchema = z.object({
  commitSha: z.string().regex(/^[0-9a-f]{40}$/i),
  runId: z.string().regex(/^\d+$/),
  runAttempt: z.string().regex(/^\d+$/),
})

const requestSchema = z.discriminatedUnion('action', [
  identitySchema.extend({
    action: z.literal('prepare'),
    password: z.string().min(24).max(200),
  }),
  identitySchema.extend({
    action: z.literal('assert'),
  }),
  identitySchema.extend({
    action: z.literal('fail'),
    error: z.string().min(1).max(2000),
  }),
])

type RequestBody = z.infer<typeof requestSchema>
type AdminClient = ReturnType<typeof createAdminClient>
type JsonRecord = Record<string, unknown>

export async function POST(request: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return response({ error: 'Invalid UI golden-path request', code: 'invalid_request' }, 400)
    }

    const machine = await verifyGithubActionsUiRequest(request, parsed.data.commitSha)
    if (machine.runId !== parsed.data.runId || machine.runAttempt !== parsed.data.runAttempt) {
      return response({ error: 'Workflow identity mismatch', code: 'workflow_identity_mismatch' }, 401)
    }

    const deploymentSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || null
    if (!deploymentSha || deploymentSha !== parsed.data.commitSha) {
      return response({
        error: 'Production deployment is not ready for this commit',
        code: 'deployment_not_ready',
        deploymentSha,
      }, 409)
    }

    const admin = createAdminClient()
    if (parsed.data.action === 'prepare') return prepareRun(admin, parsed.data, deploymentSha)
    if (parsed.data.action === 'assert') return assertRun(admin, parsed.data, deploymentSha)
    return failRun(admin, parsed.data, deploymentSha)
  } catch (error) {
    const code = error instanceof Error ? error.message : 'ui_golden_path_failed'
    console.error('[internal/ui-golden-path]', code)
    const authFailure = code.startsWith('ui_oidc_')
    return response({ error: 'UI golden-path request rejected', code }, authFailure ? 401 : 500)
  }
}

async function prepareRun(admin: AdminClient, body: Extract<RequestBody, { action: 'prepare' }>, deploymentSha: string) {
  const email = serviceEmail(body.runId, body.runAttempt)
  const organizationName = `Kumplio UI Golden Path ${body.runId}-${body.runAttempt}`
  let user = await findUser(admin, email)
  const now = new Date().toISOString()

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      app_metadata: {
        kumplio_service_account: 'ui_golden_path_e2e',
        ui_golden_path_status: 'prepared',
        ui_golden_path_commit_sha: body.commitSha,
        ui_golden_path_run_id: body.runId,
        ui_golden_path_run_attempt: body.runAttempt,
        ui_golden_path_started_at: now,
      },
      user_metadata: {
        display_name: 'Kumplio UI Golden Path E2E',
        company_name: organizationName,
        workspace_name: organizationName,
        signup_source: 'github_actions_ui_e2e',
        synthetic: true,
      },
    })
    if (error || !data.user) throw new Error('ui_e2e_user_creation_failed')
    user = data.user
  } else {
    assertServiceUser(user, body)
    const existingStatus = String(user.app_metadata?.ui_golden_path_status || '')
    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
      password: body.password,
      app_metadata: {
        ...user.app_metadata,
        kumplio_service_account: 'ui_golden_path_e2e',
        ui_golden_path_status: existingStatus === 'passed' ? 'passed' : 'prepared',
        ui_golden_path_commit_sha: body.commitSha,
        ui_golden_path_run_id: body.runId,
        ui_golden_path_run_attempt: body.runAttempt,
        ui_golden_path_started_at: user.app_metadata?.ui_golden_path_started_at || now,
      },
      user_metadata: {
        ...user.user_metadata,
        display_name: 'Kumplio UI Golden Path E2E',
        company_name: organizationName,
        workspace_name: organizationName,
        signup_source: 'github_actions_ui_e2e',
        synthetic: true,
      },
    })
    if (error || !data.user) throw new Error('ui_e2e_user_rotation_failed')
    user = data.user
  }

  const { data: memberships, error: membershipError } = await admin
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
  if (membershipError) throw new Error('ui_e2e_membership_lookup_failed')
  if ((memberships || []).length > 1) throw new Error('ui_e2e_user_has_multiple_workspaces')

  return response({
    ok: true,
    action: 'prepare',
    email,
    organizationName,
    userId: user.id,
    hasWorkspace: (memberships || []).length === 1,
    deploymentSha,
  })
}

async function assertRun(admin: AdminClient, body: Extract<RequestBody, { action: 'assert' }>, deploymentSha: string) {
  const email = serviceEmail(body.runId, body.runAttempt)
  const user = await findUser(admin, email)
  if (!user) return response({ error: 'UI E2E user not found', code: 'ui_e2e_user_not_found' }, 404)
  assertServiceUser(user, body)

  const result = await collectGoldenPathState(admin, user.id)
  const failures = Object.entries(result.assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name)
  const status = failures.length === 0 ? 'passed' : 'failed'
  const completedAt = new Date().toISOString()

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      ui_golden_path_status: status,
      ui_golden_path_completed_at: completedAt,
      ui_golden_path_failures: failures,
      ui_golden_path_summary: result.summary,
    },
  })
  if (updateError) throw new Error('ui_e2e_result_persistence_failed')

  if (failures.length > 0) {
    return response({
      error: 'UI golden path did not satisfy every assertion',
      code: 'ui_e2e_assertion_failed',
      failures,
      ...result,
      deploymentSha,
    }, 409)
  }

  return response({ ok: true, action: 'assert', status, ...result, deploymentSha })
}

async function failRun(admin: AdminClient, body: Extract<RequestBody, { action: 'fail' }>, deploymentSha: string) {
  const email = serviceEmail(body.runId, body.runAttempt)
  const user = await findUser(admin, email)
  if (!user) return response({ ok: true, action: 'fail', recorded: false, deploymentSha })
  assertServiceUser(user, body)

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      ui_golden_path_status: 'failed',
      ui_golden_path_completed_at: new Date().toISOString(),
      ui_golden_path_error: body.error.slice(0, 2000),
    },
  })
  if (error) throw new Error('ui_e2e_failure_persistence_failed')
  return response({ ok: true, action: 'fail', recorded: true, deploymentSha })
}

async function collectGoldenPathState(admin: AdminClient, userId: string) {
  const memberships = await selectMany(admin, 'organization_members', 'organization_id, role', 'user_id', userId)
  const membership = memberships[0] as { organization_id?: string; role?: string } | undefined
  const organizationId = membership?.organization_id || null

  const profiles = organizationId
    ? await selectMany(admin, 'profiles', 'id, organization_id', 'id', userId)
    : []
  const organizations = organizationId
    ? await selectMany(admin, 'organizations', 'id, name', 'id', organizationId)
    : []
  const projects = organizationId
    ? await selectMany(admin, 'projects', 'id, organization_id, status', 'organization_id', organizationId)
    : []
  const cases = organizationId
    ? await selectMany(admin, 'compliance_cases', 'id, project_id, title, status, metadata, created_at', 'organization_id', organizationId)
    : []

  const guidedCase = cases.find((item) => objectValue(item.metadata, 'source') === 'guided_resolution') || null
  const workflowRows = guidedCase
    ? await selectMany(admin, 'agent_workflows', 'id, case_id, status, total_stages, current_stage', 'case_id', String(guidedCase.id))
    : []
  const workflow = workflowRows[0] || null
  const stages = workflow
    ? await selectMany(admin, 'agent_workflow_stages', 'id, workflow_id, stage_index, status, run_id, output_artifact_id', 'workflow_id', String(workflow.id))
    : []
  const runIds = stages.map((stage) => String(stage.run_id || '')).filter(Boolean)
  const runs = runIds.length
    ? await selectIn(admin, 'agent_runs', 'id, status, input_tokens, output_tokens, total_tokens, elapsed_ms', 'id', runIds)
    : []
  const artifacts = runIds.length
    ? await selectIn(admin, 'agent_artifacts', 'id, run_id, status, superseded_at', 'run_id', runIds)
    : []
  const reviews = guidedCase
    ? await selectMany(admin, 'agent_reviews', 'id, run_id, decision', 'case_id', String(guidedCase.id))
    : []
  const jobs = workflow
    ? await selectMany(admin, 'agent_jobs', 'id, workflow_id, stage_index, status', 'workflow_id', String(workflow.id))
    : []
  const missions = guidedCase
    ? await selectMany(admin, 'missions', 'id, case_id, status, owner_id, completed_at', 'case_id', String(guidedCase.id))
    : []
  const requests = guidedCase
    ? await selectMany(admin, 'evidence_requests', 'id, case_id, status, submitted_evidence_id', 'case_id', String(guidedCase.id))
    : []
  const controls = organizationId && projects[0]
    ? await selectMany(admin, 'controls', 'id, project_id, code, lifecycle_status, design_effectiveness, operating_effectiveness', 'organization_id', organizationId)
    : []
  const expectedControlCode = guidedCase
    ? `BASE-INVENTORY-${String(guidedCase.id).replaceAll('-', '').slice(0, 10).toUpperCase()}`
    : ''
  const baselineControl = controls.find((control) => control.code === expectedControlCode) || null
  const evidence = organizationId
    ? await selectMany(admin, 'evidence', 'id, project_id, validation_status, integrity_status, integrity_hash, metadata', 'organization_id', organizationId)
    : []
  const baselineEvidence = guidedCase
    ? evidence.find((item) => objectValue(item.metadata, 'caseId') === String(guidedCase.id)) || null
    : null
  const evaluations = guidedCase
    ? await selectMany(admin, 'control_evaluations', 'id, control_id, case_id, evaluation_type, result', 'case_id', String(guidedCase.id))
    : []
  const processingActivities = organizationId
    ? await selectMany(admin, 'organization_processes', 'id, organization_id, attributes', 'organization_id', organizationId)
    : []
  const processingActivity = guidedCase
    ? processingActivities.find((item) => objectValue(item.attributes, 'caseId') === String(guidedCase.id)) || processingActivities[0] || null
    : processingActivities[0] || null
  const processingReviews = processingActivity
    ? await selectMany(admin, 'processing_activity_reviews', 'id, process_id, decision, completeness, unknowns', 'process_id', String(processingActivity.id))
    : []

  const activeArtifacts = artifacts.filter((item) => !item.superseded_at)
  const activeJobs = jobs.filter((item) => ['queued', 'leased', 'retry_wait'].includes(String(item.status)))
  const deadLetters = jobs.filter((item) => item.status === 'dead_letter')
  const designEvaluation = evaluations.find((item) => item.evaluation_type === 'design')
  const operatingEvaluations = evaluations.filter((item) => item.evaluation_type === 'operating')
  const latestProcessingReview = processingReviews[0] as { decision?: string; completeness?: string; unknowns?: unknown } | undefined
  const processingUnknowns = Array.isArray(latestProcessingReview?.unknowns) ? latestProcessingReview.unknowns.length : 0

  const assertions = {
    oneIndependentMembership: memberships.length === 1 && membership?.role === 'owner',
    activeWorkspaceMatchesMembership: profiles.length === 1 && profiles[0]?.organization_id === organizationId,
    oneOrganization: organizations.length === 1,
    oneProject: projects.length === 1,
    onboardingAndGuidedCasesCreated: cases.length === 2 && Boolean(guidedCase),
    oneCompletedWorkflow: workflowRows.length === 1 && workflow?.status === 'completed' && Number(workflow?.total_stages) === 5,
    fiveApprovedStages: stages.length === 5 && stages.every((stage) => stage.status === 'approved' && stage.run_id),
    fiveApprovedRuns: runs.length === 5 && runs.every((run) => run.status === 'approved'),
    fiveApprovedArtifacts: activeArtifacts.length === 5 && activeArtifacts.every((artifact) => artifact.status === 'approved'),
    fiveApprovedHumanReviews: reviews.length === 5 && reviews.every((review) => review.decision === 'approved'),
    durableQueueCompleted: jobs.length === 5 && activeJobs.length === 0 && deadLetters.length === 0 && jobs.every((job) => job.status === 'succeeded'),
    operationalMissionCompleted: missions.length === 1 && missions[0]?.status === 'completed',
    evidenceRequestAccepted: requests.length === 1 && requests[0]?.status === 'accepted',
    baselineControlCreated: Boolean(baselineControl),
    baselineEvidenceAcceptedAndVerified: Boolean(baselineEvidence && baselineEvidence.validation_status === 'accepted' && baselineEvidence.integrity_status === 'verified' && String(baselineEvidence.integrity_hash || '').length === 64),
    designAndOperatingEvaluationsSeparated: designEvaluation?.result === 'effective' && operatingEvaluations.some((item) => item.result === 'partial'),
    processingActivityReviewed: processingActivities.length === 1 && latestProcessingReview?.decision === 'approved' && latestProcessingReview.completeness === 'partial' && processingUnknowns > 0,
  }

  const summary = {
    organizationId,
    organizationName: organizations[0]?.name || null,
    projectId: projects[0]?.id || null,
    guidedCaseId: guidedCase?.id || null,
    workflowId: workflow?.id || null,
    missionId: missions[0]?.id || null,
    evidenceRequestId: requests[0]?.id || null,
    baselineControlId: baselineControl?.id || null,
    baselineEvidenceId: baselineEvidence?.id || null,
    processingActivityId: processingActivity?.id || null,
    counts: {
      memberships: memberships.length,
      projects: projects.length,
      cases: cases.length,
      stages: stages.length,
      runs: runs.length,
      artifacts: activeArtifacts.length,
      reviews: reviews.length,
      jobs: jobs.length,
      activeJobs: activeJobs.length,
      deadLetters: deadLetters.length,
      missions: missions.length,
      evidenceRequests: requests.length,
      controls: controls.length,
      evidence: evidence.length,
      evaluations: evaluations.length,
      processingActivities: processingActivities.length,
      processingReviews: processingReviews.length,
    },
    usage: {
      inputTokens: sum(runs, 'input_tokens'),
      outputTokens: sum(runs, 'output_tokens'),
      totalTokens: sum(runs, 'total_tokens'),
      elapsedMs: sum(runs, 'elapsed_ms'),
    },
  }

  return { assertions, summary }
}

async function findUser(admin: AdminClient, email: string): Promise<User | null> {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error('ui_e2e_user_lookup_failed')
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email)
    if (user) return user
    if (data.users.length < 1000) break
  }
  return null
}

function assertServiceUser(user: User, body: Pick<RequestBody, 'commitSha' | 'runId' | 'runAttempt'>) {
  if (user.app_metadata?.kumplio_service_account !== 'ui_golden_path_e2e') throw new Error('ui_e2e_user_not_authorized')
  if (user.app_metadata?.ui_golden_path_commit_sha !== body.commitSha) throw new Error('ui_e2e_user_commit_mismatch')
  if (String(user.app_metadata?.ui_golden_path_run_id || '') !== body.runId) throw new Error('ui_e2e_user_run_mismatch')
  if (String(user.app_metadata?.ui_golden_path_run_attempt || '') !== body.runAttempt) throw new Error('ui_e2e_user_attempt_mismatch')
}

async function selectMany(admin: AdminClient, table: string, columns: string, field: string, value: string) {
  const { data, error } = await admin.from(table).select(columns).eq(field, value)
  if (error) throw new Error(`ui_e2e_query_failed_${table}`)
  return (data || []) as JsonRecord[]
}

async function selectIn(admin: AdminClient, table: string, columns: string, field: string, values: string[]) {
  const { data, error } = await admin.from(table).select(columns).in(field, values)
  if (error) throw new Error(`ui_e2e_query_failed_${table}`)
  return (data || []) as JsonRecord[]
}

function serviceEmail(runId: string, runAttempt: string) {
  return `ui-golden-path-${runId}-${runAttempt}@kumplio.invalid`
}

function objectValue(value: unknown, key: string) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? String((value as JsonRecord)[key] || '')
    : ''
}

function sum(rows: JsonRecord[], key: string) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0)
}

function response(payload: JsonRecord, status = 200) {
  const result = NextResponse.json(payload, { status })
  result.headers.set('Cache-Control', 'no-store')
  return result
}
