import type { Metadata } from 'next'
import Link from 'next/link'
import { Database, ExternalLink, Eye, KeyRound, LockKeyhole, ShieldCheck, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { SECURITY_PUBLIC_COPY } from '@/lib/i18n/legal-public-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'
import { N3URALIA_CANONICAL_URL, SITE_URL } from '@/lib/public-site'

const controlIcons = [LockKeyhole, UserCheck, Database, Eye, KeyRound, ShieldCheck] as const

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getPublicRequestContext()
  const copy = SECURITY_PUBLIC_COPY[locale]
  const canonical = withPublicLocale('/security', locale)

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    alternates: {
      canonical,
      languages: {
        'es-CL': withPublicLocale('/security', 'es'),
        en: withPublicLocale('/security', 'en'),
        'x-default': withPublicLocale('/security', 'es'),
      },
    },
  }
}

export default async function SecurityPage() {
  const { locale } = await getPublicRequestContext()
  const copy = SECURITY_PUBLIC_COPY[locale]
  const canonicalPath = withPublicLocale('/security', locale)
  const homeHref = getPublicSiteHref('/', locale)
  const contactHref = getPublicSiteHref('/contact', locale)
  const alternateLocale = locale === 'es' ? 'en' : 'es'
  const alternateHref = withPublicLocale('/security', alternateLocale)

  const graph = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_URL}${canonicalPath}#page`,
    url: `${SITE_URL}${canonicalPath}`,
    name: copy.graphName,
    description: copy.metadata.description,
    inLanguage: locale === 'es' ? 'es-CL' : 'en',
    publisher: { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href={homeHref} className="font-extrabold tracking-[0.18em]">KUMPLIO</Link>
          <div className="flex items-center gap-2">
            <Link href={alternateHref} hrefLang={alternateLocale === 'es' ? 'es-CL' : 'en'} className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground">{copy.nav.switchLanguage}</Link>
            <Button asChild><Link href={contactHref}>{copy.nav.contact}</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-6 py-24 md:py-32">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{copy.hero.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl text-balance text-5xl font-black tracking-tight md:text-7xl">{copy.hero.title}</h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-muted-foreground">{copy.hero.description}</p>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-3">
            {copy.controls.map(({ title, description }, index) => {
              const Icon = controlIcons[index]
              return (
                <article key={title} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                  <h2 className="mt-5 text-xl font-bold">{title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold">{copy.current.title}</h2>
            <p className="mt-4 leading-7 text-muted-foreground">{copy.current.description}</p>
            <div className="mt-6 rounded-2xl border border-border bg-card p-5">
              <p className="font-bold">{copy.current.reportTitle}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {copy.current.reportTextBeforeSecurity}{' '}
                <a className="font-semibold text-primary hover:underline" href="mailto:security@kumplio.app">security@kumplio.app</a>
                {copy.current.reportTextBetween}{' '}
                <a className="font-semibold text-primary hover:underline" href="mailto:info@kumplio.app">info@kumplio.app</a>
                {copy.current.reportTextAfterInfo}
              </p>
              <a href="/.well-known/security.txt" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                {copy.current.securityTxt} <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 text-center">
          <h2 className="mx-auto max-w-3xl text-4xl font-bold">{copy.cta.title}</h2>
          <Button size="lg" asChild className="mt-8"><Link href={contactHref}>{copy.cta.action}</Link></Button>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <Footer locale={locale} />
    </div>
  )
}
