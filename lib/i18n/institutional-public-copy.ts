import type { PublicLocale } from '@/lib/i18n/public-routing'

type Card = { title: string; description: string }

type AboutCopy = {
  metadata: { title: string; description: string; ogTitle: string; ogDescription: string }
  nav: { home: string; action: string; switchLanguage: string }
  hero: { eyebrow: string; title: string; description: string }
  problem: { eyebrow: string; title: string; description: string }
  approach: { eyebrow: string; title: string; description: string }
  principles: { eyebrow: string; title: string; items: Card[] }
  scope: { title: string; helps: Card; doesNotReplace: Card }
  cta: { title: string; description: string; action: string }
}

type ThinkingCopy = {
  metadata: { title: string; description: string; ogDescription: string }
  hero: { badge: string; title: string; description: string; start: string; how: string }
  simplify: { eyebrow: string; title: string; principles: Card[] }
  workflow: { eyebrow: string; title: string; description: string; steps: Card[] }
  responsibility: { eyebrow: string; title: string; description: string }
}

type PoweredCopy = {
  metadata: { title: string; description: string; ogDescription: string }
  nav: { about: string; switchLanguage: string }
  hero: { eyebrow: string; title: string; description: string; n3uralia: string; kumplio: string }
  responsibilities: { eyebrow: string; title: string; description: string; capabilities: Card[] }
  comparison: {
    kumplioTitle: string
    kumplioDescription: string
    kumplioItems: string[]
    kumplioAction: string
    n3uraliaTitle: string
    n3uraliaDescription: string
    n3uraliaItems: string[]
    n3uraliaAction: string
  }
  graph: { pageName: string; pageDescription: string; region: string }
}

