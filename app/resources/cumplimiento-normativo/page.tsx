import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, FileCheck2, HelpCircle, Scale, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { N3URALIA_CANONICAL_URL, SITE_URL } from '@/lib/public-site'

export const metadata: Metadata = {
  title: 'Recursos de cumplimiento normativo en Chile',
  description:
    'Recursos públicos de Kumplio sobre cumplimiento normativo, evidencia auditable, software de compliance y preparación para la Ley 21.719 en Chile.',
  alternates: { canonical: '/resources/cumplimiento-normativo' },
  openGraph: {
    title: 'Recursos de cumplimiento normativo en Chile | Kumplio',
    description: 'Guías públicas sobre obligaciones, controles, evidencia y preparación regulatoria en Chile.',
    url: '/resources/cumplimiento-normativo',
    type: 'website',
  },
}

const resources = [
  {
    icon: ShieldCheck,
    title: 'Guías prácticas de la Ley 21.719',
    description:
      'Principios, derechos de titulares, encargados, evaluación de impacto y modelo de prevención con fundamento legal, pasos y evidencia esperada.',
    href: '/resources/ley-21719',
    label: 'Explorar guías',
  },
  {
    icon: FileCheck2,
    title: 'Software de cumplimiento en Chile',
    description:
      'Cómo una plataforma conecta fuentes, obligaciones, controles, responsables, evidencia, misiones y revisión humana.',
    href: '/software-cumplimiento-chile',
    label: 'Conocer el modelo',
  },
  {
    icon: HelpCircle,
    title: 'Preguntas frecuentes',
    description:
      'Respuestas directas sobre el producto, la Ley 21.719, inteligencia artificial, datos privados, precios y la relación con n3uralia.',
    href: '/faq',
    label: 'Leer respuestas',
  },
  {
    icon: Scale,
    title: 'Alcance y límites de Kumplio',
    description:
      'Principios de trazabilidad, separación de conocimiento público y privado, revisión humana y límites de la asistencia mediante IA.',
    href: '/about',
    label: 'Conocer Kumplio',
  },
]

export default function ComplianceResourcesPage() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/resources/cumplimiento-normativo#page`,
        url: `${SITE_URL}/resources/cumplimiento-normativo`,
        name: 'Recursos de cumplimiento normativo en Chile',
        description: metadata.description,
        inLanguage: 'es-CL',
        publisher: { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Recursos', item: `${SITE_URL}/resources/cumplimiento-normativo` },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-extrabold tracking-[0.18em]">KUMPLIO</Link>
          <Button asChild><Link href="/sign-up">Comenzar</Link></Button>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-6 py-24 md:py-32">
          <div className="mx-auto max-w-5xl text-center">
            <BookOpen className="mx-auto h-12 w-12 text-primary" />
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Centro de recursos · Chile</p>
            <h1 className="mt-3 text-balance text-5xl font-black tracking-tight md:text-7xl">
              Información para convertir requisitos en trabajo verificable.
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Contenido público mantenido por Kumplio con fuentes identificables, lenguaje operativo y separación clara entre información general y evaluación profesional del caso concreto.
            </p>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
            {resources.map(({ icon: Icon, title, description, href, label }) => (
              <article key={title} className="flex flex-col rounded-2xl border border-border bg-card p-7">
                <Icon className="h-8 w-8 text-primary" />
                <h2 className="mt-6 text-2xl font-bold">{title}</h2>
                <p className="mt-4 flex-1 leading-relaxed text-muted-foreground">{description}</p>
                <Button variant="outline" asChild className="mt-7 justify-between">
                  <Link href={href}>{label}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-4xl font-bold">Criterios editoriales</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-bold">Fuentes identificables</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Las afirmaciones regulatorias deben relacionarse con fuentes oficiales o referencias claramente indicadas.</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-bold">Sin evidencia inventada</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">No se publican clientes, ahorros, porcentajes o resultados como reales sin respaldo verificable.</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-bold">Revisión humana</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">El contenido informativo no reemplaza asesoría jurídica ni la evaluación profesional del caso concreto.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl rounded-2xl border border-primary/30 bg-card p-10 text-center md:p-14">
            <h2 className="text-4xl font-bold">¿Necesitas estructurar un marco específico?</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Organiza obligaciones, controles, evidencia, responsables y acciones dentro de un espacio de trabajo.
            </p>
            <Button size="lg" asChild className="mt-8">
              <Link href="/sign-up">Comenzar evaluación <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <Footer />
    </div>
  )
}
