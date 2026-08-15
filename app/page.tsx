import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { PublicWorkspacePreview } from '@/components/marketing/public-workspace-preview'
import { ResolutionEntry } from '@/components/marketing/resolution-entry'
import { HOME_PUBLIC_COPY } from '@/lib/i18n/home-public-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'

export default async function HomePage() {
  const { locale } = await getPublicRequestContext()
  const copy = HOME_PUBLIC_COPY[locale]
  const homeHref = withPublicLocale('/', locale)
  const pricingHref = getPublicSiteHref('/pricing', locale)
  const demoHref = getPublicSiteHref('/demo', locale)
  const alternateLocale = locale === 'es' ? 'en' : 'es'
  const alternateHomeHref = withPublicLocale('/', alternateLocale)

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111723]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href={homeHref} aria-label="Kumplio">
            <Image src="/logo-kumplio.svg" alt="Kumplio" width={150} height={64} priority className="h-12 w-auto" />
          </Link>
          <div className="hidden items-center gap-6 lg:flex">
            <a href="#producto" className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.dataProtection}</a>
            <Link href={demoHref} className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.guide}</Link>
            <a href="#casos" className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.specialists}</a>
            <a href="#seguridad" className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.security}</a>
            <Link href={pricingHref} className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.plans}</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={alternateHomeHref}
              hrefLang={alternateLocale === 'es' ? 'es-CL' : 'en'}
              className="rounded-lg border border-white/12 px-3 py-2 text-xs font-black text-white/70 transition hover:border-white/30 hover:text-white"
              aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a español'}
            >
              {copy.nav.switchLanguage}
            </Link>
            <Link href="/sign-in" className="hidden text-sm font-semibold text-white/80 hover:text-white sm:block">{copy.nav.signIn}</Link>
            <Button asChild className="hidden h-11 rounded-[10px] px-5 font-black sm:inline-flex">
              <a href="#resolver">{copy.nav.resolve}</a>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section id="resolver" className="relative border-b border-white/10 px-5 pb-20 pt-36 sm:px-8 md:pb-28 md:pt-44 lg:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(184,245,66,0.13),transparent_27%),radial-gradient(circle_at_84%_20%,rgba(75,98,130,0.22),transparent_31%)]" />
          <div className="mx-auto grid max-w-[1440px] items-center gap-14 lg:grid-cols-[0.96fr_1.04fr] lg:gap-20">
            <div>
              <p className="text-sm font-black text-primary">{copy.hero.eyebrow}</p>
              <h1 className="mt-6 max-w-[860px] text-balance text-[44px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[58px] md:text-[72px]">
                {copy.hero.title}
              </h1>
              <p className="mt-7 max-w-[740px] text-pretty text-[17px] leading-8 text-white/62 sm:text-lg">
                {copy.hero.description}
              </p>
              <div className="mt-9 grid max-w-[860px] gap-3 text-sm text-white/58 sm:grid-cols-3">
                {copy.hero.proofs.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-8 max-w-2xl text-sm leading-7 text-white/42">{copy.hero.note}</p>
            </div>
            <ResolutionEntry locale={locale} />
          </div>
        </section>

        <section id="producto" className="border-b border-white/10 bg-[#0d131e] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                  {locale === 'es' ? 'Producto, no promesa' : 'Product, not a promise'}
                </p>
                <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
                  {locale === 'es' ? 'Mira cómo se transforma una situación en trabajo revisable.' : 'See how a situation becomes reviewable work.'}
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/55">
                  {locale === 'es'
                    ? 'Este preview usa datos ficticios. Cambia el escenario y recorre cómo Kumplio conecta objetivo, prioridad, reservas, evidencia y revisión humana antes de avanzar.'
                    : 'This preview uses fictional data. Change the scenario and see how Kumplio connects the objective, priority, reservations, evidence and human review before moving forward.'}
                </p>
                <Button asChild variant="outline" className="mt-7 h-12 rounded-[10px] px-6 font-black">
                  <Link href={demoHref}>{locale === 'es' ? 'Abrir demo navegable' : 'Open interactive demo'} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
              <PublicWorkspacePreview locale={locale} mode="compact" />
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.solution.eyebrow}</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">{copy.solution.title}</h2>
              <p className="mt-6 max-w-3xl text-base leading-8 text-white/55">{copy.solution.description}</p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {copy.solution.layers.map((item, index) => (
                <article key={item.title} className="rounded-[22px] border border-white/10 bg-card p-6">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">0{index + 1}</p>
                  <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="casos" className="border-b border-white/10 bg-[#0d131e] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.scenarios.eyebrow}</p>
                <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">{copy.scenarios.title}</h2>
              </div>
              <p className="max-w-2xl text-base leading-8 text-white/50 lg:justify-self-end">
                {locale === 'es'
                  ? 'No necesitas saber qué módulo usar. Empieza por lo que está pasando y Kumplio organiza el contexto, las capacidades y la revisión necesarias.'
                  : 'You do not need to know which module to use. Start with what is happening and Kumplio organizes the context, capabilities and review that are needed.'}
              </p>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {copy.scenarios.items.map((scenario) => (
                <article key={scenario.label} className="group rounded-[24px] border border-white/10 bg-card p-7 transition hover:-translate-y-1 hover:border-primary/25">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{scenario.label}</p>
                  <h3 className="mt-5 text-2xl font-black leading-tight">{scenario.title}</h3>
                  <div className="mt-6 space-y-3">
                    {scenario.examples.map((example) => (
                      <div key={example} className="flex items-center gap-3 text-sm text-white/55">
                        <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                        <span>{example}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="seguridad" className="border-b border-white/10 px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <ShieldCheck className="h-10 w-10 text-primary" />
              <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.security.eyebrow}</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">{copy.security.title}</h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/55">{copy.security.description}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/55">{locale === 'es' ? 'Fuentes trazables' : 'Traceable sources'}</span>
                <span className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/55">{locale === 'es' ? 'Contexto por organización' : 'Organization-scoped context'}</span>
                <span className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/55">{locale === 'es' ? 'Revisión humana' : 'Human review'}</span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {copy.security.cards.map(({ title, description }) => (
                <article key={title} className="rounded-[22px] border border-white/10 bg-card p-6">
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-5 py-24 text-center sm:px-8 md:py-32 lg:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_80%,rgba(184,245,66,0.10),transparent_28%)]" />
          <div className="mx-auto max-w-4xl">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.cta.eyebrow}</p>
            <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-[-0.035em] md:text-6xl">{copy.cta.title}</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/55">{copy.cta.description}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-13 rounded-[10px] px-8 font-black">
                <a href="#resolver">{copy.cta.action} <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-13 rounded-[10px] px-8 font-black">
                <Link href={demoHref}>{locale === 'es' ? 'Explorar demo' : 'Explore demo'}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
