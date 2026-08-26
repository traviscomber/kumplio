import type { PublicLocale } from '@/lib/i18n/public-routing'

type CardCopy = { title: string; description: string }
type ScenarioCopy = { label: string; title: string; examples: string[] }

type HomePublicCopy = {
  nav: { dataProtection: string; guide: string; specialists: string; security: string; plans: string; signIn: string; resolve: string; switchLanguage: string }
  hero: { eyebrow: string; title: string; description: string; proofs: string[]; note: string }
  protection: { eyebrow: string; title: string; description: string; scatteredLabel: string; scatteredProblem: string; scatteredSolution: string; reactiveLabel: string; reactiveProblem: string; reactiveSolution: string; pillars: CardCopy[] }
  solution: { eyebrow: string; title: string; description: string; layers: CardCopy[] }
  guide: { eyebrow: string; title: string; description: string; steps: CardCopy[] }
  specialists: { eyebrow: string; title: string; description: string; specialistLabel: string; deliverableLabel: string; note: string }
  scenarios: { eyebrow: string; title: string; items: ScenarioCopy[] }
  security: { eyebrow: string; title: string; description: string; note: string; cards: CardCopy[] }
  cta: { eyebrow: string; title: string; description: string; action: string }
}

export const HOME_PUBLIC_COPY: Record<PublicLocale, HomePublicCopy> = {
  es: {
    nav: { dataProtection: 'Protección de datos', guide: 'Cómo te guía', specialists: 'Cómo trabaja', security: 'Seguridad', plans: 'Planes', signIn: 'Ingresar', resolve: 'Resolver mi caso', switchLanguage: 'English' },
    hero: {
      eyebrow: 'Protección de datos + guía experta para resolver',
      title: 'Protege tus datos. Entiende qué hacer. Avanza con una guía clara.',
      description: 'Kumplio centraliza la información que hoy está repartida, entiende tu situación y la convierte en una ruta concreta de solución con evidencia y revisión humana.',
      proofs: ['Centraliza información sensible', 'Recibe una guía experta', 'Cierra con evidencia'],
      note: 'Diseñado para organizaciones que necesitan prepararse para la Ley 21.719 y resolver situaciones reales de privacidad, seguridad de la información y cumplimiento sin perder contexto.',
    },
    protection: {
      eyebrow: 'Primero: protege y ordena', title: 'No puedes proteger información que no sabes dónde está ni cómo se usa.',
      description: 'La protección de datos empieza antes del checklist: necesitas saber qué información tienes, para qué se usa, quién accede, qué terceros participan, qué evidencia existe y qué decisiones ya se tomaron.',
      scatteredLabel: 'Información dispersa', scatteredProblem: 'Correos, carpetas, planillas, contratos y decisiones pierden relación entre sí.', scatteredSolution: 'Un expediente conecta datos, obligaciones, responsables, controles, evidencia y decisiones.',
      reactiveLabel: 'Cumplimiento reactivo', reactiveProblem: 'Descubres la brecha cuando llega una auditoría, solicitud o incidente.', reactiveSolution: 'Ordena primero, detecta lo pendiente y transforma cada brecha en trabajo gestionable.',
      pillars: [
        { title: 'Sabe qué información tienes', description: 'Reúne documentos, tratamientos, proveedores, controles, evidencias y decisiones para dejar de reconstruir el contexto cada vez.' },
        { title: 'Entiende qué debes proteger', description: 'Relaciona datos, obligaciones, riesgos y responsables para distinguir lo crítico de lo que puede esperar.' },
        { title: 'Gestiona con acceso controlado', description: 'Centraliza sin mezclar contextos: la información privada se organiza por organización, con trazabilidad y revisión.' },
      ],
    },
    solution: {
      eyebrow: 'Después: convierte contexto en solución', title: 'No necesitas otro diagnóstico. Necesitas saber qué hacer después.',
      description: 'Kumplio conecta el problema con una siguiente acción, un responsable, evidencia esperada y una condición concreta de cierre.',
      layers: [
        { title: 'Contexto claro', description: 'Qué información existe, qué falta y qué necesita revisión.' },
        { title: 'Análisis útil', description: 'Qué obligaciones y riesgos importan para la situación concreta.' },
        { title: 'Resolución', description: 'Acciones, controles, responsables sugeridos y criterios de cierre para avanzar.' },
        { title: 'Evidencia y revisión', description: 'Fuentes, evidencia, revisiones y decisiones quedan relacionadas con el expediente.' },
      ],
    },
    guide: {
      eyebrow: 'Guía experta, paso a paso', title: 'De una situación concreta a una decisión respaldada.',
      description: 'Un flujo simple organiza el contexto, prepara una resolución y mantiene revisión independiente antes del cierre.',
      steps: [
        { title: 'Describe', description: 'Cuéntanos la situación y reúne en un expediente los antecedentes necesarios.' },
        { title: 'Analiza', description: 'Kumplio relaciona contexto, fuentes y obligaciones para identificar qué importa.' },
        { title: 'Resuelve', description: 'Convierte brechas y preguntas abiertas en controles, evidencia y acciones concretas.' },
        { title: 'Revisa', description: 'Contrasta conclusiones y reservas antes de respaldar la decisión con evidencia y cierre.' },
      ],
    },
    specialists: {
      eyebrow: 'Tres capacidades principales', title: 'Analiza. Resuelve. Revisa.',
      description: 'El flujo principal mantiene responsabilidades claras para reducir traspasos innecesarios y conservar una revisión independiente.',
      specialistLabel: 'Capacidad', deliverableLabel: 'Entrega',
      note: 'Cuando el caso lo requiere, Kumplio puede activar especialistas adicionales para riesgo cuantitativo, cambio regulatorio, planificación detallada o análisis histórico. La decisión final permanece bajo control humano.',
    },
    scenarios: {
      eyebrow: 'Problemas reales de privacidad', title: 'Empieza por la situación que necesitas resolver, no por aprender un módulo.',
      items: [
        { label: 'Nueva Ley 21.719', title: 'Ordena lo que debes implementar antes de convertirlo en otro proyecto inmanejable.', examples: ['Inventario de tratamientos', 'Bases, finalidades y responsables', 'Brechas, controles y evidencia'] },
        { label: 'Información y terceros', title: 'Entiende dónde están tus datos y qué riesgos aparecen cuando participan proveedores o encargados.', examples: ['Contratos y proveedores', 'Accesos y responsables', 'Transferencias y evidencia disponible'] },
        { label: 'Casos concretos', title: 'Transforma una duda, solicitud o incidente en una ruta guiada para responder con contexto.', examples: ['Solicitud de un titular', 'Incidente o posible brecha', 'Auditoría o requerimiento de un cliente'] },
      ],
    },
    security: {
      eyebrow: 'Seguridad de la información', title: 'La protección de datos también exige proteger el contexto con el que trabajas.',
      description: 'Centralizar solo sirve si la información permanece controlada. Kumplio está diseñado para separar el contexto privado de cada organización, limitar el acceso y conservar trazabilidad sobre resultados, revisiones y decisiones.',
      note: 'El objetivo no es acumular más información: es reunir únicamente la necesaria para gestionar mejor, con contexto, responsabilidad y evidencia.',
      cards: [
        { title: 'Aislamiento por organización', description: 'El contexto privado de una organización se mantiene separado del de las demás.' },
        { title: 'Trazabilidad de decisiones', description: 'El expediente conserva qué se hizo, qué cambió, qué evidencia se revisó y quién decidió.' },
        { title: 'Revisión humana', description: 'Kumplio prepara el trabajo; las decisiones sensibles mantienen validación humana.' },
      ],
    },
    cta: { eyebrow: 'Protección de datos sin empezar desde cero', title: 'Cuéntanos qué necesitas proteger o resolver.', description: 'Kumplio centraliza los antecedentes y te guía desde el análisis hasta una decisión respaldada por contexto, evidencia y revisión.', action: 'Empezar un caso' },
  },
  en: {
    nav: { dataProtection: 'Data protection', guide: 'How it guides you', specialists: 'How it works', security: 'Security', plans: 'Plans', signIn: 'Sign in', resolve: 'Resolve my case', switchLanguage: 'Español' },
    hero: {
      eyebrow: 'Data protection + expert guidance to resolve real situations', title: 'Protect your data. Understand what to do. Move forward with a clear path.',
      description: 'Kumplio centralizes scattered information, understands your situation and turns it into a concrete resolution path supported by evidence and human review.',
      proofs: ['Centralize sensitive information', 'Get expert guidance', 'Close with evidence'],
      note: 'Built for organizations that need to prepare for Chilean Law 21.719 and resolve real privacy, information-security and compliance situations without losing context.',
    },
    protection: {
      eyebrow: 'First: protect and organize', title: 'You cannot protect information if you do not know where it is or how it is used.',
      description: 'Data protection starts before the checklist: you need to know what information you hold, why it is used, who can access it, which third parties are involved, what evidence exists and which decisions have already been made.',
      scatteredLabel: 'Scattered information', scatteredProblem: 'Emails, folders, spreadsheets, contracts and decisions lose their relationship with one another.', scatteredSolution: 'One case file connects data, obligations, owners, controls, evidence and decisions.',
      reactiveLabel: 'Reactive compliance', reactiveProblem: 'You discover the gap only when an audit, request or incident arrives.', reactiveSolution: 'Organize first, identify what is missing and turn each gap into manageable work.',
      pillars: [
        { title: 'Know what information you have', description: 'Bring documents, processing activities, vendors, controls, evidence and decisions together so you stop rebuilding context every time.' },
        { title: 'Understand what you need to protect', description: 'Connect data, obligations, risks and owners so you can distinguish what is critical from what can wait.' },
        { title: 'Manage it with controlled access', description: 'Centralize without mixing contexts: private information remains organized by organization, with traceability and review.' },
      ],
    },
    solution: {
      eyebrow: 'Then: turn context into resolution', title: 'You do not need another diagnosis. You need to know what happens next.',
      description: 'Kumplio connects the issue to a next action, an owner, expected evidence and a concrete closure condition.',
      layers: [
        { title: 'Clear context', description: 'What information exists, what is missing and what still needs review.' },
        { title: 'Useful analysis', description: 'Which obligations and risks matter for the concrete situation.' },
        { title: 'Resolution', description: 'Actions, controls, suggested owners and closure criteria to move forward.' },
        { title: 'Evidence and review', description: 'Sources, evidence, reviews and decisions stay connected to the case file.' },
      ],
    },
    guide: {
      eyebrow: 'Expert guidance, step by step', title: 'From a concrete situation to a supported decision.',
      description: 'A simple flow organizes context, prepares a resolution and preserves independent review before closure.',
      steps: [
        { title: 'Describe', description: 'Tell us the situation and bring the necessary background into one case file.' },
        { title: 'Analyze', description: 'Kumplio connects context, sources and obligations to identify what matters.' },
        { title: 'Resolve', description: 'Turn gaps and open questions into controls, evidence and concrete actions.' },
        { title: 'Review', description: 'Challenge conclusions and reservations before supporting the decision with evidence and closure.' },
      ],
    },
    specialists: {
      eyebrow: 'Three core capabilities', title: 'Analyze. Resolve. Review.',
      description: 'The core flow keeps responsibilities clear, reduces unnecessary handoffs and preserves independent review.',
      specialistLabel: 'Capability', deliverableLabel: 'Delivers',
      note: 'When a case requires it, Kumplio can activate additional specialists for quantitative risk, regulatory change, detailed planning or historical analysis. The final decision remains under human control.',
    },
    scenarios: {
      eyebrow: 'Real privacy problems', title: 'Start with the situation you need to resolve, not with learning another software module.',
      items: [
        { label: 'Chilean Law 21.719', title: 'Organize what you need to implement before it becomes another unmanageable project.', examples: ['Processing activity inventory', 'Legal bases, purposes and owners', 'Gaps, controls and evidence'] },
        { label: 'Information and third parties', title: 'Understand where your data is and which risks appear when vendors or processors are involved.', examples: ['Contracts and vendors', 'Access and owners', 'Transfers and available evidence'] },
        { label: 'Concrete situations', title: 'Turn a question, request or incident into a guided path that preserves the relevant context.', examples: ['Data-subject request', 'Incident or possible breach', 'Audit or customer requirement'] },
      ],
    },
    security: {
      eyebrow: 'Information security', title: 'Protecting data also means protecting the context you use to work with it.',
      description: 'Centralization only helps if the information remains controlled. Kumplio is designed to keep each organization’s private context separate, limit access and preserve traceability across outputs, reviews and decisions.',
      note: 'The goal is not to collect more information. It is to bring together only what is necessary to manage the situation better, with context, accountability and evidence.',
      cards: [
        { title: 'Organization isolation', description: 'One organization’s private context remains separated from every other organization.' },
        { title: 'Decision traceability', description: 'The case file preserves what was done, what changed, which evidence was reviewed and who made the decision.' },
        { title: 'Human review', description: 'Kumplio prepares the work; sensitive decisions continue to require human validation.' },
      ],
    },
    cta: { eyebrow: 'Data protection without starting from scratch', title: 'Tell us what you need to protect or resolve.', description: 'Kumplio centralizes the background and guides you from analysis to a decision supported by context, evidence and review.', action: 'Start a case' },
  },
}
