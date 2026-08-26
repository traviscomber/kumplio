import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileCheck2,
  FolderKanban,
  LockKeyhole,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { ResolutionEntry } from '@/components/marketing/resolution-entry'
import { HOME_PUBLIC_COPY } from '@/lib/i18n/home-public-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'

const privacyIcons = [Database, SearchCheck, LockKeyhole] as const
const guideIcons = [FolderKanban, SearchCheck, Sparkles, FileCheck2] as const

const coreCapabilities = {
  es: [
    { name: 'Isidora', stage: 'Analiza', role: 'Obligaciones y contexto', description: 'Relaciona antecedentes, fuentes y aplicabilidad para entender qué importa y qué requiere atención.' },
    { name: 'Verónica', stage: 'Resuelve', role: 'Controles, evidencia y acciones', description: 'Convierte brechas en controles, evidencia esperada y acciones concretas con criterios de cierre.' },
    { name: 'Julieta', stage: 'Revisa', role: 'Revisión independiente', description: 'Contrasta conclusiones, detecta reservas y mantiene las decisiones sensibles bajo control humano.' },
  ],
  en: [
    { name: 'Isidora', stage: 'Analyze', role: 'Obligations and context', description: 'Connects background, sources and applicability to clarify what matters and what needs attention.' },
    { name: 'Verónica', stage: 'Resolve', role: 'Controls, evidence and actions', description: 'Turns gaps into controls, expected evidence and concrete actions with clear closure criteria.' },
    { name: 'Julieta', stage: 'Review', role: 'Independent review', description: 'Challenges conclusions, identifies reservations and keeps sensitive decisions under human control.' },
  ],
} as const

