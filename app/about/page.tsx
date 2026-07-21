import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, FileCheck2, Scale, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Sobre KUMPLIO | Plataforma de cumplimiento continuo',
  description:
    'Conoce el enfoque de KUMPLIO para convertir obligaciones regulatorias, contractuales y de política interna en controles, evidencia y acciones verificables.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'Sobre KUMPLIO | Cumplimiento continuo',
    description:
      'Una plataforma de n3uralia para estructurar obligaciones, controles, evidencia, hallazgos y planes de acción.',
    url: '/about',
    type: 'website',
  },
}

const principles = [
  {
    icon: Scale,
    title: 'Trazabilidad',
    description: 'Cada evaluación debe poder relacionarse con una fuente, un control, evidencia y una decisión responsable.',
  },
  {
    icon: ShieldCheck,
    title: 'Revisión humana',
    description: 'La asistencia mediante IA organiza y propone; las decisiones legales y de cumplimiento permanecen bajo supervisión profesional.',
  },
  {
    icon: FileCheck2,
    title: 'Evidencia operativa',
    description: 'El cumplimiento se gestiona como trabajo recurrente, no como una declaración aislada o un diagnóstico estático.',
  },
  {
    icon: CheckCircle2,
    title: 'Aplicación gradual',
    description: 'La plataforma permite comenzar con un marco prioritario y extender el mismo modelo a otras obligaciones y áreas operativas.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-bold">KUMPLIO</Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link href="/">Inicio</Link></Button>
            <Button asChild><Link href="/sign-up">Evaluar cumplimiento</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-6 py-24 md:py-32">
          <div className="mx-auto max-w-5xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Sobre KUMPLIO</p>
            <h1 className="max-w-4xl text-balance text-5xl font-black tracking-tight md:text-7xl">
              Cumplimiento continuo con evidencia y responsabilidad humana.
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              KUMPLIO es una plataforma desarrollada por n3uralia para estructurar obligaciones provenientes de regulaciones, contratos y políticas internas. El sistema ayuda a convertir esas obligaciones en controles, responsables, evidencia, hallazgos y planes de acción.
            </p>
          </div>
        </section>

        <section className="border-b border-border bg-muted/30 px-6 py-20">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Problema</p>
              <h2 className="mt-3 text-4xl font-bold">La información regulatoria suele quedar separada de la operación.</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Documentos, matrices, evidencias, responsables y acciones correctivas suelen administrarse en herramientas distintas. Esa fragmentación dificulta conocer qué obligación está cubierta, qué control debe revisarse y qué evidencia respalda una decisión.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Enfoque</p>
              <h2 className="mt-3 text-4xl font-bold">Una estructura común para gestionar distintos marcos.</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                KUMPLIO utiliza un ciclo consistente: mapear obligaciones, asignar controles, vincular evidencia, registrar hallazgos, corregir brechas y preparar revisiones. La Ley 21.719 es un caso prioritario en Chile, pero la plataforma no se limita a una sola regulación.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Principios</p>
              <h2 className="text-4xl font-bold md:text-5xl">Cómo debe operar la plataforma</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {principles.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-xl border border-border bg-card p-6">
                  <Icon className="h-7 w-7 text-primary" />
                  <h3 className="mt-5 text-xl font-bold">{title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-4xl font-bold">Alcance y límites</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-bold">KUMPLIO ayuda a</h3>
                <p className="mt-3 text-muted-foreground">Organizar información, proponer estructuras de control, relacionar evidencia y mantener trazabilidad del trabajo de cumplimiento.</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-bold">KUMPLIO no reemplaza</h3>
                <p className="mt-3 text-muted-foreground">La asesoría jurídica, la auditoría independiente ni la decisión profesional de responsables legales, de riesgo o cumplimiento.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl rounded-2xl border border-primary/30 bg-card p-10 text-center md:p-14">
            <h2 className="text-4xl font-bold">Convierte un marco regulatorio en trabajo verificable.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Comienza con un diagnóstico y conserva obligaciones, controles, evidencia y acciones dentro de un mismo espacio de trabajo.
            </p>
            <Button size="lg" asChild className="mt-8">
              <Link href="/sign-up">Evaluar cumplimiento <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
