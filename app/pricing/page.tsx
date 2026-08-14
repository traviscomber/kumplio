import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Headphones, Layers3, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { PRICING_PUBLIC_COPY } from '@/lib/i18n/pricing-public-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'

const planIcons = {
  esencial: ShieldCheck,
  profesional: Layers3,
  acompanado: Headphones,
} as const

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getPublicRequestContext()
  const copy = PRICING_PUBLIC_COPY[locale]
  const canonical = withPublicLocale('/pricing', locale)

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    alternates: {
      canonical,
      languages: {
        'es-CL': withPublicLocale('/pricing', 'es'),
        en: withPublicLocale('/pricing', 'en'),
        'x-default': withPublicLocale('/pricing', 'es'),
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: copy.metadata.title,
      description: copy.metadata.description,
    },
  }
}

export default async function PricingPage() {
  const { locale } = await getPublicRequestContext()
  const copy = PRICING_PUBLIC_COPY[locale]
  const alternateLocale = locale === 'es' ? 'en' : 'es'
  const homeHref = getPublicSiteHref('/', locale)
  const demoHref = getPublicSiteHref('/demo', locale)
  const pricingHref = withPublicLocale('/pricing', locale)
  const alternatePricingHref = withPublicLocale('/pricing', alternateLocale)

  function planHref(id: 'esencial' | 'profesional' | 'acompanado') {
    if (id === 'acompanado') return `${getPublicSiteHref('/contact', locale)}?service=acompanado`
    return `/sign-up?plan=${id}`
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111723]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href={homeHref} aria-label="Kumplio">
            <Image src="/logo-kumplio.svg" alt="Kumplio" width={150} height={64} priority className="h-12 w-auto" />
          </Link>
          <div className="hidden items-center gap-7 lg:flex">
            <Link href={homeHref} className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.home}</Link>
            <Link href={demoHref} className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.demo}</Link>
            <Link href={pricingHref} className="text-sm font-semibold text-primary">{copy.nav.plans}</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={alternatePricingHref}
              hrefLang={alternateLocale === 'es' ? 'es-CL' : 'en'}
              className="rounded-lg border border-white/12 px-3 py-2 text-xs font-black text-white/70 transition hover:border-white/30 hover:text-white"
              aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a español'}
            >
              {copy.nav.switchLanguage}
            </Link>
            <Link href="/sign-in" className="hidden text-sm font-semibold text-white/80 hover:text-white sm:block">{copy.nav.signIn}</Link>
            <Button asChild className="hidden h-11 rounded-[10px] px-5 font-bold sm:inline-flex"><Link href="/sign-up">{copy.nav.start}</Link></Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden border-b border-white/10 px-5 pb-20 pt-36 sm:px-8 md:pb-28 md:pt-44 lg:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(184,245,66,0.12),transparent_28%),radial-gradient(circle_at_80%_35%,rgba(75,98,130,0.2),transparent_30%)]" />
          <div className="mx-auto max-w-[1050px] text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-4 py-2 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" /> {copy.hero.eyebrow}</div>
            <h1 className="mx-auto mt-7 max-w-[900px] text-balance text-4xl font-extrabold leading-tight tracking-[-0.035em] sm:text-5xl md:text-6xl">{copy.hero.title}</h1>
            <p className="mx-auto mt-6 max-w-[760px] text-pretty text-lg leading-8 text-white/60">{copy.hero.description}</p>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-5 lg:grid-cols-3">
              {copy.plans.map((plan) => {
                const Icon = planIcons[plan.id]
                return (
                  <article key={plan.id} className={`relative flex h-full flex-col rounded-[22px] border p-7 md:p-8 ${plan.highlighted ? 'border-primary bg-primary/[0.055] shadow-[0_24px_80px_rgba(184,245,66,0.08)]' : 'border-white/10 bg-card'}`}>
                    {plan.badge && <span className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{plan.badge}</span>}
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                    <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-primary">{plan.name}</p>
                    <h2 className="mt-3 text-2xl font-extrabold">{plan.outcome}</h2>
                    <p className="mt-4 min-h-[72px] text-sm leading-6 text-white/55">{plan.description}</p>
                    <div className="mt-7"><p className="text-4xl font-extrabold tracking-tight">{plan.price}</p><p className="mt-1 text-sm text-white/45">{plan.period}</p></div>
                    <Button asChild variant={plan.highlighted ? 'default' : 'outline'} className="mt-7 h-12 w-full rounded-[10px] font-bold"><Link href={planHref(plan.id)}>{plan.cta}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                    <div className="mt-8 border-t border-white/10 pt-6">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">{copy.changesLabel}</p>
                      <ul className="mt-4 space-y-3">
                        {plan.results.map((result) => <li key={result} className="flex gap-3 text-sm leading-6 text-white/65"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" /><span>{result}</span></li>)}
                      </ul>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0d131e] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1050px]">
            <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{copy.choice.eyebrow}</p><h2 className="mt-3 text-3xl font-extrabold md:text-4xl">{copy.choice.title}</h2></div>
            <div className="mt-10 space-y-4">
              {copy.choice.rows.map(([need, answer]) => <div key={need} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm leading-6 text-white/65">{need}</p><span className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{answer}</span></div>)}
            </div>
            <div className="mt-12 text-center"><p className="text-sm text-white/48">{copy.choice.note}</p></div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
