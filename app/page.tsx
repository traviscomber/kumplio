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

const resultLayers = [
  {
    title: 'Qué importa ahora',
    description: 'Kumplio separa lo urgente de lo que puede esperar según el contexto y la evidencia disponible.',
  },
  {
    title: 'Qué debes hacer',
    description: 'Recibes una siguiente acción clara y un plan que puede revisarse, asignarse y cerrarse.',
  },
  {
    title: 'Qué respalda la conclusión',
    description: 'Cada resultado conserva fuentes, documentos, artefactos, revisiones y decisiones relacionadas.',
  },
  {
    title: 'Qué falta confirmar',
    description: 'Las dudas, reservas y datos ausentes se muestran expresamente. Kumplio no inventa certezas.',
  },
]

const steps = [
  ['Entiende', 'Interpreta el resultado que necesitas, no solo una palabra clave o una normativa.', SearchCheck],
  ['Organiza', 'Centraliza en un expediente los antecedentes que realmente afectan tu situación.', FolderKanban],
  ['Trabaja', 'Asigna especialistas digitales según el objetivo y registra cada ejecución real.', Users],
  ['Prepara', 'Convierte hallazgos en prioridades, acciones y criterios concretos de cierre.', Sparkles],
  ['Verifica', 'Relaciona conclusiones con fuentes, evidencia y revisión humana antes de avanzar.', FileCheck2],
  ['Acompaña', 'Mantiene el caso abierto hasta que la acción quede respaldada y pueda cerrarse.', CheckCircle2],
] as const

const audiences = [
  {
    label: 'Personas',
    title: 'Entiende tu situación y sabe qué hacer después.',
    examples: ['Me llegó una carta', 'Voy a firmar un contrato', 'Quiero iniciar una actividad'],
  },
  {
    label: 'Empresas',
    title: 'Resuelve exigencias sin convertirlas en otro proyecto de planillas.',
    examples: ['Preparar una auditoría', 'Implementar una nueva ley', 'Responder a un cliente'],
  },
  {
    label: 'Profesionales',
    title: 'Entrega trabajo mejor estructurado, trazable y revisable.',
    examples: ['Preparar un informe', 'Revisar antecedentes', 'Respaldar una recomendación'],
  },
]

