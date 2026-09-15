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
  'Connect people, contractors, vendors, documents, requirements, validity and evidence inside a traceable operating context',
  'Show what is in order, what needs attention, what information is missing and the next accountable action',
  'Control documents, certifications, clearances and expirations for the specific person, company, facility, vehicle, site or operation',
  'Turn gaps and pending work into actions with suggested owners, dependencies, dates and verifiable closure criteria',
  'Activate specialized areas for data protection, mining, transport, construction, healthcare and agribusiness on one shared platform',
  'Prepare organizations for Chile Law 21.719 with inventories, gaps, priorities and verifiable evidence without reducing Kumplio to privacy alone',
  'Coordinate digital specialists with defined responsibilities and deliverables according to the authorized objective and context',
  'Connect relevant conclusions to sources, documents, evidence and human review before legal, operational or closure decisions advance',
  'Preserve organization isolation, controlled access, history, provenance and traceability throughout case management',
  'Guide each situation from Understand to Resolve and Demonstrate with reusable approved evidence where appropriate',
] as const

export const PUBLIC_SITE_METADATA: Record<PublicLocale, PublicMetadataCopy> = {
  es: {
    htmlLang: 'es-CL',
    openGraphLocale: 'es_CL',
    title: 'Kumplio | Sistema operativo de cumplimiento para Chile',
    description: 'Kumplio conecta personas, documentos, requisitos, vencimientos y evidencia para mostrar qué está en regla, qué necesita atención y qué hacer después. Producto desarrollado por n3uralia.',
    classification: 'Sistema operativo de cumplimiento, documentos, requisitos y evidencia para organizaciones y personas en Chile',
    brandSlogan: 'Cumplir. Sin perseguir documentos.',
    category: 'Sistema operativo de cumplimiento y gestión de evidencia',
    keywords: [
      'software cumplimiento Chile',
      'sistema operativo de cumplimiento',
      'gestión documental cumplimiento',
      'control de vencimientos documentos',
      'gestión de contratistas Chile',
      'habilitación trabajadores contratistas',
      'cumplimiento minería Chile',
      'cumplimiento transporte Chile',
      'cumplimiento construcción Chile',
      'cumplimiento salud Chile',
      'cumplimiento agroindustria Chile',
      'protección de datos personales Chile',
      'Ley 21.719 Chile',
      'evidencia cumplimiento normativo',
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
      'Kumplio connects people, documents, requirements, expirations and evidence to show what is in order, what needs attention and what to do next. A product by n3uralia.',
    classification: 'Compliance operating system for people, documents, requirements, expirations and evidence in Chile',
    brandSlogan: 'Stay compliant. Without chasing documents.',
    category: 'Compliance operating system and evidence management',
    keywords: [
      'compliance software Chile',
      'compliance operating system',
      'document compliance management',
      'document expiration tracking',
      'contractor compliance Chile',
      'worker clearance management',
      'mining compliance Chile',
      'transport compliance Chile',
      'construction compliance Chile',
      'healthcare compliance Chile',
      'agribusiness compliance Chile',
      'Chile data protection',
      'Chile Law 21.719',
      'compliance evidence management',
      'guided compliance Chile',
      'Kumplio',
      'n3uralia',
    ],
    capabilities: englishCapabilities,
  },
}
