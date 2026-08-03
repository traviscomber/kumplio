'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CircleCheckBig,
  FileSearch,
  ListChecks,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

const outcomes = [
  {
    icon: SearchCheck,
    title: 'Entiende qué cambió',
    description: 'Reúne normativa, documentos y contexto de tu organización con fuente, fecha y versión.',
  },
  {
    icon: ListChecks,
    title: 'Decide qué importa',
    description: 'Prioriza obligaciones, riesgos y decisiones según su impacto real en tu empresa.',
  },
  {
    icon: Target,
    title: 'Convierte la decisión en trabajo',
    description: 'Activa una misión con responsables, evidencias, revisiones y un resultado verificable.',
  },
]

const firstSolution = [
  'Identificar tratamientos y obligaciones aplicables.',
  'Relacionar políticas, contratos, controles y evidencias.',
  'Priorizar brechas y responsables.',
  'Preparar un plan de implementación trazable.',
]

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute -inset-12 -z-10 rounded-full bg-primary/10 blur-3xl" />
      <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#151c28] shadow-[0_28px_100px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold tracking-wide text-white/75">TU TRABAJO HOY</span>
          </div>
          <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">Organización activa</span>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Prioridad</p>
            <h3 className="mt-2 text-2xl font-bold text-white">3 decisiones necesitan tu atención</h3>
            <p className="mt-2 text-sm leading-6 text-white/55">Kumplio explica qué cambió, por qué importa y qué puedes hacer ahora.</p>
          </div>

          {[
            ['Cambio regulatorio detectado', 'Revisar impacto en datos personales', ShieldCheck],
            ['Evidencia próxima a vencer', 'Solicitar actualización al responsable', FileSearch],
            ['Resultado listo para aprobar', 'Validar y continuar la misión', BadgeCheck],
          ].map(([title, action, Icon]) => (
            <div key={String(title)} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">{String(title)}</p>
                <p className="mt-1 text-xs leading-5 text-white/45">{String(action)}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-white/30" />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-5 py-3 text-[11px] text-white/40">
          <span>Fuente → decisión → misión → resultado</span>
          <span className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> Siempre revisable</span>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111723]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Kumplio" className="flex items-center">
            <Image src="/logo-kumplio.svg" alt="Kumplio" width={150} height={64} priority className="h-12 w-auto" />
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            <a href="#resultado" className="text-sm font-medium text-white/65 transition-colors hover:text-white">Qué consigues</a>
            <a href="#como-funciona" className="text-sm font-medium text-white/65 transition-colors hover:text-white">Cómo funciona</a>
            <Link href="/features/ley-21719" className="text-sm font-medium text-white/65 transition-colors hover:text-white">Ley 21.719</Link>
            <Link href="/pricing" className="text-sm font-medium text-white/65 transition-colors hover:text-white">Planes</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden text-sm font-semibold text-white/80 transition-colors hover:text-white sm:block">Ingresar</Link>
            <Button asChild className="h-11 rounded-[10px] px-5 font-bold shadow-[0_0_28px_rgba(184,245,66,0.14)]">
              <Link href="/sign-up">Comenzar</Link>
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
                <Sparkles className="h-3.5 w-3.5" /> Inteligencia organizacional para empresas chilenas
              </div>

              <h1 className="mt-7 max-w-[850px] text-balance text-[42px] font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-[54px] md:text-[66px]">
                Convierte conocimiento en decisiones y decisiones en ejecución verificable.
              </h1>

              <p className="mt-7 max-w-[700px] text-pretty text-[17px] leading-8 text-white/62 sm:text-lg">
                Kumplio entiende tu organización, detecta lo que requiere atención y coordina misiones para que el trabajo avance con evidencia, responsables y revisión humana.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-13 rounded-[10px] px-7 text-sm font-bold">
                  <Link href="/sign-up">Preparar mi primera misión <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-13 rounded-[10px] border-white/15 bg-white/[0.025] px-7 text-sm font-semibold hover:bg-white/[0.07]">
                  <a href="#como-funciona">Ver cómo funciona</a>
                </Button>
              </div>

              <div className="mt-9 grid max-w-[680px] gap-3 text-sm text-white/55 sm:grid-cols-3">
                {['Fuentes identificables', 'Resultados trazables', 'La persona siempre decide'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <ProductPreview />
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#0d131e] px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-5 text-sm text-white/48 md:flex-row md:items-center md:justify-between">
            <p className="font-semibold text-white/75">Diseñado para transformar obligaciones y conocimiento en trabajo concreto.</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <span>Normativa oficial</span>
              <span>Contexto de tu empresa</span>
              <span>Misiones coordinadas</span>
              <span>Evidencia verificable</span>
            </div>
          </div>
        </section>

        <section id="resultado" className="px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Qué consigues</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.025em] md:text-5xl">
                Menos búsqueda. Menos coordinación manual. Más trabajo terminado.
              </h2>
              <p className="mt-6 text-base leading-7 text-white/55">
                La plataforma organiza el contexto necesario para que cada persona sepa qué cambió, qué debe decidir y cuál es el siguiente paso.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {outcomes.map(({ icon: Icon, title, description }, index) => (
                <article key={title} className="relative rounded-[20px] border border-white/10 bg-card p-7">
                  <span className="absolute right-6 top-6 font-mono text-xs text-white/20">0{index + 1}</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-7 text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-y border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Cómo funciona</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.025em] md:text-5xl">
                El conocimiento no termina en un informe. Termina en un resultado.
              </h2>
              <p className="mt-6 text-base leading-7 text-white/55">
                Kumplio conecta información pública y privada sin confundirlas. Cada recomendación conserva su fundamento y puede transformarse en una misión ejecutable.
              </p>
            </div>

            <div className="space-y-3">
              {[
                ['1', 'Comprender', 'Reúne normativa, documentos, procesos y decisiones anteriores.'],
                ['2', 'Priorizar', 'Distingue lo urgente de lo importante y explica por qué.'],
                ['3', 'Ejecutar', 'Coordina responsables, habilidades IA, evidencia y revisiones.'],
                ['4', 'Demostrar', 'Conserva resultados, fuentes, versiones y decisiones humanas.'],
              ].map(([number, title, description]) => (
                <div key={number} className="grid gap-4 rounded-2xl border border-white/10 bg-card p-5 sm:grid-cols-[56px_1fr] sm:items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">{number}</div>
                  <div>
                    <h3 className="font-bold text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/50">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-12 rounded-[28px] border border-white/10 bg-card p-7 sm:p-10 lg:grid-cols-[1fr_0.9fr] lg:p-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                <ShieldCheck className="h-4 w-4" /> Primera solución oficial
              </div>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">Prepárate para la Ley 21.719 con un plan que tu equipo pueda ejecutar.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/55">
                Pasa desde documentos dispersos a una misión con brechas, responsables, evidencia y criterios de avance claros.
              </p>
              <Button asChild className="mt-7 h-12 rounded-[10px] px-6 font-bold">
                <Link href="/features/ley-21719">Conocer la solución <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

            <div className="space-y-3">
              {firstSolution.map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-white/65">
                  <CircleCheckBig className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#0d131e] px-5 py-24 text-center sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <Building2 className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-6 text-balance text-4xl font-extrabold tracking-tight md:text-5xl">Tu organización ya tiene conocimiento. Kumplio lo convierte en avance.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/55">Comienza con una organización, un objetivo y una primera misión. Sin comprar tokens ni aprender una arquitectura nueva.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-13 rounded-[10px] px-8 font-bold">
                <Link href="/sign-up">Comenzar ahora <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-13 rounded-[10px] border-white/15 bg-transparent px-8 font-semibold">
                <Link href="/pricing">Ver alternativas</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
