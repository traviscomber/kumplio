import assert from 'node:assert/strict'
import fs from 'node:fs'
const home = fs.readFileSync('app/dashboard/daily-content.tsx', 'utf8')
for (const marker of [
  'Tu única decisión ahora',
  'Esto necesita tu criterio',
  'Kumplio continúa preparando y verificando',
  'requieren tu decisión',
  'avanzan con Kumplio',
]) assert.ok(home.includes(marker), `Next Best Action v2 missing: ${marker}`)
console.log('Next Best Action v2 contract: PASS')
