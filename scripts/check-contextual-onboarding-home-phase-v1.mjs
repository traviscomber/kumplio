import fs from 'node:fs'

const required = {
  'components/onboarding/workspace-onboarding-form.tsx': ["'persona'", "'profesional'", "'empresa'", '/app/inicio?case='],
  'lib/product/onboarding/contextual-diagnosis.ts': ['not_verified', 'complianceVerified: false'],
  'lib/product/home/authenticated-home.ts': ['slice(0, 3)', '/app/casos/'],
  'supabase/migrations/20260825010000_contextual_onboarding_v2.sql': ['initialize_contextual_workspace_v2', 'organization_audit_events'],
  'app/app/layout.tsx': ['x-kumplio-authenticated-path'],
  'proxy.ts': ['x-kumplio-authenticated-path', "'/app/:path*'"],
  'ROADMAP.md': ['Onboarding contextual + Inicio enfocado — `ACTIVE`'],
  'package.json': ['check:contextual-onboarding-home'],
  'scripts/release-check.mjs': ["['check:contextual-onboarding-home']"],
}
for (const [file, markers] of Object.entries(required)) {
  const source = fs.readFileSync(file, 'utf8')
  for (const marker of markers) if (!source.includes(marker)) throw new Error(`${file} missing marker: ${marker}`)
}
console.log('Contextual onboarding and home phase: PASS')
