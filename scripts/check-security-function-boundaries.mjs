import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migration = await readFile(
  new URL('./48-harden-exposed-security-definer-functions.sql', import.meta.url),
  'utf8',
)

for (const functionName of ['is_organization_member', 'create_document_record']) {
  assert.match(
    migration,
    new RegExp(`create or replace function private\\.${functionName}\\(`, 'i'),
    `${functionName} debe conservar su implementación privilegiada en private`,
  )
  assert.match(
    migration,
    new RegExp(`create or replace function public\\.${functionName}\\([\\s\\S]*?security invoker`, 'i'),
    `${functionName} debe exponer solo un wrapper SECURITY INVOKER`,
  )
}

assert.match(migration, /revoke all on function public\.is_organization_member\(uuid\) from public, anon/i)
assert.match(migration, /revoke all on function public\.create_document_record\(uuid, text, text, text\) from public, anon/i)
assert.doesNotMatch(
  migration,
  /create or replace function public\.(?:is_organization_member|create_document_record)\([\s\S]*?security definer/i,
  'Ninguna función privilegiada debe quedar expuesta en public',
)

console.log('Security function boundary validation passed.')
