import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Eye, FileCheck2, SearchCheck, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { ResolutionEntry } from '@/components/marketing/resolution-entry'
import { HOME_CLARITY_COPY } from '@/lib/i18n/home-clarity-copy'
import { HOME_PUBLIC_COPY } from '@/lib/i18n/home-public-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'

const journeyIcons = [ArrowRight, SearchCheck, FileCheck2, Users, CheckCircle2] as const
const workflowIcons = [SearchCheck, FileCheck2, Eye] as const
const coreSpecialistNames = ['Isidora', 'Verónica', 'Julieta'] as const

export default async function HomePage() {
  const { locale } = await getPublicRequestContext()
  const copy = HOME_CLARITY_COPY[locale]
  const publicCopy = HOME_PUBLIC_COPY[locale]
  const homeHref = withPublicLocale('/', locale)
  const pricingHref = getPublicSiteHref('/pricing', locale)
  const resourcesHref = getPublicSiteHref('/resources/ley-21719', locale)
  const alternateLocale = locale === 'es' ? 'en' : 'es'
  const alternateHomeHref = withPublicLocale('/', alternateLocale)

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111723]/94 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href={homeHref} aria-label="Kumplio">
            <Image src="/logo-kumplio.svg" alt="Kumplio" width={150} height={64} priority className="h-12 w-auto" />
          </Link>
          <div className="hidden items-center gap-6 lg:flex">
            <a href="#producto" className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.product}</a>
            <a href="#como-funciona" className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.how}</a>
            <a href="#para-quien" className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.forWho}</a>
            <Link href={resourcesHref} className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.resources}</Link>
            <Link href={pricingHref} className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.pricing}</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href={alternateHomeHref} hrefLang={alternateLocale === 'es' ? 'es-CL' : 'en'} className="rounded-lg border border-white/12 px-3 py-2 text-xs font-black text-white/70 hover:border-white/30 hover:text-white">
              {copy.nav.switchLanguage}
            </Link>
            <Link href="/sign-in" className="hidden text-sm font-semibold text-white/80 hover:text-white sm:block">{copy.nav.signIn}</Link>
            <Button asChild className="hidden h-11 rounded-[10px] px-5 font-black sm:inline-flex"><a href="#resolver">{copy.nav.try}</a></Button>
          </div>
        </div>
      </nav>

      <main>
        <section id="resolver" className="relative border-b border-white/10 px-5 pb-20 pt-36 sm:px-8 md:pb-28 md:pt-44 lg:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(184,245,66,0.14),transparent_28%),radial-gradient(circle_at_84%_20%,rgba(75,98,130,0.22),transparent_31%)]" />
          <div className="mx-auto grid max-w-[1440px] items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
            <div>
              <p className="text-sm font-black text-primary">{copy.hero.eyebrow}</p>
              <h1 className="mt-6 max-w-[820px] text-balance text-[44px] font-extrabold leading-[1.03] tracking-[-0.045em] sm:text-[58px] md:text-[70px]">{copy.hero.title}</h1>
              <p className="mt-7 max-w-[720px] text-pretty text-[17px] leading-8 text-white/64 sm:text-lg">{copy.hero.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="h-12 rounded-xl px-6 font-black"><a href="#resolver-form">{copy.hero.primary}</a></Button>
                <Button asChild variant="outline" className="h-12 rounded-xl border-white/15 bg-transparent px-6 font-black"><a href="#como-funciona">{copy.hero.secondary}</a></Button>
              </div>
              <div className="mt-8 grid gap-3 text-sm text-white/60 sm:grid-cols-3">
                {copy.hero.proofs.map((item) => <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /><span>{item}</span></div>)}
              </div>
            </div>
            <div id="resolver-form" className="scroll-mt-28"><ResolutionEntry locale={locale} /></div>
          </div>
        </section>

        <section id="como-funciona" className="border-b border-white/10 bg-[#0d131e] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-4xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.journey.eyebrow}</p><h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">{copy.journey.title}</h2></div>
            <div className="mt-12 grid gap-4 md:grid-cols-5">
              {copy.journey.steps.map((step, index) => { const Icon = journeyIcons[index]; return <article key={step.title} className="rounded-[22px] border border-white/10 bg-card p-6"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><span className="text-xs font-black text-white/25">0{index + 1}</span></div><h3 className="mt-6 text-lg font-black leading-tight">{step.title}</h3><p className="mt-3 text-sm leading-6 text-white/50">{step.description}</p></article> })}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1200px]">
            <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.example.eyebrow}</p><h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">{copy.example.title}</h2></div>
            <blockquote className="mt-10 rounded-[28px] border border-primary/20 bg-primary/[0.06] p-7 text-2xl font-bold leading-relaxed sm:p-9 md:text-3xl">“{copy.example.quote}”</blockquote>
            <div className="mt-6 grid gap-4 md:grid-cols-3">{copy.example.outcomes.map((outcome) => <article key={outcome.title} className="rounded-[22px] border border-white/10 bg-card p-6"><h3 className="text-xl font-black text-primary">{outcome.title}</h3><p className="mt-3 text-sm leading-7 text-white/55">{outcome.description}</p></article>)}</div>
          </div>
        </section>

        <section id="producto" className="border-b border-white/10 bg-[#0d131e] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-4xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.workflow.eyebrow}</p><h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">{copy.workflow.title}</h2><p className="mt-6 max-w-3xl text-base leading-8 text-white/55">{copy.workflow.description}</p></div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">{copy.workflow.stages.map((stage, index) => { const Icon = workflowIcons[index]; return <article key={stage.title} className="rounded-[26px] border border-white/10 bg-card p-7"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div><h3 className="mt-6 text-3xl font-black">{stage.title}</h3><p className="mt-4 text-sm leading-7 text-white/55">{stage.description}</p></article> })}</div>
          </div>
        </section>

        <section aria-label={publicCopy.nav.specialists} className="border-b border-white/10 px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-4xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.specialists.eyebrow}</p><h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">{copy.specialists.title}</h2><p className="mt-6 max-w-3xl text-base leading-8 text-white/55">{copy.specialists.description}</p></div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">{copy.specialists.people.map((person, index) => <article key={person.name} className="rounded-[24px] border border-white/10 bg-card p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{person.label}</p><h3 className="mt-3 text-2xl font-black">{coreSpecialistNames[index]}</h3></div><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></div></div><p className="mt-5 text-sm leading-7 text-white/50">{person.description}</p></article>)}</div>
            <p className="mt-8 max-w-3xl text-sm leading-7 text-white/42">{copy.specialists.note}</p>
          </div>
        </section>

        <section id="para-quien" className="border-b border-white/10 bg-[#0d131e] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1440px]"><div className="max-w-4xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.scenarios.eyebrow}</p><h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">{copy.scenarios.title}</h2></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{copy.scenarios.items.map((scenario) => <article key={scenario.title} className="rounded-[24px] border border-white/10 bg-card p-7"><h3 className="text-2xl font-black leading-tight">{scenario.title}</h3><p className="mt-4 text-sm leading-7 text-white/55">{scenario.description}</p><a href="#resolver" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-primary">{copy.hero.primary}<ArrowRight className="h-4 w-4" /></a></article>)}</div></div>
        </section>

        <section className="border-b border-white/10 px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div><ShieldCheck className="h-10 w-10 text-primary" /><p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.security.eyebrow}</p><h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">{copy.security.title}</h2><p className="mt-6 text-base leading-8 text-white/55">{copy.security.description}</p><p className="mt-5 text-sm leading-7 text-white/42">{copy.security.note}</p></div>
            <div className="grid gap-4 sm:grid-cols-3">{copy.security.points.map((point) => <article key={point.title} className="rounded-[22px] border border-white/10 bg-card p-6"><h3 className="text-lg font-black">{point.title}</h3><p className="mt-3 text-sm leading-7 text-white/50">{point.description}</p></article>)}</div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1100px] rounded-[32px] border border-primary/20 bg-primary/[0.07] p-8 text-center sm:p-12 md:p-16"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.cta.eyebrow}</p><h2 className="mx-auto mt-4 max-w-4xl text-balance text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">{copy.cta.title}</h2><p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/60">{copy.cta.description}</p><Button asChild className="mt-8 h-12 rounded-xl px-7 font-black"><a href="#resolver">{copy.cta.action}</a></Button></div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  )
}
