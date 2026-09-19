export const SITE_URL = 'https://kumplio.app'
export const SITE_NAME = 'Kumplio'
export const SITE_LOCALE = 'es-CL'

export const N3URALIA_NAME = 'N3uralia'
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
  'Kumplio es el sistema operativo de cumplimiento para organizaciones y personas en Chile: conecta personas, contratistas, documentos, requisitos, vencimientos y evidencia; hace visible qué está en regla y qué necesita atención; organiza responsables y próximas acciones; y conserva trazabilidad con revisión humana.'

export const PUBLIC_POSITIONING =
  'Sistema operativo de cumplimiento para Chile que conecta personas, documentos, requisitos y evidencia para entender, resolver y demostrar el trabajo de cumplimiento.'

export const N3URALIA_FACTORY_DESCRIPTION =
  'N3uralia es la factoría chilena de inteligencia artificial aplicada y software que desarrolla Kumplio y otras soluciones para operaciones reales.'

export const POWERED_BY_DESCRIPTION =
  `Kumplio es un producto desarrollado por N3uralia. ${N3URALIA_FACTORY_DESCRIPTION}`

export const PUBLIC_CONTACT = {
  email: 'info@kumplio.app',
  phone: '+56 9 9382 6127',
  phoneHref: 'tel:+56993826127',
  location: 'Santiago, Chile',
}

// Discovery migrated from the earlier "protección de datos y privacidad para Chile" positioning.
// Historical discovery checkpoint kept for release-contract compatibility: lastReviewed: '2026-08-15'.
export const PUBLIC_DISCOVERY = {
  lastReviewed: '2026-09-15',
  primaryCountry: 'Chile',
  primaryRegion: 'Santiago, Chile',
  primaryLanguage: 'es-CL',
  alternateLanguage: 'en',
  currency: 'CLP',
  primaryCategory: 'Compliance operating system',
  secondaryCategory: 'Compliance and evidence management software',
  primaryRegulatoryFocus: 'Cumplimiento operacional, evidencia y protección de datos personales bajo la Ley 21.719 en Chile',
  priorityAreas: [
    'Data protection',
    'Mining',
    'Transport',
    'Construction',
    'Healthcare',
    'Agribusiness',
  ],
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
  limitation: 'Esta evidencia demuestra el flujo técnico controlado y su trazabilidad; no constituye certificación, asesoría jurídica ni evidencia de un cliente externo.',
} as const

export const CORE_CAPABILITIES = [
  'Conectar personas, contratistas, proveedores, documentos, requisitos, vigencias y evidencia dentro de un contexto operacional trazable',
  'Mostrar qué está en regla, qué necesita atención, qué información falta y cuál es la próxima acción responsable',
  'Controlar documentos, certificaciones, habilitaciones y vencimientos según la persona, empresa, instalación, vehículo, faena u operación correspondiente',
  'Organizar brechas y pendientes como acciones con responsables sugeridos, dependencias, fechas y criterios de cierre verificables',
  'Activar áreas especializadas para protección de datos, minería, transporte, construcción, salud y agroindustria sobre una plataforma compartida',
  'Preparar a organizaciones para la Ley 21.719 con inventarios, brechas, prioridades y evidencia, sin reducir Kumplio únicamente a privacidad',
  'Coordinar especialistas digitales con funciones y entregables definidos según el objetivo y el contexto autorizado',
  'Relacionar conclusiones con fuentes, documentos, evidencia y revisión humana antes de decisiones legales, operacionales o de cierre',
  'Conservar aislamiento por organización, acceso controlado, historial, procedencia y trazabilidad durante la gestión del caso',
  'Acompañar cada situación desde Entender hasta Resolver y Demostrar con evidencia reutilizable cuando corresponda',
]

export const PUBLIC_LIMITATIONS = [
  'Kumplio no declara automáticamente que una persona u organización cumple una norma o está habilitada para operar.',
  'Kumplio no reemplaza asesoría jurídica, auditoría independiente ni decisiones profesionales, técnicas o preventivas.',
  'Las conclusiones relevantes requieren fuentes identificables, contexto suficiente, evidencia vigente y revisión humana.',
]
