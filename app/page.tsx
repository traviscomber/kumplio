import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { ResolutionEntry } from '@/components/marketing/resolution-entry'
import { MobilePublicNav } from '@/components/marketing/mobile-public-nav'
import { HomeMotionController } from '@/components/marketing/home-motion-controller'
import { AGENT_CATALOG } from '@/lib/agents/catalog'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'
import { VERTICAL_IMAGES, VERTICAL_IMAGE_POSITIONS, VERTICAL_PUBLIC_COPY, VERTICAL_SLUGS } from '@/lib/i18n/vertical-public-copy'

const sections = 'border-b border-[#393833] px-5 py-20 sm:px-8 md:py-28 lg:px-12'
const eyebrow = 'text-[11px] font-medium uppercase tracking-[.22em] text-[#B17A4D]'
const h2 = 'mt-5 max-w-4xl text-balance text-[38px] font-light leading-[1.12] tracking-[-.03em] text-[#C2A887] md:text-[52px]'
const navLink = 'text-sm text-[#AAA69C] transition hover:text-[#C2A887] focus-visible:outline-none'

function AreaCard({ slug, locale }: { slug: (typeof VERTICAL_SLUGS)[number]; locale: 'es' | 'en' }) {
  const area = VERTICAL_PUBLIC_COPY[locale][slug]

  return (
    <Link
      href={getPublicSiteHref(`/verticales/${slug}`, locale)}
      className="group relative min-h-[420px] overflow-hidden border-b border-[#393833] p-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#A7C63A] lg:border-b-0 lg:border-r last:border-r-0"
    >
      <Image
        src={VERTICAL_IMAGES[slug]}
        alt=""
        fill
        sizes="(min-width:1024px) 33vw,100vw"
        style={{ objectPosition: VERTICAL_IMAGE_POSITIONS[slug] }}
        className="object-cover opacity-45 grayscale-[20%] transition duration-300 group-hover:scale-[1.015] group-hover:opacity-58"
      />
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,23,21,.04),rgba(23,23,21,.97)_94%)]" />
      <div className="relative flex h-full flex-col">
        <h3 className="mt-auto text-3xl font-light text-[#C2A887]">{area.name}</h3>
        <p className="mt-4 text-base leading-7 text-[#C8C3B8]">{area.heroQuestion}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#A7C63A]">
          {locale === 'es' ? 'Explorar área' : 'Explore area'}
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}

