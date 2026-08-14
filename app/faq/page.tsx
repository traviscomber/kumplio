import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ExternalLink, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { FAQ_PUBLIC_COPY } from '@/lib/i18n/faq-public-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'
import { N3URALIA_CANONICAL_URL, N3URALIA_REFERRAL_URL, SITE_URL } from '@/lib/public-site'

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getPublicRequestContext()
  const copy = FAQ_PUBLIC_COPY[locale]
  const canonical = withPublicLocale('/faq', locale)

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    alternates: {
      canonical,
      languages: {
        'es-CL': withPublicLocale('/faq', 'es'),
        en: withPublicLocale('/faq', 'en'),
        'x-default': withPublicLocale('/faq', 'es'),
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: copy.metadata.openGraphTitle,
      description: copy.metadata.openGraphDescription,
    },
  }
}

export default async function FaqPage() {
  const { locale } = await getPublicRequestContext()
  const copy = FAQ_PUBLIC_COPY[locale]
  const allFaqs = copy.sections.flatMap((section) => section.items)
  const canonicalPath = withPublicLocale('/faq', locale)
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const homeHref = getPublicSiteHref('/', locale)
  const contactHref = getPublicSiteHref('/contact', locale)
  const alternateLocale = locale === 'es' ? 'en' : 'es'
  const alternateFaqHref = withPublicLocale('/faq', alternateLocale)

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#page`,
        url: canonicalUrl,
        name: copy.metadata.openGraphTitle,
        inLanguage: locale === 'es' ? 'es-CL' : 'en',
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
          { '@type': 'ListItem', position: 1, name: copy.breadcrumbs.home, item: `${SITE_URL}${homeHref}` },
          { '@type': 'ListItem', position: 2, name: copy.breadcrumbs.faq, item: canonicalUrl },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href={homeHref} className="font-extrabold tracking-[0.18em]">KUMPLIO</Link>
          <div className="flex items-center gap-2">
            <Link
              href={alternateFaqHref}
              hrefLang={alternateLocale === 'es' ? 'es-CL' : 'en'}
              className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition hover:text-foreground"
              aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a español'}
            >
              {copy.header.switchLanguage}
            </Link>
            <Button asChild><Link href={contactHref}>{copy.header.contact}</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-6 py-24 md:py-32">
          <div className="mx-auto max-w-5xl text-center">
            <HelpCircle className="mx-auto h-11 w-11 text-primary" />
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-primary">{copy.hero.eyebrow}</p>
            <h1 className="mt-4 text-balance text-5xl font-black tracking-[-0.04em] md:text-7xl">{copy.hero.title}</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">{copy.hero.description}</p>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl space-y-16">
            {copy.sections.map((section) => (
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
              <h2 className="text-2xl font-extrabold">{copy.custom.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.custom.description}</p>
            </div>
            <a href={N3URALIA_REFERRAL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
              {copy.custom.action} <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </section>

        <section className="px-6 py-24 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight">{copy.cta.title}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{copy.cta.description}</p>
          <Button size="lg" asChild className="mt-8"><Link href={contactHref}>{copy.cta.action} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <Footer locale={locale} />
    </div>
  )
}
