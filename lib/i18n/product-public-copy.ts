import type { PublicLocale } from '@/lib/i18n/public-routing'

type Card = { title: string; description: string }
type LinkCard = Card & { href: string; action: string }

type SoftwareCopy = {
  metadata: { title: string; description: string }
  nav: { home: string; resources: string; plans: string; contact: string; switchLanguage: string }
  hero: { eyebrow: string; title: string; description: string; primary: string; secondary: string; proof: string[]; note: string }
  protect: { eyebrow: string; title: string; description: string; cards: Card[] }
  resolve: { eyebrow: string; title: string; description: string; stages: Card[] }
  capabilities: { eyebrow: string; title: string; description: string; cards: Card[] }
  steps: { eyebrow: string; title: string; cards: Card[] }
  difference: { eyebrow: string; title: string; body: string; guard: string }
  cta: { title: string; body: string; action: string }
  faq: Array<{ question: string; answer: string }>
}

type LawFeatureCopy = {
  metadata: { title: string; description: string }
  nav: { home: string; guides: string; plans: string; contact: string; switchLanguage: string }
  hero: { eyebrow: string; title: string; description: string; dateLabel: string; date: string; source: string; primary: string; secondary: string }
  areas: { eyebrow: string; title: string; cards: Card[] }
  flow: { eyebrow: string; title: string; description: string; steps: Card[] }
  paths: { eyebrow: string; title: string; cards: LinkCard[] }
  evidence: { eyebrow: string; title: string; description: string; bullets: string[]; guard: string }
  sources: { title: string; description: string; bcn: string; diario: string }
  cta: { title: string; body: string; action: string }
}

type UseCasesCopy = {
  metadata: { title: string; description: string }
  nav: { home: string; demo: string; plans: string; contact: string; switchLanguage: string }
  hero: { eyebrow: string; title: string; description: string }
  cases: Array<{ tag: string; title: string; description: string; results: string[] }>
  note: string
  cta: { title: string; body: string; primary: string; secondary: string }
}

type EnterpriseCopy = {
  metadata: { title: string; description: string }
  nav: { home: string; product: string; plans: string; contact: string; switchLanguage: string }
  hero: { eyebrow: string; title: string; description: string; primary: string; secondary: string }
  standard: { eyebrow: string; title: string; description: string; items: string[]; action: string }
  studio: { eyebrow: string; title: string; description: string; items: string[]; action: string }
  flow: { eyebrow: string; title: string; steps: Card[] }
  boundary: { title: string; description: string }
}

