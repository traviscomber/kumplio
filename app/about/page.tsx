import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, FileCheck2, Scale, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { ABOUT_PUBLIC_COPY } from '@/lib/i18n/institutional-public-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'

const principleIcons = [Scale, ShieldCheck, FileCheck2, CheckCircle2] as const

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getPublicRequestContext()
  const copy = ABOUT_PUBLIC_COPY[locale]
  const canonical = withPublicLocale('/about', locale)

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    alternates: {
      canonical,
      languages: {
        'es-CL': withPublicLocale('/about', 'es'),
        en: withPublicLocale('/about', 'en'),
        'x-default': withPublicLocale('/about', 'es'),
      },
    },
    openGraph: {
      title: copy.metadata.ogTitle,
      description: copy.metadata.ogDescription,
      url: canonical,
      type: 'website',
    },
  }
}

export default async function AboutPage() {
  const { locale } = await getPublicRequestContext()
  const copy = ABOUT_PUBLIC_COPY[locale]
  const homeHref = getPublicSiteHref('/', locale)
  const alternateLocale = locale === 'es' ? 'en' : 'es'
  const alternateHref = withPublicLocale('/about', alternateLocale)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href={homeHref} className="font-bold">KUMPLIO</Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={alternateHref}
              hrefLang={alternateLocale === 'es' ? 'es-CL' : 'en'}
              className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition hover:text-foreground"
            >
              {copy.nav.switchLanguage}
            </Link>
            <Button variant="ghost" asChild><Link href={homeHref}>{copy.nav.home}</Link></Button>
            <Button asChild><Link href="/sign-up">{copy.nav.action}</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-6 py-24 md:py-32">
          <div className="mx-auto max-w-5xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">{copy.hero.eyebrow}</p>
            <h1 className="max-w-4xl text-balance text-5xl font-black tracking-tight md:text-7xl">{copy.hero.title}</h1>
            <p className="mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">{copy.hero.description}</p>
          </div>
        </section>

        <section className="border-b border-border bg-muted/30 px-6 py-20">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{copy.problem.eyebrow}</p>
              <h2 className="mt-3 text-4xl font-bold">{copy.problem.title}</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{copy.problem.description}</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{copy.approach.eyebrow}</p>
              <h2 className="mt-3 text-4xl font-bold">{copy.approach.title}</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{copy.approach.description}</p>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">{copy.principles.eyebrow}</p>
              <h2 className="text-4xl font-bold md:text-5xl">{copy.principles.title}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {copy.principles.items.map(({ title, description }, index) => {
                const Icon = principleIcons[index]
                return (
                  <article key={title} className="rounded-xl border border-border bg-card p-6">
                    <Icon className="h-7 w-7 text-primary" />
                    <h3 className="mt-5 text-xl font-bold">{title}</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-4xl font-bold">{copy.scope.title}</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {[copy.scope.helps, copy.scope.doesNotReplace].map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-3 text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl rounded-2xl border border-primary/30 bg-card p-10 text-center md:p-14">
            <h2 className="text-4xl font-bold">{copy.cta.title}</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">{copy.cta.description}</p>
            <Button size="lg" asChild className="mt-8"><Link href="/sign-up">{copy.cta.action} <ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  )
}
