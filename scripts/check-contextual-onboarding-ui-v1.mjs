import fs from 'node:fs'

const form = fs.readFileSync('components/onboarding/workspace-onboarding-form.tsx', 'utf8')
for (const marker of [
  "value: 'persona'", "value: 'profesional'", "value: 'empresa'",
  '¿Qué necesitas proteger, ordenar o resolver?', 'No sé por dónde empezar',
  'professionalActivity', 'organizationName', 'documentsAvailable', 'targetDate', 'Trabajadores aproximados', 'Clientes activos aproximados',
  'Resultado inicial', 'Esto aún no acredita cumplimiento',
  "router.replace(`/app/inicio?case=", 'disabled={loading',
]) if (!form.includes(marker)) throw new Error(`Onboarding form missing marker: ${marker}`)

const page = fs.readFileSync('app/onboarding/page.tsx', 'utf8')
if (!page.includes('Persona, profesional o empresa')) throw new Error('Onboarding page must introduce the three contexts')
console.log('Contextual onboarding UI contract: PASS')