const centralizationBenefits = [
  {
    title: 'Un solo expediente',
    description: 'Documentos, obligaciones, controles, evidencias, responsables y decisiones dejan de vivir separados.',
    icon: Database,
  },
  {
    title: 'Contexto que no se pierde',
    description: 'Cada antecedente queda relacionado con el caso y puede reutilizarse sin reconstruir la historia desde cero.',
    icon: FolderKanban,
  },
  {
    title: 'Información privada controlada',
    description: 'Kumplio está diseñado para mantener el contexto de cada organización aislado, con acceso controlado y trazabilidad.',
    icon: LockKeyhole,
  },
] as const

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111723]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Kumplio">
            <Image src="/logo-kumplio.svg" alt="Kumplio" width={150} height={64} priority className="h-12 w-auto" />
          </Link>
          <div className="hidden items-center gap-6 lg:flex">
            <a href="#diferencia" className="text-sm font-medium text-white/65 hover:text-white">La diferencia</a>
            <a href="#como-funciona" className="text-sm font-medium text-white/65 hover:text-white">Cómo funciona</a>
            <a href="#equipo" className="text-sm font-medium text-white/65 hover:text-white">Equipo digital</a>
            <a href="#seguridad" className="text-sm font-medium text-white/65 hover:text-white">Seguridad</a>
            <Link href="/pricing" className="text-sm font-medium text-white/65 hover:text-white">Planes</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden text-sm font-semibold text-white/80 hover:text-white sm:block">Ingresar</Link>
            <Button asChild className="h-11 rounded-[10px] px-5 font-black">
              <a href="#resolver">Resolver un caso</a>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section id="resolver" className="relative border-b border-white/10 px-5 pb-24 pt-36 sm:px-8 md:pb-32 md:pt-44 lg:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(184,245,66,0.12),transparent_27%),radial-gradient(circle_at_84%_20%,rgba(75,98,130,0.2),transparent_31%)]" />
          <div className="mx-auto grid max-w-[1440px] items-center gap-14 lg:grid-cols-[0.96fr_1.04fr] lg:gap-20">
            <div>
              <p className="text-sm font-black text-primary">Resolución guiada de obligaciones</p>
              <h1 className="mt-6 max-w-[820px] text-balance text-[44px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[58px] md:text-[72px]">
                Describe el problema. Kumplio te acompaña hasta cerrarlo.
              </h1>
              <p className="mt-7 max-w-[700px] text-pretty text-[17px] leading-8 text-white/62 sm:text-lg">
                Primero reúne la información que hoy está repartida. Kumplio la organiza en un expediente, coordina el trabajo de especialistas digitales y conserva fuentes, evidencia y decisiones para que puedas gestionar con contexto y seguridad.
              </p>
              <div className="mt-9 grid max-w-[820px] gap-3 text-sm text-white/58 sm:grid-cols-3">
                {['Centraliza tus antecedentes', 'Trabaja con especialistas digitales', 'Cierra con evidencia'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-10 max-w-xl text-sm leading-7 text-white/42">
                Para situaciones regulatorias, contractuales y de cumplimiento de personas, profesionales y organizaciones.
              </p>
            </div>

            <ResolutionEntry />
          </div>
        </section>

        <section id="diferencia" className="border-b border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">La diferencia</p>
                <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
                  No solo te muestra qué falta. Te ayuda a resolverlo.
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/55">
                  La mayoría de las soluciones parte desde módulos, normas o matrices. Kumplio parte desde la situación que necesitas resolver, centraliza sus antecedentes y mantiene un expediente vivo hasta llegar a una decisión respaldada.
                </p>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-card">
                <div className="grid border-b border-white/10 sm:grid-cols-2">
                  <div className="p-6 sm:p-8">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">Software tradicional</p>
                    <p className="mt-4 text-xl font-bold text-white/75">Configura, carga, clasifica y aprende el sistema.</p>
                  </div>
                  <div className="border-t border-white/10 bg-primary/[0.055] p-6 sm:border-l sm:border-t-0 sm:p-8">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Kumplio</p>
                    <p className="mt-4 text-xl font-bold">Explica lo que necesitas y empieza con un caso preparado.</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2">
                  <div className="p-6 sm:p-8">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">Información dispersa</p>
                    <p className="mt-4 text-xl font-bold text-white/75">Correos, carpetas, planillas y decisiones pierden contexto entre sí.</p>
                  </div>
                  <div className="border-t border-white/10 bg-primary/[0.055] p-6 sm:border-l sm:border-t-0 sm:p-8">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Kumplio</p>
                    <p className="mt-4 text-xl font-bold">Reúne antecedentes, trabajo, evidencia y decisiones dentro del mismo expediente.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Antes de gestionar, centraliza</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
                La gestión comienza cuando la información deja de estar repartida.
              </h2>
              <p className="mt-6 max-w-3xl text-base leading-8 text-white/55">
                Cumplimiento no es solo conocer una norma. Es saber qué documento existe, qué obligación afecta, quién es responsable, qué evidencia falta, qué se decidió y qué cambió después. Si esa información vive en lugares distintos, cada revisión parte casi desde cero.
              </p>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {centralizationBenefits.map(({ title, description, icon: Icon }) => (
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

        <section className="border-b border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Lo que recibes</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
                Una respuesta diseñada para decidir y actuar.
              </h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {resultLayers.map((item, index) => (
                <article key={item.title} className="rounded-[22px] border border-white/10 bg-card p-6">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">0{index + 1}</p>
                  <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-b border-white/10 px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Cómo funciona</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
                Un equipo digital trabaja. Tú mantienes la decisión.
              </h2>
              <p className="mt-6 text-base leading-8 text-white/55">
                Cada etapa existe porque hay información centralizada, una ejecución real, un resultado persistido y una revisión. Kumplio no muestra actividad simulada ni declara certezas sin respaldo.
              </p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {steps.map(([title, description, Icon], index) => (
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

        <section id="equipo" className="border-b border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Quién hace el trabajo</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
                Siete especialistas digitales. Cada uno tiene una responsabilidad distinta.
              </h2>
              <p className="mt-6 max-w-3xl text-base leading-8 text-white/55">
                Kumplio no trata la IA como una caja negra. Cada agente tiene una función definida, recibe un tipo de contexto y entrega resultados concretos que pueden revisarse antes de tomar una decisión.
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
              No todos intervienen en todos los casos. Kumplio activa las capacidades que corresponden al objetivo y conserva qué agente trabajó, qué produjo y qué revisión recibió.
            </p>
          </div>
        </section>

        <section id="para-quien" className="border-b border-white/10 px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Una entrada simple. Experiencias distintas.</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
                Empieza con una situación, no con un módulo.
              </h2>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {audiences.map((audience) => (
                <article key={audience.label} className="rounded-[24px] border border-white/10 bg-card p-7">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{audience.label}</p>
                  <h3 className="mt-5 text-2xl font-black leading-tight">{audience.title}</h3>
                  <div className="mt-6 space-y-3">
                    {audience.examples.map((example) => (
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

        <section id="seguridad" className="border-b border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <ShieldCheck className="h-10 w-10 text-primary" />
              <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-primary">Seguridad de la información</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">Centralizar sí. Exponer no.</h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/55">
                Reunir información en un solo lugar solo genera valor si permanece controlada. Kumplio está diseñado para separar el contexto privado de cada organización, limitar el acceso y conservar trazabilidad sobre el trabajo y las decisiones.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/42">
                La centralización permite gestionar mejor; la seguridad evita que esa ventaja se transforme en un nuevo riesgo.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Aislamiento por organización', 'El contexto privado de una organización se mantiene separado del de las demás.'],
                ['Trazabilidad', 'Ejecuciones, resultados, revisiones y decisiones conservan un historial que puede revisarse.'],
                ['Control humano', 'Los agentes preparan el trabajo; las decisiones sensibles mantienen revisión y aprobación humana.'],
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
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">No necesitas aprender compliance para empezar</p>
            <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-[-0.035em] md:text-6xl">
              Cuéntanos qué necesitas resolver.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/55">
              Kumplio centralizará los antecedentes del caso, organizará el trabajo de los especialistas y te mostrará qué decisión corresponde tomar después.
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
