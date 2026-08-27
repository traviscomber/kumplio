import fs from 'node:fs'

const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const copy = fs.readFileSync(new URL('../lib/i18n/home-clarity-copy.ts', import.meta.url), 'utf8')

const required = [
  'Descubre qué datos personales usa tu empresa y qué debes corregir.',
  'Revisar mi empresa',
  'Agrega',
  'Relaciona tu realidad con las obligaciones aplicables',
  'Decide',
  'Demuestra',
  'Tenemos datos de clientes, trabajadores y postulantes',
  'Un mapa de sus datos',
  'Un diagnóstico accionable',
  'Un plan que se puede cerrar',
  'Analiza',
  'Resuelve',
  'Revisa',
  'Isidora',
  'Verónica',
  'Julieta',
  'Protección de datos',
  'Minería',
  'Transporte',
  'Cuéntanos qué datos usa tu empresa.',
]

for (const phrase of required) {
  if (!copy.includes(phrase) && !page.includes(phrase)) {
    console.error(`Landing clarity contract missing: ${phrase}`)
    process.exit(1)
  }
}

for (const forbidden of ['tenant-specific', 'provider assurance', 'Golden Path', 'lifecycle V2']) {
  if (copy.includes(forbidden)) {
    console.error(`Landing acquisition copy exposes internal terminology: ${forbidden}`)
    process.exit(1)
  }
}

for (const name of ['Isidora', 'Verónica', 'Julieta']) {
  if (!page.includes(name) && !copy.includes(name)) {
    console.error(`Core specialist missing: ${name}`)
    process.exit(1)
  }
}

if (!page.includes('ResolutionEntry')) {
  console.error('ResolutionEntry must remain the primary landing intake interaction')
  process.exit(1)
}

console.log('Landing clarity contract: PASS')
