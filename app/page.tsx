'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  GitBranch,
  ListChecks,
  SearchCheck,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { TrustSignals } from '@/components/trust-signals'
import { InteractiveDiagnosis } from '@/components/interactive-diagnosis'
import { SpecialistsGrid } from '@/components/specialists-grid'

const lifecycle = [
  { icon: SearchCheck, title: 'Mapear', description: 'Identifica obligaciones desde normas, contratos y políticas.' },
  { icon: ListChecks, title: 'Controlar', description: 'Convierte cada obligación en controles, responsables y frecuencia.' },
  { icon: FileCheck2, title: 'Evidenciar', description: 'Vincula documentos y registros con cada control evaluado.' },
  { icon: TriangleAlert, title: 'Corregir', description: 'Prioriza hallazgos, riesgos y acciones con trazabilidad.' },
  { icon: ShieldCheck, title: 'Auditar', description: 'Genera revisiones y reportes respaldados por evidencia.' },
]

const capabilities = [
  'Análisis de documentos y extracción asistida de obligaciones',
  'Matriz de controles con responsables y periodicidad',
  'Biblioteca de evidencias con vigencia y relaciones',
  'Hallazgos, riesgos y planes de acción',
  'Auditorías con historial de decisiones',
  'Integraciones con sistemas operacionales como Cleaner2',
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Kumplio" className="flex items-center">
            <Image src="/logo-kumplio.svg" alt="Kumplio" width={132} height={44} priority className="h-11 w-auto" />
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#producto" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Producto</a>
            <a href="#flujo" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Cómo funciona</a>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Precios</Link>
            <Link href="/sales-kit" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Recursos</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden text-sm font-medium sm:block">Acceder</Link>
            <Button asChild>
              <Link href="/sign-up">Evaluar mi cumplimiento</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="border-b border-border px-6 py-24 md:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <GitBranch className="h-4 w-4" />
                Cumplimiento continuo y trazable
              </div>
              <h1 className="max-w-4xl text-balance text-5xl font-black tracking-tight md:text-7xl">
                Convierte obligaciones en controles y evidencia auditable.
              </h1>
              <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
                Kumplio estructura regulaciones, contratos y políticas para que tu organización pueda asignar controles, respaldarlos con evidencia y corregir hallazgos de forma verificable.
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" asChild className="text-base font-semibold">
                  <Link href="/sign-up">Evaluar mi cumplimiento <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base font-semibold">
                  <a href="#flujo">Ver cómo funciona</a>
                </Button>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                La IA propone y organiza. Las decisiones críticas permanecen bajo revisión humana.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/10 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vista de cumplimiento</p>
                  <h2 className="mt-1 text-2xl font-bold">Estado verificable</h2>
                </div>
                <ShieldCheck className="h-9 w-9 text-primary" />
              </div>
              <div className="space-y-3">
                {[
                  ['Obligaciones con control asignado', 'Revisión requerida'],
                  ['Evidencia próxima a vencer', 'Atención'],
                  ['Hallazgos críticos abiertos', 'Prioridad alta'],
                  ['Acciones con respaldo de cierre', 'Verificable'],
                ].map(([label, status], index) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm leading-relaxed">
                Cada resultado puede rastrearse hasta la fuente, el control, la evidencia y la persona que aprobó la evaluación.
              </div>
            </div>
          </div>
        </section>

        <section id="flujo" className="border-b border-border px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Ciclo completo</p>
              <h2 className="text-4xl font-bold md:text-5xl">Del requisito a la evidencia</h2>
              <p className="mt-5 text-lg text-muted-foreground">Una estructura común para protección de datos, contratos, transporte, minería y otros marcos regulatorios.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              {lifecycle.map((step, index) => {
                const Icon = step.icon
                return (
                  <article key={step.title} className="relative rounded-xl border border-border bg-card p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                      <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                    </div>
                    <h3 className="text-lg font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section id="producto" className="border-b border-border bg-muted/30 px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Plataforma</p>
              <h2 className="text-4xl font-bold md:text-5xl">Un sistema de control, no solo un diagnóstico.</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                El análisis inicial se transforma en trabajo operativo: responsables, controles recurrentes, evidencia vigente, hallazgos y acciones correctivas.
              </p>
            </div>
            <div className="grid gap-3">
              {capabilities.map((capability) => (
                <div key={capability} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <p className="text-sm font-medium leading-relaxed">{capability}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <TrustSignals />

        <section className="border-b border-border px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Asistencia especializada</p>
              <h2 className="text-4xl font-bold md:text-5xl">Agentes con funciones delimitadas</h2>
              <p className="mt-5 text-lg text-muted-foreground">Cada agente debe mostrar fuentes, confianza y estado de revisión, sin sustituir la decisión profesional.</p>
            </div>
            <SpecialistsGrid />
          </div>
        </section>

        <section id="diagnostico-gratis" className="border-b border-primary/30 bg-primary/5 px-6 py-24 scroll-mt-24">
          <div className="mx-auto max-w-7xl">
            <InteractiveDiagnosis />
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl rounded-2xl border border-primary/30 bg-card p-10 text-center md:p-14">
            <h2 className="text-4xl font-bold md:text-5xl">Construye una postura de cumplimiento demostrable.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Comienza con un diagnóstico y conserva el resultado dentro de un espacio de trabajo operativo.</p>
            <Button size="lg" asChild className="mt-8 text-base font-semibold">
              <Link href="/sign-up">Comenzar evaluación <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
