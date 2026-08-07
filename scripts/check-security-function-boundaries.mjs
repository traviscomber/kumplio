import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const privilegedMigration = await readFile(
  new URL('./48-harden-exposed-security-definer-functions.sql', import.meta.url),
  'utf8',
)
const workspaceMigration = await readFile(
  new URL('./49-active-workspace-context.sql', import.meta.url),
  'utf8',
)
const guidedMigration = await readFile(
  new URL('./50-guided-case-idempotent-start.sql', import.meta.url),
  'utf8',
)
const guidedFixMigration = await readFile(
  new URL('./52-fix-guided-case-idempotent-start.sql', import.meta.url),
  'utf8',
)

function functionDefinition(sql, schema, functionName) {
  const startPattern = new RegExp(`create or replace function ${schema}\\.${functionName}\\(`, 'i')
  const start = sql.search(startPattern)
  assert.notEqual(start, -1, `${schema}.${functionName} debe existir`)

  const end = sql.indexOf('$$;', start)
  assert.notEqual(end, -1, `${schema}.${functionName} debe tener un cuerpo SQL cerrado`)
  return sql.slice(start, end + 3)
}

for (const functionName of ['is_organization_member', 'create_document_record']) {
  const privateDefinition = functionDefinition(privilegedMigration, 'private', functionName)
  const publicDefinition = functionDefinition(privilegedMigration, 'public', functionName)

  assert.match(privateDefinition, /security definer/i, `${functionName} debe conservar su implementación privilegiada en private`)
  assert.match(publicDefinition, /security invoker/i, `${functionName} debe exponer solo un wrapper SECURITY INVOKER`)
  assert.doesNotMatch(publicDefinition, /security definer/i, `${functionName} no puede quedar como SECURITY DEFINER en public`)
}

for (const functionName of ['list_my_workspaces', 'set_active_workspace']) {
  const privateDefinition = functionDefinition(workspaceMigration, 'private', functionName)
  const publicDefinition = functionDefinition(workspaceMigration, 'public', functionName)

  assert.match(privateDefinition, /security definer/i, `${functionName} debe mantener la implementación privilegiada en private`)
  assert.match(publicDefinition, /security invoker/i, `${functionName} debe exponer un wrapper SECURITY INVOKER`)
  assert.doesNotMatch(publicDefinition, /security definer/i, `${functionName} no puede quedar como SECURITY DEFINER en public`)
}

assert.match(privilegedMigration, /revoke all on function public\.is_organization_member\(uuid\) from public, anon/i)
assert.match(privilegedMigration, /revoke all on function public\.create_document_record\(uuid, text, text, text\) from public, anon/i)

for (const signature of ['list_my_workspaces\\(\\)', 'set_active_workspace\\(uuid\\)']) {
  assert.match(workspaceMigration, new RegExp(`revoke all on function public\\.${signature} from public`, 'i'))
  assert.match(workspaceMigration, new RegExp(`revoke all on function public\\.${signature} from anon`, 'i'))
}

assert.match(
  workspaceMigration,
  /create policy organization_members_select_active_workspace[\s\S]*?public\.is_organization_member/i,
  'La política de membresías debe conservar autorización y filtrar el workspace activo',
)
assert.match(
  workspaceMigration,
  /profiles[\s\S]*?organization_id/i,
  'El workspace activo debe seguir siendo profiles.organization_id',
)

const guidedPrivateDefinition = functionDefinition(guidedMigration, 'private', 'start_guided_case_record')
const guidedPublicDefinition = functionDefinition(guidedMigration, 'public', 'start_guided_case_record')
assert.match(guidedPrivateDefinition, /security definer/i, 'El bootstrap guiado debe mantener su implementación privilegiada en private')
assert.doesNotMatch(guidedPublicDefinition, /security definer/i, 'El wrapper público del bootstrap guiado no puede ser SECURITY DEFINER')
assert.match(
  guidedMigration,
  /revoke all on function public\.start_guided_case_record\([\s\S]*?from public, anon/i,
  'El bootstrap guiado debe revocar ejecución a PUBLIC y anon',
)
assert.match(
  guidedMigration,
  /pg_advisory_xact_lock[\s\S]*?guided_start_key/i,
  'El bootstrap guiado debe serializar reintentos y conservar una clave idempotente',
)
assert.match(
  guidedMigration,
  /compliance_cases_guided_start_key_uidx/i,
  'La clave idempotente debe estar respaldada por una restricción única por organización',
)

const guidedFixDefinition = functionDefinition(guidedFixMigration, 'private', 'start_guided_case_record')
assert.match(guidedFixDefinition, /v_case_id uuid/i, 'El fix debe usar v_case_id para evitar colisión con columnas')
assert.match(guidedFixDefinition, /v_workflow_id uuid/i, 'El fix debe usar v_workflow_id para evitar colisión con columnas')
assert.doesNotMatch(guidedFixDefinition, /\n\s*case_id uuid;/i, 'No debe reintroducirse la variable ambigua case_id')
assert.doesNotMatch(guidedFixDefinition, /\n\s*workflow_id uuid;/i, 'No debe reintroducirse la variable ambigua workflow_id')

console.log('Security function boundary validation passed.')
