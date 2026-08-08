import fs from 'node:fs'

const sqlPath = 'scripts/maintenance/cleanup-ui-golden-path-pre-mission.sql'
const docsPath = 'docs/operations/ui-golden-path-data-lifecycle.md'

for (const file of [sqlPath, docsPath]) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`)
}

const sql = fs.readFileSync(sqlPath, 'utf8')
const docs = fs.readFileSync(docsPath, 'utf8')

const targetUsers = [
  'cd549b07-9ad1-429d-9f1a-d8499e5de48d',
  'b4f65bf7-18ff-4945-90cb-e263230ac687',
  '971ccc9d-be30-49f5-b15b-7341d5b046d6',
  '9dfc01cd-e4a8-4304-a787-17af0bcc04cf',
]

const targetOrganizations = [
  'bbb9134c-2661-4c07-8c0a-33bab603f9a0',
  '7df3cfe5-ba8e-430c-ae9a-e164b5205bf3',
  'c19429e1-78a2-44cc-880e-dd6216ae94d3',
]

const officialOrganizations = [
  'f02634d4-8dfe-46b3-b58f-fd1c188a1230',
  '855eb5b2-c35c-4130-b80c-d87576bc0140',
  '68291744-3ea1-424f-88ad-c199a780c662',
]

for (const marker of [
  'begin;',
  "set transaction isolation level serializable;",
  'pg_advisory_xact_lock',
  'Expected exactly 4 pre-mission E2E users',
  'Expected exactly 3 pre-mission E2E organizations',
  'Expected exactly 3 pre-mission E2E projects',
  'Official 3x organization entered cleanup target',
  'Target contains immutable mission events',
  'Target contains immutable knowledge events',
  'Target is referenced by tenant assurance',
  "con.confdeltype in ('a', 'r')",
  'delete from public.ai_platform_runs',
  'delete from public.scraper_runs',
  'delete from public.profiles',
  'delete from public.organizations',
  'delete from auth.users',
  "'mode', 'reversible_dry_run'",
  'rollback;',
]) {
  if (!sql.includes(marker)) throw new Error(`${sqlPath} missing marker: ${marker}`)
}

if (!/rollback;\s*$/i.test(sql.trim())) {
  throw new Error('The maintenance script must end in ROLLBACK')
}

if (/\bcommit\s*;/i.test(sql)) {
  throw new Error('The committed maintenance script must not contain COMMIT;')
}

for (const id of [...targetUsers, ...targetOrganizations, ...officialOrganizations]) {
  if (!sql.includes(id)) throw new Error(`${sqlPath} missing reviewed UUID: ${id}`)
}

const targetOrgBlock = sql.match(/insert into target_orgs[\s\S]*?create temporary table target_projects/i)?.[0]
if (!targetOrgBlock) throw new Error('Could not isolate the target_orgs allowlist')

for (const id of targetOrganizations) {
  if (!targetOrgBlock.includes(id)) throw new Error(`Target organization missing from allowlist: ${id}`)
}
for (const id of officialOrganizations) {
  if (targetOrgBlock.includes(id)) throw new Error(`Official organization entered target_orgs: ${id}`)
}

const targetUserBlock = sql.match(/insert into target_users[\s\S]*?create temporary table target_orgs/i)?.[0]
if (!targetUserBlock) throw new Error('Could not isolate the target_users allowlist')
for (const id of targetUsers) {
  if (!targetUserBlock.includes(id)) throw new Error(`Target user missing from allowlist: ${id}`)
}
if (targetUserBlock.includes('31229627159-')) {
  throw new Error('An official 3x identity entered target_users')
}

const profilesDelete = sql.indexOf('delete from public.profiles')
const organizationsDelete = sql.indexOf('delete from public.organizations')
const usersDelete = sql.indexOf('delete from auth.users')
if (!(profilesDelete >= 0 && profilesDelete < organizationsDelete && organizationsDelete < usersDelete)) {
  throw new Error('Cleanup order must be profiles → organizations → auth.users')
}

if (/delete\s+from\s+auth[.]users[\s\S]{0,400}email\s+like/i.test(sql)) {
  throw new Error('Auth users must be deleted from the explicit UUID allowlist, never an email pattern')
}
if (/delete\s+from\s+public[.]organizations[\s\S]{0,300}name\s+like/i.test(sql)) {
  throw new Error('Organizations must be deleted from the explicit UUID allowlist, never a name pattern')
}

for (const marker of [
  'mission_events_are_immutable',
  'Pre‑misión e incompletos — candidatos a limpieza',
  'scripts/maintenance/cleanup-ui-golden-path-pre-mission.sql',
  'termina en `ROLLBACK` por defecto',
  'La automatización usada en este cierre no obtuvo autorización de la herramienta para ejecutar SQL destructivo en producción.',
  '| Usuarios E2E | 10 | 6 |',
  '| Organizaciones E2E | 9 | 6 |',
]) {
  if (!docs.includes(marker)) throw new Error(`${docsPath} missing marker: ${marker}`)
}

console.log('UI golden-path E2E data lifecycle guardrail: PASS')
