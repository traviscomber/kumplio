import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const page = await readFile('app/software-cumplimiento-chile/page.tsx', 'utf8')

for (const marker of [
  'Analiza',
  'Resuelve',
  'Revisa',
  'Describe tu situación',
  'Evidencia y cierre',
  'Isidora',
  'Verónica',
  'Julieta',
  'especialistas adicionales',
  'revisión humana',
]) {
  assert.match(page, new RegExp(marker))
}

assert.doesNotMatch(page, /Entender[\s\S]{0,400}Demostrar[\s\S]{0,400}Resolver[\s\S]{0,400}Acompañar/)
assert.doesNotMatch(page, /diagnóstico gratis|cumplimiento 100%|exposición exacta|asesoría jurídica automática/i)

console.log('Software landing alignment contract: PASS')