export const ABOUT_PUBLIC_COPY: Record<PublicLocale, AboutCopy> = {
  es: {
    metadata: {
      title: 'Sobre KUMPLIO | Plataforma de cumplimiento continuo',
      description: 'Conoce el enfoque de KUMPLIO para convertir obligaciones regulatorias, contractuales y de política interna en controles, evidencia y acciones verificables.',
      ogTitle: 'Sobre KUMPLIO | Cumplimiento continuo',
      ogDescription: 'Una plataforma de n3uralia para estructurar obligaciones, controles, evidencia, hallazgos y planes de acción.',
    },
    nav: { home: 'Inicio', action: 'Evaluar cumplimiento', switchLanguage: 'English' },
    hero: {
      eyebrow: 'Sobre KUMPLIO',
      title: 'Cumplimiento continuo con evidencia y responsabilidad humana.',
      description: 'KUMPLIO es una plataforma desarrollada por n3uralia para estructurar obligaciones provenientes de regulaciones, contratos y políticas internas. El sistema ayuda a convertir esas obligaciones en controles, responsables, evidencia, hallazgos y planes de acción.',
    },
    problem: {
      eyebrow: 'Problema',
      title: 'La información regulatoria suele quedar separada de la operación.',
      description: 'Documentos, matrices, evidencias, responsables y acciones correctivas suelen administrarse en herramientas distintas. Esa fragmentación dificulta conocer qué obligación está cubierta, qué control debe revisarse y qué evidencia respalda una decisión.',
    },
    approach: {
      eyebrow: 'Enfoque',
      title: 'Una estructura común para gestionar distintos marcos.',
      description: 'KUMPLIO utiliza un ciclo consistente: mapear obligaciones, asignar controles, vincular evidencia, registrar hallazgos, corregir brechas y preparar revisiones. La Ley 21.719 es un caso prioritario en Chile, pero la plataforma no se limita a una sola regulación.',
    },
    principles: {
      eyebrow: 'Principios',
      title: 'Cómo debe operar la plataforma',
      items: [
        { title: 'Trazabilidad', description: 'Cada evaluación debe poder relacionarse con una fuente, un control, evidencia y una decisión responsable.' },
        { title: 'Revisión humana', description: 'La asistencia mediante IA organiza y propone; las decisiones legales y de cumplimiento permanecen bajo supervisión profesional.' },
        { title: 'Evidencia operativa', description: 'El cumplimiento se gestiona como trabajo recurrente, no como una declaración aislada o un diagnóstico estático.' },
        { title: 'Aplicación gradual', description: 'La plataforma permite comenzar con un marco prioritario y extender el mismo modelo a otras obligaciones y áreas operativas.' },
      ],
    },
    scope: {
      title: 'Alcance y límites',
      helps: { title: 'KUMPLIO ayuda a', description: 'Organizar información, proponer estructuras de control, relacionar evidencia y mantener trazabilidad del trabajo de cumplimiento.' },
      doesNotReplace: { title: 'KUMPLIO no reemplaza', description: 'La asesoría jurídica, la auditoría independiente ni la decisión profesional de responsables legales, de riesgo o cumplimiento.' },
    },
    cta: {
      title: 'Convierte un marco regulatorio en trabajo verificable.',
      description: 'Comienza con un diagnóstico y conserva obligaciones, controles, evidencia y acciones dentro de un mismo espacio de trabajo.',
      action: 'Evaluar cumplimiento',
    },
  },
  en: {
    metadata: {
      title: 'About KUMPLIO | Continuous compliance platform',
      description: 'Learn how KUMPLIO turns regulatory, contractual and internal-policy obligations into controls, evidence and verifiable actions.',
      ogTitle: 'About KUMPLIO | Continuous compliance',
      ogDescription: 'A n3uralia platform for structuring obligations, controls, evidence, findings and action plans.',
    },
    nav: { home: 'Home', action: 'Assess compliance', switchLanguage: 'Español' },
    hero: {
      eyebrow: 'About KUMPLIO',
      title: 'Continuous compliance with evidence and human accountability.',
      description: 'KUMPLIO is a platform developed by n3uralia to structure obligations that come from regulations, contracts and internal policies. The system helps turn those obligations into controls, owners, evidence, findings and action plans.',
    },
    problem: {
      eyebrow: 'Problem',
      title: 'Regulatory information is often disconnected from operations.',
      description: 'Documents, matrices, evidence, owners and corrective actions are often managed in separate tools. That fragmentation makes it difficult to know which obligation is covered, which control needs review and which evidence supports a decision.',
    },
    approach: {
      eyebrow: 'Approach',
      title: 'One structure for managing different frameworks.',
      description: 'KUMPLIO uses a consistent cycle: map obligations, assign controls, link evidence, record findings, address gaps and prepare reviews. Chilean Law 21.719 is a priority use case, but the platform is not limited to a single regulation.',
    },
    principles: {
      eyebrow: 'Principles',
      title: 'How the platform should operate',
      items: [
        { title: 'Traceability', description: 'Every assessment should be connectable to a source, a control, evidence and an accountable decision.' },
        { title: 'Human review', description: 'AI assistance organizes and proposes; legal and compliance decisions remain under professional supervision.' },
        { title: 'Operational evidence', description: 'Compliance is managed as recurring work, not as an isolated declaration or a static diagnosis.' },
        { title: 'Gradual adoption', description: 'The platform can start with one priority framework and extend the same model to other obligations and operational areas.' },
      ],
    },
    scope: {
      title: 'Scope and limits',
      helps: { title: 'KUMPLIO helps', description: 'Organize information, propose control structures, connect evidence and preserve traceability across compliance work.' },
      doesNotReplace: { title: 'KUMPLIO does not replace', description: 'Legal advice, independent audit or the professional judgment of legal, risk or compliance owners.' },
    },
    cta: {
      title: 'Turn a regulatory framework into verifiable work.',
      description: 'Start with an assessment and keep obligations, controls, evidence and actions inside the same workspace.',
      action: 'Assess compliance',
    },
  },
}

