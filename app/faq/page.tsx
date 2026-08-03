import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ExternalLink, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { N3URALIA_CANONICAL_URL, N3URALIA_REFERRAL_URL, SITE_URL } from '@/lib/public-site'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes sobre Kumplio y cumplimiento en Chile',
  description:
    'Respuestas sobre Kumplio, Ley 21.719, fuentes oficiales, inteligencia artificial, revisión humana, seguridad, precios y la relación con n3uralia.',
  alternates: { canonical: '/faq' },
  openGraph: {
    type: 'website',
    url: '/faq',
    title: 'Preguntas frecuentes | Kumplio',
    description: 'Respuestas claras sobre el producto, su alcance, sus límites y su operación en Chile.',
  },
}

const sections = [
  {
    title: 'Producto',
    items: [
      {
        question: '¿Qué es Kumplio?',
        answer:
          'Kumplio es un software chileno de cumplimiento normativo e inteligencia regulatoria. Ayuda a convertir fuentes, obligaciones y contexto organizacional en controles, misiones, evidencia y decisiones revisables.',
      },
      {
        question: '¿Para qué tipo de organización sirve?',
        answer:
          'Está orientado a organizaciones que necesitan ordenar cumplimiento, documentos, responsables y evidencia. El caso inicial es la preparación para la Ley 21.719, con posibilidad de extender el mismo modelo a contratos, políticas y otros marcos.',
      },
      {
        question: '¿Kumplio reemplaza Excel, Drive o un gestor documental?',
        answer:
          'Puede complementar o reemplazar parte de esos flujos. La diferencia es que mantiene relaciones entre fuentes, obligaciones, controles, responsables, evidencia, hallazgos, acciones y decisiones, en vez de almacenar cada elemento de forma aislada.',
      },
      {
        question: '¿Kumplio declara automáticamente que una empresa cumple?',
        answer:
          'No. La plataforma organiza información, propone estructuras y ayuda a ejecutar trabajo. Las conclusiones relevantes requieren contexto suficiente, fuentes identificables y revisión humana.',
      },
    ],
  },
  {
    title: 'Ley 21.719 y contenido regulatorio',
    items: [
      {
        question: '¿Kumplio sirve para preparar la Ley 21.719?',
        answer:
          'Sí. La primera solución prioritaria organiza tratamientos, obligaciones, responsables, controles, contratos, evidencia, brechas y acciones necesarias para preparar la entrada en vigencia general de la Ley 21.719 el 1 de diciembre de 2026.',
      },
      {
        question: '¿Qué fuentes utiliza Kumplio?',
        answer:
          'La plataforma prioriza fuentes oficiales identificables, como LeyChile de la Biblioteca del Congreso Nacional y el Diario Oficial. La procedencia, fecha y versión deben conservarse para que una afirmación regulatoria pueda revisarse.',
      },
      {
        question: '¿Las guías públicas son asesoría jurídica?',
        answer:
          'No. Son información general para ayudar a organizar preguntas, procesos y evidencia. La aplicabilidad concreta depende de cada organización y debe revisarse con profesionales cuando corresponda.',
      },
    ],
  },
  {
    title: 'Inteligencia artificial y revisión',
    items: [
      {
        question: '¿Cómo utiliza inteligencia artificial?',
        answer:
          'Kumplio utiliza capacidades especializadas para extraer, comparar, clasificar, estructurar y proponer trabajo. El objetivo es asistir procesos con contexto y trazabilidad, no entregar respuestas genéricas sin fuente.',
      },
      {
        question: '¿La IA toma decisiones legales?',
        answer:
          'No. La IA puede preparar análisis, propuestas y entregables, pero las decisiones jurídicas, de cumplimiento, auditoría o negocio permanecen bajo responsabilidad humana.',
      },
      {
        question: '¿Qué ocurre cuando falta información?',
        answer:
          'El resultado debería indicar la limitación, solicitar contexto o escalar a revisión. Kumplio no debería convertir una ausencia de evidencia en una conclusión positiva de cumplimiento.',
      },
    ],
  },
  {
    title: 'Datos, seguridad y empresas',
    items: [
      {
        question: '¿Los datos de una organización se comparten con otra?',
        answer:
          'No deben compartirse. La arquitectura separa el conocimiento público de la memoria privada de cada organización y aplica controles de acceso y aislamiento por organización.',
      },
      {
        question: '¿Dónde puedo revisar la información de seguridad?',
        answer:
          'La página pública de Seguridad describe las medidas operativas actuales, los límites y el canal para reportar incidentes o vulnerabilidades. No se publican certificaciones que no estén demostradas.',
      },
      {
        question: '¿Existe una alternativa para procesos personalizados?',
        answer:
          'Sí. Kumplio Enterprise Studio permite evaluar integraciones, permisos, flujos y experiencias específicas. Cuando el problema excede el alcance del producto estándar, n3uralia puede diseñar una solución de software más amplia.',
      },
    ],
  },
  {
    title: 'Planes y empresa desarrolladora',
    items: [
      {
        question: '¿Los precios están en pesos chilenos?',
        answer:
          'Sí. Los planes públicos se expresan en CLP y no incluyen IVA. La creación de una cuenta o workspace no inicia un cobro automático; la contratación y facturación se confirman por separado.',
      },
      {
        question: '¿Quién desarrolla Kumplio?',
        answer:
          'Kumplio es desarrollado por n3uralia, empresa chilena de inteligencia artificial aplicada, automatización y software para operaciones reales en Chile y Latinoamérica.',
      },
    ],
  },
]

const allFaqs = sections.flatMap((section) => section.items)

export default function FaqPage() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/faq#page`,
        url: `${SITE_URL}/faq`,
        name: 'Preguntas frecuentes sobre Kumplio',
        inLanguage: 'es-CL',
        publisher: { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
        mainEntity: allFaqs.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Preguntas frecuentes', item: `${SITE_URL}/faq` },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-extrabold tracking-[0.18em]">KUMPLIO</Link>
          <Button asChild><Link href="/contact">Contacto</Link></Button>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-6 py-24 md:py-32">
          <div className="mx-auto max-w-5xl text-center">
            <HelpCircle className="mx-auto h-11 w-11 text-primary" />
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-primary">Preguntas frecuentes</p>
            <h1 className="mt-4 text-balance text-5xl font-black tracking-[-0.04em] md:text-7xl">Respuestas directas sobre Kumplio.</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
              Producto, Ley 21.719, inteligencia artificial, fuentes, seguridad, precios y relación con n3uralia.
            </p>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl space-y-16">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-3xl font-extrabold tracking-tight">{section.title}</h2>
                <div className="mt-7 space-y-4">
                  {section.items.map((item) => (
                    <article key={item.question} className="rounded-2xl border border-border bg-card p-6">
                      <h3 className="text-lg font-bold">{item.question}</h3>
                      <p className="mt-3 leading-7 text-muted-foreground">{item.answer}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-16">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold">¿La pregunta es sobre implementación o software a medida?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Kumplio cubre el producto estándar. N3uralia diseña sistemas, integraciones y automatizaciones fuera de ese alcance.</p>
            </div>
            <a href={N3URALIA_REFERRAL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
              Conocer n3uralia <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </section>

        <section className="px-6 py-24 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight">¿Necesitas revisar tu caso?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Cuéntanos el objetivo y el contexto antes de seleccionar un plan o proyecto.</p>
          <Button size="lg" asChild className="mt-8"><Link href="/contact">Enviar solicitud <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <Footer />
    </div>
  )
}