export const SOFTWARE_PUBLIC_COPY: Record<PublicLocale, SoftwareCopy> = {
  es: {
    metadata: {
      title: 'Software de protección de datos y Ley 21.719 en Chile',
      description: 'Kumplio ayuda a organizaciones en Chile a ordenar datos personales, preparar la Ley 21.719, priorizar brechas, coordinar responsables y conservar evidencia con revisión humana.',
    },
    nav: { home: 'Inicio', resources: 'Recursos', plans: 'Planes', contact: 'Contacto', switchLanguage: 'English' },
    hero: {
      eyebrow: 'Protección de datos para Chile',
      title: 'Protege tus datos y prepárate para la Ley 21.719 con una ruta clara.',
      description: 'Kumplio reúne tratamientos, fuentes, proveedores, controles, evidencia y responsables para convertir una obligación de privacidad en trabajo concreto, trazable y revisable.',
      primary: 'Empezar un caso', secondary: 'Ver guías Ley 21.719',
      proof: ['Mapa de tratamientos', 'Brechas y riesgos priorizados', 'Evidencia y revisión humana'],
      note: 'No reemplaza asesoría jurídica ni declara automáticamente que una organización cumple.',
    },
    protect: {
      eyebrow: 'Qué debe resolver una plataforma de protección de datos',
      title: 'Ordenar la realidad antes de afirmar cumplimiento.',
      description: 'Una buena preparación parte por hacer visibles los datos, finalidades, sistemas, terceros, responsables y preguntas abiertas que hoy están repartidos entre documentos y equipos.',
      cards: [
        { title: 'Visibilidad de datos', description: 'Relaciona actividades de tratamiento, titulares, categorías de datos, sistemas, datasets y terceros.' },
        { title: 'Riesgo y brechas', description: 'Distingue hechos verificados, supuestos y dimensiones pendientes para priorizar sin ocultar incertidumbre.' },
        { title: 'Evidencia operativa', description: 'Conecta obligaciones y controles con contratos, políticas, pruebas, decisiones y responsables.' },
      ],
    },
    resolve: {
      eyebrow: 'Ciclo operativo',
      title: 'De una situación de privacidad a un expediente demostrable.',
      description: 'Kumplio mantiene el contexto unido para que el trabajo no termine en un diagnóstico estático.',
      stages: [
        { title: 'Describe', description: 'Registra la situación, el objetivo y los antecedentes disponibles.' },
        { title: 'Mapea', description: 'Organiza actividades, obligaciones, datos, terceros, controles y evidencia.' },
        { title: 'Prioriza', description: 'Separa brechas, riesgos, dependencias y preguntas que necesitan revisión.' },
        { title: 'Ejecuta', description: 'Convierte lo pendiente en acciones con responsables, fechas y criterios de cierre.' },
        { title: 'Revisa', description: 'Contrasta conclusiones sensibles con fuentes, evidencia y revisión humana.' },
        { title: 'Demuestra', description: 'Conserva la trazabilidad de qué se hizo, con qué respaldo y quién decidió.' },
      ],
    },
    capabilities: {
      eyebrow: 'Capacidades esenciales',
      title: 'Una base para operar privacidad, no solo documentarla.',
      description: 'Las capacidades se conectan entre sí y conservan contexto común.',
      cards: [
        { title: 'Inventario de tratamientos', description: 'Actividades reales, propósitos, titulares, datos, sistemas, datasets, terceros y owners.' },
        { title: 'Fuentes y obligaciones', description: 'Normas, contratos y políticas vinculadas a requisitos que pueden revisarse.' },
        { title: 'Controles y evidencia', description: 'Diseño, operación, suficiencia y respaldo separados para evitar conclusiones infladas.' },
        { title: 'Proveedores y transferencias', description: 'Terceros, encargados, destinatarios y preguntas de transferencia visibles dentro del expediente.' },
        { title: 'Solicitudes e incidentes', description: 'Trabajo asignable y trazable para responder situaciones concretas sin perder antecedentes.' },
        { title: 'Especialistas digitales', description: 'IA especializada prepara análisis y entregables; decisiones sensibles mantienen validación humana.' },
      ],
    },
    steps: {
      eyebrow: 'Cómo empezar', title: 'Una ruta corta para pasar de desorden a control.',
      cards: [
        { title: '1. Inventaria', description: 'Registra actividades reales y conserva los unknowns que todavía deben resolverse.' },
        { title: '2. Relaciona', description: 'Conecta fuentes, contratos, políticas, sistemas, terceros y evidencia disponible.' },
        { title: '3. Prioriza', description: 'Ordena brechas por riesgo, dependencia y capacidad de demostrar el resultado.' },
        { title: '4. Ejecuta', description: 'Asigna responsables y cierra solo cuando exista respaldo suficiente.' },
      ],
    },
    difference: {
      eyebrow: 'Diseñado para la realidad chilena',
      title: 'Chile primero, con fuentes verificables y límites explícitos.',
      body: 'Kumplio prioriza la Ley 21.719, LeyChile de la Biblioteca del Congreso Nacional y el Diario Oficial como referencias oficiales, manteniendo la procedencia de la información y la fecha de revisión.',
      guard: 'La herramienta ayuda a preparar y operar trabajo de cumplimiento. No emite certificaciones ni sustituye abogado, auditor, DPO, responsable de riesgo o autoridad.',
    },
    cta: { title: 'Empieza por una situación real de protección de datos.', body: 'Describe qué necesitas resolver y convierte el contexto en una ruta de trabajo con evidencia y responsables.', action: 'Resolver mi caso' },
    faq: [
      { question: '¿Kumplio sirve para la Ley 21.719?', answer: 'Sí. El primer alcance prioritario organiza tratamientos, obligaciones, responsables, controles, proveedores, evidencia y brechas vinculadas a la preparación para la Ley 21.719.' },
      { question: '¿Kumplio certifica que una empresa cumple?', answer: 'No. Kumplio organiza trabajo, fuentes y evidencia. Una conclusión de cumplimiento requiere revisión suficiente y responsabilidad humana.' },
      { question: '¿Puede trabajar con documentos y contratos existentes?', answer: 'Sí. El objetivo es reutilizar antecedentes ya disponibles y conectarlos con obligaciones, controles y decisiones, manteniendo trazabilidad.' },
    ],
  },
  en: {
    metadata: {
      title: 'Data-protection and Law 21.719 software for Chile',
      description: 'Kumplio helps organizations in Chile organize personal data, prepare for Law 21.719, prioritize gaps, coordinate owners and preserve evidence with human review.',
    },
    nav: { home: 'Home', resources: 'Resources', plans: 'Plans', contact: 'Contact', switchLanguage: 'Español' },
    hero: {
      eyebrow: 'Data protection for Chile',
      title: 'Protect your data and prepare for Law 21.719 with a clear path.',
      description: 'Kumplio brings processing activities, sources, vendors, controls, evidence and owners together to turn a privacy obligation into concrete, traceable and reviewable work.',
      primary: 'Start a case', secondary: 'View Law 21.719 guides',
      proof: ['Processing map', 'Prioritized gaps and risks', 'Evidence and human review'],
      note: 'It does not replace legal advice or automatically declare that an organization is compliant.',
    },
    protect: {
      eyebrow: 'What a data-protection platform should solve',
      title: 'Organize reality before making a compliance claim.',
      description: 'Strong preparation starts by making visible the data, purposes, systems, third parties, owners and open questions that are currently scattered across documents and teams.',
      cards: [
        { title: 'Data visibility', description: 'Connect processing activities, data subjects, data categories, systems, datasets and third parties.' },
        { title: 'Risk and gaps', description: 'Distinguish verified facts, assumptions and pending dimensions so priorities do not hide uncertainty.' },
        { title: 'Operational evidence', description: 'Connect obligations and controls to contracts, policies, tests, decisions and owners.' },
      ],
    },
    resolve: {
      eyebrow: 'Operating cycle', title: 'From a privacy situation to a demonstrable case file.', description: 'Kumplio keeps the context connected so the work does not end in a static diagnosis.',
      stages: [
        { title: 'Describe', description: 'Record the situation, objective and available background.' },
        { title: 'Map', description: 'Organize activities, obligations, data, third parties, controls and evidence.' },
        { title: 'Prioritize', description: 'Separate gaps, risks, dependencies and questions that require review.' },
        { title: 'Execute', description: 'Turn open items into actions with owners, dates and closure criteria.' },
        { title: 'Review', description: 'Check sensitive conclusions against sources, evidence and human review.' },
        { title: 'Demonstrate', description: 'Preserve traceability of what was done, which evidence supported it and who decided.' },
      ],
    },
    capabilities: {
      eyebrow: 'Essential capabilities', title: 'A foundation for operating privacy, not only documenting it.', description: 'Capabilities remain connected through shared context.',
      cards: [
        { title: 'Processing inventory', description: 'Real activities, purposes, data subjects, data, systems, datasets, third parties and owners.' },
        { title: 'Sources and obligations', description: 'Regulations, contracts and policies connected to requirements that can be reviewed.' },
        { title: 'Controls and evidence', description: 'Design, operation, sufficiency and support kept separate to avoid inflated conclusions.' },
        { title: 'Vendors and transfers', description: 'Third parties, processors, recipients and transfer questions visible in the case file.' },
        { title: 'Requests and incidents', description: 'Assignable, traceable work for concrete situations without losing context.' },
        { title: 'Digital specialists', description: 'Specialized AI prepares analyses and deliverables; sensitive decisions retain human validation.' },
      ],
    },
    steps: {
      eyebrow: 'How to start', title: 'A short path from disorder to control.',
      cards: [
        { title: '1. Inventory', description: 'Record real activities and preserve unknowns that still need to be resolved.' },
        { title: '2. Connect', description: 'Link sources, contracts, policies, systems, third parties and available evidence.' },
        { title: '3. Prioritize', description: 'Order gaps by risk, dependency and the ability to demonstrate the result.' },
        { title: '4. Execute', description: 'Assign owners and close only when sufficient support exists.' },
      ],
    },
    difference: {
      eyebrow: 'Built for the Chilean context', title: 'Chile first, with verifiable sources and explicit limits.',
      body: 'Kumplio prioritizes Law 21.719, LeyChile from the Library of the National Congress and the Official Gazette as official references, preserving provenance and review dates.',
      guard: 'The tool helps prepare and operate compliance work. It does not issue certifications or replace lawyers, auditors, DPOs, risk owners or authorities.',
    },
    cta: { title: 'Start with a real data-protection situation.', body: 'Describe what you need to resolve and turn the context into a working path with evidence and owners.', action: 'Resolve my case' },
    faq: [
      { question: 'Can Kumplio help with Law 21.719?', answer: 'Yes. The first priority scope organizes processing activities, obligations, owners, controls, vendors, evidence and gaps related to preparation for Law 21.719.' },
      { question: 'Does Kumplio certify that a company is compliant?', answer: 'No. Kumplio organizes work, sources and evidence. A compliance conclusion requires sufficient review and human accountability.' },
      { question: 'Can it work with existing documents and contracts?', answer: 'Yes. The objective is to reuse existing background and connect it to obligations, controls and decisions while preserving traceability.' },
    ],
  },
}