export const THINKING_PUBLIC_COPY: Record<PublicLocale, ThinkingCopy> = {
  es: {
    metadata: {
      title: 'Cómo trabaja Kumplio | IA, evidencia y revisión humana en Chile',
      description: 'Metodología de Kumplio para reducir la complejidad del cumplimiento en Chile sin reducir el rigor: fuentes trazables, evidencia, automatización gobernada y revisión humana.',
      ogDescription: 'Principios de producto: claridad, trazabilidad, prevención y automatización con control humano.',
    },
    hero: {
      badge: 'The Kumplio Way',
      title: 'Lo complejo ocurre por dentro. Tú ves solo lo que importa.',
      description: 'El cumplimiento puede ser complejo. Usarlo no debería serlo. Kumplio organiza, revisa y prioriza antes de presentarte una situación, explica por qué importa y propone el siguiente paso sin quitarte el control.',
      start: 'Comenzar',
      how: 'Ver cómo funciona',
    },
    simplify: {
      eyebrow: 'Diseñado para simplificar',
      title: 'La tecnología trabaja en segundo plano. Las decisiones importantes siguen en tus manos.',
      principles: [
        { title: 'Claridad antes que volumen', description: 'Kumplio prioriza antes de mostrar. Presenta lo que merece atención y mantiene el detalle disponible cuando realmente se necesita.' },
        { title: 'Prevención antes que corrección', description: 'La experiencia guía, explica y evita errores antes de que ocurran. Las acciones críticas conservan revisión y trazabilidad.' },
        { title: 'Automatización con control humano', description: 'Kumplio analiza, prepara y propone. Las decisiones legales, económicas o irreversibles permanecen en manos de las personas.' },
      ],
    },
    workflow: {
      eyebrow: 'Cómo trabajamos',
      title: 'Kumplio trabaja primero. Tú decides.',
      description: 'No trasladamos al usuario la arquitectura, los agentes, las reglas ni el volumen de información. Presentamos una narrativa breve, seria y trazable.',
      steps: [
        { title: 'Entendemos', description: 'Reunimos el contexto disponible antes de pedir información adicional.' },
        { title: 'Encontramos', description: 'Separamos lo importante del ruido y conservamos el fundamento.' },
        { title: 'Explicamos', description: 'Mostramos qué ocurrió, por qué importa y qué evidencia lo respalda.' },
        { title: 'Proponemos', description: 'Preparamos una acción concreta y nos detenemos antes de la decisión crítica.' },
      ],
    },
    responsibility: {
      eyebrow: 'Nuestra responsabilidad',
      title: 'Reducir la complejidad sin reducir el rigor.',
      description: 'Kumplio no busca impresionar. Busca que entiendas qué merece atención, tengas una recomendación responsable y puedas volver a tu trabajo con tranquilidad.',
    },
  },
  en: {
    metadata: {
      title: 'How Kumplio works | AI, evidence and human review in Chile',
      description: 'Kumplio’s method for reducing compliance complexity in Chile without reducing rigor: traceable sources, evidence, governed automation and human review.',
      ogDescription: 'Product principles: clarity, traceability, prevention and automation with human control.',
    },
    hero: {
      badge: 'The Kumplio Way',
      title: 'Complexity stays inside. You see only what matters.',
      description: 'Compliance can be complex. Using it should not be. Kumplio organizes, reviews and prioritizes before presenting a situation, explains why it matters and proposes the next step without taking control away from you.',
      start: 'Get started',
      how: 'See how it works',
    },
    simplify: {
      eyebrow: 'Designed to simplify',
      title: 'Technology works in the background. Important decisions remain in your hands.',
      principles: [
        { title: 'Clarity before volume', description: 'Kumplio prioritizes before it displays. It surfaces what deserves attention and keeps detail available when it is actually needed.' },
        { title: 'Prevention before correction', description: 'The experience guides, explains and helps avoid errors before they happen. Critical actions retain review and traceability.' },
        { title: 'Automation with human control', description: 'Kumplio analyzes, prepares and proposes. Legal, economic or irreversible decisions remain in human hands.' },
      ],
    },
    workflow: {
      eyebrow: 'How we work',
      title: 'Kumplio works first. You decide.',
      description: 'We do not push architecture, agents, rules or information volume onto the user. We present a concise, serious and traceable narrative.',
      steps: [
        { title: 'Understand', description: 'We gather the available context before asking for additional information.' },
        { title: 'Find', description: 'We separate what matters from the noise and preserve the underlying basis.' },
        { title: 'Explain', description: 'We show what happened, why it matters and which evidence supports it.' },
        { title: 'Propose', description: 'We prepare a concrete action and stop before the critical decision.' },
      ],
    },
    responsibility: {
      eyebrow: 'Our responsibility',
      title: 'Reduce complexity without reducing rigor.',
      description: 'Kumplio is not designed to impress. It is designed to help you understand what deserves attention, receive a responsible recommendation and return to your work with clarity.',
    },
  },
}

