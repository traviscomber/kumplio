import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const required = {
  'components/onboarding/workspace-onboarding-form.tsx': ["'persona'", "'profesional'", "'empresa'", 'buildActivationHandoff', 'Ir a mi siguiente acción', 'Ver mi inicio'],
  'lib/product/onboarding/contextual-diagnosis.ts': ['not_verified', 'complianceVerified: false'],
  'lib/product/onboarding/activation-handoff.ts': ['buildActivationHandoff'],
  'lib/product/home/authenticated-home.ts': ['slice(0, 3)', '/app/casos/'],
  'supabase/migrations/20260825010000_contextual_onboarding_v2.sql': ['initialize_contextual_workspace_v2', 'organization_audit_events'],
  'app/app/layout.tsx': ['x-kumplio-authenticated-path', '<AppNavigation />'],
  'proxy.ts': ['x-kumplio-authenticated-path', "pathname === '/app' || pathname.startsWith('/app/')", 'request.nextUrl.pathname', 'request.nextUrl.search'],
  'ROADMAP.md': ['Onboarding contextual + Inicio enfocado — `ACTIVE`'],
  'package.json': ['check:contextual-onboarding-home', 'check:activation-handoff', 'check:activation-document-progress', 'check:activation-case-context'],
  'scripts/release-check.mjs': ["['check:contextual-onboarding-home']"],
}
for (const [file, markers] of Object.entries(required)) {
  const source = fs.readFileSync(file, 'utf8')
  for (const marker of markers) if (!source.includes(marker)) throw new Error(`${file} missing marker: ${marker}`)
}

const topNav = fs.readFileSync('components/layout/top-nav.tsx', 'utf8')
for (const forbidden of ['const productLinks =', 'aria-label="Acceso al producto"', 'productLinks.map']) {
  if (topNav.includes(forbidden)) throw new Error(`TopNav duplicates authenticated product navigation: ${forbidden}`)
}

execFileSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', 'scripts/test-activation-handoff.mjs'], { stdio: 'inherit' })
execFileSync(process.execPath, ['scripts/check-activation-document-progress-v1.mjs'], { stdio: 'inherit' })
execFileSync(process.execPath, ['scripts/check-activation-case-context-v1.mjs'], { stdio: 'inherit' })

console.log('Contextual onboarding and home phase: PASS')
