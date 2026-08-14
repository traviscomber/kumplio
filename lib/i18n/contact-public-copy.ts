import type { PublicLocale } from '@/lib/i18n/public-routing'

type ContactPublicCopy = {
  metadata: { title: string; description: string }
  serviceLabels: Record<'enterprise' | 'fullstack' | 'acompanado', string>
  nav: { plans: string; start: string; switchLanguage: string }
  hero: { eyebrow: string; title: string; description: string }
  selected: { eyebrow: string; description: string }
  direct: { title: string }
  after: { title: string; steps: string[] }
  success: { title: string; description: string; another: string }
  form: {
    title: string
    requiredNote: string
    requiredError: string
    emailError: string
    genericSubmitError: string
    fields: {
      name: string
      email: string
      company: string
      industry: string
      size: string
      phone: string
      challenge: string
      website: string
    }
    placeholders: {
      name: string
      email: string
      company: string
      phone: string
      challenge: string
    }
    select: string
    industries: Record<string, string>
    sizes: Record<string, string>
    submit: string
    submitting: string
    privacyPrefix: string
    privacyLink: string
    privacySuffix: string
  }
}

export const CONTACT_PUBLIC_COPY: Record<PublicLocale, ContactPublicCopy> = {
  es: {
    metadata: {
      title: 'Contacto | Kumplio',
      description: 'Cuéntanos qué necesitas proteger, ordenar, implementar o resolver. Revisamos el contexto antes de definir un plan o proyecto para tu organización.',
    },
    serviceLabels: {
      enterprise: 'Kumplio Enterprise Studio',
      fullstack: 'Solución Fullstack',
      acompanado: 'Plan Acompañado',
    },
    nav: { plans: 'Planes', start: 'Comenzar', switchLanguage: 'English' },
    hero: {
      eyebrow: 'Contacto',
      title: 'Conversemos sobre el resultado que necesitas.',
      description: 'Cuéntanos el problema, el contexto de tu organización y qué esperas conseguir. Revisaremos la solicitud antes de recomendar un plan o un proyecto.',
    },
    selected: {
      eyebrow: 'Interés identificado',
      description: 'La conversación parte con este contexto, pero confirmaremos primero si es la alternativa correcta.',
    },
    direct: { title: 'Contacto directo' },
    after: {
      title: 'Qué ocurre después',
      steps: [
        'Revisamos el objetivo y el contexto informado.',
        'Definimos si corresponde una suscripción, acompañamiento o Enterprise.',
        'Acordamos alcance, responsables, precio y próximos pasos antes de iniciar.',
      ],
    },
    success: {
      title: 'Solicitud registrada',
      description: 'Gracias. Revisaremos la información antes de contactarte para que la conversación parta con contexto.',
      another: 'Enviar otra solicitud',
    },
    form: {
      title: 'Cuéntanos sobre tu organización',
      requiredNote: 'Los campos marcados con * son necesarios para registrar la solicitud.',
      requiredError: 'Completa todos los campos obligatorios.',
      emailError: 'Ingresa un correo electrónico válido.',
      genericSubmitError: 'Ocurrió un error. Intenta nuevamente.',
      fields: {
        name: 'Nombre *',
        email: 'Correo *',
        company: 'Empresa *',
        industry: 'Industria *',
        size: 'Tamaño *',
        phone: 'Teléfono',
        challenge: 'Resultado o desafío',
        website: 'Sitio web',
      },
      placeholders: {
        name: 'Tu nombre',
        email: 'tu@empresa.cl',
        company: 'Nombre de la empresa',
        phone: '+56 9...',
        challenge: 'Describe qué necesitas ordenar, ejecutar, integrar o demostrar.',
      },
      select: 'Selecciona',
      industries: {
        servicios: 'Servicios profesionales',
        tecnologia: 'Tecnología',
        financiero: 'Financiero y seguros',
        salud: 'Salud',
        retail: 'Retail y comercio',
        transporte: 'Transporte y logística',
        construccion: 'Construcción',
        mineria: 'Minería',
        agro: 'Agro',
        otro: 'Otra',
      },
      sizes: {
        '1-9': '1–9 personas',
        '10-49': '10–49 personas',
        '50-199': '50–199 personas',
        '200-999': '200–999 personas',
        '1000+': '1.000 o más',
      },
      submit: 'Enviar solicitud',
      submitting: 'Registrando solicitud…',
      privacyPrefix: 'Al enviar aceptas que utilicemos estos datos para responder tu solicitud, según nuestra',
      privacyLink: 'Política de Privacidad',
      privacySuffix: '.',
    },
  },
  en: {
    metadata: {
      title: 'Contact | Kumplio',
      description: 'Tell us what you need to protect, organize, implement or resolve. We review the context before defining a plan or project for your organization in Chile.',
    },
    serviceLabels: {
      enterprise: 'Kumplio Enterprise Studio',
      fullstack: 'Full-stack solution',
      acompanado: 'Guided plan',
    },
    nav: { plans: 'Plans', start: 'Get started', switchLanguage: 'Español' },
    hero: {
      eyebrow: 'Contact',
      title: 'Let’s discuss the outcome you need.',
      description: 'Tell us about the problem, your organization’s context and what you want to achieve. We will review the request before recommending a plan or project.',
    },
    selected: {
      eyebrow: 'Interest identified',
      description: 'The conversation starts with this context, but we will first confirm whether it is the right option.',
    },
    direct: { title: 'Direct contact' },
    after: {
      title: 'What happens next',
      steps: [
        'We review the objective and the context you provided.',
        'We determine whether a subscription, guided support or Enterprise is the right fit.',
        'We agree on scope, owners, price and next steps before starting.',
      ],
    },
    success: {
      title: 'Request received',
      description: 'Thank you. We will review the information before contacting you so the conversation starts with context.',
      another: 'Send another request',
    },
    form: {
      title: 'Tell us about your organization',
      requiredNote: 'Fields marked with * are required to register the request.',
      requiredError: 'Complete all required fields.',
      emailError: 'Enter a valid email address.',
      genericSubmitError: 'Something went wrong. Please try again.',
      fields: {
        name: 'Name *',
        email: 'Email *',
        company: 'Company *',
        industry: 'Industry *',
        size: 'Size *',
        phone: 'Phone',
        challenge: 'Outcome or challenge',
        website: 'Website',
      },
      placeholders: {
        name: 'Your name',
        email: 'you@company.com',
        company: 'Company name',
        phone: '+56 9...',
        challenge: 'Describe what you need to organize, execute, integrate or demonstrate.',
      },
      select: 'Select',
      industries: {
        servicios: 'Professional services',
        tecnologia: 'Technology',
        financiero: 'Financial services and insurance',
        salud: 'Healthcare',
        retail: 'Retail and commerce',
        transporte: 'Transport and logistics',
        construccion: 'Construction',
        mineria: 'Mining',
        agro: 'Agriculture',
        otro: 'Other',
      },
      sizes: {
        '1-9': '1–9 people',
        '10-49': '10–49 people',
        '50-199': '50–199 people',
        '200-999': '200–999 people',
        '1000+': '1,000 or more',
      },
      submit: 'Send request',
      submitting: 'Submitting request…',
      privacyPrefix: 'By submitting, you agree that we may use this data to respond to your request under our',
      privacyLink: 'Privacy Policy',
      privacySuffix: '.',
    },
  },
}
