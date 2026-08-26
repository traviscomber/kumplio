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
const navLinkClass = 'rounded-[3px] text-sm font-medium text-[#AAA08F] transition-colors hover:text-[#C2A887] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#171715]'
const sectionClass = 'border-b border-[rgba(194,168,135,0.14)] px-5 py-24 sm:px-8 md:py-36 lg:px-12'
const eyebrowClass = 'text-[11px] font-medium uppercase tracking-[0.2em] text-[#A36C42]'
const h2Class = 'mt-4 max-w-4xl text-balance text-[38px] font-normal leading-[1.15] tracking-[-0.025em] text-[#C2A887] md:text-[44px]'
const bodyClass = 'text-[15px] leading-7 text-[#AAA08F] md:text-base'

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
    <div className="min-h-screen overflow-x-hidden bg-[#171715] text-[#C2A887]">
      <nav aria-label="Primary" className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(194,168,135,0.14)] bg-[#171715]/95">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href={homeHref} aria-label="Kumplio" className="rounded-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#171715]">
            <Image src="/kumplio-logo.png" alt="Kumplio" width={160} height={60} priority className="h-10 w-auto sm:h-11" />
          </Link>
          <div className="hidden items-center gap-7 lg:flex">
            <a href="#producto" className={navLinkClass}>{copy.nav.product}</a>
            <a href="#como-funciona" className={navLinkClass}>{copy.nav.how}</a>
            <a href="#para-quien" className={navLinkClass}>{copy.nav.forWho}</a>
            <Link href={resourcesHref} className={navLinkClass}>{copy.nav.resources}</Link>
            <Link href={pricingHref} className={navLinkClass}>{copy.nav.pricing}</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href={alternateHomeHref} hrefLang={alternateLocale === 'es' ? 'es-CL' : 'en'} className="rounded-[4px] border border-[rgba(194,168,135,0.22)] px-3 py-2 text-xs font-medium text-[#AAA08F] transition-colors hover:border-[#A36C42] hover:text-[#C2A887] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#171715]">
              {copy.nav.switchLanguage}
            </Link>
            <Link href="/sign-in" className="hidden rounded-[3px] text-sm font-medium text-[#AAA08F] transition-colors hover:text-[#C2A887] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#171715] sm:block">{copy.nav.signIn}</Link>
            <Button asChild className="hidden h-11 rounded-[4px] px-5 font-medium sm:inline-flex"><a href="#resolver-form">{copy.nav.try}</a></Button>
            <Button asChild data-mobile-primary-cta className="h-10 rounded-[4px] px-3 text-xs font-medium sm:hidden"><a href="#resolver-form">{copy.nav.try}</a></Button>
          </div>
        </div>
      </nav>

      <main>
        <section id="resolver" className="relative scroll-mt-20 border-b border-[rgba(194,168,135,0.14)] px-5 pb-28 pt-36 sm:px-8 md:pb-44 md:pt-44 lg:px-12">
          <div className="pointer-events-none absolute right-0 top-24 -z-10 hidden h-[520px] w-[46%] opacity-25 lg:block" aria-hidden="true">
            <div className="absolute right-16 top-12 h-px w-[72%] bg-[#A36C42]/50" />
            <div className="absolute right-28 top-36 h-px w-[58%] bg-[#746D62]/50" />
            <div className="absolute right-20 top-60 h-px w-[66%] bg-[#A36C42]/35" />
            <div className="absolute right-48 top-0 h-[340px] w-px bg-[#72472F]/45" />
            <div className="absolute right-80 top-24 h-[280px] w-px bg-[#746D62]/35" />
          </div>
          <div className="mx-auto grid max-w-[1440px] items-start gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <div className="max-w-[620px]">
              <p className={eyebrowClass}>{copy.hero.eyebrow}</p>
              <h1 className="mt-6 text-balance text-[46px] font-light leading-[1.07] tracking-[-0.03em] text-[#C2A887] sm:text-[56px] md:text-[64px]">{copy.hero.title}</h1>
              <p className="mt-7 max-w-[590px] text-[16px] leading-8 text-[#AAA08F]">{copy.hero.description}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild className="h-12 rounded-[4px] px-6 font-medium"><a href="#resolver-form">{copy.hero.primary}</a></Button>
                <Button asChild variant="outline" className="h-12 rounded-[4px] border-[rgba(194,168,135,0.24)] bg-transparent px-6 font-medium text-[#C2A887]"><a href="#como-funciona">{copy.hero.secondary}</a></Button>
              </div>
              <div className="mt-10 grid gap-3 text-sm text-[#746D62] sm:grid-cols-3">
                {copy.hero.proofs.map((item) => <div key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{item}</span></div>)}
              </div>
            </div>
            <div id="resolver-form" className="scroll-mt-24"><ResolutionEntry locale={locale} /></div>
          </div>
        </section>

        <section id="como-funciona" className={`scroll-mt-20 bg-[#20201D] ${sectionClass}`}>
          <div className="mx-auto max-w-[1440px]">
            <p className={eyebrowClass}>{copy.journey.eyebrow}</p>
            <h2 className={h2Class}>{copy.journey.title}</h2>
            <div className="mt-16 grid gap-px border-y border-[rgba(194,168,135,0.14)] md:grid-cols-5">
              {copy.journey.steps.map((step, index) => {
                const Icon = journeyIcons[index]
                return <article key={step.title} className="min-h-56 border-b border-[rgba(194,168,135,0.14)] px-0 py-8 md:border-b-0 md:border-r md:px-6 first:md:pl-0 last:md:border-r-0 last:md:pr-0"><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-[#A36C42]" /><span className="text-[11px] text-[#555149]">0{index + 1}</span></div><h3 className="mt-8 text-[20px] font-normal leading-tight text-[#C2A887]">{step.title}</h3><p className="mt-3 text-sm leading-6 text-[#746D62]">{step.description}</p></article>
              })}
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="mx-auto max-w-[1200px]">
            <p className={eyebrowClass}>{copy.example.eyebrow}</p>
            <h2 className={h2Class}>{copy.example.title}</h2>
            <blockquote className="mt-14 max-w-5xl border-l border-[#A36C42] py-2 pl-7 text-[26px] font-light leading-relaxed text-[#C2A887] md:text-[30px]">“{copy.example.quote}”</blockquote>
            <div className="mt-14 grid gap-10 border-t border-[rgba(194,168,135,0.14)] pt-10 md:grid-cols-3">{copy.example.outcomes.map((outcome) => <article key={outcome.title}><h3 className="text-[19px] font-normal text-[#A7C63A]">{outcome.title}</h3><p className="mt-3 text-sm leading-7 text-[#746D62]">{outcome.description}</p></article>)}</div>
          </div>
        </section>

        <section id="producto" className={`scroll-mt-20 bg-[#20201D] ${sectionClass}`}>
          <div className="mx-auto max-w-[1440px]">
            <p className={eyebrowClass}>{copy.workflow.eyebrow}</p>
            <h2 className={h2Class}>{copy.workflow.title}</h2>
            <p className={`mt-6 max-w-3xl ${bodyClass}`}>{copy.workflow.description}</p>
            <div className="mt-16 grid gap-10 border-t border-[rgba(194,168,135,0.14)] pt-10 lg:grid-cols-3">{copy.workflow.stages.map((stage, index) => { const Icon = workflowIcons[index]; return <article key={stage.title}><Icon className="h-6 w-6 text-[#A36C42]" /><h3 className="mt-7 text-[28px] font-normal text-[#C2A887]">{stage.title}</h3><p className="mt-4 max-w-sm text-sm leading-7 text-[#746D62]">{stage.description}</p></article> })}</div>
          </div>
        </section>

        <section aria-label={publicCopy.nav.specialists} className={sectionClass}>
          <div className="mx-auto max-w-[1440px]">
            <p className={eyebrowClass}>{copy.specialists.eyebrow}</p>
            <h2 className={h2Class}>{copy.specialists.title}</h2>
            <p className={`mt-6 max-w-3xl ${bodyClass}`}>{copy.specialists.description}</p>
            <div className="mt-16 grid gap-12 border-t border-[rgba(194,168,135,0.14)] pt-10 lg:grid-cols-3">{copy.specialists.people.map((person, index) => <article key={person.name}><div className="flex items-center justify-between"><p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#A36C42]">{person.label}</p><Users className="h-5 w-5 text-[#72472F]" /></div><h3 className="mt-6 text-[26px] font-normal text-[#C2A887]">{coreSpecialistNames[index]}</h3><p className="mt-4 text-sm leading-7 text-[#746D62]">{person.description}</p></article>)}</div>
            <p className="mt-10 max-w-3xl text-sm leading-7 text-[#555149]">{copy.specialists.note}</p>
          </div>
        </section>

        <section id="para-quien" className={`scroll-mt-20 bg-[#20201D] ${sectionClass}`}>
          <div className="mx-auto max-w-[1440px]">
            <p className={eyebrowClass}>{copy.scenarios.eyebrow}</p>
            <h2 className={h2Class}>{copy.scenarios.title}</h2>
            <div className="mt-16 grid gap-10 border-t border-[rgba(194,168,135,0.14)] pt-10 lg:grid-cols-3">{copy.scenarios.items.map((scenario) => <article key={scenario.title}><h3 className="text-[25px] font-normal leading-tight text-[#C2A887]">{scenario.title}</h3><p className="mt-4 text-sm leading-7 text-[#746D62]">{scenario.description}</p><a href="#resolver-form" className="mt-7 inline-flex items-center gap-2 rounded-[3px] text-sm font-medium text-[#A7C63A] transition-colors hover:text-[#C2A887] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-[#20201D]">{copy.hero.primary}<ArrowRight className="h-4 w-4" /></a></article>)}</div>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div><ShieldCheck className="h-7 w-7 text-[#A36C42]" /><p className={`mt-7 ${eyebrowClass}`}>{copy.security.eyebrow}</p><h2 className={h2Class}>{copy.security.title}</h2><p className={`mt-6 ${bodyClass}`}>{copy.security.description}</p><p className="mt-5 text-sm leading-7 text-[#555149]">{copy.security.note}</p></div>
            <div className="grid gap-10 border-t border-[rgba(194,168,135,0.14)] pt-10 sm:grid-cols-3">{copy.security.points.map((point) => <article key={point.title}><h3 className="text-[18px] font-normal text-[#C2A887]">{point.title}</h3><p className="mt-3 text-sm leading-7 text-[#746D62]">{point.description}</p></article>)}</div>
          </div>
        </section>

        <section className="px-5 py-28 sm:px-8 md:py-44 lg:px-12">
          <div className="mx-auto max-w-[1100px] border-y border-[rgba(194,168,135,0.14)] py-16 text-center md:py-20"><p className={eyebrowClass}>{copy.cta.eyebrow}</p><h2 className="mx-auto mt-5 max-w-4xl text-balance text-[38px] font-light leading-[1.15] tracking-[-0.025em] text-[#C2A887] md:text-[44px]">{copy.cta.title}</h2><p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#AAA08F]">{copy.cta.description}</p><Button asChild className="mt-9 h-12 rounded-[4px] px-7 font-medium"><a href="#resolver-form">{copy.cta.action}</a></Button></div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  )
}
