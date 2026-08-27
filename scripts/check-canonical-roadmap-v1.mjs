import fs from 'node:fs'
import path from 'node:path'

const files = {
  roadmap: 'ROADMAP.md',
  agents: 'AGENTS.md',
  readme: 'README.md',
  governance: 'docs/governance/canonical-roadmap-contract.md',
  pullRequestTemplate: '.github/pull_request_template.md',
  package: 'package.json',
  releaseCheck: 'scripts/release-check.mjs',
}

for (const file of Object.values(files)) {
  if (!fs.existsSync(file)) throw new Error(`Canonical roadmap contract missing required file: ${file}`)
}

const roadmap = fs.readFileSync(files.roadmap, 'utf8')
const agents = fs.readFileSync(files.agents, 'utf8')
const readme = fs.readFileSync(files.readme, 'utf8')
const governance = fs.readFileSync(files.governance, 'utf8')
const pullRequestTemplate = fs.readFileSync(files.pullRequestTemplate, 'utf8')
const packageJson = JSON.parse(fs.readFileSync(files.package, 'utf8'))
const releaseCheck = fs.readFileSync(files.releaseCheck, 'utf8')

for (const marker of [
  '# KUMPLIO — Roadmap Maestro de Producto y Ejecución',
  '**Documento canónico de producto, arquitectura, evidencia y prioridades**',
  '## 7. Gates P0 antes de beta privada autoservicio',
  '## 9. Próximos bloques de 3',
  '## 12. Congelamiento de alcance',
  '## 13. Decisión vigente',
  '### Bloque 16 — Cierre técnico y evidencia externa — `ACTIVE`',
  '### Bloque 17 — Experiencia autenticada canónica — `DONE`',
  '### Bloque 18 — Desarrollo post-cierre y piloto supervisado — `ACTIVE / NEXT`',
  '**Decisión del owner — 24 de agosto de 2026:**',
  '**Decisión del owner — 25 de agosto de 2026:**',
  'functional freeze',
]) {
  if (!roadmap.includes(marker)) throw new Error(`ROADMAP.md missing canonical marker: ${marker}`)
}

const nextBlocks = roadmap.match(/^### Bloque \d+ — .+ — `(?:ACTIVE \/ NEXT|NEXT)`$/gm) || []
if (nextBlocks.length !== 1 || !nextBlocks[0].startsWith('### Bloque 18 ')) {
  throw new Error(`ROADMAP.md must identify Block 18 as the single active NEXT feature block; found ${nextBlocks.length}`)
}

if (!roadmap.includes('- no crear módulos nuevos solo porque son atractivos;')) {
  throw new Error('ROADMAP.md must preserve the scope-freeze rule against attractive unprioritized modules')
}

for (const marker of [
  '`ROADMAP.md` es la **única fuente canónica de prioridad, secuencia y estado del producto**.',
  '### No desviarse',
  '### Excepciones de emergencia',
  'significa:\n\n> **Tomar la siguiente tarea incompleta del bloque canónico vigente',
  'npm run check:canonical-roadmap',
]) {
  if (!agents.includes(marker)) throw new Error(`AGENTS.md missing binding roadmap rule: ${marker}`)
}

for (const marker of [
  '## Roadmap canónico: trabajar sin desviaciones',
  '[`ROADMAP.md`](./ROADMAP.md) es la **única fuente canónica de prioridad, secuencia y estado**.',
  'npm run check:canonical-roadmap',
  './docs/governance/canonical-roadmap-contract.md',
]) {
  if (!readme.includes(marker)) throw new Error(`README.md missing canonical roadmap marker: ${marker}`)
}

for (const marker of [
  '> Estado: **OBLIGATORIO**',
  'No existe trabajo de producto autorizado fuera del roadmap canónico',
  '## 5. Interpretación de instrucciones breves',
  '## 6. Excepciones de emergencia',
  '## 7. Protocolo para cambiar el roadmap',
  '## 9. Obligaciones de cada PR',
  'Un agente no tiene autoridad para cambiar la prioridad de producto por iniciativa propia.',
]) {
  if (!governance.includes(marker)) throw new Error(`Governance contract missing marker: ${marker}`)
}

for (const marker of [
  '## Alineación con el roadmap canónico',
  'Bloque, gate o defecto autorizado',
  'El trabajo corresponde a `NEXT`, `ACTIVE`, `P0` o una corrección permitida',
  'Si cambia prioridad o estado, `ROADMAP.md` se actualiza en esta misma PR',
  'No adelanta trabajo `PLANNED` o `DEFERRED`',
]) {
  if (!pullRequestTemplate.includes(marker)) throw new Error(`PR template missing roadmap alignment marker: ${marker}`)
}

if (packageJson.scripts?.['check:canonical-roadmap'] !== 'node scripts/check-canonical-roadmap-v1.mjs') {
  throw new Error('package.json must expose check:canonical-roadmap')
}
if (!releaseCheck.includes("['check:canonical-roadmap']")) {
  throw new Error('Release Gate must execute check:canonical-roadmap')
}

const rootMarkdownFiles = fs.readdirSync('.')
  .filter((entry) => entry.endsWith('.md') && entry !== files.roadmap)
const duplicateDeclaration = '**Documento canónico de producto, arquitectura, evidencia y prioridades**'
for (const file of rootMarkdownFiles) {
  const content = fs.readFileSync(path.join('.', file), 'utf8')
  if (content.includes(duplicateDeclaration)) throw new Error(`${file} duplicates the roadmap master declaration`)
}
if (/\b(?:MASTER_ROADMAP|ROADMAP_MASTER|CANONICAL_ROADMAP)\.md\b/i.test(readme + agents + governance)) {
  throw new Error('Do not introduce a second roadmap master file; ROADMAP.md is the only canonical roadmap')
}

console.log('Canonical roadmap contract: PASS (Block 18 active; Block 16 external gates preserved)')
