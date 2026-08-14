import type { PublicLocale } from '@/lib/i18n/public-routing'

type CardCopy = { title: string; description: string }
type ScenarioCopy = { label: string; title: string; examples: string[] }

type HomePublicCopy = {
  nav: {
    dataProtection: string
    guide: string
    specialists: string
    security: string
    plans: string
    signIn: string
    resolve: string
    switchLanguage: string
  }
  hero: {
    eyebrow: string
    title: string
    description: string
    proofs: string[]
    note: string
  }
  protection: {
    eyebrow: string
    title: string
    description: string
    scatteredLabel: string
    scatteredProblem: string
    scatteredSolution: string
    reactiveLabel: string
    reactiveProblem: string
    reactiveSolution: string
    pillars: CardCopy[]
  }
  solution: {
    eyebrow: string
    title: string
    description: string
    layers: CardCopy[]
  }
  guide: {
    eyebrow: string
    title: string
    description: string
    steps: CardCopy[]
  }
  specialists: {
    eyebrow: string
    title: string
    description: string
    specialistLabel: string
    deliverableLabel: string
    note: string
  }
  scenarios: {
    eyebrow: string
    title: string
    items: ScenarioCopy[]
  }
  security: {
    eyebrow: string
    title: string
    description: string
    note: string
    cards: CardCopy[]
  }
  cta: {
    eyebrow: string
    title: string
    description: string
    action: string
  }
}

