import type { PublicLocale } from '@/lib/i18n/public-routing'

type Step = { title: string; description: string }
type Scenario = { title: string; description: string }

type HomeClarityCopy = {
  nav: { product: string; how: string; forWho: string; resources: string; pricing: string; signIn: string; try: string; switchLanguage: string }
  hero: { eyebrow: string; title: string; description: string; primary: string; secondary: string; proofs: string[] }
  journey: { eyebrow: string; title: string; steps: Step[] }
  example: { eyebrow: string; title: string; quote: string; outcomes: Step[] }
  workflow: { eyebrow: string; title: string; description: string; stages: Step[] }
  specialists: { eyebrow: string; title: string; description: string; people: Array<{ name: string; label: string; description: string }>; capabilities: string[]; note: string }
  scenarios: { eyebrow: string; title: string; items: Scenario[] }
  security: { eyebrow: string; title: string; description: string; points: Step[]; note: string }
  cta: { eyebrow: string; title: string; description: string; action: string }
}

export const HOME_CLARITY_COPY: Record<PublicLocale, HomeClarityCopy> = {
  es: {
    nav: { product: 'Producto', how: 'Cómo funciona', forWho: 'Para quién', resources: 'Recursos', pricing: 'Precios', signIn: 'Ingresar', try: 'Probar Kumplio', switchLanguage: 'English' },
    hero: {
      eyebrow: 'Protección de datos para Chile',
      title: 'Descubre qué datos personales usa tu empresa y qué debes corregir.',
      description: 'Kumplio ordena tus tratamientos, detecta brechas frente a la Ley 21.719 y crea un plan con tareas, responsables, plazos y evidencia de cierre.',
      primary: 'Revisar mi empresa',
      secondary: 'Ver cómo funciona',
      proofs: ['Inventario de datos y proveedores', 'Brechas y tareas priorizadas', 'Responsables, plazos y evidencia'],
    },
    journey: {
      eyebrow: 'Del desorden a un plan ejecutable',
      title: 'De la complejidad a una decisión que puedes ejecutar.',
      steps: [
        { title: 'Agrega', description: 'Reúne documentos, datos, proveedores y contexto operativo en un solo lugar.' },
        { title: 'Analiza', description: 'Relaciona tu realidad con las obligaciones aplicables y mantiene visibles los desconocidos.' },
        { title: 'Decide', description: 'Convierte cada brecha en una acción priorizada con responsable y plazo.' },
        { title: 'Demuestra', description: 'Conserva la evidencia, la revisión humana y el historial de cada corrección.' },
      ],
    },
    example: {
      eyebrow: 'Un caso concreto',
      title: 'Esto es lo que una empresa obtiene al usar Kumplio.',
      quote: 'Tenemos datos de clientes, trabajadores y postulantes en varios sistemas, pero nadie sabe exactamente dónde están ni qué debemos corregir.',
      outcomes: [
        { title: 'Un mapa de sus datos', description: 'Qué datos usa, para qué, dónde están, quién es responsable y qué proveedores participan.' },
        { title: 'Un diagnóstico accionable', description: 'Qué exige atención, qué información falta y cuáles son las brechas prioritarias frente a la Ley 21.719.' },
        { title: 'Un plan que se puede cerrar', description: 'Tareas, responsables, plazos, documentos requeridos y evidencia para demostrar cada corrección.' },
      ],
    },
    workflow: {
      eyebrow: 'El modelo de Kumplio',
      title: 'Kumplio hace el análisis; tu empresa mantiene la decisión.',
      description: 'Tres etapas convierten información dispersa en trabajo concreto, conservando las dudas y decisiones que requieren revisión humana.',
      stages: [
        { title: 'Analiza', description: 'Ordena datos, tratamientos, sistemas, proveedores y obligaciones aplicables.' },
        { title: 'Resuelve', description: 'Convierte cada brecha en una acción priorizada con responsable y evidencia requerida.' },
        { title: 'Revisa', description: 'Señala contradicciones, información faltante y decisiones que una persona debe validar.' },
      ],
    },
    specialists: {
      eyebrow: 'Tu equipo digital',
      title: 'Un equipo coordinado de especialistas. Una sola ruta de trabajo.',
      description: 'Tres especialistas principales trabajan con capacidades transversales sin obligarte a coordinar agentes ni repartir el contexto manualmente.',
      people: [
        { name: 'Isidora', label: 'Entiende', description: 'Identifica obligaciones y encuentra las fuentes que respaldan el análisis.' },
        { name: 'Verónica', label: 'Comprueba', description: 'Revisa controles y qué evidencia falta para sostenerlos.' },
        { name: 'Julieta', label: 'Revisa', description: 'Detecta contradicciones, reservas y decisiones que requieren criterio humano.' },
      ],
      capabilities: ['Datos y privacidad', 'Cumplimiento laboral', 'Contratos y terceros', 'Operación sectorial'],
      note: 'Kumplio coordina especialistas y capacidades sobre el mismo caso. La decisión final permanece bajo control humano.',
    },
    scenarios: {
      eyebrow: 'Una plataforma, distintas realidades',
      title: 'Cumplimiento transversal, diseñado para la operación chilena.',
      items: [
        { title: 'Protección de datos', description: 'La puerta de entrada: inventario, brechas y plan de preparación frente a la Ley 21.719.' },
        { title: 'Minería', description: 'Contratistas, personas, controles y evidencia conectados con una operación exigente y distribuida.' },
        { title: 'Transporte', description: 'Documentos, proveedores, flota y obligaciones coordinados sin perder trazabilidad. Laboral atraviesa ambas verticales.' },
      ],
    },
    security: {
      eyebrow: 'Seguridad y evidencia',
      title: 'Centralizar sirve solo si el contexto permanece controlado.',
      description: 'Kumplio está diseñado para que cada organización trabaje con su propio contexto, con decisiones trazables y revisión humana en los puntos sensibles.',
      points: [
        { title: 'Contexto separado', description: 'La información privada de una organización se mantiene aislada de las demás.' },
        { title: 'Decisiones trazables', description: 'Puedes relacionar qué se decidió, qué cambió y qué evidencia fue revisada.' },
        { title: 'Revisión humana', description: 'Kumplio prepara y organiza el trabajo; no reemplaza a la persona responsable de decidir.' },
      ],
      note: 'La evidencia ayuda a respaldar el trabajo realizado. No equivale por sí sola a certificación ni a una declaración automática de cumplimiento total.',
    },
    cta: {
      eyebrow: 'Empieza ahora',
      title: 'Cuéntanos qué datos usa tu empresa. Kumplio te mostrará por dónde empezar.',
      description: 'Describe tu situación en palabras simples. Recibirás una ruta para ordenar la información, detectar brechas y convertirlas en acciones verificables.',
      action: 'Revisar mi empresa',
    },
  },
  en: {
    nav: { product: 'Product', how: 'How it works', forWho: 'Who it is for', resources: 'Resources', pricing: 'Pricing', signIn: 'Sign in', try: 'Try Kumplio', switchLanguage: 'Español' },
    hero: {
      eyebrow: 'Data protection for Chile',
      title: 'Find out what personal data your company uses and what needs fixing.',
      description: 'Kumplio organizes processing activities, identifies gaps against Chilean Law 21.719 and creates a plan with tasks, owners, deadlines and closure evidence.',
      primary: 'Review my company',
      secondary: 'See how it works',
      proofs: ['Data and vendor inventory', 'Prioritized gaps and tasks', 'Owners, deadlines and evidence'], 
    },
    journey: {
      eyebrow: 'From scattered information to an executable plan',
      title: 'From complexity to a decision your team can execute.',
      steps: [
        { title: 'Gather', description: 'Bring documents, data, vendors and operating context into one place.' },
        { title: 'Analyze', description: 'Connect reality to applicable obligations while keeping unknowns visible.' },
        { title: 'Decide', description: 'Turn each gap into a prioritized action with an owner and deadline.' },
        { title: 'Demonstrate', description: 'Preserve evidence, human review and the history of every correction.' },
      ],
    },
    example: {
      eyebrow: 'A concrete example',
      title: 'This is what a company gets from Kumplio.',
      quote: 'We hold customer, employee and applicant data across several systems, but nobody knows exactly where it is or what needs fixing.',
      outcomes: [
        { title: 'A map of its data', description: 'What data is used, why, where it lives, who owns it and which vendors are involved.' },
        { title: 'An actionable diagnosis', description: 'What needs attention, what information is missing and which gaps matter most under Chilean Law 21.719.' },
        { title: 'A plan that can be closed', description: 'Tasks, owners, deadlines, required documents and evidence for every correction.' },
      ],
    },
    workflow: {
      eyebrow: 'The Kumplio model',
      title: 'Kumplio performs the analysis; your company keeps control of the decision.',
      description: 'Three stages turn scattered information into concrete work while preserving uncertainties and decisions that require human review.',
      stages: [
        { title: 'Analyze', description: 'Organize data, processing activities, systems, vendors and applicable obligations.' },
        { title: 'Resolve', description: 'Turn each gap into a prioritized action with an owner and required evidence.' },
        { title: 'Review', description: 'Flag contradictions, missing information and decisions that a person must validate.' },
      ],
    },
    specialists: {
      eyebrow: 'Your digital team',
      title: 'A coordinated team of specialists. One work path.',
      description: 'Three core specialists work with cross-cutting capabilities without making you coordinate agents or distribute context manually.',
      people: [
        { name: 'Isidora', label: 'Understands', description: 'Identifies obligations and finds the sources that support the analysis.' },
        { name: 'Verónica', label: 'Verifies', description: 'Reviews controls and the evidence still needed to support them.' },
        { name: 'Julieta', label: 'Reviews', description: 'Finds contradictions, reservations and decisions that require human judgment.' },
      ],
      capabilities: ['Data and privacy', 'Labor compliance', 'Contracts and third parties', 'Sector operations'],
      note: 'Kumplio coordinates specialists and capabilities on the same case. The final decision remains under human control.',
    },
    scenarios: {
      eyebrow: 'One platform, different realities',
      title: 'Cross-cutting compliance, designed for Chilean operations.',
      items: [
        { title: 'Data protection', description: 'The entry point: inventory, gaps and a preparation plan for Chilean Law 21.719.' },
        { title: 'Mining', description: 'Contractors, people, controls and evidence connected to a demanding, distributed operation.' },
        { title: 'Transport', description: 'Documents, vendors, fleet and obligations coordinated without losing traceability. Labor cuts across both verticals.' },
      ],
    },
    security: {
      eyebrow: 'Security and evidence',
      title: 'Centralization only helps if context remains controlled.',
      description: 'Kumplio is designed so each organization works with its own context, with traceable decisions and human review at sensitive points.',
      points: [
        { title: 'Separated context', description: 'One organization’s private information remains isolated from every other organization.' },
        { title: 'Traceable decisions', description: 'You can connect what was decided, what changed and which evidence was reviewed.' },
        { title: 'Human review', description: 'Kumplio prepares and organizes the work; it does not replace the person responsible for the decision.' },
      ],
      note: 'Evidence helps support the work performed. It does not by itself equal certification or an automatic declaration of total compliance.',
    },
    cta: {
      eyebrow: 'Start now',
      title: 'Tell us what data your company uses. Kumplio will show you where to begin.',
      description: 'Describe your situation in plain language. Get a path to organize information, identify gaps and turn them into verifiable actions.',
      action: 'Review my company',
    },
  },
}
