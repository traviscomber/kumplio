import type { PublicLocale } from '@/lib/i18n/public-routing'

export const VERTICAL_SLUGS = ['proteccion-de-datos', 'mineria', 'transporte', 'construccion', 'salud', 'agroindustria'] as const
export type VerticalSlug = (typeof VERTICAL_SLUGS)[number]

export const VERTICAL_IMAGES: Record<VerticalSlug, string> = {
  'proteccion-de-datos': '/brand/kumplio-hero-compliance.webp',
  mineria: '/brand/kumplio-mining.webp',
  transporte: '/brand/kumplio-transport.webp',
  construccion: '/brand/kumplio-construction.webp',
  salud: '/brand/kumplio-healthcare.webp',
  agroindustria: '/brand/kumplio-agribusiness.webp',
}

type VerticalCopy = {
  name: string
  eyebrow: string
  title: string
  description: string
  prioritiesTitle: string
  priorities: string[]
  resultTitle: string
  results: Array<{ title: string; description: string }>
  note: string
  back: string
  cta: string
}

const sharedResults = {
  es: [
    { title: 'Contexto ordenado', description: 'Documentos, responsables, proveedores y controles reunidos en un mismo caso.' },
    { title: 'Brechas priorizadas', description: 'Pendientes e información faltante convertidos en una ruta de trabajo visible.' },
    { title: 'Evidencia trazable', description: 'Cada corrección conserva responsable, plazo, revisión humana y respaldo.' },
  ],
  en: [
    { title: 'Organized context', description: 'Documents, owners, vendors and controls gathered in one case.' },
    { title: 'Prioritized gaps', description: 'Open items and missing information turned into a visible work path.' },
    { title: 'Traceable evidence', description: 'Every correction retains its owner, deadline, human review and support.' },
  ],
} as const

