import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, BrainCircuit, Braces, Building2, CheckCircle2, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { POWERED_PUBLIC_COPY } from '@/lib/i18n/institutional-public-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'
import {
  N3URALIA_CANONICAL_URL,
  N3URALIA_CONTACT_REFERRAL_URL,
  N3URALIA_FACTORY_DESCRIPTION,
  N3URALIA_SOLUTIONS_REFERRAL_URL,
  SITE_URL,
} from '@/lib/public-site'

const capabilityIcons = [BrainCircuit, Workflow, Braces, Building2] as const

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getPublicRequestContext()
  const copy = POWERED_PUBLIC_COPY[locale]
  const canonical = withPublicLocale('/powered-by-n3uralia', locale)

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    alternates: {
      canonical,
      languages: {
        'es-CL': withPublicLocale('/powered-by-n3uralia', 'es'),
        en: withPublicLocale('/powered-by-n3uralia', 'en'),
        'x-default': withPublicLocale('/powered-by-n3uralia', 'es'),
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: copy.metadata.title,
      description: copy.metadata.ogDescription,
    },
  }
}

export default async function PoweredByN3uraliaPage() {
  const { locale } = await getPublicRequestContext()
  const copy = POWERED_PUBLIC_COPY[locale]
  const canonicalPath = withPublicLocale('/powered-by-n3uralia', locale)
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const homeHref = getPublicSiteHref('/', locale)
  const aboutHref = getPublicSiteHref('/about', locale)
  const productHref = getPublicSiteHref('/software-cumplimiento-chile', locale)
  const pricingHref = getPublicSiteHref('/pricing', locale)
  const alternateLocale = locale === 'es' ? 'en' : 'es'
  const alternateHref = withPublicLocale('/powered-by-n3uralia', alternateLocale)

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': `${canonicalUrl}#page`,
        url: canonicalUrl,
        name: copy.graph.pageName,
        description: copy.graph.pageDescription,
        inLanguage: locale === 'es' ? 'es-CL' : 'en',
        about: [
          { '@id': `${SITE_URL}/#software` },
          { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
        ],
      },
      {
        '@type': 'Organization',
        '@id': `${N3URALIA_CANONICAL_URL}/#organization`,
        name: 'n3uralia',
        alternateName: 'N3uralia',
        url: N3URALIA_CANONICAL_URL,
        description: N3URALIA_FACTORY_DESCRIPTION,
        areaServed: [
          { '@type': 'Country', name: 'Chile' },
          { '@type': 'Place', name: copy.graph.region },
        ],
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
          <Link href={homeHref} className="font-extrabold tracking-[0.18em]">KUMPLIO</Link>
          <div className="flex items-center gap-2">
            <Link href={alternateHref} hrefLang={alternateLocale === 'es' ? 'es-CL' : 'en'} className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground">{copy.nav.switchLanguage}</Link>
            <Button variant="outline" asChild><Link href={aboutHref}>{copy.nav.about}</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-6 py-24 md:py-32">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{copy.hero.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-balance text-5xl font-black leading-tight tracking-[-0.04em] md:text-7xl">{copy.hero.title}</h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">{copy.hero.description}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="outline" asChild><a href={N3URALIA_SOLUTIONS_REFERRAL_URL} target="_blank" rel="noopener noreferrer">{copy.hero.n3uralia} <ArrowUpRight className="ml-2 h-4 w-4" /></a></Button>
              <Button size="lg" asChild><Link href={productHref}>{copy.hero.kumplio} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{copy.responsibilities.eyebrow}</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">{copy.responsibilities.title}</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">{copy.responsibilities.description}</p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {copy.responsibilities.capabilities.map(({ title, description }, index) => {
                const Icon = capabilityIcons[index]
                return (
                  <article key={title} className="rounded-2xl border border-border bg-card p-7">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground"><Icon className="h-5 w-5" /></div>
                    <h3 className="mt-6 text-xl font-bold">{title}</h3>
                    <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{copy.comparison.kumplioDescription}</p>
              <h2 className="mt-4 text-3xl font-extrabold">{copy.comparison.kumplioTitle}</h2>
              <ul className="mt-7 space-y-4 text-muted-foreground">
                {copy.comparison.kumplioItems.map((item) => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />{item}</li>)}
              </ul>
              <Button asChild className="mt-8"><Link href={pricingHref}>{copy.comparison.kumplioAction} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{copy.comparison.n3uraliaDescription}</p>
              <h2 className="mt-4 text-3xl font-extrabold">{copy.comparison.n3uraliaTitle}</h2>
              <ul className="mt-7 space-y-4 text-muted-foreground">
                {copy.comparison.n3uraliaItems.map((item) => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />{item}</li>)}
              </ul>
              <Button variant="outline" asChild className="mt-8"><a href={N3URALIA_CONTACT_REFERRAL_URL} target="_blank" rel="noopener noreferrer">{copy.comparison.n3uraliaAction} <ArrowUpRight className="ml-2 h-4 w-4" /></a></Button>
            </div>
          </div>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <Footer locale={locale} />
    </div>
  )
}