export const HOME_PUBLIC_COPY: Record<PublicLocale, HomePublicCopy> = {
  es: {
    nav: {
      dataProtection: 'Protección de datos',
      guide: 'Cómo te guía',
      specialists: 'Especialistas',
      security: 'Seguridad',
      plans: 'Planes',
      signIn: 'Ingresar',
      resolve: 'Resolver mi caso',
      switchLanguage: 'English',
    },
    hero: {
      eyebrow: 'Protección de datos + guía experta para resolver',
      title: 'Protege tus datos. Entiende qué hacer. Avanza con una guía clara.',
      description:
        'Kumplio centraliza la información que hoy está repartida, identifica obligaciones y riesgos, coordina especialistas digitales y convierte cada situación en una ruta concreta de solución con evidencia y revisión humana.',
      proofs: ['Centraliza información sensible', 'Recibe una guía experta', 'Cierra con evidencia'],
      note: 'Diseñado para organizaciones que necesitan prepararse para la Ley 21.719 y resolver situaciones reales de privacidad, seguridad de la información y cumplimiento sin perder contexto.',
    },
    protection: {
      eyebrow: 'Primero: protege y ordena',
      title: 'No puedes proteger información que no sabes dónde está ni cómo se usa.',
      description:
        'La protección de datos empieza antes del checklist: necesitas saber qué información tienes, para qué se usa, quién accede, qué terceros participan, qué evidencia existe y qué decisiones ya se tomaron.',
      scatteredLabel: 'Información dispersa',
      scatteredProblem: 'Correos, carpetas, planillas, contratos y decisiones pierden relación entre sí.',
      scatteredSolution: 'Un expediente conecta datos, obligaciones, responsables, controles, evidencia y decisiones.',
      reactiveLabel: 'Cumplimiento reactivo',
      reactiveProblem: 'Descubres la brecha cuando llega una auditoría, solicitud o incidente.',
      reactiveSolution: 'Ordena primero, detecta lo pendiente y transforma cada brecha en trabajo gestionable.',
      pillars: [
        {
          title: 'Sabe qué información tienes',
          description: 'Reúne documentos, tratamientos, proveedores, controles, evidencias y decisiones para dejar de reconstruir el contexto cada vez.',
        },
        {
          title: 'Entiende qué debes proteger',
          description: 'Relaciona datos, obligaciones, riesgos y responsables para distinguir lo crítico de lo que puede esperar.',
        },
        {
          title: 'Gestiona con acceso controlado',
          description: 'Centraliza sin mezclar contextos: la información privada se organiza por organización, con trazabilidad y revisión.',
        },
      ],
    },
    solution: {
      eyebrow: 'Después: convierte contexto en solución',
      title: 'No necesitas otro diagnóstico. Necesitas saber qué hacer después.',
      description:
        'Kumplio no se queda en señalar una obligación o una brecha. La guía conecta el problema con una siguiente acción, un responsable, evidencia esperada y una condición concreta de cierre.',
      layers: [
        { title: 'Mapa claro', description: 'Qué información existe, dónde está, quién la usa, qué falta y qué necesita revisión.' },
        { title: 'Riesgos priorizados', description: 'Qué puede generar exposición, qué requiere atención inmediata y qué depende de más antecedentes.' },
        { title: 'Plan de solución', description: 'Pasos concretos, responsables sugeridos, dependencias y criterios de cierre para avanzar sin improvisar.' },
        { title: 'Respaldo verificable', description: 'Fuentes, evidencia, revisiones y decisiones quedan relacionadas con el expediente para demostrar cómo se llegó al resultado.' },
      ],
    },
    guide: {
      eyebrow: 'Guía experta, paso a paso',
      title: 'De información desordenada a una decisión respaldada.',
      description:
        'Cada etapa reduce incertidumbre. Kumplio organiza el contexto, activa las capacidades necesarias, muestra qué falta y conserva la revisión antes de que una conclusión sensible avance.',
      steps: [
        { title: 'Centraliza', description: 'Reúne en un expediente la información necesaria para entender la situación completa.' },
        { title: 'Entiende', description: 'Kumplio relaciona antecedentes, obligaciones y contexto para identificar qué realmente importa.' },
        { title: 'Prioriza', description: 'Los especialistas separan urgencias, brechas, riesgos y preguntas abiertas antes de proponer acciones.' },
        { title: 'Resuelve', description: 'Recibes una ruta concreta con acciones, responsables sugeridos y criterios claros de término.' },
        { title: 'Verifica', description: 'Cada conclusión relevante se contrasta con fuentes, evidencia y revisión humana antes del cierre.' },
        { title: 'Mantén control', description: 'El expediente conserva qué cambió, quién intervino y qué decisión quedó tomada.' },
      ],
    },
    specialists: {
      eyebrow: 'Especialistas digitales coordinados',
      title: 'Una guía experta funciona mejor cuando cada especialista sabe exactamente qué debe resolver.',
      description:
        'Kumplio no usa una IA genérica para todo. Cada agente tiene una responsabilidad, trabaja sobre contexto autorizado y entrega resultados concretos que pueden revisarse antes de tomar una decisión.',
      specialistLabel: 'Especialista',
      deliverableLabel: 'Entrega',
      note: 'No todos intervienen en todos los casos. Kumplio activa las capacidades necesarias, conserva qué agente trabajó, qué produjo y qué revisión recibió, y mantiene la decisión final bajo control humano.',
    },
    scenarios: {
      eyebrow: 'Problemas reales de privacidad',
      title: 'Empieza por la situación que necesitas resolver, no por aprender un módulo.',
      items: [
        {
          label: 'Nueva Ley 21.719',
          title: 'Ordena lo que debes implementar antes de convertirlo en otro proyecto inmanejable.',
          examples: ['Inventario de tratamientos', 'Bases, finalidades y responsables', 'Brechas, controles y evidencia'],
        },
        {
          label: 'Información y terceros',
          title: 'Entiende dónde están tus datos y qué riesgos aparecen cuando participan proveedores o encargados.',
          examples: ['Contratos y proveedores', 'Accesos y responsables', 'Transferencias y evidencia disponible'],
        },
        {
          label: 'Casos concretos',
          title: 'Transforma una duda, solicitud o incidente en una ruta guiada para responder con contexto.',
          examples: ['Solicitud de un titular', 'Incidente o posible brecha', 'Auditoría o requerimiento de un cliente'],
        },
      ],
    },
    security: {
      eyebrow: 'Seguridad de la información',
      title: 'La protección de datos también exige proteger el contexto con el que trabajas.',
      description:
        'Centralizar solo sirve si la información permanece controlada. Kumplio está diseñado para separar el contexto privado de cada organización, limitar el acceso y conservar trazabilidad sobre ejecuciones, resultados, revisiones y decisiones.',
      note: 'El objetivo no es acumular más información: es reunir únicamente la necesaria para gestionar mejor, con contexto, responsabilidad y evidencia.',
      cards: [
        { title: 'Aislamiento por organización', description: 'El contexto privado de una organización se mantiene separado del de las demás.' },
        { title: 'Trazabilidad de decisiones', description: 'El expediente conserva qué se hizo, qué cambió, qué evidencia se revisó y quién decidió.' },
        { title: 'Revisión humana', description: 'Los especialistas digitales preparan el trabajo; las decisiones sensibles mantienen validación humana.' },
      ],
    },
    cta: {
      eyebrow: 'Protección de datos sin empezar desde cero',
      title: 'Cuéntanos qué necesitas proteger o resolver.',
      description: 'Kumplio centraliza los antecedentes, organiza el trabajo de los especialistas y te guía hasta una decisión respaldada por contexto, evidencia y revisión.',
      action: 'Empezar un caso',
    },
  },
  en: {
    nav: {
      dataProtection: 'Data protection',
      guide: 'How it guides you',
      specialists: 'Specialists',
      security: 'Security',
      plans: 'Plans',
      signIn: 'Sign in',
      resolve: 'Resolve my case',
      switchLanguage: 'Español',
    },
    hero: {
      eyebrow: 'Data protection + expert guidance to resolve real situations',
      title: 'Protect your data. Understand what to do. Move forward with a clear path.',
      description:
        'Kumplio centralizes scattered information, identifies obligations and risks, coordinates digital specialists and turns each situation into a concrete resolution path supported by evidence and human review.',
      proofs: ['Centralize sensitive information', 'Get expert guidance', 'Close with evidence'],
      note: 'Built for organizations that need to prepare for Chilean Law 21.719 and resolve real privacy, information-security and compliance situations without losing context.',
    },
    protection: {
      eyebrow: 'First: protect and organize',
      title: 'You cannot protect information if you do not know where it is or how it is used.',
      description:
        'Data protection starts before the checklist: you need to know what information you hold, why it is used, who can access it, which third parties are involved, what evidence exists and which decisions have already been made.',
      scatteredLabel: 'Scattered information',
      scatteredProblem: 'Emails, folders, spreadsheets, contracts and decisions lose their relationship with one another.',
      scatteredSolution: 'One case file connects data, obligations, owners, controls, evidence and decisions.',
      reactiveLabel: 'Reactive compliance',
      reactiveProblem: 'You discover the gap only when an audit, request or incident arrives.',
      reactiveSolution: 'Organize first, identify what is missing and turn each gap into manageable work.',
      pillars: [
        {
          title: 'Know what information you have',
          description: 'Bring documents, processing activities, vendors, controls, evidence and decisions together so you stop rebuilding context every time.',
        },
        {
          title: 'Understand what you need to protect',
          description: 'Connect data, obligations, risks and owners so you can distinguish what is critical from what can wait.',
        },
        {
          title: 'Manage it with controlled access',
          description: 'Centralize without mixing contexts: private information remains organized by organization, with traceability and review.',
        },
      ],
    },
    solution: {
      eyebrow: 'Then: turn context into resolution',
      title: 'You do not need another diagnosis. You need to know what happens next.',
      description:
        'Kumplio does not stop at pointing out an obligation or a gap. The guidance connects the issue to a next action, an owner, expected evidence and a concrete closure condition.',
      layers: [
        { title: 'Clear map', description: 'What information exists, where it is, who uses it, what is missing and what still needs review.' },
        { title: 'Prioritized risks', description: 'What can create exposure, what needs immediate attention and what depends on additional context.' },
        { title: 'Resolution plan', description: 'Concrete steps, suggested owners, dependencies and closure criteria so teams can move forward without improvising.' },
        { title: 'Verifiable support', description: 'Sources, evidence, reviews and decisions stay connected to the case file so the path to the result remains traceable.' },
      ],
    },
    guide: {
      eyebrow: 'Expert guidance, step by step',
      title: 'From disorganized information to a supported decision.',
      description:
        'Each stage reduces uncertainty. Kumplio organizes context, activates the capabilities that are needed, shows what is missing and preserves review before a sensitive conclusion moves forward.',
      steps: [
        { title: 'Centralize', description: 'Bring the information needed to understand the full situation into one case file.' },
        { title: 'Understand', description: 'Kumplio connects background, obligations and context to identify what actually matters.' },
        { title: 'Prioritize', description: 'Specialists separate urgency, gaps, risks and open questions before proposing actions.' },
        { title: 'Resolve', description: 'Receive a concrete path with actions, suggested owners and clear completion criteria.' },
        { title: 'Verify', description: 'Relevant conclusions are checked against sources, evidence and human review before closure.' },
        { title: 'Stay in control', description: 'The case file preserves what changed, who intervened and which decision was made.' },
      ],
    },
    specialists: {
      eyebrow: 'Coordinated digital specialists',
      title: 'Expert guidance works better when each specialist knows exactly what they are responsible for.',
      description:
        'Kumplio does not use one generic AI for everything. Each specialist has a defined responsibility, works only with authorized context and produces concrete outputs that can be reviewed before a decision is made.',
      specialistLabel: 'Specialist',
      deliverableLabel: 'Delivers',
      note: 'Not every specialist is involved in every case. Kumplio activates the capabilities that are needed, preserves who worked, what they produced and what review they received, and keeps the final decision under human control.',
    },
    scenarios: {
      eyebrow: 'Real privacy problems',
      title: 'Start with the situation you need to resolve, not with learning another software module.',
      items: [
        {
          label: 'Chilean Law 21.719',
          title: 'Organize what you need to implement before it becomes another unmanageable project.',
          examples: ['Processing activity inventory', 'Legal bases, purposes and owners', 'Gaps, controls and evidence'],
        },
        {
          label: 'Information and third parties',
          title: 'Understand where your data is and which risks appear when vendors or processors are involved.',
          examples: ['Contracts and vendors', 'Access and owners', 'Transfers and available evidence'],
        },
        {
          label: 'Concrete situations',
          title: 'Turn a question, request or incident into a guided path that preserves the relevant context.',
          examples: ['Data-subject request', 'Incident or possible breach', 'Audit or customer requirement'],
        },
      ],
    },
    security: {
      eyebrow: 'Information security',
      title: 'Protecting data also means protecting the context you use to work with it.',
      description:
        'Centralization only helps if the information remains controlled. Kumplio is designed to keep each organization’s private context separate, limit access and preserve traceability across executions, outputs, reviews and decisions.',
      note: 'The goal is not to collect more information. It is to bring together only what is necessary to manage the situation better, with context, accountability and evidence.',
      cards: [
        { title: 'Organization isolation', description: 'One organization’s private context remains separated from every other organization.' },
        { title: 'Decision traceability', description: 'The case file preserves what was done, what changed, which evidence was reviewed and who made the decision.' },
        { title: 'Human review', description: 'Digital specialists prepare the work; sensitive decisions continue to require human validation.' },
      ],
    },
    cta: {
      eyebrow: 'Data protection without starting from scratch',
      title: 'Tell us what you need to protect or resolve.',
      description: 'Kumplio centralizes the background, organizes specialist work and guides you toward a decision supported by context, evidence and review.',
      action: 'Start a case',
    },
  },
}
