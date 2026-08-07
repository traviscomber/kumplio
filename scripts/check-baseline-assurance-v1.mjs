import fs from 'node:fs'

const required = [
  ['app/api/cases/[caseId]/baseline-assurance/route.ts', [
    'acceptInitialScope',
    'acceptPartialOperation',
    'mission_owner_required',
    "rpc('finalize_case_baseline_assurance'",
  ]],
  ['components/cases/case-baseline-assurance-client.tsx', [
    'no acredita inventario completo ni cumplimiento legal',
    'Acepto la operación parcial',
    'Aseguramiento del expediente',
  ]],
  ['components/cases/case-baseline-assurance.tsx', [
    'baseline_assurance_closed',
    'operational_plan_ready',
    'operatingEffectiveness',
  ]],
  ['lib/compliance/confidence.ts', [
    "key: 'operating_partial', maximum: 65",
    'No equivale a cumplimiento global',
    'operating_effectiveness',
  ]],
  ['lib/compliance/advisor/daily-advisor.ts', [
    'calculateComplianceConfidence',
    'calculateWorkspaceConfidence',
  ]],
  ['app/insights/page.tsx', [
    'Confianza del alcance registrado',
    'Por qué no puede subir más',
    'confidence.caps',
  ]],
  ['components/evidence/evidence-workspace.tsx', [
    "accepted: 'Aceptada'",
    "validated: 'Validada'",
  ]],
  ['supabase/migrations/20260807134509_ensure_case_baseline_assets.sql', [
    'ensure_case_baseline_assets',
    'no obligación legal validada',
    'case_inventory_baseline',
    'to service_role',
  ]],
  ['supabase/migrations/20260807134655_finalize_case_baseline_assurance.sql', [
    'finalize_case_baseline_assurance',
    "'operating', 'partial'",
    'baseline_assurance_closed',
    'to service_role',
  ]],
  ['supabase/migrations/20260807134801_fix_control_evaluation_evidence_variable_ambiguity.sql', [
    'v_evidence_id',
    'link.evidence_id = v_evidence_id',
  ]],
  ['supabase/migrations/20260807141858_close_official_case_baseline_assurance.sql', [
    'official baseline second call was not idempotent',
    'no acredita inventario completo ni cumplimiento legal',
    "operating_effectiveness from public.controls where id = v_control) <> 'partial'",
    "obligation_text like 'Requerimiento interno de preparación (no obligación legal validada):%'",
    'target pilot data is not present in this environment',
    'v_target_exists boolean',
    'v_preexisting boolean',
  ]],
]

for (const [file, markers] of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`)
  const text = fs.readFileSync(file, 'utf8')
  for (const marker of markers) {
    if (!text.includes(marker)) throw new Error(`${file} missing marker: ${marker}`)
  }
}

const confidence = fs.readFileSync('lib/compliance/confidence.ts', 'utf8')
if (confidence.includes('if (total <= 0) return 100')) {
  throw new Error('Confidence cannot treat missing data as 100%')
}

const route = fs.readFileSync('app/api/cases/[caseId]/baseline-assurance/route.ts', 'utf8')
if (!route.includes('access.canAssignWork') || !route.includes("String(mission.owner_id || '') !== user.id")) {
  throw new Error('Baseline closure must require assignment permission and the mission owner')
}

const officialMigration = fs.readFileSync('supabase/migrations/20260807141858_close_official_case_baseline_assurance.sql', 'utf8')
if (!officialMigration.includes('if not v_target_exists then')) {
  throw new Error('Supervised production data migration must be a no-op when pilot data is absent')
}
if (!officialMigration.includes('if not v_preexisting and coalesce')) {
  throw new Error('Supervised migration must tolerate an already-closed restored production snapshot')
}

console.log('Baseline assurance guardrail: PASS')