export const LAW_FEATURE_PUBLIC_COPY: Record<PublicLocale, LawFeatureCopy> = {
  es: {
    metadata: { title: 'Ley 21.719 Chile | Preparación operativa con Kumplio', description: 'Ruta operativa para preparar la Ley 21.719 en Chile: inventario de tratamientos, bases, terceros, evidencia, controles y revisión humana.' },
    nav: { home: 'Inicio', guides: 'Guías', plans: 'Planes', contact: 'Contacto', switchLanguage: 'English' },
    hero: { eyebrow: 'Ley 21.719 · Chile', title: 'Prepara la nueva ley de datos como una operación, no como un documento.', description: 'Kumplio organiza actividades de tratamiento, preguntas jurídicas, evidencia y acciones para que el equipo pueda avanzar sin confundir trabajo pendiente con cumplimiento demostrado.', dateLabel: 'Entrada en vigencia general', date: '1 de diciembre de 2026', source: 'Según texto oficial publicado en LeyChile/Diario Oficial.', primary: 'Empezar preparación', secondary: 'Ver guías públicas' },
    areas: { eyebrow: 'Tres frentes que deben conectarse', title: 'La ley cruza negocio, legal y tecnología.', cards: [
      { title: 'Tratamientos y finalidades', description: 'Qué datos se usan, para quién, con qué propósito, en qué sistemas y con qué terceros.' },
      { title: 'Base, información y derechos', description: 'Qué fundamento se propone, qué se informa a titulares y cómo se reciben o resuelven solicitudes.' },
      { title: 'Seguridad, retención y evidencia', description: 'Qué controles existen, cómo se operan, cuánto se conserva y qué respaldo demuestra el resultado.' },
    ] },
    flow: { eyebrow: 'Ruta operativa', title: 'De inventario a cierre verificable.', description: 'Cada etapa deja preguntas abiertas visibles hasta que exista información suficiente.', steps: [
      { title: 'Inventariar', description: 'Registrar actividades reales y propietarios.' },
      { title: 'Revisar', description: 'Separar hechos, propuestas y dimensiones pendientes.' },
      { title: 'Remediar', description: 'Convertir brechas en acciones con responsable y fecha.' },
      { title: 'Demostrar', description: 'Conservar evidencia, revisiones y decisiones.' },
    ] },
    paths: { eyebrow: 'Recursos para avanzar', title: 'Empieza por el nivel de detalle que necesitas.', cards: [
      { title: 'Guía práctica', description: 'Qué cambia y cómo organizar un programa de preparación.', href: '/resources/ley-21719/guia-ley-21719', action: 'Leer guía' },
      { title: 'Checklist operativo', description: 'Preguntas de gobernanza, inventario, base, seguridad y respuesta.', href: '/resources/ley-21719/checklist-ley-21719', action: 'Abrir checklist' },
      { title: 'Matriz de tratamientos', description: 'Campos mínimos y criterio para separar hechos de propuestas.', href: '/resources/ley-21719/matriz-tratamientos-datos', action: 'Ver matriz' },
    ] },
    evidence: { eyebrow: 'Evidencia antes que score', title: 'Un porcentaje no reemplaza el respaldo.', description: 'Kumplio conserva la diferencia entre un control diseñado, una prueba operativa, una evidencia aceptada y una conclusión todavía pendiente.', bullets: ['Fuente y versión identificable', 'Owner y responsable de revisión', 'Evidencia con procedencia y fecha', 'Unknowns y brechas sin ocultar'], guard: 'La plataforma no sustituye asesoría jurídica, auditoría independiente ni una determinación de cumplimiento.' },
    sources: { title: 'Fuentes oficiales', description: 'La preparación debe contrastarse con el texto vigente y la publicación oficial.', bcn: 'LeyChile · Biblioteca del Congreso Nacional', diario: 'Diario Oficial de Chile' },
    cta: { title: 'Empieza con tus tratamientos reales.', body: 'Abre un caso y reúne el contexto necesario para que cada pregunta tenga owner, evidencia y siguiente paso.', action: 'Preparar mi organización' },
  },
  en: {
    metadata: { title: 'Chile Law 21.719 | Operational preparation with Kumplio', description: 'Operational path for preparing for Law 21.719 in Chile: processing inventory, legal bases, third parties, evidence, controls and human review.' },
    nav: { home: 'Home', guides: 'Guides', plans: 'Plans', contact: 'Contact', switchLanguage: 'Español' },
    hero: { eyebrow: 'Law 21.719 · Chile', title: 'Prepare for Chile’s new data law as an operation, not as a document.', description: 'Kumplio organizes processing activities, legal questions, evidence and actions so teams can move forward without confusing pending work with demonstrated compliance.', dateLabel: 'General entry into force', date: 'December 1, 2026', source: 'According to the official text published through LeyChile and the Official Gazette.', primary: 'Start preparation', secondary: 'View public guides' },
    areas: { eyebrow: 'Three fronts that must stay connected', title: 'The law crosses business, legal and technology.', cards: [
      { title: 'Processing and purposes', description: 'Which data is used, for whom, for what purpose, in which systems and with which third parties.' },
      { title: 'Legal basis, information and rights', description: 'Which basis is proposed, what is communicated to data subjects and how requests are received or resolved.' },
      { title: 'Security, retention and evidence', description: 'Which controls exist, how they operate, how long data is kept and which evidence demonstrates the result.' },
    ] },
    flow: { eyebrow: 'Operational path', title: 'From inventory to verifiable closure.', description: 'Each stage keeps open questions visible until sufficient information exists.', steps: [
      { title: 'Inventory', description: 'Record real activities and owners.' },
      { title: 'Review', description: 'Separate facts, proposals and pending dimensions.' },
      { title: 'Remediate', description: 'Turn gaps into actions with an owner and due date.' },
      { title: 'Demonstrate', description: 'Preserve evidence, reviews and decisions.' },
    ] },
    paths: { eyebrow: 'Resources to move forward', title: 'Start at the level of detail you need.', cards: [
      { title: 'Practical guide', description: 'What changes and how to organize a preparation program.', href: '/resources/ley-21719/guia-ley-21719', action: 'Read guide' },
      { title: 'Operational checklist', description: 'Questions covering governance, inventory, legal basis, security and response.', href: '/resources/ley-21719/checklist-ley-21719', action: 'Open checklist' },
      { title: 'Processing matrix', description: 'Minimum fields and criteria for separating facts from proposals.', href: '/resources/ley-21719/matriz-tratamientos-datos', action: 'View matrix' },
    ] },
    evidence: { eyebrow: 'Evidence before scores', title: 'A percentage does not replace support.', description: 'Kumplio preserves the difference among a designed control, an operational test, accepted evidence and a conclusion that is still pending.', bullets: ['Identifiable source and version', 'Owner and reviewer', 'Evidence with provenance and date', 'Unknowns and gaps kept visible'], guard: 'The platform does not replace legal advice, independent audit or a determination of compliance.' },
    sources: { title: 'Official sources', description: 'Preparation should be checked against the current text and official publication.', bcn: 'LeyChile · Library of the National Congress of Chile', diario: 'Official Gazette of Chile' },
    cta: { title: 'Start with your real processing activities.', body: 'Open a case and gather the context needed so every question has an owner, evidence and a next step.', action: 'Prepare my organization' },
  },
}

