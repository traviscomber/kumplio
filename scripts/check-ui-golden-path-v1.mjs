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
  ['.github/workflows/ui-golden-path.yml', [
    'name: UI Golden Path',
    'id-token: write',
    'statuses: write',
    '@playwright/test@1.61.1',
    'npx playwright test --config=playwright.ui-golden-path.config.mjs',
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
    "page.goto('/sign-in?next=/onboarding')",
    "getByRole('button', { name: 'Iniciar sesión' })",
    "getByRole('button', { name: 'Preparar mi diagnóstico' })",
    "page.goto('/cases/new')",
    "getByRole('button', { name: 'Preparar mi caso' })",
    "getByRole('button', { name: 'Aprobar y continuar' })",
    "getByRole('button', { name: 'Convertir en plan operativo' })",
    "getByRole('button', { name: 'Crear misión y solicitud' })",
    "getByRole('button', { name: 'Aceptar línea base y cerrar misión' })",
    "page.goto('/digital-twin')",
    "getByRole('button', { name: 'Registrar y revisar' })",
  ]],
]

for (const [file, markers] of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`)
  const text = fs.readFileSync(file, 'utf8')
  for (const marker of markers) {
    if (!text.includes(marker)) throw new Error(`${file} missing marker: ${marker}`)
  }
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
if (!workflow.includes('continue-on-error: true') || !workflow.includes("if: steps.browser.outcome == 'success'")) {
  throw new Error('The workflow must preserve browser evidence and persist a final assertion or failure')
}

const oidc = fs.readFileSync('lib/security/github-actions-ui-oidc.ts', 'utf8')
for (const claim of ['iss', 'aud', 'sub', 'exp', 'iat', 'repository_id', 'repository_owner_id', 'event_name', 'ref', 'workflow_ref', 'workflow_sha', 'run_id', 'run_attempt']) {
  if (!oidc.includes(`claims.${claim}`)) throw new Error(`OIDC verification does not enforce claim: ${claim}`)
}
if (!oidc.includes('legacySubject') || !oidc.includes('immutableSubject')) {
  throw new Error('OIDC verifier must support GitHub legacy and immutable subject formats')
}

console.log('UI golden path v1 guardrail: PASS')
