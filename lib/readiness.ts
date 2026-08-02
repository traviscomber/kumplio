import 'server-only'

import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type ReadinessState = 'ready' | 'pending' | 'blocked' | 'manual'

export type ReadinessCheck = {
  id: string
  label: string
  state: ReadinessState
  detail: string
  action?: string
}

export type ReadinessSnapshot = {
  generatedAt: string
  origin: string
  expectedOrigin: string
  checks: ReadinessCheck[]
  workspace: {
    organizationId: string | null
    projects: number
    cases: number
    controls: number
    evidence: number
    evaluations: number
    evidenceRequests: number
  }
}

const EXPECTED_ORIGIN = 'https://www.kumplio.app'

function envConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
    && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  )
}

async function adminConfigurationWorks() {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('organizations')
      .select('id', { count: 'exact', head: true })
    return !error
  } catch {
    return false
  }
}

async function requiredDatabaseObjectsWork() {
  try {
    const admin = createAdminClient()
    const tables = [
      'organizations',
      'organization_members',
      'projects',
      'compliance_cases',
      'controls',
      'evidence',
      'control_evaluations',
      'evidence_requests',
      'evidence_request_events',
    ] as const

    const results = await Promise.all(
      tables.map((table) => admin.from(table).select('*', { count: 'exact', head: true })),
    )

    return results.every((result) => !result.error)
  } catch {
    return false
  }
}

async function getWorkspaceCounts(user: User | null) {
  const empty = {
    organizationId: null,
    projects: 0,
    cases: 0,
    controls: 0,
    evidence: 0,
    evaluations: 0,
    evidenceRequests: 0,
  }

  if (!user) return empty

  const supabase = await createClient()
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) return empty
  const organizationId = membership.organization_id

  const [projects, cases, controls, evidence, evaluations, evidenceRequests] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    supabase.from('compliance_cases').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    supabase.from('controls').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    supabase.from('evidence').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    supabase.from('control_evaluations').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    supabase.from('evidence_requests').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
  ])

  return {
    organizationId,
    projects: projects.count || 0,
    cases: cases.count || 0,
    controls: controls.count || 0,
    evidence: evidence.count || 0,
    evaluations: evaluations.count || 0,
    evidenceRequests: evidenceRequests.count || 0,
  }
}