export const USE_CASES_PUBLIC_COPY: Record<PublicLocale, UseCasesCopy> = {
  es: {
    metadata: { title: 'Casos de uso | Kumplio Chile', description: 'Ejemplos de cómo Kumplio organiza cumplimiento, evidencia y acciones en tecnología, minería, logística y otras operaciones en Chile.' },
    nav: { home: 'Inicio', demo: 'Demo', plans: 'Planes', contact: 'Contacto', switchLanguage: 'English' },
    hero: { eyebrow: 'Casos de uso', title: 'Un mismo sistema para tres contextos operativos.', description: 'La arquitectura es común: fuentes, obligaciones, controles, evidencia, responsables y revisión. Lo que cambia es el contexto del negocio y las preguntas que deben resolverse.' },
    cases: [
      { tag: 'Tecnología', title: 'Protección de datos, proveedores SaaS y evidencia de controles.', description: 'Para equipos que necesitan ordenar tratamientos, contratos, accesos, proveedores y preparación para la Ley 21.719.', results: ['Mapa de tratamientos y sistemas', 'Brechas de contrato y proveedores', 'Controles y evidencia trazables'] },
      { tag: 'Minería', title: 'Contratistas, permisos y obligaciones distribuidas en múltiples áreas.', description: 'Para operaciones donde legal, seguridad, abastecimiento y terreno deben coordinar evidencia y responsables.', results: ['Obligaciones por contrato o fuente', 'Responsables y fechas visibles', 'Hallazgos y remediación conectados'] },
      { tag: 'Logística y transporte', title: 'Datos de personas, terceros y operación en movimiento.', description: 'Para empresas que coordinan conductores, clientes, proveedores y sistemas con múltiples puntos de acceso y tratamiento.', results: ['Inventario de datos y terceros', 'Solicitudes e incidentes asignables', 'Trazabilidad de decisiones'] },
    ],
    note: 'Estos ejemplos ilustran flujos de trabajo. La aplicabilidad regulatoria y las conclusiones deben revisarse según los hechos de cada organización.',
    cta: { title: '¿Quieres ver el flujo con un caso guiado?', body: 'Explora la demo o conversa con Kumplio si necesitas adaptar permisos, integraciones o procesos.', primary: 'Ver demo', secondary: 'Enterprise Studio' },
  },
  en: {
    metadata: { title: 'Use cases | Kumplio Chile', description: 'Examples of how Kumplio organizes compliance, evidence and actions across technology, mining, logistics and other operations in Chile.' },
    nav: { home: 'Home', demo: 'Demo', plans: 'Plans', contact: 'Contact', switchLanguage: 'Español' },
    hero: { eyebrow: 'Use cases', title: 'One system for three operating contexts.', description: 'The architecture is shared: sources, obligations, controls, evidence, owners and review. What changes is the business context and the questions that must be resolved.' },
    cases: [
      { tag: 'Technology', title: 'Data protection, SaaS vendors and control evidence.', description: 'For teams that need to organize processing activities, contracts, access, vendors and preparation for Law 21.719.', results: ['Map of processing activities and systems', 'Contract and vendor gaps', 'Traceable controls and evidence'] },
      { tag: 'Mining', title: 'Contractors, permits and obligations distributed across multiple areas.', description: 'For operations where legal, safety, procurement and field teams must coordinate evidence and owners.', results: ['Obligations by contract or source', 'Visible owners and due dates', 'Connected findings and remediation'] },
      { tag: 'Logistics and transport', title: 'Personal data, third parties and operations in motion.', description: 'For companies coordinating drivers, customers, vendors and systems with multiple access and processing points.', results: ['Inventory of data and third parties', 'Assignable requests and incidents', 'Decision traceability'] },
    ],
    note: 'These examples illustrate workflows. Regulatory applicability and conclusions should be reviewed according to each organization’s facts.',
    cta: { title: 'Do you want to see the workflow with a guided case?', body: 'Explore the demo or talk to Kumplio if you need custom permissions, integrations or processes.', primary: 'View demo', secondary: 'Enterprise Studio' },
  },
}

