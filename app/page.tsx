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
import { AGENT_CATALOG } from '@/lib/agents/catalog'

const privacyPillars = [
  {
    title: 'Sabe qué información tienes',
    description: 'Reúne documentos, tratamientos, proveedores, controles, evidencias y decisiones para dejar de reconstruir el contexto cada vez.',
    icon: Database,
  },
  {
    title: 'Entiende qué debes proteger',
    description: 'Relaciona datos, obligaciones, riesgos y responsables para distinguir lo crítico de lo que puede esperar.',
    icon: SearchCheck,
  },
  {
    title: 'Gestiona con acceso controlado',
    description: 'Centraliza sin mezclar contextos: la información privada se organiza por organización, con trazabilidad y revisión.',
    icon: LockKeyhole,
  },
] as const

const solutionLayers = [
  {
    title: 'Mapa claro',
    description: 'Qué información existe, dónde está, quién la usa, qué falta y qué necesita revisión.',
  },
  {
    title: 'Riesgos priorizados',
    description: 'Qué puede generar exposición, qué requiere atención inmediata y qué depende de más antecedentes.',
  },
  {
    title: 'Plan de solución',
    description: 'Pasos concretos, responsables sugeridos, dependencias y criterios de cierre para avanzar sin improvisar.',
  },
  {
    title: 'Respaldo verificable',
    description: 'Fuentes, evidencia, revisiones y decisiones quedan relacionadas con el expediente para demostrar cómo se llegó al resultado.',
  },
]

const guideSteps = [
  ['Centraliza', 'Reúne en un expediente la información necesaria para entender la situación completa.', FolderKanban],
  ['Entiende', 'Kumplio relaciona antecedentes, obligaciones y contexto para identificar qué realmente importa.', SearchCheck],
  ['Prioriza', 'Los especialistas separan urgencias, brechas, riesgos y preguntas abiertas antes de proponer acciones.', Sparkles],
  ['Resuelve', 'Recibes una ruta concreta con acciones, responsables sugeridos y criterios claros de término.', Users],
  ['Verifica', 'Cada conclusión relevante se contrasta con fuentes, evidencia y revisión humana antes del cierre.', FileCheck2],
  ['Mantén control', 'El expediente conserva qué cambió, quién intervino y qué decisión quedó tomada.', CheckCircle2],
] as const

