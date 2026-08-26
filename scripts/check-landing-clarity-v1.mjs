import fs from 'node:fs'

const page = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const copy = fs.readFileSync(new URL('../lib/i18n/home-clarity-copy.ts', import.meta.url), 'utf8')

const required = [
  'Protege los datos de tu empresa sin perderte en la regulación.',
  'Analizar mi situación',
  'Cuéntanos qué está pasando',
  'Kumplio analiza',
  'Recibes un plan claro',
  'Ejecutas las acciones',
  'Dejas evidencia del cierre',
  'Mi empresa usa datos de clientes y no sé si estamos preparados para la Ley 21.719.',
  'Kumplio encuentra',
  'Kumplio te dice qué hacer',
  'Tú mantienes el control',
  'Analiza',
  'Resuelve',
  'Revisa',
  'Isidora',
  'Verónica',
  'Julieta',
  'Prepararme para la Ley 21.719',
  'Ordenar proveedores y terceros',
  'Resolver una solicitud, incidente o auditoría',
  'Empieza por la situación que necesitas resolver.',
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
