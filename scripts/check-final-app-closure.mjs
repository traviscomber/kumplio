import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const navigation = await readFile('components/app-navigation.tsx', 'utf8')
const requiredRoutes = [
  '/app/inicio',
  '/app/casos',
  '/app/documentos',
  '/app/evidencia',
  '/app/alertas',
  '/app/actividad',
  '/app/personas',
  '/app/configuracion',
]

for (const route of requiredRoutes) assert.match(navigation, new RegExp(route.replaceAll('/', '\\/')))
assert.match(navigation, /label: 'Personas'/)
assert.match(navigation, /label: 'Configuración'/)
assert.doesNotMatch(navigation, /href: '\/app\/configuracion'.*available: false/)

console.log('Final authenticated app closure contract: OK')