const privacyScenarios = [
  {
    label: 'Nueva Ley 21.719',
    title: 'Ordena lo que debes implementar antes de convertirlo en otro proyecto inmanejable.',
    examples: ['Inventario de tratamientos', 'Bases, finalidades y responsables', 'Brechas, controles y evidencia'],
  },
  {
    label: 'Información y terceros',
    title: 'Entiende dónde están tus datos y qué riesgos aparecen cuando participan proveedores o encargados.',
    examples: ['Contratos y proveedores', 'Accesos y responsables', 'Transferencias y evidencia disponible'],
  },
  {
    label: 'Casos concretos',
    title: 'Transforma una duda, solicitud o incidente en una ruta guiada para responder con contexto.',
    examples: ['Solicitud de un titular', 'Incidente o posible brecha', 'Auditoría o requerimiento de un cliente'],
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111723]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Kumplio">
            <Image src="/logo-kumplio.svg" alt="Kumplio" width={150} height={64} priority className="h-12 w-auto" />
          </Link>
          <div className="hidden items-center gap-6 lg:flex">
            <a href="#proteccion" className="text-sm font-medium text-white/65 hover:text-white">Protección de datos</a>
            <a href="#guia" className="text-sm font-medium text-white/65 hover:text-white">Cómo te guía</a>
            <a href="#equipo" className="text-sm font-medium text-white/65 hover:text-white">Especialistas</a>
            <a href="#seguridad" className="text-sm font-medium text-white/65 hover:text-white">Seguridad</a>
            <Link href="/pricing" className="text-sm font-medium text-white/65 hover:text-white">Planes</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden text-sm font-semibold text-white/80 hover:text-white sm:block">Ingresar</Link>
            <Button asChild className="h-11 rounded-[10px] px-5 font-black">
              <a href="#resolver">Resolver mi caso</a>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section id="resolver" className="relative border-b border-white/10 px-5 pb-24 pt-36 sm:px-8 md:pb-32 md:pt-44 lg:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(184,245,66,0.13),transparent_27%),radial-gradient(circle_at_84%_20%,rgba(75,98,130,0.22),transparent_31%)]" />
          <div className="mx-auto grid max-w-[1440px] items-center gap-14 lg:grid-cols-[0.96fr_1.04fr] lg:gap-20">
            <div>
              <p className="text-sm font-black text-primary">Protección de datos + guía experta para resolver</p>
              <h1 className="mt-6 max-w-[860px] text-balance text-[44px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[58px] md:text-[72px]">
                Protege tus datos. Entiende qué hacer. Avanza con una guía clara.
              </h1>
              <p className="mt-7 max-w-[740px] text-pretty text-[17px] leading-8 text-white/62 sm:text-lg">
                Kumplio centraliza la información que hoy está repartida, identifica obligaciones y riesgos, coordina especialistas digitales y convierte cada situación en una ruta concreta de solución con evidencia y revisión humana.
              </p>
              <div className="mt-9 grid max-w-[860px] gap-3 text-sm text-white/58 sm:grid-cols-3">
                {['Centraliza información sensible', 'Recibe una guía experta', 'Cierra con evidencia'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-10 max-w-2xl text-sm leading-7 text-white/42">
                Diseñado para organizaciones que necesitan prepararse para la Ley 21.719 y resolver situaciones reales de privacidad, seguridad de la información y cumplimiento sin perder contexto.
              </p>
            </div>

            <ResolutionEntry />
          </div>
        </section>

        <section id="proteccion" className="border-b border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Primero: protege y ordena</p>
                <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
                  No puedes proteger información que no sabes dónde está ni cómo se usa.
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/55">
                  La protección de datos empieza antes del checklist: necesitas saber qué información tienes, para qué se usa, quién accede, qué terceros participan, qué evidencia existe y qué decisiones ya se tomaron.
                </p>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-card">
                <div className="grid border-b border-white/10 sm:grid-cols-2">
                  <div className="p-6 sm:p-8">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">Información dispersa</p>
                    <p className="mt-4 text-xl font-bold text-white/75">Correos, carpetas, planillas, contratos y decisiones pierden relación entre sí.</p>
                  </div>
                  <div className="border-t border-white/10 bg-primary/[0.055] p-6 sm:border-l sm:border-t-0 sm:p-8">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Kumplio</p>
                    <p className="mt-4 text-xl font-bold">Un expediente conecta datos, obligaciones, responsables, controles, evidencia y decisiones.</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2">
                  <div className="p-6 sm:p-8">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">Cumplimiento reactivo</p>
                    <p className="mt-4 text-xl font-bold text-white/75">Descubres la brecha cuando llega una auditoría, solicitud o incidente.</p>
                  </div>
                  <div className="border-t border-white/10 bg-primary/[0.055] p-6 sm:border-l sm:border-t-0 sm:p-8">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Kumplio</p>
                    <p className="mt-4 text-xl font-bold">Ordena primero, detecta lo pendiente y transforma cada brecha en trabajo gestionable.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {privacyPillars.map(({ title, description, icon: Icon }) => (
                <article key={title} className="rounded-[24px] border border-white/10 bg-card p-7">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Después: convierte contexto en solución</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
                No necesitas otro diagnóstico. Necesitas saber qué hacer después.
              </h2>
              <p className="mt-6 max-w-3xl text-base leading-8 text-white/55">
                Kumplio no se queda en señalar una obligación o una brecha. La guía conecta el problema con una siguiente acción, un responsable, evidencia esperada y una condición concreta de cierre.
              </p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {solutionLayers.map((item, index) => (
                <article key={item.title} className="rounded-[22px] border border-white/10 bg-card p-6">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">0{index + 1}</p>
                  <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="guia" className="border-b border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Guía experta, paso a paso</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
                De información desordenada a una decisión respaldada.
              </h2>
              <p className="mt-6 max-w-3xl text-base leading-8 text-white/55">
                Cada etapa reduce incertidumbre. Kumplio organiza el contexto, activa las capacidades necesarias, muestra qué falta y conserva la revisión antes de que una conclusión sensible avance.
              </p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {guideSteps.map(([title, description, Icon], index) => (
                <article key={title} className="rounded-[22px] border border-white/10 bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-black text-white/25">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="equipo" className="border-b border-white/10 px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Especialistas digitales coordinados</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
                Una guía experta funciona mejor cuando cada especialista sabe exactamente qué debe resolver.
              </h2>
              <p className="mt-6 max-w-3xl text-base leading-8 text-white/55">
                Kumplio no usa una IA genérica para todo. Cada agente tiene una responsabilidad, trabaja sobre contexto autorizado y entrega resultados concretos que pueden revisarse antes de tomar una decisión.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {AGENT_CATALOG.map((agent, index) => (
                <article key={agent.id} className="rounded-[24px] border border-white/10 bg-card p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Especialista 0{index + 1}</p>
                      <h3 className="mt-3 text-2xl font-black">{agent.name}</h3>
                      <p className="mt-2 text-sm font-semibold text-white/70">{agent.role}</p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-white/50">{agent.mission}</p>
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">Entrega</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {agent.delivers.slice(0, 3).map((deliverable) => (
                        <span key={deliverable} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/55">
                          {deliverable}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-8 max-w-3xl text-sm leading-7 text-white/42">
              No todos intervienen en todos los casos. Kumplio activa las capacidades necesarias, conserva qué agente trabajó, qué produjo y qué revisión recibió, y mantiene la decisión final bajo control humano.
            </p>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Problemas reales de privacidad</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
                Empieza por la situación que necesitas resolver, no por aprender un módulo.
              </h2>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {privacyScenarios.map((scenario) => (
                <article key={scenario.label} className="rounded-[24px] border border-white/10 bg-card p-7">
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

        <section id="seguridad" className="border-b border-white/10 px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <ShieldCheck className="h-10 w-10 text-primary" />
              <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-primary">Seguridad de la información</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">La protección de datos también exige proteger el contexto con el que trabajas.</h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/55">
                Centralizar solo sirve si la información permanece controlada. Kumplio está diseñado para separar el contexto privado de cada organización, limitar el acceso y conservar trazabilidad sobre ejecuciones, resultados, revisiones y decisiones.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/42">
                El objetivo no es acumular más información: es reunir únicamente la necesaria para gestionar mejor, con contexto, responsabilidad y evidencia.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Aislamiento por organización', 'El contexto privado de una organización se mantiene separado del de las demás.'],
                ['Trazabilidad de decisiones', 'El expediente conserva qué se hizo, qué cambió, qué evidencia se revisó y quién decidió.'],
                ['Revisión humana', 'Los especialistas digitales preparan el trabajo; las decisiones sensibles mantienen validación humana.'],
              ].map(([title, description]) => (
                <article key={title} className="rounded-[22px] border border-white/10 bg-card p-6">
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 text-center sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Protección de datos sin empezar desde cero</p>
            <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-[-0.035em] md:text-6xl">
              Cuéntanos qué necesitas proteger o resolver.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/55">
              Kumplio centraliza los antecedentes, organiza el trabajo de los especialistas y te guía hasta una decisión respaldada por contexto, evidencia y revisión.
            </p>
            <Button size="lg" asChild className="mt-8 h-13 rounded-[10px] px-8 font-black">
              <a href="#resolver">Empezar un caso <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
