import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ClipboardCheck, Database, Eye, FileCheck2, SearchCheck, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { ResolutionEntry } from '@/components/marketing/resolution-entry'
import { LawCountdown } from '@/components/marketing/law-countdown'
import { MobilePublicNav } from '@/components/marketing/mobile-public-nav'
import { HOME_CLARITY_COPY } from '@/lib/i18n/home-clarity-copy'
import { HOME_PUBLIC_COPY } from '@/lib/i18n/home-public-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'
import { VERTICAL_IMAGES, VERTICAL_IMAGE_POSITIONS, type VerticalSlug } from '@/lib/i18n/vertical-public-copy'

const workflowIcons = [SearchCheck, FileCheck2, Eye] as const
const outcomeIcons = [Database, SearchCheck, ClipboardCheck] as const
const sectionClass = 'border-b border-white/10 px-5 py-20 sm:px-8 md:py-28 lg:px-12'
const eyebrowClass = 'text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B17A4D]'
const h2Class = 'mt-5 max-w-4xl text-balance text-[38px] font-light leading-[1.12] tracking-[-0.03em] text-[#D5B994] md:text-[52px]'
const navClass = 'text-sm text-[#AAA08F] transition-colors hover:text-[#E0C5A1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

function CinematicImage({ src, position = 'center', opacityClass = 'opacity-60' }: { src: string; position?: string; opacityClass?: string }) {
  return <Image src={src} alt="" fill sizes="100vw" className={`object-cover ${opacityClass}`} style={{ objectPosition: position }} />
}

