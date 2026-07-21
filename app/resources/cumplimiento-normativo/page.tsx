import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, FileCheck2, Scale, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Recursos de cumplimiento normativo | KUMPLIO',
  description:
    'Recursos públicos de KUMPLIO sobre cumplimiento continuo, evidencia auditable y preparación para la Ley 21.719 en Chile.',
  alternates: { canonical: '/resources/cumplimiento-normativo' },
  openGraph: {
    title: 'Recursos de cumplimiento normativo | KUMPLIO',
    description:
      'Guías públicas sobre obligaciones, controles, evidencia y preparación regulatoria en Chile.',
    url: '/resources/cumplimiento-normativo',
    type: 'website',
  },
}

const resources = [
  {
    icon: ShieldCheck,
    title: 'Ley 21.719: preparación para diciembre de 2026',
    description:
      'Resumen práctico de las áreas que una organización debe revisar: gobernanza, bases de licitud, derechos, seguridad, privacidad por diseño y evidencia.',
    href: '/features/ley-21719',
    label: 'Ver guía de la Ley 21.719',
  },
  {
    icon: FileCheck2,
    title: 'Del requisito a la evidencia',
    description:
      'Conoce el modelo operativo de KUMPLIO para relacionar una obligación con controles, responsables, documentos, hallazgos y acciones correctivas.',
    href: '/#flujo',
    label: 'Ver cómo funciona',
  },
  {
    icon: Scale,
    title: 'Alcance de la plataforma',
    description:
      'Revisa el enfoque, los principios de trazabilidad y revisión humana, y los límites de la asistencia mediante inteligencia artificial.',
    href: '/about',
    label: 'Conocer KUMPLIO',
  },
]

export default function ComplianceResourcesPage() {
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
          <div className="mx-auto max-w-5xl text-center">
            <BookOpen className="mx-auto h-12 w-12 text-primary" />
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Centro de recursos</p>
            <h1 className="mt-3 text-balance text-5xl font-black tracking-tight md:text-7xl">
              Información pública para convertir requisitos en trabajo verificable.
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Esta sección reúne únicamente recursos publicados y mantenidos por KUMPLIO. No se presentan artículos ficticios, métricas comerciales ni contenido pendiente como si estuviera disponible.
            </p>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
            {resources.map(({ icon: Icon, title, description, href, label }) => (
              <article key={title} className="flex flex-col rounded-2xl border border-border bg-card p-7">
                <Icon className="h-8 w-8 text-primary" />
                <h2 className="mt-6 text-2xl font-bold">{title}</h2>
                <p className="mt-4 flex-1 leading-relaxed text-muted-foreground">{description}</p>
                <Button variant="outline" asChild className="mt-7 justify-between">
                  <Link href={href}>{label}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-4xl font-bold">Criterios editoriales</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-bold">Fuentes identificables</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Las afirmaciones regulatorias deben poder relacionarse con fuentes oficiales o referencias claramente indicadas.</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-bold">Sin resultados inventados</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">No se publican ratings, ahorros, clientes, porcentajes ni casos de éxito sin respaldo verificable.</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-bold">Revisión humana</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">El contenido informativo no reemplaza asesoría jurídica ni una evaluación profesional del caso concreto.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl rounded-2xl border border-primary/30 bg-card p-10 text-center md:p-14">
            <h2 className="text-4xl font-bold">¿Necesitas estructurar un marco específico?</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Inicia un diagnóstico y organiza obligaciones, controles, evidencia y acciones dentro de un espacio de trabajo.
            </p>
            <Button size="lg" asChild className="mt-8">
              <Link href="/sign-up">Comenzar evaluación <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
