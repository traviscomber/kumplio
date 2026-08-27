import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, Eye, FileCheck2, SearchCheck, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { ResolutionEntry } from '@/components/marketing/resolution-entry'
import { HOME_CLARITY_COPY } from '@/lib/i18n/home-clarity-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'

const workflowIcons = [SearchCheck, FileCheck2, Eye] as const
const coreSpecialistNames = ['Isidora', 'Verónica', 'Julieta'] as const
const sectionClass = 'border-b border-white/10 px-5 py-24 sm:px-8 md:py-32 lg:px-12'
const eyebrowClass = 'text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B17A4D]'
const h2Class = 'mt-5 max-w-4xl text-balance text-[38px] font-light leading-[1.12] tracking-[-0.03em] text-[#D5B994] md:text-[52px]'
const navClass = 'text-sm text-[#AAA08F] transition-colors hover:text-[#E0C5A1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

function CinematicImage({ src, position = 'center' }: { src: string; position?: string }) {
  return <Image src={src} alt="" fill sizes="100vw" className="object-cover opacity-60" style={{ objectPosition: position }} />
}

export default async function HomePage() {
  const { locale } = await getPublicRequestContext()
  const copy = HOME_CLARITY_COPY[locale]
  const alternateLocale = locale === 'es' ? 'en' : 'es'

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#151513] text-[#C2A887]">
      <nav aria-label="Primary" className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#151513]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href={withPublicLocale('/', locale)} aria-label="Kumplio"><Image src="/kumplio-logo.png" alt="Kumplio" width={160} height={60} priority className="h-10 w-auto" /></Link>
          <div className="hidden items-center gap-7 lg:flex"><a href="#producto" className={navClass}>{copy.nav.product}</a><a href="#como-funciona" className={navClass}>{copy.nav.how}</a><a href="#verticales" className={navClass}>{copy.nav.forWho}</a><Link href={getPublicSiteHref('/resources/ley-21719', locale)} className={navClass}>{copy.nav.resources}</Link><Link href={getPublicSiteHref('/pricing', locale)} className={navClass}>{copy.nav.pricing}</Link></div>
          <div className="flex items-center gap-3"><Link href={withPublicLocale('/', alternateLocale)} hrefLang={alternateLocale} className="rounded border border-white/10 px-3 py-2 text-xs text-[#AAA08F]">{copy.nav.switchLanguage}</Link><Link href="/sign-in" className="hidden text-sm text-[#AAA08F] sm:block">{copy.nav.signIn}</Link><Button asChild className="h-10 rounded px-4 text-xs sm:h-11 sm:text-sm"><a href="#resolver-form">{copy.nav.try}</a></Button></div>
        </div>
      </nav>

      <main>
        <section className="relative min-h-[850px] border-b border-white/10 pt-20">
          <CinematicImage src="/brand/kumplio-hero-compliance.webp" position="68% center" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#151513_2%,rgba(21,21,19,.95)_32%,rgba(21,21,19,.12)_78%),linear-gradient(0deg,#151513_0%,transparent_48%)]" />
          <div className="relative mx-auto flex min-h-[770px] max-w-[1440px] items-center px-5 py-24 sm:px-8 lg:px-12"><div className="max-w-[700px]"><p className={eyebrowClass}>{copy.hero.eyebrow}</p><h1 className="mt-7 text-balance text-[48px] font-light leading-[1.02] tracking-[-0.045em] text-[#E0C5A1] sm:text-[66px] lg:text-[78px]">{copy.hero.title}</h1><p className="mt-8 max-w-[620px] text-[17px] leading-8 text-[#B2A797]">{copy.hero.description}</p><div className="mt-10 flex flex-wrap gap-3"><Button asChild className="h-12 rounded px-6"><a href="#resolver-form">{copy.hero.primary}</a></Button><Button asChild variant="outline" className="h-12 rounded border-white/20 bg-black/10 px-6 text-[#E0C5A1]"><a href="#como-funciona">{copy.hero.secondary}</a></Button></div><div className="mt-12 grid max-w-[650px] gap-4 border-t border-white/15 pt-6 text-xs text-[#AAA08F] sm:grid-cols-3">{copy.hero.proofs.map(item => <div key={item} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#A7C63A]" /><span>{item}</span></div>)}</div></div></div>
        </section>

        <section id="como-funciona" className="relative min-h-[820px] scroll-mt-20 border-b border-white/10">
          <CinematicImage src="/brand/kumplio-transformation.webp" position="center" /><div className="absolute inset-0 bg-[linear-gradient(180deg,#151513_0%,rgba(21,21,19,.2)_45%,#151513_100%)]" />
          <div className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 md:py-32 lg:px-12"><p className={eyebrowClass}>{copy.journey.eyebrow}</p><h2 className={h2Class}>{copy.journey.title}</h2><div className="mt-[330px] grid border-y border-white/10 bg-[#151513]/80 backdrop-blur-md md:grid-cols-4">{copy.journey.steps.map((step,index)=><article key={step.title} className="border-b border-white/10 p-7 md:border-b-0 md:border-r last:md:border-r-0"><span className="text-[11px] text-[#A7C63A]">0{index+1}</span><h3 className="mt-6 text-2xl font-light text-[#D5B994]">{step.title}</h3><p className="mt-4 text-sm leading-7 text-[#8F8678]">{step.description}</p></article>)}</div></div>
        </section>

        <section id="verticales" className="relative min-h-[820px] scroll-mt-20 border-b border-white/10"><CinematicImage src="/brand/kumplio-mining-transport.webp" /><div className="absolute inset-0 bg-[linear-gradient(180deg,#151513_0%,transparent_30%,#151513_100%)]"/><div className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 md:py-32 lg:px-12"><p className={eyebrowClass}>{copy.scenarios.eyebrow}</p><h2 className={h2Class}>{copy.scenarios.title}</h2><div className="mt-[350px] grid border border-white/10 bg-black/45 backdrop-blur-md md:grid-cols-3">{copy.scenarios.items.map((item,index)=><article key={item.title} className="border-b border-white/10 p-7 md:border-b-0 md:border-r last:md:border-r-0"><p className="text-[11px] text-[#A7C63A]">0{index+1}</p><h3 className="mt-5 text-2xl font-light text-[#E0C5A1]">{item.title}</h3><p className="mt-4 text-sm leading-7 text-[#AAA08F]">{item.description}</p></article>)}</div></div></section>

        <section id="producto" className="relative min-h-[820px] scroll-mt-20 border-b border-white/10"><CinematicImage src="/brand/kumplio-operating-model.webp" /><div className="absolute inset-0 bg-[linear-gradient(180deg,#151513_0%,transparent_35%,#151513_100%)]"/><div className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 md:py-32 lg:px-12"><p className={eyebrowClass}>{copy.workflow.eyebrow}</p><h2 className={h2Class}>{copy.workflow.title}</h2><p className="mt-6 max-w-2xl text-base leading-8 text-[#AAA08F]">{copy.workflow.description}</p><div className="mt-[330px] grid border-y border-white/10 bg-[#151513]/80 backdrop-blur-md md:grid-cols-3">{copy.workflow.stages.map((stage,index)=>{const Icon=workflowIcons[index];return <article key={stage.title} className="p-7 md:border-r last:md:border-r-0"><Icon className="h-6 w-6 text-[#B17A4D]"/><h3 className="mt-7 text-3xl font-light text-[#D5B994]">{stage.title}</h3><p className="mt-4 text-sm leading-7 text-[#8F8678]">{stage.description}</p></article>})}</div></div></section>

        <section className="relative min-h-[900px] border-b border-white/10"><CinematicImage src="/brand/kumplio-specialists.webp"/><div className="absolute inset-0 bg-[linear-gradient(180deg,#151513_0%,transparent_35%,#151513_100%)]"/><div className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 md:py-32 lg:px-12"><p className={eyebrowClass}>{copy.specialists.eyebrow}</p><h2 className={h2Class}>{copy.specialists.title}</h2><p className="mt-6 max-w-2xl text-base leading-8 text-[#AAA08F]">{copy.specialists.description}</p><div className="mt-[360px] grid border-y border-white/10 bg-[#151513]/80 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-7">{copy.specialists.people.map(person=><article key={person.name} className="p-5"><p className="text-[10px] uppercase tracking-[.16em] text-[#A7C63A]">{person.label}</p><h3 className="mt-4 text-xl font-light text-[#D5B994]">{person.name}</h3><p className="mt-3 text-xs leading-6 text-[#827A6E]">{person.description}</p></article>)}</div><p className="mt-7 max-w-3xl text-sm leading-7 text-[#827A6E]">{copy.specialists.note}</p></div></section>

        <section className={`bg-[#1C1C19] ${sectionClass}`}><div className="mx-auto max-w-[1440px]"><p className={eyebrowClass}>{copy.example.eyebrow}</p><h2 className={h2Class}>{copy.example.title}</h2><blockquote className="mt-12 max-w-5xl border-l border-[#B17A4D] pl-7 text-[25px] font-light leading-relaxed text-[#D5B994] md:text-[32px]">“{copy.example.quote}”</blockquote><div className="mt-14 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-3">{copy.example.outcomes.map(item=><article key={item.title}><h3 className="text-xl text-[#A7C63A]">{item.title}</h3><p className="mt-4 text-sm leading-7 text-[#827A6E]">{item.description}</p></article>)}</div></div></section>

        <section className="relative min-h-[780px] border-b border-white/10"><CinematicImage src="/brand/kumplio-evidence-security.webp" position="65% center"/><div className="absolute inset-0 bg-[linear-gradient(90deg,#151513_5%,rgba(21,21,19,.9)_38%,transparent_80%),linear-gradient(0deg,#151513_0%,transparent_45%)]"/><div className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 md:py-32 lg:px-12"><div className="max-w-xl"><ShieldCheck className="h-7 w-7 text-[#B17A4D]"/><p className={`mt-7 ${eyebrowClass}`}>{copy.security.eyebrow}</p><h2 className={h2Class}>{copy.security.title}</h2><p className="mt-6 text-base leading-8 text-[#AAA08F]">{copy.security.description}</p><div className="mt-10 grid gap-6">{copy.security.points.map(point=><article key={point.title} className="border-l border-white/15 pl-5"><h3 className="text-lg text-[#D5B994]">{point.title}</h3><p className="mt-2 text-sm leading-6 text-[#827A6E]">{point.description}</p></article>)}</div><p className="mt-7 text-xs leading-6 text-[#625D55]">{copy.security.note}</p></div></div></section>

        <section id="resolver-form" className="scroll-mt-20 bg-[#1C1C19] px-5 py-24 sm:px-8 md:py-36 lg:px-12"><div className="mx-auto grid max-w-[1200px] gap-16 lg:grid-cols-[.8fr_1.2fr]"><div><p className={eyebrowClass}>{copy.cta.eyebrow}</p><h2 className={h2Class}>{copy.cta.title}</h2><p className="mt-6 text-base leading-8 text-[#AAA08F]">{copy.cta.description}</p></div><ResolutionEntry locale={locale} /></div></section>
      </main>
      <Footer locale={locale}/>
    </div>
  )
}
