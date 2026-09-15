import type { PublicLocale } from '@/lib/i18n/public-routing'
import { CORE_CAPABILITIES } from '@/lib/public-site'

type PublicMetadataCopy = {
  htmlLang: string
  openGraphLocale: string
  title: string
  description: string
  classification: string
  brandSlogan: string
  category: string
  keywords: string[]
  capabilities: readonly string[]
}

const englishCapabilities = [
  'Centralize sensitive information, documents, processing activities, vendors, controls, evidence and decisions inside traceable case files',
  'Help teams understand what personal data exists, where it is, how it is used, who is involved and what still requires review',
  'Prepare organizations for Chilean Law 21.719 through guided work, priorities and verifiable evidence',
  'Turn privacy and data-protection gaps into actions, suggested owners, dependencies and closure criteria',
  'Coordinate digital specialists with defined responsibilities and deliverables according to the authorized objective and context',
  'Connect relevant conclusions to sources, documents, evidence and human review before they advance',
  'Preserve organization isolation, controlled access, history and traceability throughout case management',
  'Guide each situation from initial understanding to a verifiable decision and closure',
] as const

export const PUBLIC_SITE_METADATA: Record<PublicLocale, PublicMetadataCopy> = {
  es: {
    htmlLang: 'es-CL',
    openGraphLocale: 'es_CL',
    title: 'Kumplio | Sistema operativo de cumplimiento para Chile',
    description: 'Kumplio conecta personas, documentos, requisitos y evidencia para mostrar qué está en regla, qué necesita atención y qué hacer después. Producto desarrollado por n3uralia.',
    classification: 'Sistema operativo de cumplimiento, documentos, requisitos y evidencia para organizaciones en Chile',
    brandSlogan: 'Cumplir. Sin perseguir documentos.',
    category: 'Gestión de cumplimiento y evidencia',
    keywords: [
      'protección de datos personales Chile',
      'Ley 21.719 Chile',
      'software protección de datos Chile',
      'gestión privacidad Chile',
      'guía experta protección de datos',
      'mapa de tratamientos de datos',
      'evidencia protección de datos',
      'gestión de riesgos de privacidad',
      'cumplimiento normativo Chile',
      'Kumplio',
      'n3uralia',
    ],
    capabilities: CORE_CAPABILITIES,
  },
  en: {
    htmlLang: 'en',
    openGraphLocale: 'en_US',
    title: 'Kumplio | Compliance operating system for Chile',
    description:
      'Kumplio connects people, documents, requirements and evidence to show what is in order, what needs attention and what to do next. A product by n3uralia.',
    classification: 'Compliance operating system for documents, requirements and evidence in organizations operating in Chile',
    brandSlogan: 'Stay compliant. Without chasing documents.',
    category: 'Compliance and evidence management',
    keywords: [
      'Chile data protection',
      'Chile Law 21.719',
      'data protection software Chile',
      'privacy management Chile',
      'privacy compliance Chile',
      'processing activity inventory',
      'privacy evidence management',
      'privacy risk management',
      'guided compliance Chile',
      'Kumplio',
      'n3uralia',
    ],
    capabilities: englishCapabilities,
  },
}