export const VERTICAL_PUBLIC_COPY: Record<PublicLocale, Record<VerticalSlug, VerticalCopy>> = {
  es: {
    'proteccion-de-datos': { name: 'Protección de datos', eyebrow: 'Ley 21.719 · Chile', title: 'Convierte tus tratamientos de datos en un plan que se puede ejecutar.', description: 'Identifica qué datos personales usa la empresa, para qué, dónde están y qué terceros participan antes de priorizar las brechas.', prioritiesTitle: 'Qué puedes ordenar', priorities: ['Inventario de datos, tratamientos y finalidades', 'Sistemas, proveedores y transferencias involucradas', 'Brechas, responsables, plazos y evidencia de cierre'], resultTitle: 'Una ruta verificable', results: [...sharedResults.es], note: 'Kumplio organiza el análisis y señala las decisiones que requieren validación profesional. No reemplaza asesoría legal ni certifica cumplimiento total.', back: 'Volver a verticales', cta: 'Revisar mi empresa' },
    mineria: { name: 'Minería', eyebrow: 'Operación minera', title: 'Conecta contratistas, personas, controles y evidencia por operación.', description: 'Ordena el contexto distribuido de una faena para que obligaciones, hallazgos y responsables no queden separados entre documentos y equipos.', prioritiesTitle: 'Qué puedes ordenar', priorities: ['Contratistas, subcontratistas y responsables', 'Controles operacionales y documentación de respaldo', 'Hallazgos, acciones correctivas y evidencia por faena'], resultTitle: 'Una operación más trazable', results: [...sharedResults.es], note: 'La aplicabilidad de cada obligación depende del contexto real de la operación y debe ser revisada por una persona responsable.', back: 'Volver a verticales', cta: 'Revisar mi operación' },
    transporte: { name: 'Transporte', eyebrow: 'Transporte y logística', title: 'Mantén documentos, flota, proveedores y obligaciones en una misma ruta.', description: 'Relaciona el trabajo de una operación móvil y distribuida con controles, responsables y evidencia sin perder el historial.', prioritiesTitle: 'Qué puedes ordenar', priorities: ['Documentación de flota, personas y terceros', 'Proveedores críticos y responsabilidades asociadas', 'Vencimientos, brechas y respaldos de corrección'], resultTitle: 'Continuidad con evidencia', results: [...sharedResults.es], note: 'Kumplio ayuda a estructurar el trabajo; la empresa conserva la decisión y la validación de cada control aplicable.', back: 'Volver a verticales', cta: 'Revisar mi operación' },
    construccion: { name: 'Construcción', eyebrow: 'Proyectos y faenas', title: 'Ordena contratos, subcontratos, controles y evidencia por proyecto.', description: 'Reúne el contexto de cada obra para asignar acciones y comprobar correcciones aunque participen múltiples empresas y responsables.', prioritiesTitle: 'Qué puedes ordenar', priorities: ['Proyectos, faenas, contratistas y subcontratistas', 'Controles, documentos y responsables por frente de trabajo', 'Brechas y evidencia de cierre asociadas al proyecto'], resultTitle: 'Control por proyecto', results: [...sharedResults.es], note: 'La plataforma no sustituye la evaluación técnica, preventiva o legal que corresponda a cada faena.', back: 'Volver a verticales', cta: 'Revisar mi proyecto' },
    salud: { name: 'Salud', eyebrow: 'Datos y servicios de salud', title: 'Haz trazable el cuidado de datos sensibles, accesos y proveedores.', description: 'Identifica dónde existe información sensible, quién interviene y qué controles o decisiones requieren evidencia y revisión humana.', prioritiesTitle: 'Qué puedes ordenar', priorities: ['Datos sensibles, finalidades y responsables', 'Accesos, sistemas y proveedores que participan', 'Protocolos, brechas y evidencia de corrección'], resultTitle: 'Contexto sensible bajo control', results: [...sharedResults.es], note: 'Kumplio no emite diagnósticos clínicos ni reemplaza la evaluación legal, sanitaria o de seguridad requerida.', back: 'Volver a verticales', cta: 'Revisar mi organización' },
    agroindustria: { name: 'Agroindustria', eyebrow: 'Operación agroindustrial', title: 'Coordina personas, proveedores, instalaciones y controles de extremo a extremo.', description: 'Conecta el contexto del campo, plantas y terceros con acciones concretas, responsables y respaldo de cierre.', prioritiesTitle: 'Qué puedes ordenar', priorities: ['Instalaciones, procesos, personas y proveedores', 'Controles y documentación repartidos en la operación', 'Hallazgos, responsables y evidencia de corrección'], resultTitle: 'Una operación conectada', results: [...sharedResults.es], note: 'Las obligaciones aplicables varían según actividad, instalación y contexto; la revisión humana sigue siendo necesaria.', back: 'Volver a verticales', cta: 'Revisar mi operación' },
  },
  en: {} as Record<VerticalSlug, VerticalCopy>,
}

VERTICAL_PUBLIC_COPY.en = Object.fromEntries(
  VERTICAL_SLUGS.map((slug) => {
    const source = VERTICAL_PUBLIC_COPY.es[slug]
    const names: Record<VerticalSlug, string> = { 'proteccion-de-datos': 'Data protection', mineria: 'Mining', transporte: 'Transport', construccion: 'Construction', salud: 'Healthcare', agroindustria: 'Agribusiness' }
    return [slug, { ...source, name: names[slug], eyebrow: `${names[slug]} · Chile`, title: `Make ${names[slug].toLowerCase()} compliance work visible and executable.`, description: 'Bring operational context, responsibilities, gaps and evidence together before deciding what needs attention.', prioritiesTitle: 'What you can organize', priorities: ['People, processes, documents and vendors', 'Applicable controls and missing information', 'Actions, owners, deadlines and closure evidence'], resultTitle: 'A verifiable work path', results: [...sharedResults.en], note: 'Kumplio structures the analysis and flags decisions for human validation. It does not replace professional advice or certify total compliance.', back: 'Back to sectors', cta: 'Review my organization' }]
  }),
) as Record<VerticalSlug, VerticalCopy>

export function isVerticalSlug(value: string): value is VerticalSlug {
  return VERTICAL_SLUGS.includes(value as VerticalSlug)
}
