import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const orchestration = readFileSync('lib/agents/orchestration.ts', 'utf8')

for (const phrase of [
  'exige relevancia directa con el objeto del caso',
  'NO lo presentes como obligación del caso',
  'limitations o missingInformation',
  'contexto fuera de alcance',
]) {
  assert.ok(orchestration.includes(phrase), `Isidora case relevance guard missing: ${phrase}`)
}

console.log('Isidora case relevance contract: PASS')
