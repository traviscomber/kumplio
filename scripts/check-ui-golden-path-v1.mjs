import fs from 'node:fs'

const required = [
  ['lib/security/github-actions-ui-oidc.ts', [
    "const AUDIENCE = 'kumplio-ui-golden-path'",
    "const REPOSITORY = 'traviscomber/kumplio'",
    "const REPOSITORY_ID = '1260929467'",
    "const WORKFLOW = 'UI Golden Path'",
    "const REF = 'refs/heads/main'",
    'workflow_sha',
    'repository_owner_id',
    'runner_environment',
    'verifySignature',
  ]],
  ['app/api/internal/ui-golden-path/route.ts', [
    'verifyGithubActionsUiRequest',
    "action: z.literal('prepare')",
    "action: z.literal('assert')",
    "action: z.literal('fail')",
    'VERCEL_GIT_COMMIT_SHA',
    "kumplio_service_account: 'ui_golden_path_e2e'",
    'admin.auth.admin.createUser',
    'admin.auth.admin.updateUserById',
    'collectGoldenPathState',
    'fiveApprovedStages',
    'durableQueueCompleted',
    'processingActivityReviewed',
  ]],
  ['components/onboarding/workspace-onboarding-form.tsx', [
    "const caseId = data.workspace?.caseId as string | undefined",
    'setActivationHandoff(buildActivationHandoff(diagnosis, caseId))',
    'Ir a mi siguiente acción',
    'Ver mi inicio',
  ]],
  ['lib/compliance/accountability/team.ts', [
    ".select('id,user_id,role,joined_at')",
    ".from('profiles')",
    ".select('id,first_name,last_name,email')",
    ".in('id', userIds)",
    'profileByUserId',
  ]],
  ['.github/workflows/ui-golden-path.yml', [
    'name: UI Golden Path',
    'id-token: write',
    'statuses: write',
    '@playwright/test@1.61.1',
    'npx playwright test --config=playwright.ui-golden-path.config.mjs',
    'echo "exit_code=$exit_code" >> "$GITHUB_OUTPUT"',
    "if: ${{ steps.browser.outputs.exit_code == '0' }}",
    "if: ${{ steps.browser.outputs.exit_code != '0' }}",
    'api/internal/ui-golden-path',
    'actions/upload-artifact@v4',
    'UI Golden Path: PASS',
  ]],
  ['playwright.ui-golden-path.config.mjs', [
    'ui-golden-path\\.spec\\.mjs',
    "trace: 'retain-on-failure'",
    "screenshot: 'only-on-failure'",
    "video: 'retain-on-failure'",
    "timezoneId: 'America/Santiago'",
  ]],
  ['tests/e2e/ui-golden-path.spec.mjs', [
    "page.goto('/es')",
    "name: 'Empezar con guía experta', exact: true",
    "searchParams.get('next')).toBe('/onboarding')",
    "page.goto('/sign-in?next=/onboarding')",
    "name: 'Iniciar sesión', exact: true",
    "name: 'Crear mi primer diagnóstico', exact: true",
    "page.goto('/cases/new')",
    "name: 'Empresa', exact: true",
    "name: 'Preparar mi caso', exact: true",
    "const review = page.getByRole('main')",
    "review.getByRole('button', { name: 'Aprobar y continuar', exact: true })",
    "const main = page.getByRole('main')",
    "name: 'Convertir en plan operativo', exact: true",
    "name: 'Crear misión y solicitud', exact: true",
    "name: 'Aceptar línea base y cerrar misión', exact: true",
    "page.goto('/digital-twin')",
    "name: 'Registrar y revisar', exact: true",
    "const activityHeading = page.getByRole('heading', { name: activityName, exact: true })",
    "const activity = page.locator('article').filter({ has: activityHeading })",
    "activity.getByText('Parcial', { exact: true })",
    "activity.getByText('Portal Kumplio UI E2E', { exact: true })",
    "activity.getByText('Proveedor sintético UI E2E', { exact: true })",
    'activity.getByText(/accepted · verified/i)',
    'activity.getByText(/SHA-256 [a-f0-9]{64}/i)',
    "hasText: 'Base jurídica pendiente de validación'",
    "hasText: 'Retención pendiente de aprobación'",
  ]],
]

