import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Database,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  Scale,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'
import { PUBLIC_AGENTIC_ASSURANCE, SITE_URL } from '@/lib/public-site'

const OFFICIAL_SOURCES = {
  leychile: 'https://www.bcn.cl/leychile/navegar?i=1209272',
  diarioOficial: 'https://www.diariooficial.interior.gob.cl/publicaciones/2024/12/13/44023/01/2583630.pdf',
} as const

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getPublicRequestContext()
  const canonical = withPublicLocale('/trust', locale)
  const spanish = locale === 'es'
  const title = spanish ? 'Centro de confianza y evidencia' : 'Trust and assurance center'
  const description = spanish
    ? 'Cómo Kumplio trabaja con fuentes oficiales, evidencia, aislamiento por organización, revisión humana y assurance técnico sin confundir pruebas internas con certificación.'
    : 'How Kumplio works with official sources, evidence, organization isolation, human review and technical assurance without presenting internal tests as certification.'

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        'es-CL': withPublicLocale('/trust', 'es'),
        en: withPublicLocale('/trust', 'en'),
        'x-default': withPublicLocale('/trust', 'es'),
      },
    },
    openGraph: { type: 'website', url: canonical, title, description },
  }
}

export default async function TrustPage() {
  const { locale } = await getPublicRequestContext()
  const es = locale === 'es'
  const homeHref = getPublicSiteHref('/', locale)
  const securityHref = getPublicSiteHref('/security', locale)
  const demoHref = getPublicSiteHref('/demo', locale)

  const principles = es
    ? [
        ['Fuente antes que afirmación', 'Las afirmaciones regulatorias importantes deben poder volver a una fuente identificable y revisable.'],
        ['Evidencia antes que cierre', 'Una política o documento aislado no se convierte automáticamente en prueba de operación efectiva.'],
        ['Unknowns visibles', 'Cuando falta contexto, Kumplio conserva la incertidumbre en vez de transformarla en una conclusión positiva.'],
        ['Humano en decisiones sensibles', 'Los especialistas digitales preparan y estructuran el trabajo; las decisiones sensibles mantienen revisión humana.'],
      ]
    : [
        ['Source before claim', 'Important regulatory claims should lead back to an identifiable and reviewable source.'],
        ['Evidence before closure', 'A policy or isolated document does not automatically become proof of operating effectiveness.'],
        ['Visible unknowns', 'When context is missing, Kumplio preserves uncertainty instead of turning it into a positive conclusion.'],
        ['Human review for sensitive decisions', 'Digital specialists prepare and structure the work; sensitive decisions retain human review.'],
      ]

  const controls = es
    ? [
        [Database, 'Contexto por organización', 'La información privada se organiza por tenant y no se presenta como conocimiento compartido entre organizaciones.'],
        [LockKeyhole, 'Acceso controlado', 'La arquitectura aplica fronteras de acceso y contratos tenant-scoped en las superficies privadas.'],
        [Fingerprint, 'Procedencia y trazabilidad', 'Fuentes, artefactos, revisiones y decisiones permanecen relacionados con el expediente que los originó.'],
        [UserCheck, 'Revisión humana', 'Una etapa sensible no debe avanzar solo porque un modelo produjo una respuesta.'],
      ]
    : [
        [Database, 'Organization-scoped context', 'Private information is organized by tenant and is not presented as shared knowledge across organizations.'],
        [LockKeyhole, 'Controlled access', 'The architecture applies access boundaries and tenant-scoped contracts across private surfaces.'],
        [Fingerprint, 'Provenance and traceability', 'Sources, artifacts, reviews and decisions remain connected to the case file that produced them.'],
        [UserCheck, 'Human review', 'A sensitive stage should not advance simply because a model produced an answer.'],
      ]

  const assuranceMetrics = [
    [es ? 'Etapas aprobadas' : 'Approved stages', `${PUBLIC_AGENTIC_ASSURANCE.approvedStages}/${PUBLIC_AGENTIC_ASSURANCE.stages}`],
    [es ? 'Jobs succeeded' : 'Jobs succeeded', `${PUBLIC_AGENTIC_ASSURANCE.jobsSucceeded}/${PUBLIC_AGENTIC_ASSURANCE.stages}`],
    [es ? 'Provider traces' : 'Provider traces', `${PUBLIC_AGENTIC_ASSURANCE.providerTraces}/${PUBLIC_AGENTIC_ASSURANCE.stages}`],
    [es ? 'Tool calls fallidos' : 'Failed tool calls', String(PUBLIC_AGENTIC_ASSURANCE.failedToolCalls)],
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href={homeHref} aria-label="Kumplio">
            <Image src="/logo-kumplio.svg" alt="Kumplio" width={140} height={56} priority className="h-11 w-auto" />
          </Link>
          <Button asChild variant="outline" className="rounded-[10px] font-bold">
            <Link href={demoHref}>{es ? 'Ver demo' : 'View demo'}</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <Link href={homeHref} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> {es ? 'Volver' : 'Back'}
            </Link>
            <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-primary">
              <ShieldCheck className="h-4 w-4" /> {es ? 'Centro de confianza' : 'Trust center'}
            </div>
            <h1 className="mt-6 max-w-4xl text-balance text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl">
              {es ? 'Confianza que puede inspeccionarse.' : 'Trust you can inspect.'}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              {es
                ? 'Kumplio no debería pedirte que confíes en una caja negra. Esta página explica qué fuentes priorizamos, cómo tratamos la evidencia, dónde exigimos revisión humana y qué alcance tienen nuestras pruebas técnicas.'
                : 'Kumplio should not ask you to trust a black box. This page explains which sources we prioritize, how we handle evidence, where human review is required and what our technical tests actually demonstrate.'}
            </p>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-5 md:grid-cols-2">
              {principles.map(([title, description], index) => (
                <article key={title} className="rounded-[22px] border border-border bg-card p-6 sm:p-7">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">0{index + 1}</div>
                  <h2 className="mt-5 text-xl font-extrabold">{title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/20 px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{es ? 'Fuentes oficiales' : 'Official sources'}</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              {es ? 'La fuente forma parte del resultado, no del marketing.' : 'The source is part of the result, not the marketing.'}
            </h2>
            <p className="mt-5 max-w-3xl leading-8 text-muted-foreground">
              {es
                ? 'Para el foco público actual en Ley 21.719, Kumplio prioriza el texto oficial consolidado de BCN/LeyChile y la publicación correspondiente del Diario Oficial. La arquitectura interna conserva además procedencia, fecha de recuperación, hash y versión de parser para los artefactos ingeridos.'
                : 'For the current public focus on Chilean Law 21.719, Kumplio prioritizes the official consolidated text from BCN/LeyChile and the corresponding Official Gazette publication. The internal architecture also preserves provenance, retrieval time, content hash and parser version for ingested artifacts.'}
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <SourceCard
                href={OFFICIAL_SOURCES.leychile}
                title="BCN · LeyChile"
                description={es ? 'Texto oficial consolidado y versiones de la Ley 21.719.' : 'Official consolidated text and versions of Chilean Law 21.719.'}
              />
              <SourceCard
                href={OFFICIAL_SOURCES.diarioOficial}
                title={es ? 'Diario Oficial de la República de Chile' : 'Official Gazette of Chile'}
                description={es ? 'Publicación oficial de la Ley 21.719 · 13 de diciembre de 2024.' : 'Official publication of Law 21.719 · December 13, 2024.'}
              />
            </div>

            <p className="mt-6 text-xs leading-6 text-muted-foreground">
              {es
                ? 'Kumplio es un producto independiente. No está afiliado, patrocinado, certificado ni respaldado por las instituciones mencionadas. Los nombres y marcas pertenecen a sus respectivos titulares.'
                : 'Kumplio is an independent product. It is not affiliated with, sponsored, certified or endorsed by the institutions referenced above. Names and trademarks belong to their respective owners.'}
            </p>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
              <div>
                <Scale className="h-9 w-9 text-primary" />
                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-primary">{es ? 'Controles de confianza' : 'Trust controls'}</p>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {es ? 'Diseñado para conservar contexto y reservas.' : 'Designed to preserve context and reservations.'}
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {controls.map(([Icon, title, description]) => (
                  <article key={String(title)} className="rounded-[22px] border border-border bg-card p-6">
                    <Icon className="h-6 w-6 text-primary" />
                    <h3 className="mt-5 font-extrabold">{String(title)}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{String(description)}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/20 px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-[28px] border border-primary/20 bg-primary/[0.04] p-6 sm:p-9">
              <div className="flex items-start gap-4">
                <FileCheck2 className="mt-1 h-7 w-7 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{es ? 'Assurance técnico controlado' : 'Controlled technical assurance'}</p>
                  <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
                    {es ? 'Un E2E productivo controlado completó 5/5 etapas.' : 'A controlled production E2E completed 5/5 stages.'}
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                    {es
                      ? `Observado el ${PUBLIC_AGENTIC_ASSURANCE.observedAt}. La corrida fue sintética y controlada: comprueba comportamiento técnico dentro de ese alcance; no es evidencia de cliente, certificación de cumplimiento ni conclusión jurídica.`
                      : `Observed on ${PUBLIC_AGENTIC_ASSURANCE.observedAt}. The run was synthetic and controlled: it demonstrates technical behavior within that scope; it is not customer evidence, a compliance certification or a legal conclusion.`}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {assuranceMetrics.map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-border bg-background/70 p-5">
                    <p className="text-2xl font-black text-primary">{value}</p>
                    <p className="mt-2 text-xs font-bold text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
            <article className="rounded-[24px] border border-border bg-card p-7">
              <CheckCircle2 className="h-7 w-7 text-primary" />
              <h2 className="mt-5 text-2xl font-extrabold">{es ? 'Qué sí afirmamos' : 'What we do claim'}</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {es
                  ? 'Kumplio organiza situaciones, fuentes, evidencia, especialistas, revisiones y acciones dentro de un expediente trazable; las capacidades técnicas publicadas se acotan al alcance realmente probado.'
                  : 'Kumplio organizes situations, sources, evidence, specialists, reviews and actions in a traceable case file; published technical capabilities are bounded by the scope actually tested.'}
              </p>
            </article>
            <article className="rounded-[24px] border border-border bg-card p-7">
              <ShieldCheck className="h-7 w-7 text-primary" />
              <h2 className="mt-5 text-2xl font-extrabold">{es ? 'Qué no afirmamos' : 'What we do not claim'}</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {es
                  ? 'No afirmamos certificaciones externas, cumplimiento integral automático, sustitución de asesoría jurídica, eficacia de un control sin evidencia suficiente ni cierre operacional donde todavía existen unknowns.'
                  : 'We do not claim external certifications, automatic comprehensive compliance, replacement of legal advice, control effectiveness without sufficient evidence or operational closure while unknowns remain.'}
              </p>
            </article>
          </div>
        </section>

        <section className="border-t border-border px-5 py-20 text-center sm:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-extrabold tracking-tight">{es ? 'Revisa el producto, no solo la promesa.' : 'Inspect the product, not just the promise.'}</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">
              {es ? 'La demo pública utiliza datos ficticios y permite explorar cómo se conectan prioridades, reservas, evidencia y revisión.' : 'The public demo uses fictional data and lets you inspect how priorities, reservations, evidence and review connect.'}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-[10px] font-black"><Link href={demoHref}>{es ? 'Explorar demo' : 'Explore demo'}</Link></Button>
              <Button asChild size="lg" variant="outline" className="rounded-[10px] font-black"><Link href={securityHref}>{es ? 'Ver seguridad' : 'View security'}</Link></Button>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  )
}

function SourceCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group rounded-[22px] border border-border bg-card p-6 transition hover:border-primary/35">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-extrabold">{title}</p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
      </div>
    </a>
  )
}
