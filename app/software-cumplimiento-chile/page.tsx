import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  Check,
  FileCheck2,
  SearchCheck,
  ShieldCheck,
  Workflow,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { N3URALIA_CANONICAL_URL, SITE_URL } from '@/lib/public-site'

export const metadata: Metadata = {
  title: 'Software de cumplimiento normativo en Chile',
  description:
    'Kumplio es un software chileno de cumplimiento normativo e inteligencia regulatoria para gestionar obligaciones, controles, evidencia, misiones y revisión humana.',
  keywords: [
    'software cumplimiento normativo Chile',
    'plataforma compliance Chile',
    'software gestión de cumplimiento',
    'software Ley 21.719',
    'plataforma evidencia auditable',
    'inteligencia regulatoria Chile',
  ],
  alternates: { canonical: '/software-cumplimiento-chile' },
  openGraph: {
    type: 'website',
    url: '/software-cumplimiento-chile',
    title: 'Software de cumplimiento normativo en Chile | Kumplio',
    description:
      'Del requisito a la evidencia: obligaciones, controles, misiones y decisiones revisables en una plataforma chilena.',
  },
}

const comparison = [
  ['Normativa y fuentes identificables', false, false, true],
  ['Obligaciones relacionadas con controles', false, false, true],
  ['Evidencia con responsable, vigencia y revisión', false, true, true],
  ['Misiones ejecutables con criterios de éxito', false, false, true],
  ['Asistencia IA con contexto y revisión humana', false, false, true],
  ['Historial de decisiones y resultados', false, true, true],
]

const faqs = [
  {
    question: '¿Qué es un software de cumplimiento normativo?',
    answer:
      'Es una plataforma que ayuda a organizar requisitos, responsables, controles, evidencia, hallazgos y acciones. Su valor no está solamente en almacenar documentos, sino en demostrar cómo se gestiona y revisa el cumplimiento.',
  },
  {
    question: '¿Kumplio declara automáticamente que una empresa cumple?',
    answer:
      'No. Kumplio organiza fuentes, contexto, controles y evidencia; propone estructuras y próximos pasos; y conserva revisión humana para las decisiones relevantes.',
  },
  {
    question: '¿Sirve solamente para la Ley 21.719?',
    answer:
      'No. La Ley 21.719 es la primera solución prioritaria en Chile, pero el modelo de obligaciones, controles, evidencia, riesgos y acciones puede extenderse a contratos, políticas y otros marcos.',
  },
  {
    question: '¿Quién desarrolla Kumplio?',
    answer:
      'Kumplio es un producto desarrollado por n3uralia, empresa chilena de inteligencia artificial aplicada, automatización y software para operaciones reales.',
  },
]

function Availability({ enabled }: { enabled: boolean }) {
  return enabled
    ? <Check className="mx-auto h-5 w-5 text-primary" aria-label="Disponible" />
    : <X className="mx-auto h-5 w-5 text-muted-foreground/45" aria-label="No disponible" />
}