const copy = {
  es: {
    nav: ['Cómo funciona', 'Áreas', 'Para empresas', 'Para trabajadores', 'Precios'],
    signIn: 'Ingresar', action: 'Comenzar', language: 'English',
    heroEyebrow: 'El sistema operativo de cumplimiento',
    heroTitleA: 'Cumplir.', heroTitleB: 'Sin perseguir documentos.',
    heroSupport: 'Kumplio conecta personas, documentos, requisitos y evidencia para mostrarte qué está en regla, qué necesita atención y qué hacer después.',
    workerPath: 'Soy trabajador', companyPath: 'Gestiono una empresa',
    problemEyebrow: 'El problema', problemTitle: 'El cumplimiento se dispersa. La responsabilidad no.',
    problemBody: 'Documentos en correos, vencimientos en planillas y requisitos que cambian según la persona, el proveedor o la operación. Kumplio convierte esas relaciones en una ruta visible y verificable.',
    startTitle: '¿Qué necesitas tener en regla?', startBody: 'Describe una situación y recibe una orientación inicial antes de crear tu cuenta.',
    howEyebrow: 'Cómo funciona', howTitle: 'Una sola ruta para entender, resolver y demostrar.',
    how: [
      ['Entiende', 'Kumplio identifica requisitos, documentos, brechas y cambios.'],
      ['Resuelve', 'Prioriza lo importante y organiza qué hacer, quién debe hacerlo y cuándo.'],
      ['Demuestra', 'Conserva evidencia, revisión y trazabilidad de lo que quedó resuelto.'],
    ],
    pathsEyebrow: 'Dos caminos, un mismo núcleo', workerTitle: 'Tus documentos listos para trabajar.', workerBody: 'Documentos, certificaciones, vencimientos, alertas e información verificada reutilizable.', workerCta: 'Crear mi perfil',
    companyTitle: 'Controla el cumplimiento de tu equipo.', companyBody: 'Trabajadores, contratistas, requisitos, verificación, alertas, evidencia y estado.', companyCta: 'Gestionar mi empresa',
    statusEyebrow: 'Resultado', statusTitle: 'Todo claro en una sola vista.', statusLabels: ['listos', 'necesitan atención', 'vencen pronto'],
    areasEyebrow: 'Kumplio Areas', areasTitle: 'Activa el contexto que necesita tu operación.', allAreas: 'Ver todas las áreas',
    agentsEyebrow: 'Kumplio Agents', agentsTitle: 'Un equipo coordinado. No siete herramientas separadas.', agentsBody: 'No necesitas saber qué agente usar. Kumplio coordina el equipo por ti.',
    workflowTitle: 'Así trabaja Kumplio', changed: 'Cambió una norma', changedResult: 'Sabes qué cambió, qué hacer y qué falta.', team: '¿Mi equipo puede trabajar hoy?', teamResult: 'Sabes quién está listo y quién necesita atención.',
    exampleEyebrow: 'Caso concreto', exampleTitle: 'Un proveedor crítico vence en 12 días y falta un certificado.', reviews: 'Kumplio revisa', result: 'Resultado',
    exampleChain: 'Proveedor → requisito → certificado → vencimiento → responsable → acción.',
    exampleResult: 'Renovar antes del 14/09. Responsable: Operaciones. 2 evidencias pendientes.',
    pricingEyebrow: 'Kumplio Core', pricingTitle: 'La plataforma compartida para todas tus áreas de cumplimiento.', pricingBody: 'Comienza con Kumplio Core y activa las áreas que necesita tu operación.', pricingCta: 'Ver planes y precios',
    finalEyebrow: 'Empieza con una situación real', finalTitle: 'Kumplio recomienda. Tú decides.', finalBody: 'La revisión humana permanece en las decisiones legales, de auditoría y de cierre.',
  },
  en: {
    nav: ['How it works', 'Areas', 'For companies', 'For workers', 'Pricing'],
    signIn: 'Sign in', action: 'Get started', language: 'Español',
    heroEyebrow: 'The compliance operating system', heroTitleA: 'Stay compliant.', heroTitleB: 'Without chasing documents.',
    heroSupport: 'Kumplio connects people, documents, requirements and evidence to show what is in order, what needs attention and what to do next.',
    workerPath: 'I am a worker', companyPath: 'I manage a company',
    problemEyebrow: 'The problem', problemTitle: 'Compliance gets scattered. Accountability does not.', problemBody: 'Documents in email, expirations in spreadsheets and requirements that change by person, vendor or operation. Kumplio turns those relationships into a visible, verifiable path.',
    startTitle: 'What do you need to keep in order?', startBody: 'Describe a situation and receive initial guidance before creating an account.',
    howEyebrow: 'How it works', howTitle: 'One path to understand, resolve and demonstrate.',
    how: [['Understand', 'Kumplio identifies requirements, documents, gaps and changes.'], ['Resolve', 'Prioritize what matters and organize what to do, who should do it and when.'], ['Demonstrate', 'Preserve evidence, review and traceability for what was resolved.']],
    pathsEyebrow: 'Two paths, one shared core', workerTitle: 'Your documents ready for work.', workerBody: 'Documents, certifications, expirations, alerts and reusable verified information.', workerCta: 'Create my profile',
    companyTitle: 'Control your team’s compliance.', companyBody: 'Workers, contractors, requirements, verification, alerts, evidence and status.', companyCta: 'Manage my company',
    statusEyebrow: 'Outcome', statusTitle: 'Everything clear in one view.', statusLabels: ['ready', 'need attention', 'expire soon'],
    areasEyebrow: 'Kumplio Areas', areasTitle: 'Activate the context your operation needs.', allAreas: 'View all areas',
    agentsEyebrow: 'Kumplio Agents', agentsTitle: 'One coordinated team. Not seven separate tools.', agentsBody: 'You do not need to choose an agent. Kumplio coordinates the team for you.',
    workflowTitle: 'How Kumplio works', changed: 'A regulation changed', changedResult: 'Know what changed, what to do and what remains.', team: 'Can my team work today?', teamResult: 'Know who is ready and who needs attention.',
    exampleEyebrow: 'Concrete situation', exampleTitle: 'A critical vendor expires in 12 days and one certificate is missing.', reviews: 'Kumplio reviews', result: 'Outcome',
    exampleChain: 'Vendor → requirement → certificate → expiration → owner → action.', exampleResult: 'Renew before 14/09. Owner: Operations. 2 evidence items pending.',
    pricingEyebrow: 'Kumplio Core', pricingTitle: 'The shared platform for every compliance area.', pricingBody: 'Start with Kumplio Core and activate the areas your operation needs.', pricingCta: 'View plans and pricing',
    finalEyebrow: 'Start with a real situation', finalTitle: 'Kumplio recommends. You decide.', finalBody: 'Human review remains part of legal, audit and closure decisions.',
  },
} as const

