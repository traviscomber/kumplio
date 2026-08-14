import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Eye, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { THINKING_PUBLIC_COPY } from '@/lib/i18n/institutional-public-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'

const principleIcons = [Eye, ShieldCheck, CheckCircle2] as const

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getPublicRequestContext()
  const copy = THINKING_PUBLIC_COPY[locale]
  const canonical = withPublicLocale('/como-pensamos', locale)

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    alternates: {
      canonical,
      languages: {
        'es-CL': withPublicLocale('/como-pensamos', 'es'),
        en: withPublicLocale('/como-pensamos', 'en'),
        'x-default': withPublicLocale('/como-pensamos', 'es'),
      },
    },
    openGraph: {
      type: 'article',
      url: canonical,
      title: copy.metadata.title,
      description: copy.metadata.ogDescription,
    },
  }
}

export default async function ComoPensamosPage() {
  const { locale } = await getPublicRequestContext()
  const copy = THINKING_PUBLIC_COPY[locale]
  const homeHref = getPublicSiteHref('/', locale)
  const alternateLocale = locale === 'es' ? 'en' : 'es'
  const alternateHref = withPublicLocale('/como-pensamos', alternateLocale)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <section className="relative overflow-hidden border-b border-border px-6 pb-24 pt-28 md:pb-32 md:pt-36">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(184,245,66,0.10),transparent_30%),radial-gradient(circle_at_80%_25%,rgba(70,95,130,0.15),transparent_28%)]" />
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" /> {copy.hero.badge}</div>
              <Link href={alternateHref} hrefLang={alternateLocale === 'es' ? 'es-CL' : 'en'} className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground">{alternateLocale === 'en' ? 'English' : 'Español'}</Link>
            </div>

            <h1 className="mt-7 max-w-4xl text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] sm:text-5xl md:text-6xl">{copy.hero.title}</h1>
            <p className="mt-7 max-w-3xl text-pretty text-lg leading-8 text-muted-foreground">{copy.hero.description}</p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-[10px] font-bold"><Link href="/sign-up">{copy.hero.start} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="rounded-[10px]"><Link href={`${homeHref}#guia`}>{copy.hero.how}</Link></Button>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 md:py-32">
          <div className="container mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{copy.simplify.eyebrow}</p>
              <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl md:text-5xl">{copy.simplify.title}</h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {copy.simplify.principles.map(({ title, description }, index) => {
                const Icon = principleIcons[index]
                return (
                  <article key={title} className="rounded-[20px] border border-border bg-card p-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                    <h3 className="mt-6 text-xl font-bold">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/20 px-6 py-24 md:py-32">
          <div className="container mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{copy.workflow.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl">{copy.workflow.title}</h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">{copy.workflow.description}</p>
            </div>

            <div className="space-y-3">
              {copy.workflow.steps.map(({ title, description }, index) => (
                <div key={title} className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[56px_1fr] sm:items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">{index + 1}</div>
                  <div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24 text-center md:py-32">
          <div className="container mx-auto max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{copy.responsibility.eyebrow}</p>
            <h2 className="mt-5 text-balance text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl md:text-5xl">{copy.responsibility.title}</h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">{copy.responsibility.description}</p>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  )
}