export const ENTERPRISE_PUBLIC_COPY: Record<PublicLocale, EnterpriseCopy> = {
  es: {
    metadata: { title: 'Kumplio Enterprise Studio | Integraciones y soluciones a medida', description: 'Cuando Kumplio estándar no alcanza, Enterprise Studio evalúa integraciones, permisos, flujos y soluciones fullstack para organizaciones en Chile.' },
    nav: { home: 'Inicio', product: 'Producto', plans: 'Planes', contact: 'Contacto', switchLanguage: 'English' },
    hero: { eyebrow: 'Kumplio Enterprise Studio', title: 'Cuando el problema supera el producto estándar, diseñamos la operación contigo.', description: 'Enterprise Studio amplía Kumplio con integraciones, permisos, automatizaciones y experiencias específicas. Si la necesidad se convierte en un sistema propio, n3uralia puede construir una solución fullstack separada.', primary: 'Evaluar mi caso', secondary: 'Ver planes estándar' },
    standard: { eyebrow: 'Kumplio estándar', title: 'Empieza por el producto cuando el flujo común resuelve el problema.', description: 'El producto estándar es la opción correcta cuando puedes operar con el modelo compartido de expedientes, misiones, evidencia y especialistas.', items: ['Workspace multiempresa', 'Expedientes y misiones', 'Controles, evidencia y revisión', 'Especialistas digitales coordinados'], action: 'Ver planes' },
    studio: { eyebrow: 'Enterprise Studio', title: 'Personaliza cuando la operación lo exige.', description: 'Evaluamos el alcance antes de prometer una integración o automatización. La propuesta define dependencias, responsables, precio y criterio de aceptación.', items: ['Integraciones con ERP, CRM y sistemas internos', 'Roles, permisos y flujos específicos', 'Automatizaciones y conectores propios', 'Experiencias o módulos dedicados', 'Solución Fullstack desde $5.000.000 + IVA cuando corresponde'], action: 'Solicitar evaluación' },
    flow: { eyebrow: 'Cómo trabajamos', title: 'Primero encaje; después alcance y construcción.', steps: [
      { title: '1. Contexto', description: 'Entendemos el resultado, sistemas, usuarios y restricciones.' },
      { title: '2. Encaje', description: 'Definimos qué puede resolver Kumplio estándar y qué necesita personalización.' },
      { title: '3. Propuesta', description: 'Acordamos alcance, dependencias, precio, responsables y aceptación.' },
      { title: '4. Implementación', description: 'Construimos y validamos sin convertir promesas comerciales en claims técnicos no demostrados.' },
    ] },
    boundary: { title: 'Enterprise no significa “todo incluido”.', description: 'Cada integración, proveedor, requisito de seguridad y dato sensible se evalúa explícitamente. La propuesta comercial no sustituye una revisión jurídica, de privacidad o de seguridad cuando corresponda.' },
  },
  en: {
    metadata: { title: 'Kumplio Enterprise Studio | Integrations and custom solutions', description: 'When standard Kumplio is not enough, Enterprise Studio evaluates integrations, permissions, workflows and full-stack solutions for organizations in Chile.' },
    nav: { home: 'Home', product: 'Product', plans: 'Plans', contact: 'Contact', switchLanguage: 'Español' },
    hero: { eyebrow: 'Kumplio Enterprise Studio', title: 'When the problem exceeds the standard product, we design the operation with you.', description: 'Enterprise Studio extends Kumplio with integrations, permissions, automation and specific experiences. If the need becomes a proprietary system, n3uralia can build a separate full-stack solution.', primary: 'Assess my case', secondary: 'View standard plans' },
    standard: { eyebrow: 'Standard Kumplio', title: 'Start with the product when the shared workflow solves the problem.', description: 'The standard product is the right option when you can operate with the shared model of case files, missions, evidence and specialists.', items: ['Multi-organization workspace', 'Case files and missions', 'Controls, evidence and review', 'Coordinated digital specialists'], action: 'View plans' },
    studio: { eyebrow: 'Enterprise Studio', title: 'Customize when the operation requires it.', description: 'We assess scope before promising an integration or automation. The proposal defines dependencies, owners, price and acceptance criteria.', items: ['Integrations with ERP, CRM and internal systems', 'Specific roles, permissions and workflows', 'Custom automations and connectors', 'Dedicated experiences or modules', 'Full-stack solution from CLP $5,000,000 + VAT when appropriate'], action: 'Request assessment' },
    flow: { eyebrow: 'How we work', title: 'Fit first; then scope and build.', steps: [
      { title: '1. Context', description: 'We understand the outcome, systems, users and constraints.' },
      { title: '2. Fit', description: 'We define what standard Kumplio can solve and what requires customization.' },
      { title: '3. Proposal', description: 'We agree on scope, dependencies, price, owners and acceptance.' },
      { title: '4. Implementation', description: 'We build and validate without turning commercial promises into unproven technical claims.' },
    ] },
    boundary: { title: 'Enterprise does not mean “everything included.”', description: 'Each integration, provider, security requirement and sensitive-data use is assessed explicitly. A commercial proposal does not replace legal, privacy or security review when appropriate.' },
  },
}
