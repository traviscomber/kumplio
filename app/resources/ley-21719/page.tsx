import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarClock, ExternalLink, Scale, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { chileComplianceGuides, officialLey21719Reference } from '@/lib/chile-compliance-content'
import { N3URALIA_CANONICAL_URL, SITE_URL } from '@/lib/public-site'

const guideImages = [
  '/brand/law-21719-principles.webp',
  '/brand/law-21719-data-subject-rights.webp',
  '/brand/law-21719-processors-providers.webp',
  '/brand/law-21719-impact-assessment.webp',
  '/brand/law-21719-prevention-model.webp',
] as const

export const metadata: Metadata = {
  title: 'Guías de la Ley 21.719 para empresas en Chile',
  description:
    'Centro de recursos sobre la Ley 21.719: principios, derechos de titulares, encargados, evaluación de impacto y modelo de prevención para empresas chilenas.',
  keywords: [
    'Ley 21.719 guía empresas',
    'nueva ley datos personales Chile',
    'cumplimiento protección de datos Chile',
    'derechos titulares Ley 21.719',
    'evaluación impacto datos Chile',
    'modelo prevención Ley 21.719',
  ],
  alternates: { canonical: '/resources/ley-21719' },
  openGraph: {
    type: 'website',
    url: '/resources/ley-21719',
    title: 'Guías de la Ley 21.719 para empresas en Chile | Kumplio',
    description: 'Explicaciones prácticas con referencia al texto oficial, evidencia esperada y pasos de implementación.',
  },
}

export default function Ley21719ResourcesPage() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/resources/ley-21719#page`,
        url: `${SITE_URL}/resources/ley-21719`,
        name: 'Guías de la Ley 21.719 para empresas en Chile',
        description: metadata.description,
        inLanguage: 'es-CL',
        publisher: { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
        hasPart: chileComplianceGuides.map((guide) => ({
          '@type': 'Article',
          name: guide.title,
          url: `${SITE_URL}/resources/ley-21719/${guide.slug}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Recursos', item: `${SITE_URL}/resources/cumplimiento-normativo` },
          { '@type': 'ListItem', position: 3, name: 'Ley 21.719', item: `${SITE_URL}/resources/ley-21719` },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Kumplio, volver al inicio" className="block">
            <Image src="/kumplio-logo-canonical.png" alt="Kumplio" width={455} height={171} priority className="h-auto w-[172px] object-contain sm:w-[190px]" />
          </Link>
          <Button asChild size="lg"><Link href="/features/ley-21719">Ver solución</Link></Button>
        </div>
      </header>

      <main>
        <section className="relative min-h-[720px] overflow-hidden border-b border-border px-6 py-24 md:py-32">
          <Image src="/brand/law-21719-hero.webp" alt="" fill priority sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#171715_0%,rgba(23,23,21,.96)_38%,rgba(23,23,21,.28)_76%),linear-gradient(0deg,#171715_0%,transparent_48%)]" />
          <div className="relative mx-auto max-w-[1440px] lg:px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
              <BookOpen className="h-4 w-4" /> Centro de conocimiento · Chile
            </div>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-black leading-tight tracking-[-0.04em] md:text-7xl">
              Ley 21.719: guías prácticas para preparar la operación.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#C8BCAA] md:text-xl">
              Explicaciones orientadas a empresas chilenas sobre obligaciones, procesos y evidencia. Cada guía indica su fundamento legal y separa información general de la evaluación concreta que debe realizar cada organización.
            </p>
            <div className="mt-8 flex max-w-3xl flex-wrap gap-3 text-sm text-[#C8BCAA]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#171715]/85 px-4 py-2 backdrop-blur-md"><Scale className="h-4 w-4 text-primary" /> Ley 21.719</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#171715]/85 px-4 py-2 backdrop-blur-md"><CalendarClock className="h-4 w-4 text-primary" /> Vigencia general: 1 de diciembre de 2026</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#171715]/85 px-4 py-2 backdrop-blur-md"><ShieldCheck className="h-4 w-4 text-primary" /> Revisión humana requerida</span>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/30 px-6 py-14">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-5 lg:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold">Fuente legal principal</p>
              <p className="mt-1 text-sm text-muted-foreground">Texto oficial disponible en la Biblioteca del Congreso Nacional de Chile.</p>
            </div>
            <a href={officialLey21719Reference.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
              Consultar texto oficial <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-[1440px] lg:px-6">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Temas prioritarios</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Cinco frentes para comenzar la preparación.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                El alcance de cada obligación depende del tratamiento, el riesgo y el contexto de la empresa. Estas guías ayudan a ordenar las primeras preguntas y la evidencia necesaria.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              {chileComplianceGuides.map((guide, index) => (
                <article key={guide.slug} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_60px_rgba(0,0,0,.22)] last:lg:col-span-2">
                  <div className="relative h-56 overflow-hidden border-b border-border sm:h-64">
                    <Image src={guideImages[index]} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(32,32,29,.9)_100%)]" />
                    <p className="absolute bottom-5 left-7 text-xs font-bold uppercase tracking-[0.18em] text-[#C5E052]">Guía {String(index + 1).padStart(2, '0')}</p>
                  </div>
                  <div className="flex flex-1 flex-col p-7">
                    <h3 className="text-2xl font-extrabold">{guide.shortTitle}</h3>
                    <p className="mt-3 flex-1 leading-7 text-muted-foreground">{guide.description}</p>
                    <p className="mt-5 border-t border-border pt-5 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Fundamento:</strong> {guide.legalBasis}</p>
                    <Link href={`/resources/ley-21719/${guide.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                      Leer guía <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-24">
          <div className="mx-auto max-w-[1200px]">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Uso responsable</p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight">Qué entregan y qué no entregan estas guías.</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold">Ayudan a</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  {['Entender la estructura general de la ley.', 'Identificar procesos y evidencia que deben revisarse.', 'Preparar preguntas para responsables internos y asesores.', 'Convertir la preparación en un plan de trabajo.'].map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold">No reemplazan</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  {['La evaluación jurídica del caso concreto.', 'La determinación automática de cumplimiento.', 'La revisión de contratos, sistemas y riesgos reales.', 'Las decisiones del responsable o de la autoridad competente.'].map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 text-center">
          <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">Convierte la lectura en un plan ejecutable.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Kumplio organiza obligaciones, responsables, controles, evidencia y revisiones dentro de un mismo espacio de trabajo.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild><Link href="/sign-up">Comenzar evaluación <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/software-cumplimiento-chile">Conocer la plataforma</Link></Button>
          </div>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <Footer />
    </div>
  )
}
