import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const navigation = await readFile('components/app-navigation.tsx', 'utf8')
const requiredRoutes = ['/app/inicio','/app/casos','/app/documentos','/app/evidencia','/app/alertas','/app/actividad','/app/personas','/app/configuracion']
for (const route of requiredRoutes) assert.match(navigation, new RegExp(route.replaceAll('/', '\\/')))
assert.match(navigation, /label: 'Personas'/)
assert.match(navigation, /label: 'Configuración'/)
assert.doesNotMatch(navigation, /href: '\/app\/configuracion'.*available: false/)

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

console.log('Final authenticated app closure contract: OK')
