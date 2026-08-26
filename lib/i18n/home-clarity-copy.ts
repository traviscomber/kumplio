import type { PublicLocale } from '@/lib/i18n/public-routing'

type Step = { title: string; description: string }
type Scenario = { title: string; description: string }

type HomeClarityCopy = {
  nav: { product: string; how: string; forWho: string; resources: string; pricing: string; signIn: string; try: string; switchLanguage: string }
  hero: { eyebrow: string; title: string; description: string; primary: string; secondary: string; proofs: string[] }
  journey: { eyebrow: string; title: string; steps: Step[] }
  example: { eyebrow: string; title: string; quote: string; outcomes: Step[] }
  workflow: { eyebrow: string; title: string; description: string; stages: Step[] }
  specialists: { eyebrow: string; title: string; description: string; people: Array<{ name: string; label: string; description: string }>; note: string }
  scenarios: { eyebrow: string; title: string; items: Scenario[] }
  security: { eyebrow: string; title: string; description: string; points: Step[]; note: string }
  cta: { eyebrow: string; title: string; description: string; action: string }
}

export const HOME_CLARITY_COPY: Record<PublicLocale, HomeClarityCopy> = {
  es: {
    nav: { product: 'Producto', how: 'Cómo funciona', forWho: 'Para quién', resources: 'Recursos', pricing: 'Precios', signIn: 'Ingresar', try: 'Probar Kumplio', switchLanguage: 'English' },
    hero: {
      eyebrow: 'Protección de datos para Chile',
      title: 'Protege los datos de tu empresa sin perderte en la regulación.',
      description: 'Cuéntale a Kumplio tu situación. Te ayuda a entender qué debes hacer, convertirlo en acciones y reunir la evidencia para demostrarlo.',
      primary: 'Analizar mi situación',
      secondary: 'Ver cómo funciona',
      proofs: ['Preparado para Ley 21.719', 'Evidencia y trazabilidad', 'Revisión humana en decisiones sensibles'],
    },
    journey: {
      eyebrow: 'Una ruta simple',
      title: 'Empieza por el problema. Kumplio te guía hasta el cierre.',
      steps: [
        { title: 'Cuéntanos qué está pasando', description: 'Describe la situación con tus propias palabras y reúne el contexto necesario.' },
        { title: 'Kumplio analiza', description: 'Relaciona antecedentes, fuentes y obligaciones para detectar qué importa.' },
        { title: 'Recibes un plan claro', description: 'Convierte las brechas en acciones priorizadas, responsables sugeridos y evidencia esperada.' },
        { title: 'Ejecutas las acciones', description: 'Avanza paso a paso sin perder el vínculo entre la decisión y lo que debe hacerse.' },
        { title: 'Dejas evidencia del cierre', description: 'Documenta lo realizado y conserva trazabilidad para revisar y demostrar el avance.' },
      ],
    },
    example: {
      eyebrow: 'Un caso concreto',
      title: 'Así transforma Kumplio una duda en trabajo gestionable.',
      quote: 'Mi empresa usa datos de clientes y no sé si estamos preparados para la Ley 21.719.',
      outcomes: [
        { title: 'Kumplio encuentra', description: 'Brechas, obligaciones, información faltante y evidencia disponible.' },
        { title: 'Kumplio te dice qué hacer', description: 'Acciones priorizadas, responsables sugeridos, plazos y documentos necesarios.' },
        { title: 'Tú mantienes el control', description: 'Las conclusiones sensibles se revisan antes de aceptarlas y quedan respaldadas por contexto y evidencia.' },
      ],
    },
    workflow: {
      eyebrow: 'El modelo de Kumplio',
      title: 'Analiza. Resuelve. Revisa.',
      description: 'Tres responsabilidades claras convierten contexto en una decisión respaldada sin esconder incertidumbre ni reemplazar el criterio humano.',
      stages: [
        { title: 'Analiza', description: 'Entiende contexto, fuentes y obligaciones para identificar qué requiere atención.' },
        { title: 'Resuelve', description: 'Transforma brechas en acciones, controles y evidencia esperada para avanzar.' },
        { title: 'Revisa', description: 'Contrasta conclusiones, detecta reservas y mantiene decisiones sensibles bajo control humano.' },
      ],
    },
    specialists: {
      eyebrow: 'Tu equipo digital',
      title: 'Tres especialistas principales, una sola ruta de trabajo.',
      description: 'No necesitas aprender qué agente usar. Kumplio organiza el trabajo y activa la capacidad adecuada según el momento del caso.',
      people: [
        { name: 'Isidora', label: 'Entiende', description: 'Identifica obligaciones y encuentra las fuentes que respaldan el análisis.' },
        { name: 'Verónica', label: 'Comprueba', description: 'Revisa controles y qué evidencia falta para sostenerlos.' },
        { name: 'Julieta', label: 'Revisa', description: 'Detecta contradicciones, reservas y decisiones que requieren criterio humano.' },
      ],
      note: 'Cuando el caso lo requiere, Kumplio puede activar especialistas adicionales. La decisión final permanece bajo control humano.',
    },
    scenarios: {
      eyebrow: 'Empieza por lo que necesitas resolver',
      title: 'No tienes que aprender un módulo antes de comenzar.',
      items: [
        { title: 'Prepararme para la Ley 21.719', description: 'Ordena tratamientos, bases, responsables, brechas, controles y evidencia para convertir la preparación en un plan ejecutable.' },
        { title: 'Ordenar proveedores y terceros', description: 'Entiende dónde participan terceros, qué información manejan y qué contratos, controles o evidencias necesitas revisar.' },
        { title: 'Resolver una solicitud, incidente o auditoría', description: 'Reúne contexto, define qué hacer y conserva evidencia de la respuesta y de las decisiones tomadas.' },
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
      title: 'Empieza por la situación que necesitas resolver.',
      description: 'No necesitas aprender Kumplio antes de usarlo. Describe el problema y deja que la plataforma te guíe desde el análisis hasta el cierre con evidencia.',
      action: 'Analizar mi situación',
    },
  },
  en: {
    nav: { product: 'Product', how: 'How it works', forWho: 'Who it is for', resources: 'Resources', pricing: 'Pricing', signIn: 'Sign in', try: 'Try Kumplio', switchLanguage: 'Español' },
    hero: {
      eyebrow: 'Data protection for Chile',
      title: 'Protect your company data without getting lost in regulation.',
      description: 'Tell Kumplio what is happening. It helps you understand what to do, turn it into actions and collect the evidence needed to support the work.',
      primary: 'Analyze my situation',
      secondary: 'See how it works',
      proofs: ['Built for Chilean Law 21.719', 'Evidence and traceability', 'Human review for sensitive decisions'],
    },
    journey: {
      eyebrow: 'A simple path',
      title: 'Start with the problem. Kumplio guides you through closure.',
      steps: [
        { title: 'Tell us what is happening', description: 'Describe the situation in your own words and bring together the necessary context.' },
        { title: 'Kumplio analyzes', description: 'Connects background, sources and obligations to identify what matters.' },
        { title: 'Get a clear plan', description: 'Turns gaps into prioritized actions, suggested owners and expected evidence.' },
        { title: 'Execute the actions', description: 'Move forward step by step without losing the link between decisions and work.' },
        { title: 'Leave evidence of closure', description: 'Document what was done and preserve traceability for review and proof of progress.' },
      ],
    },
    example: {
      eyebrow: 'A concrete example',
      title: 'See how Kumplio turns uncertainty into manageable work.',
      quote: 'My company uses customer data and I do not know whether we are prepared for Chilean Law 21.719.',
      outcomes: [
        { title: 'Kumplio finds', description: 'Gaps, obligations, missing information and available evidence.' },
        { title: 'Kumplio tells you what to do', description: 'Prioritized actions, suggested owners, deadlines and required documents.' },
        { title: 'You stay in control', description: 'Sensitive conclusions are reviewed before acceptance and remain linked to context and evidence.' },
      ],
    },
    workflow: {
      eyebrow: 'The Kumplio model',
      title: 'Analyze. Resolve. Review.',
      description: 'Three clear responsibilities turn context into a supported decision without hiding uncertainty or replacing human judgment.',
      stages: [
        { title: 'Analyze', description: 'Understand context, sources and obligations to identify what needs attention.' },
        { title: 'Resolve', description: 'Turn gaps into actions, controls and expected evidence so work can move forward.' },
        { title: 'Review', description: 'Challenge conclusions, identify reservations and keep sensitive decisions under human control.' },
      ],
    },
    specialists: {
      eyebrow: 'Your digital team',
      title: 'Three core specialists, one work path.',
      description: 'You do not need to learn which agent to use. Kumplio organizes the work and activates the right capability for each stage.',
      people: [
        { name: 'Isidora', label: 'Understands', description: 'Identifies obligations and finds the sources that support the analysis.' },
        { name: 'Verónica', label: 'Verifies', description: 'Reviews controls and the evidence still needed to support them.' },
        { name: 'Julieta', label: 'Reviews', description: 'Finds contradictions, reservations and decisions that require human judgment.' },
      ],
      note: 'When a case requires it, Kumplio can activate additional specialists. The final decision remains under human control.',
    },
    scenarios: {
      eyebrow: 'Start with what you need to solve',
      title: 'You do not have to learn a module before you begin.',
      items: [
        { title: 'Prepare for Chilean Law 21.719', description: 'Organize processing activities, legal bases, owners, gaps, controls and evidence into an executable plan.' },
        { title: 'Organize vendors and third parties', description: 'Understand where third parties are involved, what data they handle and which contracts, controls or evidence need review.' },
        { title: 'Handle a request, incident or audit', description: 'Bring together context, define what to do and preserve evidence of the response and decisions.' },
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
      title: 'Start with the situation you need to solve.',
      description: 'You do not need to learn Kumplio before using it. Describe the problem and let the platform guide you from analysis through evidence-backed closure.',
      action: 'Analyze my situation',
    },
  },
}
