import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { PublicWorkspacePreview } from '@/components/marketing/public-workspace-preview'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'

const COPY = {
  es: {
    metadata: {
      title: 'Demo interactiva | Cómo funciona Kumplio',
      description: 'Explora una demostración ficticia y navegable de cómo Kumplio organiza un caso de protección de datos, especialistas, evidencia, reservas y acciones.',
    },
    back: 'Volver a Kumplio',
    eyebrow: 'Demostración pública · datos ficticios',
    title: 'Entra al producto antes de crear una cuenta.',
    description: 'Cambia el escenario, recorre especialistas, abre evidencia y revisa el plan. Esta demo no ejecuta un análisis real: representa de forma determinística cómo Kumplio organiza un expediente y mantiene la revisión humana.',
    guardrails: ['Sin datos reales', 'Sin conclusión de cumplimiento', 'Sin acciones sobre producción'],
    sectionEyebrow: 'Workspace demostrativo',
    sectionTitle: 'Un expediente conecta lo que antes vivía separado.',
    sectionDescription: 'El objetivo, las fuentes, los especialistas, la evidencia, las reservas y las acciones permanecen relacionados. Eso permite revisar por qué se propone un siguiente paso y qué falta demostrar antes de cerrar.',
    points: [
      ['Contexto antes de conclusiones', 'Kumplio separa lo aportado, lo recuperado y lo que todavía falta confirmar.'],
      ['Especialistas con fronteras', 'Cada capacidad tiene una función definida y sus resultados quedan sujetos a revisión.'],
      ['Evidencia conectada', 'Los documentos no quedan aislados: se relacionan con controles, decisiones y criterios de cierre.'],
    ],
    ctaEyebrow: 'Pasa de la demo a tu situación',
    ctaTitle: 'Describe lo que necesitas proteger o resolver.',
    ctaDescription: 'Tu expediente real comienza con tu objetivo y contexto autorizado. Kumplio no reutiliza los datos ficticios de esta demostración.',
    cta: 'Empezar un caso',
    pricing: 'Ver planes',
    switchLanguage: 'English',
  },
  en: {
    metadata: {
      title: 'Interactive demo | How Kumplio works',
      description: 'Explore a fictional, interactive demonstration of how Kumplio organizes a data-protection case, specialists, evidence, reservations and actions.',
    },
    back: 'Back to Kumplio',
    eyebrow: 'Public demo · fictional data',
    title: 'Enter the product before creating an account.',
    description: 'Change the scenario, explore specialists, open evidence and review the plan. This demo does not run a real analysis: it deterministically represents how Kumplio organizes a case file and preserves human review.',
    guardrails: ['No real data', 'No compliance conclusion', 'No production actions'],
    sectionEyebrow: 'Demo workspace',
    sectionTitle: 'One case file connects what used to live apart.',
    sectionDescription: 'The objective, sources, specialists, evidence, reservations and actions stay connected. That makes it possible to review why a next step is proposed and what still needs to be demonstrated before closure.',
    points: [
      ['Context before conclusions', 'Kumplio separates what was provided, what was retrieved and what still needs confirmation.'],
      ['Specialists with boundaries', 'Each capability has a defined responsibility and its outputs remain subject to review.'],
      ['Connected evidence', 'Documents do not remain isolated: they connect to controls, decisions and closure criteria.'],
    ],
    ctaEyebrow: 'Move from the demo to your situation',
    ctaTitle: 'Describe what you need to protect or resolve.',
    ctaDescription: 'Your real case file begins with your objective and authorized context. Kumplio does not reuse the fictional data from this demonstration.',
    cta: 'Start a case',
    pricing: 'View plans',
    switchLanguage: 'Español',
  },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getPublicRequestContext()
  const copy = COPY[locale]
  const canonical = withPublicLocale('/demo', locale)

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    alternates: {
      canonical,
      languages: {
        'es-CL': withPublicLocale('/demo', 'es'),
        en: withPublicLocale('/demo', 'en'),
        'x-default': withPublicLocale('/demo', 'es'),
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

export default async function DemoPage() {
  const { locale } = await getPublicRequestContext()
  const copy = COPY[locale]
  const alternateLocale = locale === 'es' ? 'en' : 'es'
  const homeHref = getPublicSiteHref('/', locale)
  const pricingHref = getPublicSiteHref('/pricing', locale)
  const alternateDemoHref = withPublicLocale('/demo', alternateLocale)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#111723]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href={homeHref} aria-label="Kumplio">
            <Image src="/logo-kumplio.svg" alt="Kumplio" width={145} height={58} priority className="h-11 w-auto" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={alternateDemoHref}
              hrefLang={alternateLocale === 'es' ? 'es-CL' : 'en'}
              className="rounded-lg border border-white/12 px-3 py-2 text-xs font-black text-white/70 transition hover:border-white/30 hover:text-white"
            >
              {copy.switchLanguage}
            </Link>
            <Button asChild className="hidden rounded-[10px] font-black sm:inline-flex">
              <Link href={`${homeHref}#resolver`}>{copy.cta}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10 px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(184,245,66,0.12),transparent_28%),radial-gradient(circle_at_80%_45%,rgba(75,98,130,0.2),transparent_30%)]" />
          <div className="mx-auto max-w-[1180px] text-center">
            <Link href={homeHref} className="inline-flex items-center gap-2 text-sm font-semibold text-white/45 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> {copy.back}
            </Link>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.eyebrow}</p>
            <h1 className="mx-auto mt-4 max-w-5xl text-balance text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl md:text-7xl">{copy.title}</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/55">{copy.description}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {copy.guardrails.map((item) => <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-4 py-2 text-xs font-bold text-white/50"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />{item}</span>)}
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <PublicWorkspacePreview locale={locale} mode="full" />
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0d131e] px-5 py-20 sm:px-8 md:py-24 lg:px-12">
          <div className="mx-auto max-w-[1180px]">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.sectionEyebrow}</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">{copy.sectionTitle}</h2>
              <p className="mt-6 max-w-3xl text-base leading-8 text-white/55">{copy.sectionDescription}</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {copy.points.map(([title, description]) => (
                <article key={title} className="rounded-[22px] border border-white/10 bg-card p-6">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="mt-5 text-lg font-black">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/48">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 text-center sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{copy.ctaEyebrow}</p>
            <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-[-0.035em] md:text-6xl">{copy.ctaTitle}</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/55">{copy.ctaDescription}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-13 rounded-[10px] px-8 font-black">
                <Link href={`${homeHref}#resolver`}>{copy.cta} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-13 rounded-[10px] px-8 font-black">
                <Link href={pricingHref}>{copy.pricing}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  )
}