export async function getReadinessSnapshot(origin: string): Promise<ReadinessSnapshot> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [serverConfigurationReady, databaseReady, workspace] = await Promise.all([
    adminConfigurationWorks(),
    requiredDatabaseObjectsWork(),
    getWorkspaceCounts(user),
  ])

  const normalizedOrigin = origin.replace(/\/$/, '')
  const isProductionOrigin = normalizedOrigin === EXPECTED_ORIGIN
  const hasWorkspace = Boolean(workspace.organizationId)
  const hasFirstCase = workspace.cases > 0
  const hasOperationalEvidence = workspace.controls > 0 && workspace.evidence > 0

  const checks: ReadinessCheck[] = [
    {
      id: 'application_origin',
      label: 'Dominio de aplicación',
      state: isProductionOrigin ? 'ready' : 'pending',
      detail: isProductionOrigin
        ? 'La comprobación se está ejecutando desde el dominio productivo esperado.'
        : 'La comprobación se está ejecutando desde un preview o dominio alternativo.',
      action: isProductionOrigin ? undefined : `Repetir en ${EXPECTED_ORIGIN}/readiness.`,
    },
    {
      id: 'public_supabase_configuration',
      label: 'Configuración pública de Supabase',
      state: envConfigured() ? 'ready' : 'blocked',
      detail: envConfigured()
        ? 'La aplicación dispone de URL y clave pública sin revelar sus valores.'
        : 'Falta una variable pública requerida para Supabase.',
      action: envConfigured() ? undefined : 'Revisar variables públicas en Vercel.',
    },
    {
      id: 'server_supabase_configuration',
      label: 'Configuración privilegiada del servidor',
      state: serverConfigurationReady ? 'ready' : 'blocked',
      detail: serverConfigurationReady
        ? 'El servidor pudo ejecutar una consulta administrativa inocua.'
        : 'El cliente administrativo no pudo completar la comprobación.',
      action: serverConfigurationReady ? undefined : 'Revisar la clave secreta de Supabase en Vercel sin exponerla.',
    },
    {
      id: 'database_contract',
      label: 'Contrato de base de datos',
      state: databaseReady ? 'ready' : 'blocked',
      detail: databaseReady
        ? 'Las tablas necesarias para onboarding, casos, controles y evidencia responden correctamente.'
        : 'Uno o más objetos obligatorios no están disponibles mediante la API.',
      action: databaseReady ? undefined : 'Revisar migraciones 11–26 y sus verificadores.',
    },
    {
      id: 'verified_session',
      label: 'Sesión autenticada',
      state: user ? 'ready' : 'blocked',
      detail: user
        ? 'Supabase Auth confirmó la identidad de la sesión actual.'
        : 'No existe una sesión autenticada para completar la validación.',
      action: user ? undefined : 'Iniciar sesión o registrar una cuenta desde producción.',
    },
    {
      id: 'confirmed_email',
      label: 'Correo confirmado',
      state: user?.email_confirmed_at ? 'ready' : user ? 'pending' : 'blocked',
      detail: user?.email_confirmed_at
        ? 'La cuenta actual tiene correo confirmado.'
        : 'La sesión actual no demuestra una confirmación de correo completada.',
      action: user?.email_confirmed_at ? undefined : 'Completar el enlace de confirmación enviado por Supabase Auth.',
    },
    {
      id: 'auth_redirect_allowlist',
      label: 'Redirect URL de Auth',
      state: 'manual',
      detail: 'La aplicación espera que Supabase permita el callback productivo.',
      action: `Confirmar manualmente ${EXPECTED_ORIGIN}/auth/callback en Auth > URL Configuration.`,
    },
    {
      id: 'email_confirmation_setting',
      label: 'Verificación de correo habilitada',
      state: 'manual',
      detail: 'Esta opción no puede confirmarse de forma fiable desde el cliente de aplicación.',
      action: 'Confirmar manualmente la opción de verificación de correo en Supabase Auth.',
    },
    {
      id: 'workspace_initialized',
      label: 'Workspace inicializado',
      state: hasWorkspace ? 'ready' : user ? 'pending' : 'blocked',
      detail: hasWorkspace
        ? 'La cuenta pertenece a una organización creada por el onboarding.'
        : 'La cuenta todavía no tiene una membresía de organización.',
      action: hasWorkspace ? undefined : 'Completar /onboarding desde la cuenta autenticada.',
    },
    {
      id: 'first_case',
      label: 'Primer expediente real',
      state: hasFirstCase ? 'ready' : hasWorkspace ? 'pending' : 'blocked',
      detail: hasFirstCase
        ? 'Existe al menos un expediente dentro del workspace.'
        : 'Todavía no existe un caso real asociado al workspace.',
      action: hasFirstCase ? undefined : 'Crear el primer caso desde onboarding o Centro de Casos.',
    },
    {
      id: 'control_and_evidence',
      label: 'Control y evidencia reales',
      state: hasOperationalEvidence ? 'ready' : hasFirstCase ? 'pending' : 'blocked',
      detail: hasOperationalEvidence
        ? 'El workspace contiene al menos un control y una evidencia.'
        : 'Falta crear y relacionar los primeros elementos operacionales.',
      action: hasOperationalEvidence ? undefined : 'Crear un control y una evidencia desde sus módulos.',
    },
    {
      id: 'wave_one_validation',
      label: 'Ola 1 validada',
      state: workspace.evaluations > 0 && workspace.evidenceRequests > 0 ? 'ready' : hasOperationalEvidence ? 'pending' : 'blocked',
      detail: workspace.evaluations > 0 && workspace.evidenceRequests > 0
        ? 'Existe al menos una evaluación de control y una solicitud de evidencia.'
        : 'Sprints 2 y 3 están desplegados, pero aún no cuentan con evidencia de uso real.',
      action: workspace.evaluations > 0 && workspace.evidenceRequests > 0
        ? undefined
        : 'Registrar una evaluación y cerrar una solicitud de evidencia con datos reales.',
    },
  ]

  return {
    generatedAt: new Date().toISOString(),
    origin: normalizedOrigin,
    expectedOrigin: EXPECTED_ORIGIN,
    checks,
    workspace,
  }
}