export const POWERED_PUBLIC_COPY: Record<PublicLocale, PoweredCopy> = {
  es: {
    metadata: {
      title: 'Kumplio y n3uralia | Producto y factoría de IA en Chile',
      description: 'Kumplio es un producto de cumplimiento y privacidad desarrollado por n3uralia, factoría chilena de inteligencia artificial aplicada y software para operaciones reales.',
      ogDescription: 'La relación entre Kumplio y n3uralia, la factoría chilena de IA aplicada y software que desarrolla el producto.',
    },
    nav: { about: 'Sobre Kumplio', switchLanguage: 'English' },
    hero: {
      eyebrow: 'Powered by n3uralia',
      title: 'Kumplio es desarrollado por n3uralia.',
      description: 'Kumplio es la aplicación especializada en cumplimiento, privacidad e inteligencia regulatoria. n3uralia es la factoría chilena de IA aplicada y software que diseña, construye y evoluciona su arquitectura, automatización y capacidades de inteligencia artificial.',
      n3uralia: 'Ver n3uralia',
      kumplio: 'Conocer Kumplio',
    },
    responsibilities: {
      eyebrow: 'Responsabilidades',
      title: 'Producto especializado, factoría compartida.',
      description: 'Kumplio mantiene su propia propuesta de valor, experiencia y operación. n3uralia aporta la ingeniería y capacidad de producto necesarias para desarrollar Kumplio y para construir soluciones más amplias cuando una organización necesita integraciones o procesos fuera del alcance estándar.',
      capabilities: [
        { title: 'IA aplicada con contexto', description: 'Capacidades que trabajan con fuentes, permisos, memoria y revisión humana dentro de un proceso definido.' },
        { title: 'Automatización gobernada', description: 'Flujos con responsables, decisiones, evidencia, excepciones y trazabilidad.' },
        { title: 'Ingeniería fullstack', description: 'Aplicaciones web, backend, bases de datos, integraciones, observabilidad y operación continua.' },
        { title: 'Implementación regional', description: 'Sistemas adaptados a equipos, normativa, presupuestos y operación de Chile y Latinoamérica.' },
      ],
    },
    comparison: {
      kumplioTitle: 'Para operar cumplimiento y privacidad con una plataforma especializada.',
      kumplioDescription: 'Kumplio',
      kumplioItems: ['Preparación y operación de la Ley 21.719.', 'Relación entre obligaciones, controles y evidencia.', 'Misiones con responsables y revisión humana.', 'Trazabilidad de fuentes, decisiones y resultados.'],
      kumplioAction: 'Ver planes',
      n3uraliaTitle: 'Factoría de IA aplicada y software para construir sistemas fuera del producto estándar.',
      n3uraliaDescription: 'n3uralia',
      n3uraliaItems: ['Aplicaciones fullstack para procesos propios.', 'Integraciones con ERP, CRM y sistemas existentes.', 'Agentes IA y automatización para otras áreas operativas.', 'Arquitectura, despliegue y evolución de sistemas a medida.'],
      n3uraliaAction: 'Contactar n3uralia',
    },
    graph: { pageName: 'Kumplio y n3uralia', pageDescription: 'Relación entre el producto Kumplio y n3uralia, su desarrollador y factoría de producto.', region: 'Latinoamérica' },
  },
  en: {
    metadata: {
      title: 'Kumplio and n3uralia | Product and AI studio in Chile',
      description: 'Kumplio is a compliance and privacy product developed by n3uralia, a Chilean applied-AI and software studio for real operations.',
      ogDescription: 'How Kumplio relates to n3uralia, the Chilean applied-AI and software studio that develops the product.',
    },
    nav: { about: 'About Kumplio', switchLanguage: 'Español' },
    hero: {
      eyebrow: 'Powered by n3uralia',
      title: 'Kumplio is developed by n3uralia.',
      description: 'Kumplio is the specialized application for compliance, privacy and regulatory intelligence. n3uralia is the Chilean applied-AI and software studio that designs, builds and evolves its architecture, automation and artificial-intelligence capabilities.',
      n3uralia: 'Visit n3uralia',
      kumplio: 'Explore Kumplio',
    },
    responsibilities: {
      eyebrow: 'Responsibilities',
      title: 'Specialized product, shared product studio.',
      description: 'Kumplio keeps its own value proposition, experience and operation. n3uralia provides the engineering and product capabilities required to develop Kumplio and to build broader solutions when an organization needs integrations or processes beyond the standard product scope.',
      capabilities: [
        { title: 'Applied AI with context', description: 'Capabilities that work with sources, permissions, memory and human review inside a defined process.' },
        { title: 'Governed automation', description: 'Workflows with owners, decisions, evidence, exceptions and traceability.' },
        { title: 'Full-stack engineering', description: 'Web applications, backend, databases, integrations, observability and continuous operation.' },
        { title: 'Regional implementation', description: 'Systems adapted to teams, regulation, budgets and operations in Chile and Latin America.' },
      ],
    },
    comparison: {
      kumplioTitle: 'Operate compliance and privacy with a specialized platform.',
      kumplioDescription: 'Kumplio',
      kumplioItems: ['Preparation and operation for Chilean Law 21.719.', 'Relationships among obligations, controls and evidence.', 'Missions with owners and human review.', 'Traceability across sources, decisions and results.'],
      kumplioAction: 'View plans',
      n3uraliaTitle: 'Applied-AI and software studio for systems beyond the standard product.',
      n3uraliaDescription: 'n3uralia',
      n3uraliaItems: ['Full-stack applications for proprietary processes.', 'Integrations with ERP, CRM and existing systems.', 'AI agents and automation for other operational areas.', 'Architecture, deployment and evolution of custom systems.'],
      n3uraliaAction: 'Contact n3uralia',
    },
    graph: { pageName: 'Kumplio and n3uralia', pageDescription: 'Relationship between Kumplio and n3uralia, its developer and product studio.', region: 'Latin America' },
  },
}
