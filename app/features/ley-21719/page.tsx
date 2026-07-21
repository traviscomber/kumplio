import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  ListChecks,
  Scale,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Ley 21.719: nueva ley de protección de datos en Chile',
  description:
    'Guía práctica para preparar la entrada en vigencia de la Ley 21.719 el 1 de diciembre de 2026. Obligaciones, derechos, controles, evidencia y plan de implementación para organizaciones chilenas.',
  keywords: [
    'Ley 21.719',
    'nueva ley de datos personales Chile',
    'protección de datos personales Chile',
    'vigencia Ley 21.719 diciembre 2026',
    'Agencia de Protección de Datos Personales',
    'cumplimiento Ley 21.719',
    'privacidad por diseño Chile',
    'evaluación de impacto datos personales',
  ],
  alternates: { canonical: '/features/ley-21719' },
  openGraph: {
    type: 'article',
    locale: 'es_CL',
    url: '/features/ley-21719',
    title: 'Ley 21.719: preparación para el 1 de diciembre de 2026',
    description:
      'Convierte las obligaciones de la nueva ley de datos personales en controles, evidencia y acciones verificables.',
    images: [
      {
        url: '/og-ley-21719.png',
        width: 1200,
        height: 630,
        alt: 'Ley 21.719 — Protección de datos personales en Chile',
      },
    ],
  },
}

const priorities = [
  {
    title: 'Gobernanza y responsabilidad',
    description: 'Definir responsables, políticas, registros de decisiones y mecanismos de supervisión del tratamiento de datos.',
  },
  {
    title: 'Bases de licitud y transparencia',
    description: 'Identificar el fundamento de cada tratamiento y entregar información clara a los titulares de los datos.',
  },
  {
    title: 'Derechos de las personas',
    description: 'Implementar procedimientos verificables para atender solicitudes de acceso, rectificación, supresión, oposición y portabilidad.',
  },
  {
    title: 'Seguridad y gestión de incidentes',
    description: 'Mantener medidas técnicas y organizativas, responsables, registros y procesos de respuesta frente a incidentes.',
  },
  {
    title: 'Privacidad por diseño',
    description: 'Incorporar protección de datos desde el diseño de productos, procesos, sistemas y relaciones con proveedores.',
  },
  {
    title: 'Evaluación y evidencia',
    description: 'Evaluar riesgos, documentar controles y conservar evidencia que permita demostrar la gestión de cumplimiento.',
  },
]

const workstreams = [
  'Inventario de tratamientos, sistemas, proveedores y categorías de datos',
  'Matriz de bases de licitud, finalidades y períodos de conservación',
  'Avisos de privacidad, consentimientos y canales para ejercer derechos',
  'Contratos con encargados y revisión de transferencias de datos',
  'Controles de acceso, seguridad, incidentes y continuidad operacional',
  'Evaluaciones de impacto para tratamientos de mayor riesgo',
  'Capacitación, aprobaciones y evidencia de ejecución',
  'Plan de remediación con responsables y fechas antes de la vigencia',
]

export default function Ley21719Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-bold">KUMPLIO</Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/">Volver al inicio</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Evaluar preparación</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-6 py-24 md:py-32">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <CalendarClock className="h-4 w-4" />
              Entrada en vigencia: 1 de diciembre de 2026
            </div>
            <h1 className="text-balance text-5xl font-black tracking-tight md:text-7xl">
              Ley 21.719: nueva protección de datos personales en Chile
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
              La ley moderniza la Ley 19.628, regula el tratamiento y la protección de datos personales y crea la Agencia de Protección de Datos Personales. La preparación requiere controles operativos y evidencia, no solamente documentos declarativos.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/sign-up">Iniciar diagnóstico <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="https://www.bcn.cl/leychile/navegar?idNorma=1209272" target="_blank" rel="noreferrer">
                  Consultar texto oficial
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/30 px-6 py-20">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
            {[
              { icon: Scale, label: 'Norma', value: 'Ley 21.719', detail: 'Publicada el 13 de diciembre de 2024' },
              { icon: CalendarClock, label: 'Vigencia', value: '01.12.2026', detail: 'Plazo para preparar implementación y evidencia' },
              { icon: ShieldCheck, label: 'Institucionalidad', value: 'Nueva Agencia', detail: 'Agencia de Protección de Datos Personales' },
            ].map(({ icon: Icon, label, value, detail }) => (
              <article key={label} className="rounded-xl border border-border bg-card p-6">
                <Icon className="h-6 w-6 text-primary" />
                <p className="mt-5 text-sm font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-b border-border px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Áreas prioritarias</p>
              <h2 className="mt-3 text-4xl font-bold md:text-5xl">Qué debe preparar una organización</h2>
              <p className="mt-5 text-lg text-muted-foreground">
                La aplicabilidad concreta depende de los tratamientos, riesgos, contratos y contexto de cada organización.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {priorities.map((priority) => (
                <article key={priority.title} className="rounded-xl border border-border bg-card p-6">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 text-lg font-bold">{priority.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{priority.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/30 px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Plan de implementación</p>
              <h2 className="mt-3 text-4xl font-bold md:text-5xl">Trabajo mínimo para llegar preparado</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                El objetivo no es afirmar cumplimiento automático. Es construir una postura demostrable, revisada y mantenida en el tiempo.
              </p>
            </div>
            <div className="space-y-3">
              {workstreams.map((item, index) => (
                <div key={item} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm font-medium leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">KUMPLIO</p>
              <h2 className="mt-3 text-4xl font-bold md:text-5xl">De la obligación a la evidencia</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-4">
              {[
                { icon: ListChecks, title: 'Obligaciones', text: 'Mapea requisitos y aplicabilidad con referencia a la fuente.' },
                { icon: UserCheck, title: 'Controles', text: 'Asigna responsables, frecuencia, criterios y revisión humana.' },
                { icon: FileCheck2, title: 'Evidencias', text: 'Relaciona políticas, contratos, registros y resultados con cada control.' },
                { icon: ShieldCheck, title: 'Remediación', text: 'Gestiona hallazgos, riesgos, fechas y respaldo de cierre.' },
              ].map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-xl border border-border bg-card p-6">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl rounded-2xl border border-primary/30 bg-card p-10 text-center md:p-14">
            <h2 className="text-4xl font-bold md:text-5xl">No esperes a diciembre de 2026 para identificar las brechas.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Evalúa documentos, procesos y controles actuales; prioriza las acciones que requieren más tiempo de implementación.
            </p>
            <Button size="lg" asChild className="mt-8">
              <Link href="/sign-up">Evaluar preparación para la Ley 21.719 <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
