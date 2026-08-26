import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const navigation = await readFile('components/app-navigation.tsx', 'utf8')
const requiredRoutes = ['/app/inicio','/app/casos','/app/documentos','/app/evidencia','/app/alertas','/app/actividad','/app/personas','/app/configuracion']
for (const route of requiredRoutes) assert.match(navigation, new RegExp(route.replaceAll('/', '\\/')))
assert.match(navigation, /label: 'Personas'/)
assert.match(navigation, /label: 'Configuración'/)

const personas = await readFile('app/app/personas/page.tsx', 'utf8')
assert.match(personas, /createClient/)
assert.match(personas, /organization_members/)
assert.match(personas, /\.eq\('organization_id', organizationId\)/)
assert.match(personas, /profiles/)
assert.doesNotMatch(personas, /createAdminClient|service_role|SUPABASE_SERVICE_ROLE_KEY/)

const configuracion = await readFile('app/app/configuracion/page.tsx', 'utf8')
assert.match(configuracion, /createClient/)
assert.match(configuracion, /organization_members/)
assert.match(configuracion, /organizations/)
assert.match(configuracion, /profiles/)
assert.doesNotMatch(configuracion, /createAdminClient|service_role|SUPABASE_SERVICE_ROLE_KEY/)
assert.doesNotMatch(configuracion, /OpenAI|provider configuration|facturación|billing|toggle/i)

const roadmap = await readFile('ROADMAP.md', 'utf8')
assert.match(roadmap, /Bloque 17 — Experiencia autenticada canónica — `DONE`/)
assert.match(roadmap, /Alertas y Actividad.*implementad/i)
assert.match(roadmap, /Personas y Configuración.*implementad/i)
assert.match(roadmap, /Analiza → Resuelve → Revisa/)
assert.match(roadmap, /functional freeze/i)
assert.match(roadmap, /Bloque 16.*`ACTIVE \/ EXTERNAL GATES`/s)
assert.match(roadmap, /P0-B — Configuración tenant Supabase — `BLOCKED EXTERNO`/)
assert.match(roadmap, /P0-C — Configuración tenant OpenAI — `BLOCKED EXTERNO`/)
assert.match(roadmap, /No se puede afirmar:.*PITR observado.*OpenAI Standard o MAM confirmado.*tenant configuration verified 3\/3.*eliminación operacional final 3\/3.*piloto externo realizado.*beta autoservicio lista/is)
for (const forbidden of [/PITR observado.*`DONE`/i,/eliminación operacional final.*3\/3.*`DONE`/i,/tenant configuration verified 3\/3.*`DONE`/i,/piloto externo.*`DONE`/i,/beta autoservicio.*`DONE`/i]) assert.doesNotMatch(roadmap, forbidden)

const releaseCheck = await readFile('scripts/release-check.mjs', 'utf8')
assert.match(releaseCheck, /\['check:final-app-closure'\]/)

console.log('Final authenticated app closure contract: OK')
