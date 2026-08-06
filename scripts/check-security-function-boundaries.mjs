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

for (const functionName of ['is_organization_member', 'create_document_record']) {
  assert.match(
    privilegedMigration,
    new RegExp(`create or replace function private\\.${functionName}\\(`, 'i'),
    `${functionName} debe conservar su implementación privilegiada en private`,
  )
  assert.match(
    privilegedMigration,
    new RegExp(`create or replace function public\\.${functionName}\\([\\s\\S]*?security invoker`, 'i'),
    `${functionName} debe exponer solo un wrapper SECURITY INVOKER`,
  )
}

for (const functionName of ['list_my_workspaces', 'set_active_workspace']) {
  assert.match(
    workspaceMigration,
    new RegExp(`create or replace function private\\.${functionName}\\(`, 'i'),
    `${functionName} debe mantener la implementación privilegiada en private`,
  )
  assert.match(
    workspaceMigration,
    new RegExp(`create or replace function public\\.${functionName}\\([\\s\\S]*?security invoker`, 'i'),
    `${functionName} debe exponer un wrapper SECURITY INVOKER`,
  )
  assert.doesNotMatch(
    workspaceMigration,
    new RegExp(`create or replace function public\\.${functionName}\\([\\s\\S]*?security definer`, 'i'),
    `${functionName} no puede quedar como SECURITY DEFINER en public`,
  )
}

assert.match(privilegedMigration, /revoke all on function public\.is_organization_member\(uuid\) from public, anon/i)
assert.match(privilegedMigration, /revoke all on function public\.create_document_record\(uuid, text, text, text\) from public, anon/i)
assert.doesNotMatch(
  privilegedMigration,
  /create or replace function public\.(?:is_organization_member|create_document_record)\([\s\S]*?security definer/i,
  'Ninguna función privilegiada debe quedar expuesta en public',
)

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

console.log('Security function boundary validation passed.')
