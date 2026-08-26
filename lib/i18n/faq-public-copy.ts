import type { PublicLocale } from '@/lib/i18n/public-routing'

type FaqItem = { question: string; answer: string }
type FaqSection = { title: string; items: FaqItem[] }
type FaqPublicCopy = { metadata: { title: string; description: string; openGraphTitle: string; openGraphDescription: string }; header: { contact: string; switchLanguage: string }; hero: { eyebrow: string; title: string; description: string }; sections: FaqSection[]; custom: { title: string; description: string; action: string }; cta: { title: string; description: string; action: string }; breadcrumbs: { home: string; faq: string } }

export const FAQ_PUBLIC_COPY: Record<PublicLocale, FaqPublicCopy> = {
  es: {
    metadata: { title: 'Preguntas frecuentes sobre Kumplio y cumplimiento en Chile', description: 'Respuestas sobre Kumplio, Ley 21.719, fuentes oficiales, inteligencia artificial, revisión humana, seguridad, precios y la relación con n3uralia.', openGraphTitle: 'Preguntas frecuentes | Kumplio', openGraphDescription: 'Respuestas claras sobre el producto, su alcance, sus límites y su operación en Chile.' },
    header: { contact: 'Contacto', switchLanguage: 'English' },
    hero: { eyebrow: 'Preguntas frecuentes', title: 'Respuestas directas sobre Kumplio.', description: 'Producto, Ley 21.719, inteligencia artificial, fuentes, seguridad, precios y relación con n3uralia.' },
    sections: [
      { title: 'Producto', items: [
        { question: '¿Qué es Kumplio?', answer: 'Kumplio es un software chileno de cumplimiento normativo e inteligencia regulatoria. Ayuda a convertir fuentes, obligaciones y contexto organizacional en casos, acciones, evidencia y decisiones revisables.' },
        { question: '¿Para qué tipo de organización sirve?', answer: 'Está orientado a organizaciones que necesitan ordenar cumplimiento, documentos, responsables y evidencia. El caso inicial es la preparación para la Ley 21.719, con posibilidad de extender el mismo modelo a contratos, políticas y otros marcos.' },
        { question: '¿Kumplio reemplaza Excel, Drive o un gestor documental?', answer: 'Puede complementar o reemplazar parte de esos flujos. La diferencia es que mantiene relaciones entre fuentes, obligaciones, controles, responsables, evidencia, hallazgos, acciones y decisiones, en vez de almacenar cada elemento de forma aislada.' },
        { question: '¿Kumplio declara automáticamente que una empresa cumple?', answer: 'No. La plataforma organiza información, propone estructuras y ayuda a ejecutar trabajo. Las conclusiones relevantes requieren contexto suficiente, fuentes identificables y revisión humana.' },
      ]},
      { title: 'Ley 21.719 y contenido regulatorio', items: [
        { question: '¿Kumplio sirve para preparar la Ley 21.719?', answer: 'Sí. La primera solución prioritaria organiza tratamientos, obligaciones, responsables, controles, contratos, evidencia, brechas y acciones necesarias para preparar la entrada en vigencia general de la Ley 21.719 el 1 de diciembre de 2026.' },
        { question: '¿Qué fuentes utiliza Kumplio?', answer: 'La plataforma prioriza fuentes oficiales identificables, como LeyChile de la Biblioteca del Congreso Nacional y el Diario Oficial. La procedencia, fecha y versión deben conservarse para que una afirmación regulatoria pueda revisarse.' },
        { question: '¿Las guías públicas son asesoría jurídica?', answer: 'No. Son información general para ayudar a organizar preguntas, procesos y evidencia. La aplicabilidad concreta depende de cada organización y debe revisarse con profesionales cuando corresponda.' },
      ]},
      { title: 'Inteligencia artificial y revisión', items: [
        { question: '¿Cómo utiliza inteligencia artificial?', answer: 'Kumplio utiliza capacidades especializadas para extraer, comparar, clasificar, estructurar y proponer trabajo. El objetivo es asistir procesos con contexto y trazabilidad, no entregar respuestas genéricas sin fuente.' },
        { question: '¿La IA toma decisiones legales?', answer: 'No. La IA puede preparar análisis, propuestas y entregables, pero las decisiones jurídicas, de cumplimiento, auditoría o negocio permanecen bajo responsabilidad humana.' },
        { question: '¿Qué ocurre cuando falta información?', answer: 'El resultado debería indicar la limitación, solicitar contexto o escalar a revisión. Kumplio no debería convertir una ausencia de evidencia en una conclusión positiva de cumplimiento.' },
      ]},
      { title: 'Datos, seguridad y empresas', items: [
        { question: '¿Los datos de una organización se comparten con otra?', answer: 'No deben compartirse. La arquitectura separa el conocimiento público de la memoria privada de cada organización y aplica controles de acceso y aislamiento por organización.' },
        { question: '¿Dónde puedo revisar la información de seguridad?', answer: 'La página pública de Seguridad describe las medidas operativas actuales, los límites y el canal para reportar incidentes o vulnerabilidades. No se publican certificaciones que no estén demostradas.' },
        { question: '¿Existe una alternativa para procesos personalizados?', answer: 'Sí. Kumplio Enterprise Studio permite evaluar integraciones, permisos, flujos y experiencias específicas. Cuando el problema excede el alcance del producto estándar, n3uralia puede diseñar una solución de software más amplia.' },
      ]},
      { title: 'Planes y empresa desarrolladora', items: [
        { question: '¿Los precios están en pesos chilenos?', answer: 'Sí. Los planes públicos se expresan en CLP y no incluyen IVA. La creación de una cuenta o workspace no inicia un cobro automático; la contratación y facturación se confirman por separado.' },
        { question: '¿Quién desarrolla Kumplio?', answer: 'Kumplio es desarrollado por n3uralia, empresa chilena de inteligencia artificial aplicada, automatización y software para operaciones reales en Chile y Latinoamérica.' },
      ]},
    ],
    custom: { title: '¿La pregunta es sobre implementación o software a medida?', description: 'Kumplio cubre el producto estándar. N3uralia diseña sistemas, integraciones y automatizaciones fuera de ese alcance.', action: 'Conocer n3uralia' },
    cta: { title: '¿Necesitas revisar tu caso?', description: 'Cuéntanos el objetivo y el contexto antes de seleccionar un plan o proyecto.', action: 'Enviar solicitud' }, breadcrumbs: { home: 'Inicio', faq: 'Preguntas frecuentes' },
  },
  en: {
    metadata: { title: 'Frequently asked questions about Kumplio and compliance in Chile', description: 'Answers about Kumplio, Chilean Law 21.719, official sources, artificial intelligence, human review, security, pricing and its relationship with n3uralia.', openGraphTitle: 'Frequently asked questions | Kumplio', openGraphDescription: 'Clear answers about the product, its scope, its limits and how it operates in Chile.' },
    header: { contact: 'Contact', switchLanguage: 'Español' }, hero: { eyebrow: 'Frequently asked questions', title: 'Direct answers about Kumplio.', description: 'Product, Chilean Law 21.719, artificial intelligence, sources, security, pricing and n3uralia.' },
    sections: [
      { title: 'Product', items: [
        { question: 'What is Kumplio?', answer: 'Kumplio is Chilean compliance and regulatory-intelligence software. It helps turn sources, obligations and organizational context into cases, actions, evidence and reviewable decisions.' },
        { question: 'What kind of organization is it for?', answer: 'It is designed for organizations that need to organize compliance work, documents, owners and evidence. The initial use case is preparation for Chilean Law 21.719, with the same model potentially extending to contracts, policies and other frameworks.' },
        { question: 'Does Kumplio replace Excel, Drive or a document-management system?', answer: 'It can complement or replace parts of those workflows. The difference is that it preserves relationships among sources, obligations, controls, owners, evidence, findings, actions and decisions instead of storing each item in isolation.' },
        { question: 'Does Kumplio automatically declare that a company is compliant?', answer: 'No. The platform organizes information, proposes structures and helps execute work. Relevant conclusions require sufficient context, identifiable sources and human review.' },
      ]},
      { title: 'Law 21.719 and regulatory content', items: [
        { question: 'Can Kumplio help prepare for Chilean Law 21.719?', answer: 'Yes. The first priority solution organizes processing activities, obligations, owners, controls, contracts, evidence, gaps and actions needed to prepare for the general entry into force of Law 21.719 on December 1, 2026.' },
        { question: 'Which sources does Kumplio use?', answer: 'The platform prioritizes identifiable official sources, such as LeyChile from the Library of the National Congress of Chile and the Official Gazette. Provenance, date and version should be preserved so regulatory statements can be reviewed.' },
        { question: 'Are the public guides legal advice?', answer: 'No. They provide general information to help organize questions, processes and evidence. How the information applies depends on each organization and should be reviewed with qualified professionals when appropriate.' },
      ]},
      { title: 'Artificial intelligence and review', items: [
        { question: 'How does Kumplio use artificial intelligence?', answer: 'Kumplio uses specialized capabilities to extract, compare, classify, structure and propose work. The objective is to assist processes with context and traceability, not to deliver generic answers without sources.' },
        { question: 'Does AI make legal decisions?', answer: 'No. AI can prepare analyses, proposals and deliverables, but legal, compliance, audit and business decisions remain under human responsibility.' },
        { question: 'What happens when information is missing?', answer: 'The result should identify the limitation, request context or escalate for review. Kumplio should not turn missing evidence into a positive conclusion of compliance.' },
      ]},
      { title: 'Data, security and organizations', items: [
        { question: 'Is one organization’s data shared with another?', answer: 'It should not be shared. The architecture separates public knowledge from each organization’s private memory and applies access controls and organization-level isolation.' },
        { question: 'Where can I review security information?', answer: 'The public Security page describes current operational measures, limits and the channel for reporting incidents or vulnerabilities. Certifications are not published unless they have been demonstrated.' },
        { question: 'Is there an option for customized processes?', answer: 'Yes. Kumplio Enterprise Studio can evaluate specific integrations, permissions, workflows and experiences. When a problem exceeds the standard product scope, n3uralia can design a broader software solution.' },
      ]},
      { title: 'Plans and developer', items: [
        { question: 'Are prices in Chilean pesos?', answer: 'Yes. Public plans are priced in CLP and exclude VAT. Creating an account or workspace does not start an automatic charge; contracting and invoicing are confirmed separately.' },
        { question: 'Who develops Kumplio?', answer: 'Kumplio is developed by n3uralia, a Chilean applied-AI, automation and software company building for real operations in Chile and Latin America.' },
      ]},
    ],
    custom: { title: 'Is your question about implementation or custom software?', description: 'Kumplio covers the standard product. N3uralia designs systems, integrations and automations outside that scope.', action: 'Learn about n3uralia' }, cta: { title: 'Do you need to review your situation?', description: 'Tell us the objective and context before choosing a plan or project.', action: 'Send a request' }, breadcrumbs: { home: 'Home', faq: 'Frequently asked questions' },
  },
}
