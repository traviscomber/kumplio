import type { PublicLocale } from '@/lib/i18n/public-routing'
import { CORE_CAPABILITIES, PUBLIC_DESCRIPTION } from '@/lib/public-site'

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
    title: 'Kumplio | Protección de datos y guía experta para resolver en Chile',
    description: `${PUBLIC_DESCRIPTION} Producto desarrollado por n3uralia.`,
    classification: 'Plataforma de protección de datos, privacidad y resolución guiada de obligaciones en Chile',
    brandSlogan: 'Protege tus datos. Entiende qué hacer. Avanza con una guía clara.',
    category: 'Protección de datos y resolución guiada',
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
    title: 'Kumplio | Data protection and guided compliance for Chile',
    description:
      'Kumplio helps organizations in Chile protect personal data and resolve privacy obligations, with an initial focus on Law 21.719. It centralizes sensitive information, organizes processing activities and vendors, identifies gaps, and turns each situation into a clear path of actions, owners, evidence and human review. A product by n3uralia.',
    classification: 'Data protection, privacy and guided compliance-resolution platform for organizations operating in Chile',
    brandSlogan: 'Protect your data. Understand what to do. Move forward with a clear path.',
    category: 'Data protection and guided compliance resolution',
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