for (const [file, markers] of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`)
  const text = fs.readFileSync(file, 'utf8')
  for (const marker of markers) {
    if (!text.includes(marker)) throw new Error(`${file} missing marker: ${marker}`)
  }
}

const onboarding = fs.readFileSync('components/onboarding/workspace-onboarding-form.tsx', 'utf8')
if (onboarding.includes('router.refresh()')) {
  throw new Error('Onboarding must not refresh the route after preparing the activation handoff')
}
if (onboarding.includes('router.replace(`/app/inicio?case=')) {
  throw new Error('Onboarding must keep the persisted diagnosis visible and let the user choose the activation CTA')
}

const team = fs.readFileSync('lib/compliance/accountability/team.ts', 'utf8')
if (/organization_members[\s\S]{0,240}profiles\s*\(/.test(team) || team.includes("profiles(first_name,last_name,email)")) {
  throw new Error('Team profiles must be loaded separately because organization_members has no direct FK to profiles')
}

const uiTest = fs.readFileSync('tests/e2e/ui-golden-path.spec.mjs', 'utf8')
if (uiTest.includes("getByText('Actividad registrada y revisada.')")) {
  throw new Error('The processing activity must be asserted from durable rendered state, not an ephemeral success message')
}

const route = fs.readFileSync('app/api/internal/ui-golden-path/route.ts', 'utf8')
for (const forbidden of [
  /[.]from\([^)]*\)[\s\S]{0,240}[.]insert\(/,
  /[.]from\([^)]*\)[\s\S]{0,240}[.]upsert\(/,
  /[.]from\([^)]*\)[\s\S]{0,240}[.]update\(/,
  /[.]from\([^)]*\)[\s\S]{0,240}[.]delete\(/,
]) {
  if (forbidden.test(route)) throw new Error('The OIDC endpoint must not create or mutate business records')
}
if (route.includes('SUPABASE_SERVICE_ROLE_KEY') || route.includes('SUPABASE_SECRET_KEY')) {
  throw new Error('The route must consume the server-only admin helper instead of reading privileged keys directly')
}

const workflow = fs.readFileSync('.github/workflows/ui-golden-path.yml', 'utf8')
if (/\$\{\{\s*secrets[.]/.test(workflow)) throw new Error('The UI workflow must not depend on long-lived repository secrets')
if (workflow.includes('SUPABASE_SERVICE_ROLE_KEY') || workflow.includes('SUPABASE_SECRET_KEY')) {
  throw new Error('Supabase privileged keys must never enter GitHub Actions')
}
if (workflow.includes('continue-on-error: true') || workflow.includes('steps.browser.outcome')) {
  throw new Error('The browser result must be routed through an explicit exit-code output')
}
if (!workflow.includes("if: ${{ steps.browser.outputs.exit_code == '0' }}") || !workflow.includes("if: ${{ steps.browser.outputs.exit_code != '0' }}")) {
  throw new Error('The workflow must route success and failure from the explicit browser exit code')
}

const oidc = fs.readFileSync('lib/security/github-actions-ui-oidc.ts', 'utf8')
for (const claim of ['iss', 'aud', 'sub', 'exp', 'iat', 'repository_id', 'repository_owner_id', 'event_name', 'ref', 'workflow_ref', 'workflow_sha', 'run_id', 'run_attempt']) {
  if (!oidc.includes(`claims.${claim}`)) throw new Error(`OIDC verification does not enforce claim: ${claim}`)
}
if (!oidc.includes('legacySubject') || !oidc.includes('immutableSubject')) {
  throw new Error('OIDC verifier must support GitHub legacy and immutable subject formats')
}

console.log('UI golden path v1 guardrail: PASS')
