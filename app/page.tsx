'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Bot,
  Building2,
  Check,
  ChevronRight,
  CircleDot,
  Database,
  FileCheck2,
  FileSearch,
  GitBranch,
  Network,
  Scale,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

const productLayers = [
  {
    icon: BookOpenCheck,
    label: 'Grafo Nacional',
    title: 'Normativa chilena estructurada',
    description: 'Leyes, artículos, incisos, versiones y relaciones con procedencia oficial.',
  },
  {
    icon: Building2,
    label: 'Memoria Organizacional',
    title: 'La realidad privada de tu organización',
    description: 'Controles, documentos, evidencias, procesos y decisiones aisladas por empresa.',
  },
  {
    icon: Waypoints,
    label: 'Motor de Mapeo',
    title: 'De la obligación a la evidencia',
    description: 'Conecta lo que exige la norma con lo que ejecuta y demuestra la organización.',
  },
]

const traceSteps = [
  ['Fuente oficial', 'BCN, Diario Oficial y organismos sectoriales'],
  ['Versión y sección', 'Texto exacto, fecha, hash y vigencia'],
  ['Interpretación', 'Afirmación explicable, nunca una conclusión oculta'],
  ['Aplicabilidad', 'Relación con procesos, controles y responsables'],
  ['Evidencia', 'Documentos y registros que permiten demostrar ejecución'],
  ['Revisión humana', 'Decisión registrada con autor, fecha y fundamento'],
]