export default async function HomePage() {
  const { locale } = await getPublicRequestContext()
  const c = copy[locale]
  const alternateLocale = locale === 'es' ? 'en' : 'es'
  const areas = VERTICAL_SLUGS.slice(0, 3)
  const agentRoles = locale === 'es'
    ? ['Obligaciones y evidencia', 'Riesgo y prioridad', 'Planes guiados', 'Cambio regulatorio', 'Control y cierre', 'Desempeño y aprendizaje', 'Revisión legal y calidad']
    : ['Obligations and evidence', 'Risk and priority', 'Guided plans', 'Regulatory change', 'Control and closure', 'Performance and learning', 'Legal and quality review']

  const menuItems = [
    { href: '#como-funciona', label: c.nav[0] }, { href: '#areas', label: c.nav[1] },
    { href: '#empresa', label: c.nav[2] }, { href: '#trabajador', label: c.nav[3] },
    { href: getPublicSiteHref('/pricing', locale), label: c.nav[4] },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#171715] text-[#AAA69C]">
      <HomeMotionController />
      <nav aria-label={locale === 'es' ? 'Principal' : 'Primary'} className="fixed inset-x-0 top-0 z-50 border-b border-[#393833] bg-[#171715]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href={withPublicLocale('/', locale)} aria-label="Kumplio"><Image src="/kumplio-logo-canonical.png" alt="Kumplio" width={455} height={171} priority className="h-auto w-[154px] sm:w-[190px]" /></Link>
          <div className="hidden items-center gap-7 lg:flex">{menuItems.map((item) => item.href === '#areas' ? (
            <details key={item.href} className="group relative">
              <summary className={`${navLink} cursor-pointer list-none py-3`}>{item.label}<span className="ml-2 inline-block text-[#A7C63A] transition-transform group-open:rotate-90">→</span></summary>
              <div className="absolute left-1/2 top-full w-[620px] -translate-x-1/2 border border-[#393833] bg-[#171715]/98 p-5 shadow-2xl">
                <div className="grid grid-cols-2 gap-x-8">
                  {VERTICAL_SLUGS.map((slug) => <Link key={slug} href={getPublicSiteHref(`/verticales/${slug}`, locale)} className="border-b border-[#393833] px-2 py-4 text-sm text-[#AAA69C] transition hover:text-[#C2A887] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A7C63A]"><span className="block text-[#C2A887]">{VERTICAL_PUBLIC_COPY[locale][slug].name}</span><span className="mt-1 block text-xs leading-5">{VERTICAL_PUBLIC_COPY[locale][slug].heroQuestion}</span></Link>)}
                </div>
                <a href="#areas" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#A7C63A]">{locale === 'es' ? 'Ver sección de áreas' : 'View areas section'}<ArrowRight className="h-4 w-4" /></a>
              </div>
            </details>
          ) : <a key={item.href} href={item.href} className={navLink}>{item.label}</a>)}</div>
          <div className="hidden items-center gap-4 lg:flex"><Link href={withPublicLocale('/', alternateLocale)} className={navLink}>{c.language}</Link><Link href="/sign-in" className={navLink}>{c.signIn}</Link><Button asChild className="rounded-[4px]"><a href="#resolver-form">{c.action}</a></Button></div>
          <MobilePublicNav alternateHomeHref={withPublicLocale('/', alternateLocale)} switchLanguage={c.language} signIn={c.signIn} tryLabel={c.action} menuLabel={locale === 'es' ? 'Abrir menú' : 'Open menu'} items={menuItems} />
        </div>
      </nav>

      <main>
        <section className="relative border-b border-[#393833] pt-20">
          {locale === 'es' && <div className="relative mx-auto hidden aspect-[1600/611] w-full max-w-[1920px] lg:block">
            <Image src="/brand/kumplio-master-hero.jpg" alt="Cumplir sin perseguir documentos: Kumplio conecta personas, documentos, requisitos y evidencia." fill priority sizes="100vw" className="object-contain" />
            <h1 className="sr-only">Cumplir. Sin perseguir documentos.</h1>
            <p className="sr-only">{c.heroSupport}</p>
            <a href="/sign-up?audience=person" aria-label="Soy trabajador: crear mi perfil" className="absolute left-[7.7%] top-[61.5%] h-[10%] w-[14.8%] rounded-[4px] focus-visible:ring-2 focus-visible:ring-[#A7C63A]" />
            <a href="/sign-up?audience=company" aria-label="Gestiono una empresa: crear mi cuenta" className="absolute left-[26.1%] top-[61.5%] h-[10%] w-[15%] rounded-[4px] focus-visible:ring-2 focus-visible:ring-[#A7C63A]" />
          </div>}
          <div className={`relative min-h-[740px] overflow-hidden ${locale === 'es' ? 'lg:hidden' : ''}`}>
            <Image src="/brand/kumplio-hero-compliance.webp" alt="" fill priority sizes="100vw" className="object-cover object-[68%_center] opacity-30 grayscale-[30%]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#171715_4%,rgba(23,23,21,.93)_42%,rgba(23,23,21,.28)_100%)]" />
            <div className="relative mx-auto flex min-h-[740px] max-w-[1440px] items-center px-5 py-24 sm:px-8 lg:px-12">
            <div data-reveal className="max-w-[760px]">
              <p className={eyebrow}>{c.heroEyebrow}</p>
              <h1 className="mt-8 text-balance text-[52px] font-light leading-[1.01] tracking-[-.045em] text-[#C2A887] sm:text-[72px] lg:text-[84px]"><span>{c.heroTitleA}</span><br /><span className="text-[#B17A4D]">{c.heroTitleB}</span></h1>
              <p className="mt-8 max-w-[660px] text-[18px] leading-8 text-[#AAA69C]">{c.heroSupport}</p>
              <div className="mt-10 flex flex-wrap gap-3"><Button asChild className="h-12 rounded-[4px] px-6"><a href="#trabajador">{c.workerPath}</a></Button><Button asChild variant="outline" className="h-12 rounded-[4px] border-[#747169] bg-[#171715]/70 px-6 text-[#C2A887]"><a href="#empresa">{c.companyPath}</a></Button></div>
            </div>
          </div>
          </div>
        </section>

        <section className={sections}><div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-2"><div data-reveal><p className={eyebrow}>{c.problemEyebrow}</p><h2 className={h2}>{c.problemTitle}</h2></div><p data-reveal className="self-end text-lg leading-9 text-[#AAA69C]">{c.problemBody}</p></div></section>

        <section id="resolver-form" className={`scroll-mt-20 bg-[#20201D] ${sections}`}><div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[.78fr_1.22fr]"><div><p className={eyebrow}>{c.startTitle}</p><h2 className={h2}>{c.startBody}</h2></div><ResolutionEntry locale={locale} /></div></section>

        <section id="como-funciona" className="scroll-mt-20 border-b border-[#393833]">
          {locale === 'es' && <div className="relative mx-auto hidden aspect-video w-full max-w-[1920px] lg:block"><Image src="/brand/kumplio-master-how.jpg" alt="Así funciona Kumplio: Entiende, Resuelve y Demuestra." fill sizes="100vw" className="object-contain" /><div className="sr-only"><h2>Así funciona Kumplio.</h2>{c.how.map(([title, body]) => <section key={title}><h3>{title}</h3><p>{body}</p></section>)}</div></div>}
          <div className={`${sections} ${locale === 'es' ? 'lg:hidden' : ''}`}><div className="mx-auto max-w-[1280px]"><p className={eyebrow}>{c.howEyebrow}</p><h2 className={h2}>{c.howTitle}</h2><div className="mt-14 grid border-y border-[#393833] md:grid-cols-3">{c.how.map(([title, body], index) => <article key={title} data-reveal className="border-b border-[#393833] py-9 md:border-b-0 md:border-r md:px-8 first:md:pl-0 last:md:border-r-0"><span className="text-[10px] text-[#B17A4D]">0{index + 1}</span><h3 className="mt-5 text-3xl font-light text-[#C2A887]">{title}</h3><p className="mt-4 text-sm leading-7">{body}</p></article>)}</div></div></div>
        </section>

        <section className="relative scroll-mt-20 border-b border-[#393833] bg-[#20201D]">
          <span id="trabajador" className="absolute -top-20" aria-hidden="true" />
          <span id="empresa" className="absolute -top-20" aria-hidden="true" />
          {locale === 'es' && <div className="relative mx-auto hidden aspect-video w-full max-w-[1920px] lg:block"><Image src="/brand/kumplio-master-paths.jpg" alt="Dos caminos, un mismo resultado: Kumplio para trabajadores y para empresas." fill sizes="100vw" className="object-contain" /><h2 className="sr-only">Dos caminos. Un mismo resultado.</h2><p className="sr-only">{c.workerTitle} {c.workerBody} {c.companyTitle} {c.companyBody}</p><a href="/sign-up?audience=person" aria-label="Crear mi perfil de trabajador" className="absolute left-[25%] top-[71%] h-[8%] w-[17.8%] rounded-[4px] focus-visible:ring-2 focus-visible:ring-[#A7C63A]" /><a href="/sign-up?audience=company" aria-label="Gestionar mi empresa" className="absolute left-[54.2%] top-[71%] h-[8%] w-[19.5%] rounded-[4px] focus-visible:ring-2 focus-visible:ring-[#A7C63A]" /></div>}
          <div className={`${sections} ${locale === 'es' ? 'lg:hidden' : ''}`}><div className="mx-auto max-w-[1280px]"><p className={eyebrow}>{c.pathsEyebrow}</p><div className="mt-12 grid gap-0 border-y border-[#393833] lg:grid-cols-2"><article className="py-12 lg:border-r lg:border-[#393833] lg:pr-14"><h2 className="text-4xl font-light text-[#C2A887]">{c.workerTitle}</h2><p className="mt-5 max-w-lg leading-8">{c.workerBody}</p><Link href="/sign-up?audience=person" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#A7C63A]">{c.workerCta}<ArrowRight className="h-4 w-4" /></Link></article><article className="py-12 lg:pl-14"><h2 className="text-4xl font-light text-[#C2A887]">{c.companyTitle}</h2><p className="mt-5 max-w-lg leading-8">{c.companyBody}</p><Link href="/sign-up?audience=company" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#A7C63A]">{c.companyCta}<ArrowRight className="h-4 w-4" /></Link></article></div></div></div>
        </section>

        <section className={sections}><div className="mx-auto max-w-[1100px]"><p className={eyebrow}>{c.statusEyebrow}</p><h2 className={h2}>{c.statusTitle}</h2><div className="mt-14 grid border-y border-[#393833] sm:grid-cols-3">{[['92%', c.statusLabels[0]], ['9', c.statusLabels[1]], ['17', c.statusLabels[2]]].map(([value, label], index) => <div key={label} className="py-10 sm:border-r sm:border-[#393833] sm:px-8 last:border-r-0"><p className={`text-5xl font-light ${index === 0 ? 'text-[#A7C63A]' : 'text-[#C2A887]'}`}>{value}</p><p className="mt-3 text-sm">{label}</p></div>)}</div></div></section>

        <section id="areas" className={`scroll-mt-20 bg-[#20201D] ${sections}`}><div className="mx-auto max-w-[1280px]"><p className={eyebrow}>{c.areasEyebrow}</p><h2 className={h2}>{c.areasTitle}</h2><div className="mt-14 grid gap-0 border-y border-[#393833] lg:grid-cols-3">{areas.map((slug) => <AreaCard key={slug} slug={slug} locale={locale} />)}</div><details className="group mt-8 border-b border-[#393833] pb-8"><summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-[3px] py-2 text-base text-[#C2A887] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A7C63A]"><span className="group-open:hidden">{c.allAreas}</span><span className="hidden group-open:inline">{locale === 'es' ? 'Ocultar áreas' : 'Hide areas'}</span><span className="text-[#A7C63A] transition-transform group-open:rotate-90">→</span></summary><div className="mt-6 grid gap-0 border-y border-[#393833] lg:grid-cols-3">{VERTICAL_SLUGS.slice(3).map((slug) => <AreaCard key={slug} slug={slug} locale={locale} />)}</div></details></div></section>

        <section className={sections}><div className="mx-auto max-w-[1280px]"><p className={eyebrow}>{c.agentsEyebrow}</p><h2 className={h2}>{c.agentsTitle}</h2><p className="mt-6 max-w-2xl text-lg leading-8">{c.agentsBody}</p><div className="mt-14 grid gap-0 border-y border-[#393833] md:grid-cols-3">{AGENT_CATALOG.slice(0, 3).map((agent, index) => <article key={agent.id} className="py-8 md:border-r md:border-[#393833] md:px-8 first:md:pl-0 last:md:border-r-0"><span className="text-[10px] text-[#B17A4D]">0{index + 1}</span><h3 className="mt-4 text-2xl font-light text-[#C2A887]">{agent.name}</h3><p className="mt-3 text-sm leading-7">{agentRoles[index]}</p></article>)}</div><div className="grid gap-0 border-b border-[#393833] sm:grid-cols-2 lg:grid-cols-4">{AGENT_CATALOG.slice(3).map((agent, offset) => <article key={agent.id} className="border-b border-[#393833] py-7 sm:border-r sm:px-6 lg:border-b-0 first:sm:pl-0 last:border-r-0"><h3 className="text-xl font-light text-[#C2A887]">{agent.name}</h3><p className="mt-3 text-sm leading-6">{agentRoles[offset + 3]}</p></article>)}</div></div></section>

        <section className={`bg-[#20201D] ${sections}`}><div className="mx-auto max-w-[1280px]"><p className={eyebrow}>{c.workflowTitle}</p><div className="mt-10 grid gap-12 lg:grid-cols-2"><article><h2 className="text-3xl font-light text-[#C2A887]">{c.changed}</h2><p className="mt-6 text-sm leading-8 text-[#B17A4D]">Beatriz → Isidora → Rodrigo → Javier → Verónica → Julieta</p><p className="mt-5">{c.changedResult}</p></article><article className="border-t border-[#393833] pt-10 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0"><h2 className="text-3xl font-light text-[#C2A887]">{c.team}</h2><p className="mt-6 text-sm leading-8 text-[#B17A4D]">Isidora → Rodrigo → Javier → Verónica → Julieta</p><p className="mt-5">{c.teamResult}</p></article></div></div></section>

        <section className={sections}><div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[.9fr_1.1fr]"><div><p className={eyebrow}>{c.exampleEyebrow}</p><h2 className={h2}>{c.exampleTitle}</h2></div><div className="border-y border-[#393833] py-8"><p className="text-[10px] uppercase tracking-[.18em] text-[#B17A4D]">{c.reviews}</p><p className="mt-4 leading-8 text-[#C2A887]">{c.exampleChain}</p><p className="mt-8 text-[10px] uppercase tracking-[.18em] text-[#B17A4D]">{c.result}</p><p className="mt-4 leading-8 text-[#C2A887]">{c.exampleResult}</p></div></div></section>

        <section className={`bg-[#20201D] ${sections}`}><div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className={eyebrow}>{c.pricingEyebrow}</p><h2 className={h2}>{c.pricingTitle}</h2><p className="mt-6 max-w-2xl leading-8">{c.pricingBody}</p></div><Button asChild className="h-12 rounded-[4px] px-6"><Link href={getPublicSiteHref('/pricing', locale)}>{c.pricingCta}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></section>

        <section className={sections}><div className="mx-auto max-w-[1000px] text-center"><p className={eyebrow}>{c.finalEyebrow}</p><h2 className="mt-6 text-5xl font-light text-[#C2A887]">{c.finalTitle}</h2><p className="mx-auto mt-6 max-w-2xl leading-8">{c.finalBody}</p><div className="mt-8"><Button asChild className="h-12 rounded-[4px] px-7"><a href="#resolver-form">{c.action}<CheckCircle2 className="ml-2 h-4 w-4" /></a></Button></div></div></section>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
