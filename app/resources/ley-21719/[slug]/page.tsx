import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, FileCheck2, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { chileComplianceGuides, guideBySlug, officialLey21719Reference } from '@/lib/chile-compliance-content'
import { N3URALIA_CANONICAL_URL, SITE_URL } from '@/lib/public-site'

type GuidePageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return chileComplianceGuides.map((guide) => ({ slug: guide.slug }))
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = guideBySlug.get(slug)
  if (!guide) return {}

  return {
    title: guide.seoTitle,
    description: guide.description,
    alternates: { canonical: `/resources/ley-21719/${guide.slug}` },
    openGraph: {
      type: 'article',
      url: `/resources/ley-21719/${guide.slug}`,
      title: guide.title,
      description: guide.description,
      locale: 'es_CL',
      publishedTime: '2026-08-03T00:00:00-04:00',
      modifiedTime: '2026-08-03T00:00:00-04:00',
      authors: [N3URALIA_CANONICAL_URL],
    },
  }
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params
  const guide = guideBySlug.get(slug)
  if (!guide) notFound()

  const related = guide.relatedSlugs
    .map((relatedSlug) => guideBySlug.get(relatedSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const pageUrl = `${SITE_URL}/resources/ley-21719/${guide.slug}`
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${pageUrl}#article`,
        url: pageUrl,
        headline: guide.title,
        description: guide.description,
        inLanguage: 'es-CL',
        datePublished: '2026-08-03',
        dateModified: '2026-08-03',
        author: {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#brand`,
          name: 'Kumplio',
          url: SITE_URL,
        },
        publisher: { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
        isPartOf: { '@id': `${SITE_URL}/resources/ley-21719#page` },
        citation: [officialLey21719Reference.url],
        about: ['Ley 21.719', 'Protección de datos personales', guide.shortTitle],
        mainEntityOfPage: { '@id': `${pageUrl}#page` },
      },
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#page`,
        url: pageUrl,
        name: guide.title,
        inLanguage: 'es-CL',
        primaryImageOfPage: { '@id': `${SITE_URL}/opengraph-image` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Ley 21.719', item: `${SITE_URL}/resources/ley-21719` },
          { '@type': 'ListItem', position: 3, name: guide.shortTitle, item: pageUrl },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/resources/ley-21719" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Guías Ley 21.719
          </Link>
          <Button asChild><Link href="/sign-up">Preparar mi organización</Link></Button>
        </div>
      </header>

      <main>
        <article>
          <header className="border-b border-border px-6 py-20 md:py-28">
            <div className="mx-auto max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Ley 21.719 · Guía práctica</p>
              <h1 className="mt-5 text-balance text-5xl font-black leading-tight tracking-[-0.04em] md:text-6xl">{guide.title}</h1>
              <p className="mt-7 text-lg leading-8 text-muted-foreground md:text-xl">{guide.description}</p>
              <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Fundamento legal</p>
                <p className="mt-2 text-sm leading-6">{guide.legalBasis}</p>
              </div>
            </div>
          </header>

          <section className="border-b border-border bg-primary/[0.045] px-6 py-16">
            <div className="mx-auto max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Respuesta directa</p>
              <p className="mt-4 text-2xl font-semibold leading-10 tracking-tight">{guide.directAnswer}</p>
            </div>
          </section>

          <section className="px-6 py-20">
            <div className="mx-auto grid max-w-5xl gap-14 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <Scale className="h-8 w-8 text-primary" />
                <h2 className="mt-5 text-3xl font-extrabold">Puntos clave</h2>
                <p className="mt-4 leading-7 text-muted-foreground">Aspectos que una organización debería identificar antes de diseñar su proceso de implementación.</p>
              </div>
              <ul className="space-y-3">
                {guide.keyPoints.map((item) => (
                  <li key={item} className="flex gap-3 rounded-xl border border-border bg-card p-4 leading-7">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="border-y border-border bg-muted/30 px-6 py-20">
            <div className="mx-auto max-w-5xl">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Implementación</p>
                <h2 className="mt-4 text-4xl font-extrabold tracking-tight">Cómo convertir el requisito en trabajo.</h2>
              </div>
              <ol className="mt-10 space-y-3">
                {guide.implementationSteps.map((step, index) => (
                  <li key={step} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-[44px_1fr] sm:items-start">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
                    <p className="pt-1 leading-7">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="px-6 py-20">
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
                <div>
                  <FileCheck2 className="h-8 w-8 text-primary" />
                  <h2 className="mt-5 text-3xl font-extrabold">Evidencia esperada</h2>
                  <p className="mt-4 leading-7 text-muted-foreground">Ejemplos de respaldos que ayudan a demostrar que el proceso fue diseñado, ejecutado y revisado.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {guide.evidenceExamples.map((item) => (
                    <div key={item} className="rounded-xl border border-border bg-card p-4 text-sm leading-6">{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-border bg-muted/30 px-6 py-16">
            <div className="mx-auto flex max-w-5xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold">Texto oficial de referencia</p>
                <p className="mt-1 text-sm text-muted-foreground">Biblioteca del Congreso Nacional de Chile. Revisa siempre la versión vigente.</p>
              </div>
              <a href={officialLey21719Reference.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                Abrir fuente oficial <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </section>

          <section className="px-6 py-20">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-3xl font-extrabold">Guías relacionadas</h2>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {related.map((item) => (
                  <Link key={item.slug} href={`/resources/ley-21719/${item.slug}`} className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
                    <p className="font-bold">{item.shortTitle}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">Leer guía <ArrowRight className="h-4 w-4" /></span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-border bg-card px-6 py-20 text-center">
            <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight">Organiza esta preparación dentro de un workspace.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Kumplio conecta fuentes, responsables, controles, evidencia y decisiones sin declarar cumplimiento automático.</p>
            <Button size="lg" asChild className="mt-8"><Link href="/sign-up">Comenzar <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </section>
        </article>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <Footer />
    </div>
  )
}
