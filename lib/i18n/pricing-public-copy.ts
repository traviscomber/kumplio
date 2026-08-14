import type { PublicLocale } from '@/lib/i18n/public-routing'

type PricingPlanCopy = {
  id: 'esencial' | 'profesional' | 'acompanado'
  name: string
  outcome: string
  price: string
  period: string
  description: string
  cta: string
  highlighted: boolean
  badge?: string
  results: string[]
}

type PricingPublicCopy = {
  metadata: {
    title: string
    description: string
  }
  nav: {
    home: string
    demo: string
    plans: string
    signIn: string
    start: string
    switchLanguage: string
  }
  hero: {
    eyebrow: string
    title: string
    description: string
  }
  plans: PricingPlanCopy[]
  changesLabel: string
  choice: {
    eyebrow: string
    title: string
    rows: Array<[string, string]>
    note: string
  }
}

export const PRICING_PUBLIC_COPY: Record<PublicLocale, PricingPublicCopy> = {
  es: {
    metadata: {
      title: 'Planes y precios de Kumplio en Chile',
      description:
        'Planes de Kumplio en pesos chilenos para ordenar evidencia, coordinar cumplimiento y avanzar con distintos niveles de acompañamiento.',
    },
    nav: {
      home: 'Inicio',
      demo: 'Demostración',
      plans: 'Planes',
      signIn: 'Ingresar',
      start: 'Probar con mi empresa',
      switchLanguage: 'English',
    },
    hero: {
      eyebrow: 'Planes según el resultado que necesitas',
      title: 'Elige cuánto trabajo manual quieres recuperar y cuánto acompañamiento necesita tu equipo.',
      description:
        'Todos los planes buscan el mismo resultado: menos tiempo buscando, decisiones más rápidas y evidencia preparada mientras la empresa avanza.',
    },
    plans: [
      {
        id: 'esencial',
        name: 'Esencial',
        outcome: 'Deja de ordenar el cumplimiento en planillas.',
        price: '$79.990',
        period: 'al mes + IVA',
        description:
          'Para una empresa que necesita reunir obligaciones, decisiones y evidencias en un flujo claro y trazable.',
        cta: 'Empezar a ordenar',
        highlighted: false,
        results: [
          'Una sola vista de lo que requiere atención',
          'Trabajo asignado con responsable y fecha',
          'Evidencia organizada mientras avanzas',
          'Menos seguimiento manual por correo',
          'Estado ejecutivo disponible en minutos',
        ],
      },
      {
        id: 'profesional',
        name: 'Profesional',
        outcome: 'Anticipa cambios y coordina equipos antes de que aparezca la urgencia.',
        price: '$249.990',
        period: 'al mes + IVA',
        description:
          'Para organizaciones que necesitan seguimiento continuo, decisiones preparadas y coordinación entre varias áreas.',
        cta: 'Reducir trabajo manual',
        highlighted: true,
        badge: 'Mayor impacto',
        results: [
          'Cambios relevantes priorizados automáticamente',
          'Menos documentos y asuntos que revisar',
          'Decisiones explicadas con evidencia y contexto',
          'Equipos alineados sobre el siguiente paso',
          'Auditorías más simples por trazabilidad continua',
        ],
      },
      {
        id: 'acompanado',
        name: 'Acompañado',
        outcome: 'Avanza con una operación guiada, no solo con una herramienta.',
        price: 'Desde $699.990',
        period: 'al mes + IVA',
        description:
          'Para empresas que quieren acelerar la adopción y mantener prioridades, responsables y resultados bajo revisión periódica.',
        cta: 'Conversar sobre mi empresa',
        highlighted: false,
        results: [
          'Configuración inicial junto a tu equipo',
          'Prioridades revisadas periódicamente',
          'Bloqueos y atrasos visibles antes de escalar',
          'Mejor adopción entre las áreas responsables',
          'Plan de avance conectado con tus objetivos',
        ],
      },
    ],
    changesLabel: 'Qué cambia',
    choice: {
      eyebrow: 'Decisión simple',
      title: 'Elige por el problema que quieres dejar atrás.',
      rows: [
        ['Quiero dejar las planillas y ordenar evidencia', 'Esencial'],
        ['Quiero anticipar cambios y coordinar varias áreas', 'Profesional'],
        ['Quiero que nos ayuden a implementar y avanzar', 'Acompañado'],
      ],
      note: 'Precios en pesos chilenos, sin IVA. Puedes comenzar con un plan y aumentar el acompañamiento cuando la organización lo necesite.',
    },
  },
  en: {
    metadata: {
      title: 'Kumplio plans and pricing for Chile',
      description:
        'Kumplio plans priced in Chilean pesos to organize evidence, coordinate compliance work and move forward with different levels of guided support.',
    },
    nav: {
      home: 'Home',
      demo: 'Demo',
      plans: 'Plans',
      signIn: 'Sign in',
      start: 'Try it with my company',
      switchLanguage: 'Español',
    },
    hero: {
      eyebrow: 'Plans based on the outcome you need',
      title: 'Choose how much manual work you want to recover and how much support your team needs.',
      description:
        'Every plan pursues the same outcome: less time searching, faster decisions and evidence prepared while the organization moves forward.',
    },
    plans: [
      {
        id: 'esencial',
        name: 'Essential',
        outcome: 'Stop managing compliance through spreadsheets.',
        price: '$79,990',
        period: 'per month + VAT',
        description:
          'For a company that needs to bring obligations, decisions and evidence into one clear, traceable workflow.',
        cta: 'Start organizing',
        highlighted: false,
        results: [
          'One view of what needs attention',
          'Work assigned with an owner and due date',
          'Evidence organized as you move forward',
          'Less manual follow-up by email',
          'Executive status available in minutes',
        ],
      },
      {
        id: 'profesional',
        name: 'Professional',
        outcome: 'Anticipate changes and coordinate teams before urgency appears.',
        price: '$249,990',
        period: 'per month + VAT',
        description:
          'For organizations that need continuous follow-up, prepared decisions and coordination across multiple areas.',
        cta: 'Reduce manual work',
        highlighted: true,
        badge: 'Highest impact',
        results: [
          'Relevant changes prioritized automatically',
          'Fewer documents and issues to review',
          'Decisions explained with evidence and context',
          'Teams aligned on the next step',
          'Simpler audits through continuous traceability',
        ],
      },
      {
        id: 'acompanado',
        name: 'Guided',
        outcome: 'Move forward with a guided operation, not only a tool.',
        price: 'From $699,990',
        period: 'per month + VAT',
        description:
          'For companies that want to accelerate adoption and keep priorities, owners and results under periodic review.',
        cta: 'Discuss my company',
        highlighted: false,
        results: [
          'Initial configuration with your team',
          'Priorities reviewed periodically',
          'Blockers and delays visible before they escalate',
          'Better adoption across responsible teams',
          'A progress plan connected to your objectives',
        ],
      },
    ],
    changesLabel: 'What changes',
    choice: {
      eyebrow: 'Simple decision',
      title: 'Choose based on the problem you want to leave behind.',
      rows: [
        ['I want to leave spreadsheets behind and organize evidence', 'Essential'],
        ['I want to anticipate changes and coordinate multiple teams', 'Professional'],
        ['I want help implementing and moving forward', 'Guided'],
      ],
      note: 'Prices are in Chilean pesos and exclude VAT. You can start with one plan and increase the level of support as your organization needs it.',
    },
  },
}
