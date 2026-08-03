import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, BrainCircuit, Braces, Building2, CheckCircle2, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import {
  N3URALIA_CANONICAL_URL,
  N3URALIA_CONTACT_REFERRAL_URL,
  N3URALIA_SOLUTIONS_REFERRAL_URL,
  SITE_URL,
} from '@/lib/public-site'

export const metadata: Metadata = {
  title: 'Kumplio y n3uralia',
  description:
    'Kumplio es un producto de cumplimiento normativo desarrollado por n3uralia, empresa chilena de IA aplicada, automatización y software para operaciones reales.',
  alternates: { canonical: '/powered-by-n3uralia' },
  openGraph: {
    type: 'website',
    url: '/powered-by-n3uralia',
    title: 'Kumplio y n3uralia',
    description: 'La relación entre el producto Kumplio y la empresa de ingeniería que lo desarrolla.',
  },
}

const capabilities = [
  {
    icon: BrainCircuit,
    title: 'IA aplicada con contexto',
    text: 'Capacidades que trabajan con fuentes, permisos, memoria y revisión humana dentro de un proceso definido.',
  },
  {
    icon: Workflow,
    title: 'Automatización gobernada',
    text: 'Flujos con responsables, decisiones, evidencia, excepciones y trazabilidad.',
  },
  {
    icon: Braces,
    title: 'Ingeniería fullstack',
    text: 'Aplicaciones web, backend, bases de datos, integraciones, observabilidad y operación continua.',
  },
  {
    icon: Building2,
    title: 'Implementación regional',
    text: 'Sistemas adaptados a equipos, normativa, presupuestos y operación de Chile y Latinoamérica.',
  },
]

export default function PoweredByN3uraliaPage() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': `${SITE_URL}/powered-by-n3uralia#page`,
        url: `${SITE_URL}/powered-by-n3uralia`,
        name: 'Kumplio y n3uralia',
        inLanguage: 'es-CL',
        about: [
          { '@id': `${SITE_URL}/#software` },
          { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
        ],
      },
      {
        '@type': 'Organization',
        '@id': `${N3URALIA_CANONICAL_URL}/#organization`,
        name: 'n3uralia',
        url: N3URALIA_CANONICAL_URL,
        makesOffer: {
          '@type': 'Offer',
          itemOffered: { '@id': `${SITE_URL}/#software` },
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-extrabold tracking-[0.18em]">KUMPLIO</Link>
          <Button variant="outline" asChild><Link href="/about">Sobre Kumplio</Link></Button>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-6 py-24 md:py-32">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Powered by n3uralia</p>
            <h1 className="mt-5 max-w-4xl text-balance text-5xl font-black leading-tight tracking-[-0.04em] md:text-7xl">
              Kumplio es desarrollado por n3uralia.
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
              Kumplio es la aplicación especializada en cumplimiento normativo e inteligencia regulatoria. N3uralia es la empresa chilena que diseña, construye y evoluciona su arquitectura de software, automatización e inteligencia artificial.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="outline" asChild>
                <a href={N3URALIA_SOLUTIONS_REFERRAL_URL} target="_blank" rel="noopener noreferrer">Ver n3uralia <ArrowUpRight className="ml-2 h-4 w-4" /></a>
              </Button>
              <Button size="lg" asChild>
                <Link href="/software-cumplimiento-chile">Conocer Kumplio <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Responsabilidades</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Producto especializado, ingeniería compartida.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Kumplio mantiene su propia propuesta de valor, experiencia y operación. N3uralia aporta la capacidad de ingeniería necesaria para desarrollar el producto y para construir soluciones más amplias cuando una organización necesita integraciones o procesos fuera del alcance estándar.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {capabilities.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl border border-border bg-card p-7">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground"><Icon className="h-5 w-5" /></div>
                  <h3 className="mt-6 text-xl font-bold">{title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Kumplio</p>
              <h2 className="mt-4 text-3xl font-extrabold">Para operar cumplimiento normativo con una plataforma especializada.</h2>
              <ul className="mt-7 space-y-4 text-muted-foreground">
                {[
                  'Preparación y operación de la Ley 21.719.',
                  'Relación entre obligaciones, controles y evidencia.',
                  'Misiones con responsables y revisión humana.',
                  'Trazabilidad de fuentes, decisiones y resultados.',
                ].map((item) => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />{item}</li>)}
              </ul>
              <Button asChild className="mt-8"><Link href="/pricing">Ver planes <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">n3uralia</p>
              <h2 className="mt-4 text-3xl font-extrabold">Para construir sistemas, integraciones o automatizaciones fuera del producto estándar.</h2>
              <ul className="mt-7 space-y-4 text-muted-foreground">
                {[
                  'Aplicaciones fullstack para procesos propios.',
                  'Integraciones con ERP, CRM y sistemas existentes.',
                  'Agentes IA y automatización para otras áreas operativas.',
                  'Arquitectura, despliegue y evolución de sistemas a medida.',
                ].map((item) => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />{item}</li>)}
              </ul>
              <Button variant="outline" asChild className="mt-8"><a href={N3URALIA_CONTACT_REFERRAL_URL} target="_blank" rel="noopener noreferrer">Contactar n3uralia <ArrowUpRight className="ml-2 h-4 w-4" /></a></Button>
            </div>
          </div>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <Footer />
    </div>
  )
}