export default function SoftwareCumplimientoChilePage() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/software-cumplimiento-chile#page`,
        url: `${SITE_URL}/software-cumplimiento-chile`,
        name: 'Software de cumplimiento normativo en Chile',
        description: metadata.description,
        inLanguage: 'es-CL',
        about: { '@id': `${SITE_URL}/#software` },
        publisher: { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Software de cumplimiento normativo en Chile',
            item: `${SITE_URL}/software-cumplimiento-chile`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/software-cumplimiento-chile#faq`,
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-extrabold tracking-[0.18em]">KUMPLIO</Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex"><Link href="/pricing">Planes</Link></Button>
            <Button asChild><Link href="/sign-up">Comenzar</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
              <ShieldCheck className="h-4 w-4" /> Software para empresas chilenas
            </div>
            <h1 className="mt-6 max-w-5xl text-balance text-5xl font-black leading-tight tracking-[-0.04em] md:text-7xl">
              Cumplimiento normativo conectado con el trabajo real.
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
              Kumplio reúne normativa, documentos y contexto organizacional para convertir obligaciones en controles, misiones, evidencia y decisiones revisables. Está diseñado para Chile y comienza por la preparación para la Ley 21.719.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild><Link href="/sign-up">Crear mi organización <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button size="lg" variant="outline" asChild><Link href="/demo">Ver demo con datos ficticios</Link></Button>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Respuesta directa</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">¿Qué debe hacer un software de compliance moderno?</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Debe permitir identificar la fuente de una obligación, determinar si aplica, asignar controles y responsables, solicitar evidencia, registrar hallazgos, coordinar correcciones y conservar la decisión humana que aprueba o rechaza cada resultado.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                [SearchCheck, 'Comprender', 'Fuentes, vigencia, versiones y contexto aplicable.'],
                [FileCheck2, 'Demostrar', 'Controles, evidencia, responsables y revisiones.'],
                [Workflow, 'Ejecutar', 'Misiones, dependencias, fechas y criterios de cierre.'],
                [Bot, 'Asistir', 'IA contextualizada con fuentes y escalamiento humano.'],
              ].map(([Icon, title, text]) => (
                <article key={String(title)} className="rounded-2xl border border-border bg-card p-6">
                  <Icon className="h-7 w-7 text-primary" />
                  <h3 className="mt-5 text-xl font-bold">{String(title)}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{String(text)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Diferencia operativa</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Más que una planilla y más que un repositorio documental.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Una herramienta puede almacenar archivos. Kumplio busca mantener la relación entre el requisito, la decisión, el trabajo realizado y la evidencia que respalda el resultado.
              </p>
            </div>

            <div className="mt-12 overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-border bg-muted/40 text-sm">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Capacidad</th>
                    <th className="px-5 py-4 text-center font-semibold">Planilla</th>
                    <th className="px-5 py-4 text-center font-semibold">Gestor documental</th>
                    <th className="px-5 py-4 text-center font-semibold text-primary">Kumplio</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map(([label, spreadsheet, repository, kumplio]) => (
                    <tr key={String(label)} className="border-b border-border last:border-0">
                      <td className="px-5 py-4 text-sm font-medium">{String(label)}</td>
                      <td className="px-5 py-4 text-center"><Availability enabled={Boolean(spreadsheet)} /></td>
                      <td className="px-5 py-4 text-center"><Availability enabled={Boolean(repository)} /></td>
                      <td className="px-5 py-4 text-center"><Availability enabled={Boolean(kumplio)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Flujo de trabajo</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight">Del cambio normativo al resultado revisable.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                El producto organiza un recorrido verificable en lugar de entregar una recomendación aislada.
              </p>
            </div>
            <ol className="space-y-3">
              {[
                ['1', 'Registrar la fuente', 'Origen, fecha, versión e integridad del documento o cambio.'],
                ['2', 'Estructurar la obligación', 'Contenido, condiciones, sujetos, plazos y aplicabilidad.'],
                ['3', 'Relacionar controles', 'Responsables, periodicidad, evidencia y estado observado.'],
                ['4', 'Crear una misión', 'Trabajo, dependencias, criterios de éxito y puntos de revisión.'],
                ['5', 'Revisar el resultado', 'Aprobar, solicitar cambios o rechazar con fundamento registrado.'],
              ].map(([number, title, text]) => (
                <li key={number} className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[48px_1fr] sm:items-start">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">{number}</span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Chile primero</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Una plataforma construida desde fuentes y necesidades locales.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Kumplio prioriza fuentes oficiales chilenas, lenguaje operativo en español, precios en pesos chilenos y un modelo compatible con equipos legales, de cumplimiento, operaciones y gerencia.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              {[
                'LeyChile / BCN',
                'Diario Oficial',
                'Ley 21.719',
                'Evidencia organizacional privada',
                'Revisión humana',
                'Precios en CLP',
              ].map((item) => <span key={item} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium">{item}</span>)}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Preguntas frecuentes</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Lo esencial antes de comenzar.</h2>
            </div>
            <div className="mt-12 space-y-4">
              {faqs.map((faq) => (
                <article key={faq.question} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-lg font-bold">{faq.question}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{faq.answer}</p>
                </article>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button variant="outline" asChild><Link href="/faq">Ver todas las preguntas</Link></Button>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card px-6 py-24 text-center">
          <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">Comienza con una organización y un primer objetivo.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Configura el contexto inicial y prepara un primer caso de trabajo sin activar cobros automáticos.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild><Link href="/sign-up">Comenzar <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/pricing">Ver planes en CLP</Link></Button>
          </div>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <Footer />
    </div>
  )
}
