import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Headphones, Layers3, ShieldCheck } from 'lucide-react'
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
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#393833] bg-[#171715]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href={homeHref} aria-label="Kumplio">
            <Image src="/kumplio-logo-canonical.png" alt="Kumplio" width={455} height={171} priority className="h-auto w-[180px]" />
          </Link>
          <div className="hidden items-center gap-7 lg:flex">
            <Link href={homeHref} className="text-sm font-medium text-[#AAA69C] hover:text-[#C2A887]">{copy.nav.home}</Link>
            <Link href={demoHref} className="text-sm font-medium text-[#AAA69C] hover:text-[#C2A887]">{copy.nav.demo}</Link>
            <Link href={pricingHref} className="text-sm font-semibold text-primary">{copy.nav.plans}</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={alternatePricingHref}
              hrefLang={alternateLocale === 'es' ? 'es-CL' : 'en'}
              className="rounded-[4px] border border-[#393833] px-3 py-2 text-xs font-medium text-[#AAA69C] transition hover:text-[#C2A887]"
              aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a español'}
            >
              {copy.nav.switchLanguage}
            </Link>
            <Link href="/sign-in" className="hidden text-sm font-medium text-[#AAA69C] hover:text-[#C2A887] sm:block">{copy.nav.signIn}</Link>
            <Button asChild className="hidden h-11 rounded-[10px] px-5 font-bold sm:inline-flex"><Link href="/sign-up">{copy.nav.start}</Link></Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden border-b border-[#393833] bg-[#171715] px-5 pb-20 pt-36 sm:px-8 md:pb-28 md:pt-44 lg:px-12">
          <div className="mx-auto max-w-[1050px] text-center">
            <p className="text-xs font-medium uppercase tracking-[.2em] text-[#B17A4D]">{copy.hero.eyebrow}</p>
            <h1 className="mx-auto mt-7 max-w-[900px] text-balance text-4xl font-light leading-tight tracking-[-0.035em] text-[#C2A887] sm:text-5xl md:text-6xl">{copy.hero.title}</h1>
            <p className="mx-auto mt-6 max-w-[760px] text-pretty text-lg leading-8 text-[#AAA69C]">{copy.hero.description}</p>
            <div className="mx-auto mt-10 max-w-[760px] border-y border-[#393833] py-7 text-left">
              <p className="text-sm font-medium text-[#C2A887]">Kumplio Core</p>
              <p className="mt-2 text-sm leading-7 text-[#AAA69C]">{locale === 'es' ? 'La plataforma compartida. Comienza con Kumplio Core y activa las áreas que necesita tu operación: Protección de Datos, Minería, Transporte, Construcción, Salud y Agroindustria.' : 'The shared platform. Start with Kumplio Core and activate the areas your operation needs: Data Protection, Mining, Transport, Construction, Healthcare and Agribusiness.'}</p>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-5 lg:grid-cols-3">
              {copy.plans.map((plan) => {
                const Icon = planIcons[plan.id]
                return (
                  <article key={plan.id} className={`relative flex h-full flex-col rounded-[4px] border p-7 md:p-8 ${plan.highlighted ? 'border-primary bg-primary/[0.035]' : 'border-[#393833] bg-[#20201D]'}`}>
                    {plan.badge && <span className="absolute right-6 top-6 rounded-[3px] bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">{plan.badge}</span>}
                    <div className="flex h-11 w-11 items-center justify-center rounded-[4px] border border-primary/20 bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                    <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-primary">{plan.name}</p>
                    <h2 className="mt-3 text-2xl font-light text-[#C2A887]">{plan.outcome}</h2>
                    <p className="mt-4 min-h-[72px] text-sm leading-6 text-[#AAA69C]">{plan.description}</p>
                    <div className="mt-7"><p className="text-4xl font-light tracking-tight text-[#C2A887]">{plan.price}</p><p className="mt-1 text-sm text-[#747169]">{plan.period}</p></div>
                    <Button asChild variant={plan.highlighted ? 'default' : 'outline'} className="mt-7 h-12 w-full rounded-[10px] font-bold"><Link href={planHref(plan.id)}>{plan.cta}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                    <div className="mt-8 border-t border-white/10 pt-6">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#747169]">{copy.changesLabel}</p>
                      <ul className="mt-4 space-y-3">
                        {plan.results.map((result) => <li key={result} className="flex gap-3 text-sm leading-6 text-[#AAA69C]"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" /><span>{result}</span></li>)}
                      </ul>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-[#393833] bg-[#20201D] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1050px]">
            <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{copy.choice.eyebrow}</p><h2 className="mt-3 text-3xl font-extrabold md:text-4xl">{copy.choice.title}</h2></div>
            <div className="mt-10 space-y-4">
              {copy.choice.rows.map(([need, answer]) => <div key={need} className="flex flex-col gap-4 border-t border-[#393833] py-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm leading-6 text-[#AAA69C]">{need}</p><span className="w-fit text-sm font-medium text-primary">{answer}</span></div>)}
            </div>
            <div className="mt-12 text-center"><p className="text-sm text-[#747169]">{copy.choice.note}</p></div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