export default async function HomePage() {
  const { locale } = await getPublicRequestContext()
  const copy = HOME_PUBLIC_COPY[locale]
  const homeHref = withPublicLocale('/', locale)
  const pricingHref = getPublicSiteHref('/pricing', locale)
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
            <a href="#proteccion" className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.dataProtection}</a>
            <a href="#guia" className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.guide}</a>
            <a href="#equipo" className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.specialists}</a>
            <a href="#seguridad" className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.security}</a>
            <Link href={pricingHref} className="text-sm font-medium text-white/65 hover:text-white">{copy.nav.plans}</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href={alternateHomeHref} hrefLang={alternateLocale === 'es' ? 'es-CL' : 'en'} className="rounded-lg border border-white/12 px-3 py-2 text-xs font-black text-white/70 transition hover:border-white/30 hover:text-white" aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a español'}>
              {copy.nav.switchLanguage}
            </Link>
            <Link href="/sign-in" className="hidden text-sm font-semibold text-white/80 hover:text-white sm:block">{copy.nav.signIn}</Link>
            <Button asChild className="hidden h-11 rounded-[10px] px-5 font-black sm:inline-flex"><a href="#resolver">{copy.nav.resolve}</a></Button>
          </div>
        </div>
      </nav>

      <main>
        <section id="resolver" className="relative border-b border-white/10 px-5 pb-24 pt-36 sm:px-8 md:pb-32 md:pt-44 lg:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(184,245,66,0.13),transparent_27%),radial-gradient(circle_at_84%_20%,rgba(75,98,130,0.22),transparent_31%)]" />
          <div className="mx-auto grid max-w-[1440px] items-center gap-14 lg:grid-cols-[0.96fr_1.04fr] lg:gap-20">
            <div>
              <p className="text-sm font-black text-primary">{copy.hero.eyebrow}</p>
              <h1 className="mt-6 max-w-[860px] text-balance text-[44px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[58px] md:text-[72px]">{copy.hero.title}</h1>
              <p className="mt-7 max-w-[740px] text-pretty text-[17px] leading-8 text-white/62 sm:text-lg">{copy.hero.description}</p>
              <div className="mt-9 grid max-w-[860px] gap-3 text-sm text-white/58 sm:grid-cols-3">
                {copy.hero.proofs.map((item) => <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /><span>{item}</span></div>)}
              </div>
              <p className="mt-10 max-w-2xl text-sm leading-7 text-white/42">{copy.hero.note}</p>
            </div>
            <ResolutionEntry locale={locale} />
          </div>
        </section>

        <section id="proteccion" className="border-b border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.protection.eyebrow}</p><h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">{copy.protection.title}</h2><p className="mt-6 max-w-2xl text-base leading-8 text-white/55">{copy.protection.description}</p></div>
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-card">
                <div className="grid border-b border-white/10 sm:grid-cols-2"><div className="p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">{copy.protection.scatteredLabel}</p><p className="mt-4 text-xl font-bold text-white/75">{copy.protection.scatteredProblem}</p></div><div className="border-t border-white/10 bg-primary/[0.055] p-6 sm:border-l sm:border-t-0 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Kumplio</p><p className="mt-4 text-xl font-bold">{copy.protection.scatteredSolution}</p></div></div>
                <div className="grid sm:grid-cols-2"><div className="p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">{copy.protection.reactiveLabel}</p><p className="mt-4 text-xl font-bold text-white/75">{copy.protection.reactiveProblem}</p></div><div className="border-t border-white/10 bg-primary/[0.055] p-6 sm:border-l sm:border-t-0 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Kumplio</p><p className="mt-4 text-xl font-bold">{copy.protection.reactiveSolution}</p></div></div>
              </div>
            </div>
            <div className="mt-14 grid gap-5 lg:grid-cols-3">{copy.protection.pillars.map(({ title, description }, index) => { const Icon = privacyIcons[index]; return <article key={title} className="rounded-[24px] border border-white/10 bg-card p-7"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><h3 className="mt-6 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-7 text-white/50">{description}</p></article> })}</div>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]"><div className="max-w-4xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.solution.eyebrow}</p><h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">{copy.solution.title}</h2><p className="mt-6 max-w-3xl text-base leading-8 text-white/55">{copy.solution.description}</p></div><div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{copy.solution.layers.map((item, index) => <article key={item.title} className="rounded-[22px] border border-white/10 bg-card p-6"><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">0{index + 1}</p><h3 className="mt-5 text-xl font-black">{item.title}</h3><p className="mt-3 text-sm leading-7 text-white/50">{item.description}</p></article>)}</div></div>
        </section>

        <section id="guia" className="border-b border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]"><div className="max-w-4xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.guide.eyebrow}</p><h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">{copy.guide.title}</h2><p className="mt-6 max-w-3xl text-base leading-8 text-white/55">{copy.guide.description}</p></div><div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{copy.guide.steps.map(({ title, description }, index) => { const Icon = guideIcons[index]; return <article key={title} className="rounded-[22px] border border-white/10 bg-card p-6"><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><span className="text-xs font-black text-white/25">0{index + 1}</span></div><h3 className="mt-6 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-7 text-white/50">{description}</p></article> })}</div></div>
        </section>

        <section id="equipo" className="border-b border-white/10 px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-4xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.specialists.eyebrow}</p><h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">{copy.specialists.title}</h2><p className="mt-6 max-w-3xl text-base leading-8 text-white/55">{copy.specialists.description}</p></div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {coreCapabilities[locale].map((capability, index) => <article key={capability.name} className="rounded-[24px] border border-white/10 bg-card p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">0{index + 1} · {capability.stage}</p><h3 className="mt-3 text-2xl font-black">{capability.name}</h3><p className="mt-2 text-sm font-semibold text-white/70">{capability.role}</p></div><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></div></div><p className="mt-5 text-sm leading-7 text-white/50">{capability.description}</p></article>)}
            </div>
            <p className="mt-8 max-w-3xl text-sm leading-7 text-white/42">{copy.specialists.note}</p>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12"><div className="mx-auto max-w-[1440px]"><div className="max-w-4xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.scenarios.eyebrow}</p><h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">{copy.scenarios.title}</h2></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{copy.scenarios.items.map((scenario) => <article key={scenario.label} className="rounded-[24px] border border-white/10 bg-card p-7"><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{scenario.label}</p><h3 className="mt-5 text-2xl font-black leading-tight">{scenario.title}</h3><div className="mt-6 space-y-3">{scenario.examples.map((example) => <div key={example} className="flex items-center gap-3 text-sm text-white/55"><ArrowRight className="h-4 w-4 shrink-0 text-primary" /><span>{example}</span></div>)}</div></article>)}</div></div></section>

        <section id="seguridad" className="border-b border-white/10 px-5 py-24 sm:px-8 md:py-32 lg:px-12"><div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center"><div><ShieldCheck className="h-10 w-10 text-primary" /><p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.security.eyebrow}</p><h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">{copy.security.title}</h2><p className="mt-6 max-w-2xl text-base leading-8 text-white/55">{copy.security.description}</p><p className="mt-4 max-w-2xl text-sm leading-7 text-white/42">{copy.security.note}</p></div><div className="grid gap-4 sm:grid-cols-3">{copy.security.cards.map(({ title, description }) => <article key={title} className="rounded-[22px] border border-white/10 bg-card p-6"><h3 className="font-black">{title}</h3><p className="mt-3 text-sm leading-7 text-white/50">{description}</p></article>)}</div></div></section>

        <section className="px-5 py-24 text-center sm:px-8 md:py-32 lg:px-12"><div className="mx-auto max-w-4xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.cta.eyebrow}</p><h2 className="mt-5 text-balance text-4xl font-extrabold tracking-[-0.035em] md:text-6xl">{copy.cta.title}</h2><p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/55">{copy.cta.description}</p><Button size="lg" asChild className="mt-8 h-13 rounded-[10px] px-8 font-black"><a href="#resolver">{copy.cta.action} <ArrowRight className="ml-2 h-4 w-4" /></a></Button></div></section>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