export default async function HomePage() {
  const { locale } = await getPublicRequestContext()
  const copy = HOME_CLARITY_COPY[locale]
  const publicCopy = HOME_PUBLIC_COPY[locale]
  const alternateLocale = locale === 'es' ? 'en' : 'es'
  const alternateHomeHref = withPublicLocale('/', alternateLocale)

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#151513] text-[#C2A887]">
      <nav aria-label={locale === 'es' ? 'Principal' : 'Primary'} className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#151513]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href={withPublicLocale('/', locale)} aria-label="Kumplio" className="shrink-0"><Image src="/kumplio-logo-canonical.png" alt="Kumplio" width={455} height={171} priority className="h-auto w-[154px] object-contain sm:w-[190px]" /></Link>
          <div className="hidden items-center gap-7 lg:flex"><a href="#producto" className={navClass}>{copy.nav.product}</a><a href="#como-funciona" className={navClass}>{copy.nav.how}</a><a href="#verticales" className={navClass}>{copy.nav.forWho}</a><Link href={getPublicSiteHref('/resources/ley-21719', locale)} className={navClass}>{copy.nav.resources}</Link><Link href={getPublicSiteHref('/pricing', locale)} className={navClass}>{copy.nav.pricing}</Link></div>
          <div className="hidden items-center gap-3 lg:flex"><Link href={withPublicLocale('/', alternateLocale)} hrefLang={alternateLocale} className="rounded border border-white/10 px-3 py-2 text-xs text-[#AAA08F]">{copy.nav.switchLanguage}</Link><Link href="/sign-in" className="text-sm text-[#AAA08F]">{copy.nav.signIn}</Link><Button asChild className="h-11 rounded px-4 text-sm"><a href="#resolver-form">{copy.nav.try}</a></Button></div>
          <MobilePublicNav
            alternateHomeHref={alternateHomeHref}
            switchLanguage={copy.nav.switchLanguage}
            signIn={copy.nav.signIn}
            tryLabel={copy.nav.try}
            menuLabel={locale === 'es' ? 'Abrir menú principal' : 'Open main menu'}
            items={[
              { href: '#producto', label: copy.nav.product },
              { href: '#como-funciona', label: copy.nav.how },
              { href: '#verticales', label: copy.nav.forWho },
              { href: getPublicSiteHref('/resources/ley-21719', locale), label: copy.nav.resources },
              { href: getPublicSiteHref('/pricing', locale), label: copy.nav.pricing },
            ]}
          />
        </div>
      </nav>

      <main>
        <section className="relative min-h-[760px] border-b border-white/10 pt-20 md:min-h-[850px]">
          <CinematicImage src="/brand/kumplio-hero-compliance.webp" position="68% center" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#151513_2%,rgba(21,21,19,.95)_32%,rgba(21,21,19,.12)_78%),linear-gradient(0deg,#151513_0%,transparent_48%)]" />
          <div className="relative flex min-h-[770px] w-full items-center px-5 py-20 sm:px-10 lg:px-[clamp(3rem,6vw,7rem)]"><div className="w-full max-w-[780px] lg:max-w-[46vw] 2xl:max-w-[860px]"><p className={eyebrowClass}>{copy.hero.eyebrow}</p><h1 className="mt-7 text-balance text-[48px] font-light leading-[1.02] tracking-[-0.045em] text-[#E0C5A1] sm:text-[66px] lg:text-[clamp(64px,4.1vw,82px)]">{copy.hero.title}</h1><p className="mt-8 max-w-[680px] text-[17px] leading-8 text-[#B2A797]">{copy.hero.description}</p><LawCountdown locale={locale} /><div className="mt-8 flex flex-wrap gap-3"><Button asChild className="h-12 rounded px-6"><a href="#resolver-form">{copy.hero.primary}</a></Button><Button asChild variant="outline" className="h-12 rounded border-white/20 bg-black/10 px-6 text-[#E0C5A1]"><a href="#como-funciona">{copy.hero.secondary}</a></Button></div><div className="mt-10 grid max-w-[720px] gap-4 border-t border-white/15 pt-6 text-xs text-[#AAA08F] sm:grid-cols-3">{copy.hero.proofs.map(item => <div key={item} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#A7C63A]" /><span>{item}</span></div>)}</div></div></div>
        </section>

        <section id="como-funciona" className="relative min-h-[720px] scroll-mt-20 border-b border-white/10 md:min-h-[800px]">
          <CinematicImage src="/brand/kumplio-transformation.webp" position="center" opacityClass="opacity-70" /><div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,21,19,.78)_0%,rgba(21,21,19,.08)_45%,rgba(21,21,19,.9)_100%)]" />
          <div className="relative mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:py-28 lg:px-12"><p className={eyebrowClass}>{copy.journey.eyebrow}</p><h2 className={h2Class}>{copy.journey.title}</h2><div className="mt-56 grid border-y border-white/10 bg-[#151513]/75 backdrop-blur-sm md:mt-[300px] md:grid-cols-4">{copy.journey.steps.map((step,index)=><article key={step.title} className="border-b border-white/10 p-7 md:border-b-0 md:border-r last:md:border-r-0"><span className="text-[11px] text-[#A7C63A]">0{index+1}</span><h3 className="mt-6 text-2xl font-light text-[#D5B994]">{step.title}</h3><p className="mt-4 text-sm leading-7 text-[#AAA08F]">{step.description}</p></article>)}</div></div>
        </section>

        <section id="verticales" className="relative min-h-[900px] scroll-mt-20 border-b border-white/10"><CinematicImage src="/brand/kumplio-mining-transport.webp" opacityClass="opacity-80" /><div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,21,19,.48)_0%,rgba(21,21,19,.04)_28%,rgba(21,21,19,.88)_100%)]"/><div className="relative w-full px-5 py-20 sm:px-10 md:py-28 lg:px-[clamp(3rem,5vw,6rem)]"><p className={eyebrowClass}>{copy.scenarios.eyebrow}</p><h2 className={h2Class}>{copy.scenarios.title}</h2><div className="mt-52 grid border-l border-t border-white/15 bg-black/35 shadow-[0_28px_90px_rgba(0,0,0,.55)] backdrop-blur-sm sm:grid-cols-2 md:mt-[260px] lg:grid-cols-3">{copy.scenarios.items.map((item,index)=>{const slug=item.slug as VerticalSlug;return <Link key={item.slug} href={getPublicSiteHref(`/verticales/${item.slug}`, locale)} className="group relative flex min-h-[370px] flex-col overflow-hidden border-b border-r border-white/15 p-8 transition duration-300 hover:z-10 hover:-translate-y-1 hover:border-[#A7C63A]/45 hover:shadow-[0_22px_60px_rgba(0,0,0,.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#A7C63A]"><Image src={VERTICAL_IMAGES[slug]} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" style={{objectPosition:VERTICAL_IMAGE_POSITIONS[slug]}} className="object-cover opacity-65 transition duration-500 group-hover:scale-[1.035] group-hover:opacity-[.78]" /><span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,9,.12)_0%,rgba(10,10,9,.42)_48%,rgba(10,10,9,.95)_100%)] transition-colors group-hover:bg-[linear-gradient(180deg,rgba(10,10,9,.06)_0%,rgba(10,10,9,.32)_48%,rgba(10,10,9,.92)_100%)]" /><div className="relative flex h-full flex-1 flex-col"><p className="text-xs font-semibold text-[#C5E052]">{String(index+1).padStart(2,'0')}</p><div className="mt-auto pt-28"><h3 className="text-[27px] font-light text-[#F0D7B6]">{item.title}</h3><p className="mt-4 text-[15px] leading-7 text-[#DDD1C0]">{item.description}</p><span className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[.14em] text-[#C5E052]">{item.action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></div></div></Link>})}</div></div></section>

        <section id="producto" className="relative min-h-[760px] scroll-mt-20 border-b border-white/10"><CinematicImage src="/brand/kumplio-operating-model.webp" opacityClass="opacity-70" /><div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,21,19,.76)_0%,rgba(21,21,19,.06)_38%,rgba(21,21,19,.88)_100%)]"/><div className="relative mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:py-28 lg:px-12"><p className={eyebrowClass}>{copy.workflow.eyebrow}</p><h2 className={h2Class}>{copy.workflow.title}</h2><p className="mt-6 max-w-2xl text-base leading-8 text-[#AAA08F]">{copy.workflow.description}</p><div className="mt-52 grid border-y border-white/10 bg-[#151513]/75 backdrop-blur-sm md:mt-[245px] md:grid-cols-3">{copy.workflow.stages.map((stage,index)=>{const Icon=workflowIcons[index];return <article key={stage.title} className="p-7 md:border-r last:md:border-r-0"><Icon className="h-6 w-6 text-[#B17A4D]"/><h3 className="mt-7 text-3xl font-light text-[#D5B994]">{stage.title}</h3><p className="mt-4 text-sm leading-7 text-[#AAA08F]">{stage.description}</p></article>})}</div></div></section>

        <section className="relative min-h-[820px] overflow-hidden border-b border-white/10 bg-[#151513]"><div className="absolute inset-x-0 top-0 h-[620px] overflow-hidden md:h-[760px]"><Image src="/brand/kumplio-specialists.webp" alt="" fill sizes="100vw" className="object-cover opacity-70"/><div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,21,19,.72)_0%,rgba(21,21,19,.04)_42%,rgba(21,21,19,.82)_100%)]"/></div><div className="relative mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:py-28 lg:px-12"><p className={eyebrowClass}>{copy.specialists.eyebrow}</p><h2 className={h2Class}>{copy.specialists.title}</h2><p className="mt-6 max-w-2xl text-base leading-8 text-[#AAA08F]">{copy.specialists.description}</p><div className="mt-60 grid border-y border-white/10 bg-[#151513]/82 backdrop-blur-sm md:mt-[310px] md:grid-cols-3">{copy.specialists.people.map(person=><article key={person.name} className="border-b border-white/10 p-7 md:border-b-0 md:border-r last:md:border-r-0"><p className="text-[10px] uppercase tracking-[.16em] text-[#A7C63A]">{person.label}</p><h3 className="mt-4 text-2xl font-light text-[#D5B994]">{person.name}</h3><p className="mt-3 text-sm leading-7 text-[#AAA08F]">{person.description}</p></article>)}</div><div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">{copy.specialists.capabilities.map(capability=><span key={capability} className="text-xs uppercase tracking-[.12em] text-[#AAA08F]">{capability}</span>)}</div><p className="mt-7 max-w-3xl text-sm leading-7 text-[#AAA08F]">{copy.specialists.note}</p></div></section>

        <section className={`bg-[#1C1C19] ${sectionClass}`}><div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[.82fr_1.18fr] lg:gap-20"><div><p className={eyebrowClass}>{copy.example.eyebrow}</p><h2 className={h2Class}>{copy.example.title}</h2><blockquote className="mt-10 border-l border-[#B17A4D] pl-6 text-[23px] font-light leading-relaxed text-[#D5B994] md:text-[28px]">“{copy.example.quote}”</blockquote></div><div className="border border-white/10 bg-[#151513] p-6 sm:p-8">{copy.example.outcomes.map((item,index)=>{const Icon=outcomeIcons[index];return <article key={item.title} className="grid grid-cols-[auto_1fr] gap-5 border-b border-white/10 py-6 first:pt-0 last:border-b-0 last:pb-0"><div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#B17A4D]/40 bg-[#B17A4D]/8"><Icon className="h-5 w-5 text-[#B17A4D]"/></div><div><p className="text-[10px] uppercase tracking-[.16em] text-[#A7C63A]">0{index+1}</p><h3 className="mt-2 text-xl text-[#E0C5A1]">{item.title}</h3><p className="mt-3 text-sm leading-7 text-[#AAA08F]">{item.description}</p></div></article>})}</div></div></section>

        <section className="relative min-h-[720px] border-b border-white/10"><CinematicImage src="/brand/kumplio-evidence-security.webp" position="65% center"/><div className="absolute inset-0 bg-[linear-gradient(90deg,#151513_5%,rgba(21,21,19,.9)_38%,transparent_80%),linear-gradient(0deg,#151513_0%,transparent_45%)]"/><div className="relative mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:py-28 lg:px-12"><div className="max-w-xl"><ShieldCheck className="h-7 w-7 text-[#B17A4D]"/><p className={`mt-7 ${eyebrowClass}`}>{copy.security.eyebrow}</p><h2 className={h2Class}>{copy.security.title}</h2><p className="mt-6 text-base leading-8 text-[#AAA08F]">{copy.security.description}</p><div className="mt-10 grid gap-6">{copy.security.points.map(point=><article key={point.title} className="border-l border-white/15 pl-5"><h3 className="text-lg text-[#D5B994]">{point.title}</h3><p className="mt-2 text-sm leading-6 text-[#AAA08F]">{point.description}</p></article>)}</div><p className="mt-7 text-xs leading-6 text-[#AAA08F]">{copy.security.note}</p></div></div></section>

        <section id="resolver-form" className="scroll-mt-20 bg-[#1C1C19] px-5 py-20 sm:px-8 md:py-28 lg:px-12"><div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-16"><div><p className={eyebrowClass}>{copy.cta.eyebrow}</p><h2 className={h2Class}>{copy.cta.title}</h2><p className="mt-6 text-base leading-8 text-[#AAA08F]">{copy.cta.description}</p></div><ResolutionEntry locale={locale} /></div></section>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
