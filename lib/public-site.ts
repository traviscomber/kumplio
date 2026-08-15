export const SITE_URL = 'https://kumplio.app'
export const SITE_NAME = 'Kumplio'
export const SITE_LOCALE = 'es-CL'

export const N3URALIA_NAME = 'n3uralia'
export const N3URALIA_URL = 'https://www.n3uralia.com/es'
export const N3URALIA_CANONICAL_URL = 'https://www.n3uralia.com'
export const N3URALIA_SOLUTIONS_URL = 'https://www.n3uralia.com/es/soluciones'
export const N3URALIA_CONTACT_URL = 'https://www.n3uralia.com/es/contact'

export const N3URALIA_REFERRAL_URL = `${N3URALIA_URL}?utm_source=kumplio&utm_medium=referral&utm_campaign=powered_by_n3uralia`
export const N3URALIA_SOLUTIONS_REFERRAL_URL = `${N3URALIA_SOLUTIONS_URL}?utm_source=kumplio&utm_medium=referral&utm_campaign=kumplio_product`
export const N3URALIA_CONTACT_REFERRAL_URL = `${N3URALIA_CONTACT_URL}?utm_source=kumplio&utm_medium=referral&utm_campaign=kumplio_enterprise`

export const OFFICIAL_LEY_21719_URL =
  'https://www.bcn.cl/leychile/Navegar?idNorma=1209272&idParte=10527471&idVersion=2026-12-01'

export const PUBLIC_DESCRIPTION =
  'Kumplio ayuda a organizaciones en Chile a proteger datos personales y prepararse para la Ley 21.719: centraliza tratamientos, proveedores, controles, evidencia y decisiones; identifica brechas; coordina especialistas digitales; y convierte cada situación en una ruta clara con responsables, trazabilidad y revisión humana.'

export const PUBLIC_POSITIONING =
  'Plataforma de protección de datos y privacidad para Chile, con foco inicial en la Ley 21.719 y resolución guiada de situaciones reales.'

export const N3URALIA_FACTORY_DESCRIPTION =
  'n3uralia es la factoría chilena de inteligencia artificial aplicada y software que desarrolla Kumplio y otras soluciones para operaciones reales.'

export const POWERED_BY_DESCRIPTION =
  `Kumplio es un producto desarrollado por n3uralia. ${N3URALIA_FACTORY_DESCRIPTION}`

export const PUBLIC_CONTACT = {
  email: 'info@kumplio.app',
  phone: '+56 9 9382 6127',
  phoneHref: 'tel:+56993826127',
  location: 'Santiago, Chile',
}

export const PUBLIC_DISCOVERY = {
  lastReviewed: '2026-08-15',
  primaryCountry: 'Chile',
  primaryRegion: 'Santiago, Chile',
  primaryLanguage: 'es-CL',
  alternateLanguage: 'en',
  currency: 'CLP',
  primaryCategory: 'Data protection and privacy software',
  secondaryCategory: 'Compliance management software',
  primaryRegulatoryFocus: 'Ley 21.719 sobre protección de datos personales en Chile',
  machineContext: ['/llms.txt', '/llms-full.txt', '/kumplio.json', '/feed.xml', '/sitemap.xml'],
} as const

export const PUBLIC_AGENTIC_ASSURANCE = {
  observedAt: '2026-08-14',
  scope: 'controlled_synthetic_production_e2e',
  workflowType: 'compliance_assessment',
  stages: 5,
  approvedStages: 5,
  jobsSucceeded: 5,
  singleAttemptJobs: 5,
  failedJobs: 0,
  failedToolCalls: 0,
  providerTraces: 5,
  artifactsApproved: 5,
  reviewsApproved: 5,
  totalToolCalls: 24,
  totalTokens: 129868,
  limitation:
    'Esta evidencia demuestra el flujo técnico controlado y su trazabilidad; no constituye certificación, asesoría jurídica ni evidencia de un cliente externo.',
} as const

export const CORE_CAPABILITIES = [
  'Centralizar información sensible, documentos, tratamientos, proveedores, controles, evidencias y decisiones dentro de expedientes trazables',
  'Ayudar a entender qué datos personales existen, dónde están, cómo se usan, quién interviene y qué falta revisar',
  'Preparar a organizaciones para la Ley 21.719 mediante trabajo guiado, prioridades y evidencia verificable',
  'Convertir brechas de privacidad y protección de datos en acciones, responsables sugeridos, dependencias y criterios de cierre',
  'Coordinar especialistas digitales con funciones y entregables definidos según el objetivo y el contexto autorizado',
  'Relacionar conclusiones con fuentes, documentos, evidencia y revisiones humanas antes de avanzar',
  'Conservar aislamiento por organización, acceso controlado, historial y trazabilidad durante la gestión del caso',
  'Acompañar cada situación desde la comprensión inicial hasta una decisión y cierre verificables',
]

export const PUBLIC_LIMITATIONS = [
  'Kumplio no declara automáticamente que una persona u organización cumple una norma.',
  'Kumplio no reemplaza asesoría jurídica, auditoría independiente ni decisiones profesionales.',
  'Las conclusiones relevantes requieren fuentes identificables, contexto suficiente y revisión humana.',
]