const useCases = [
  {
    title: 'Protección de datos',
    description: 'Prepara obligaciones, tratamientos, encargados, derechos e incidentes para la Ley N.º 21.719.',
  },
  {
    title: 'Transporte',
    description: 'Controla documentación, vigencias, habilitaciones, viajes y evidencia operacional.',
  },
  {
    title: 'Agro',
    description: 'Organiza trazabilidad, aplicaciones, registros de campo, proveedores e inspecciones.',
  },
  {
    title: 'Minería',
    description: 'Relaciona permisos, controles críticos, contratistas, hallazgos y compromisos.',
  },
]

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute -inset-12 -z-10 rounded-full bg-primary/10 blur-3xl" />
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#151c28] shadow-[0_28px_100px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold tracking-wide text-white/75">PANEL DE CONTROL</span>
          </div>
          <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">Organización activa</span>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Hoy</p>
              <h3 className="mt-2 text-2xl font-bold text-white">3 decisiones requieren atención</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">Priorizadas por impacto, vencimiento y respaldo disponible.</p>
            </div>

            <div className="space-y-2.5">
              {[
                ['Nueva obligación detectada', 'Pendiente de revisión', 'bg-[#7b61c9]'],
                ['Control sin evidencia vigente', 'Atención', 'bg-[#d99414]'],
                ['Solicitud respondida', 'Lista para validar', 'bg-[#2f7dd1]'],
              ].map(([title, status, color]) => (
                <div key={title} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3.5">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-xs text-white/45">{status}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/30" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111723] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Trazabilidad</p>
                <p className="mt-1 text-sm font-semibold text-white">Ley N.º 21.719</p>
              </div>
              <Network className="h-5 w-5 text-primary" />
            </div>

            <div className="relative mt-6 min-h-[260px]">
              <div className="absolute left-1/2 top-2 h-[225px] w-px -translate-x-1/2 bg-gradient-to-b from-primary/70 via-white/15 to-transparent" />
              {[
                ['Artículo', 'Fuente oficial', 'top-0 left-1/2 -translate-x-1/2'],
                ['Obligación', 'Interpretación revisable', 'top-[76px] left-4'],
                ['Control', 'Implementación', 'top-[146px] right-2'],
                ['Evidencia', 'Respaldo verificable', 'bottom-0 left-1/2 -translate-x-1/2'],
              ].map(([title, subtitle, position], index) => (
                <div key={title} className={`absolute ${position} z-10 w-[150px] rounded-xl border border-white/10 bg-[#202733] p-3 shadow-lg`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-primary' : 'bg-white/35'}`} />
                    <p className="text-xs font-bold text-white">{title}</p>
                  </div>
                  <p className="mt-1.5 text-[10px] leading-4 text-white/40">{subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[11px] text-white/35">
          <span>Fuente → decisión → evidencia</span>
          <span className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> Revisión humana</span>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111723]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Kumplio" className="flex items-center">
            <Image src="/logo-kumplio.svg" alt="Kumplio" width={150} height={64} priority className="h-12 w-auto" />
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            <a href="#plataforma" className="text-sm font-medium text-white/65 transition-colors hover:text-white">Plataforma</a>
            <a href="#trazabilidad" className="text-sm font-medium text-white/65 transition-colors hover:text-white">Cómo funciona</a>
            <a href="#sectores" className="text-sm font-medium text-white/65 transition-colors hover:text-white">Sectores</a>
            <Link href="/features/ley-21719" className="text-sm font-medium text-white/65 transition-colors hover:text-white">Ley N.º 21.719</Link>
            <Link href="/pricing" className="text-sm font-medium text-white/65 transition-colors hover:text-white">Planes</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden text-sm font-semibold text-white/80 transition-colors hover:text-white sm:block">Ingresar</Link>
            <Button asChild className="h-11 rounded-[10px] px-5 font-bold shadow-[0_0_28px_rgba(184,245,66,0.14)]">
              <Link href="/sign-up">Solicitar acceso</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative border-b border-white/10 px-5 pb-24 pt-36 sm:px-8 md:pb-32 md:pt-44 lg:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(184,245,66,0.11),transparent_27%),radial-gradient(circle_at_82%_30%,rgba(75,98,130,0.18),transparent_30%)]" />
          <div className="mx-auto grid max-w-[1440px] items-center gap-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-4 py-2 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Plataforma chilena de conocimiento regulatorio
              </div>

              <h1 className="mt-7 max-w-[820px] text-balance text-[42px] font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-[54px] md:text-[64px]">
                Convierte obligaciones en decisiones y evidencia verificable.
              </h1>

              <p className="mt-7 max-w-[690px] text-pretty text-[17px] leading-8 text-white/62 sm:text-lg">
                Kumplio conecta normativa oficial, memoria organizacional, controles y evidencia para que cada decisión pueda explicarse, revisarse y demostrarse.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-13 rounded-[10px] px-7 text-sm font-bold">
                  <Link href="/sign-up">Evaluar mi organización <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-13 rounded-[10px] border-white/15 bg-white/[0.025] px-7 text-sm font-semibold hover:bg-white/[0.07]">
                  <a href="#plataforma">Conocer la plataforma</a>
                </Button>
              </div>

              <div className="mt-9 grid max-w-[640px] gap-3 text-sm text-white/55 sm:grid-cols-3">
                {['Fuentes oficiales', 'Trazabilidad completa', 'Revisión humana'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/features/ley-21719" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <Scale className="h-4 w-4" /> Preparación para la Ley N.º 21.719 — vigencia 1 de diciembre de 2026
              </Link>
            </div>

            <ProductPreview />
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#0d131e] px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-5 text-sm text-white/48 md:flex-row md:items-center md:justify-between">
            <p className="font-semibold text-white/70">Diseñado para el contexto regulatorio chileno.</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <span>BCN y Diario Oficial</span>
              <span>Ley N.º 21.719</span>
              <span>Organismos sectoriales</span>
              <span>Operación multiempresa</span>
            </div>
          </div>
        </section>

        <section id="plataforma" className="px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Una arquitectura distinta</p>
                <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.025em] md:text-5xl">
                  No es un repositorio. Es conocimiento conectado.
                </h2>
                <p className="mt-6 text-base leading-7 text-white/55">
                  Kumplio separa el conocimiento público de la memoria privada y los conecta mediante relaciones de aplicabilidad revisables.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {productLayers.map((layer, index) => {
                  const Icon = layer.icon
                  return (
                    <article key={layer.title} className="group relative overflow-hidden rounded-[18px] border border-white/10 bg-card p-6 transition-transform duration-300 hover:-translate-y-1">
                      <span className="absolute right-5 top-5 font-mono text-xs text-white/20">0{index + 1}</span>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-primary">{layer.label}</p>
                      <h3 className="mt-3 text-xl font-bold leading-7">{layer.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-white/50">{layer.description}</p>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="trazabilidad" className="border-y border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Trazabilidad por diseño</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.025em] md:text-5xl">
                Cada resultado puede volver a su origen.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/55">
                Una respuesta útil no basta. Kumplio conserva fuente, versión, interpretación, aplicabilidad, evidencia y decisión humana.
              </p>
              <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/[0.06] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-6 text-white/70">
                    La inteligencia artificial propone y organiza. Las decisiones críticas permanecen bajo revisión humana.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute bottom-6 left-[19px] top-6 w-px bg-gradient-to-b from-primary via-white/15 to-transparent" />
              <div className="space-y-3">
                {traceSteps.map(([title, description], index) => (
                  <div key={title} className="relative flex gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 pl-14">
                    <div className="absolute left-[11px] top-4 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-primary/35 bg-[#111723]">
                      <CircleDot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1 sm:flex sm:items-center sm:justify-between sm:gap-6">
                      <div>
                        <p className="font-bold">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-white/45">{description}</p>
                      </div>
                      <span className="mt-2 block font-mono text-[11px] text-white/20 sm:mt-0">0{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Del análisis a la operación</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.025em] md:text-5xl">Un sistema para hacer el trabajo, no solo describirlo.</h2>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                [FileSearch, 'Detectar', 'Identifica obligaciones y cambios desde fuentes oficiales y documentos internos.'],
                [GitBranch, 'Relacionar', 'Conecta obligaciones con procesos, controles, responsables y riesgos.'],
                [FileCheck2, 'Evidenciar', 'Solicita, recibe y revisa respaldo con vigencia, integridad y trazabilidad.'],
                [Bot, 'Asistir', 'Agentes especializados preparan análisis y artefactos para revisión humana.'],
              ].map(([Icon, title, description], index) => {
                const ItemIcon = Icon as typeof FileSearch
                return (
                  <article key={title as string} className="rounded-[18px] border border-white/10 bg-card p-6">
                    <div className="flex items-center justify-between">
                      <ItemIcon className="h-6 w-6 text-primary" />
                      <span className="font-mono text-xs text-white/20">0{index + 1}</span>
                    </div>
                    <h3 className="mt-8 text-xl font-bold">{title as string}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/50">{description as string}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-2 lg:items-center lg:gap-24">
            <div className="rounded-[24px] border border-white/10 bg-card p-6 shadow-2xl sm:p-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Ley N.º 21.719</p>
                  <h3 className="mt-2 text-2xl font-bold">Preparación verificable</h3>
                </div>
                <Scale className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-6 space-y-3">
                {[
                  'Inventario de tratamientos y responsables',
                  'Derechos de titulares y canales de respuesta',
                  'Gestión de encargados y proveedores',
                  'Incidentes, evaluaciones y evidencia',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#111723] p-4">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm font-semibold text-white/75">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Prioridad Chile 2026</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.025em] md:text-5xl">
                Prepárate para la nueva ley sin limitar tu sistema a una sola norma.
              </h2>
              <p className="mt-6 text-base leading-7 text-white/55">
                El mismo modelo de obligaciones, controles y evidencia puede extenderse a transporte, minería, agro, contratos y otros marcos regulatorios.
              </p>
              <Button variant="outline" asChild className="mt-8 h-12 rounded-[10px] border-white/15 bg-white/[0.025] px-6 font-bold hover:bg-white/[0.07]">
                <Link href="/features/ley-21719">Ver preparación Ley N.º 21.719 <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="sectores" className="px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Un núcleo, distintas industrias</p>
                <h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.025em] md:text-5xl">Diseñado para crecer con la realidad chilena.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-white/50">Cada vertical usa el mismo motor de conocimiento, memoria, evidencia y agentes.</p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {useCases.map((item) => (
                <article key={item.title} className="rounded-[18px] border border-white/10 bg-card p-6">
                  <Database className="h-5 w-5 text-primary" />
                  <h3 className="mt-8 text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/50">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8 md:pb-32 lg:px-12">
          <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[28px] border border-primary/20 bg-[#18202d] px-6 py-14 text-center sm:px-12 md:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(184,245,66,0.15),transparent_40%)]" />
            <div className="relative mx-auto max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Construye una base demostrable</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.025em] md:text-5xl">Comprende qué te exige la norma y demuestra cómo lo estás ejecutando.</h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/55">Comienza con una evaluación y conserva el resultado dentro de una plataforma operacional y trazable.</p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-13 rounded-[10px] px-7 font-bold">
                  <Link href="/sign-up">Solicitar acceso <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-13 rounded-[10px] border-white/15 bg-transparent px-7 font-semibold hover:bg-white/[0.06]">
                  <Link href="/sign-in">Ingresar a mi cuenta</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
