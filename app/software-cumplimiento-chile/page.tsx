import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
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
  title: 'Software de protección de datos y Ley 21.719 en Chile',
  description:
    'Kumplio es una plataforma chilena para proteger datos personales, prepararse para la Ley 21.719, ordenar tratamientos y proveedores, gestionar brechas y cerrar acciones con evidencia y revisión humana.',
  keywords: [
    'software protección de datos Chile',
    'software Ley 21.719',
    'plataforma privacidad Chile',
    'gestión datos personales Chile',
    'cumplimiento Ley 21.719 empresas',
    'software compliance Chile',
    'evidencia privacidad Chile',
  ],
  alternates: { canonical: '/software-cumplimiento-chile' },
  openGraph: {
    type: 'website',
    url: '/software-cumplimiento-chile',
    title: 'Software de protección de datos y Ley 21.719 en Chile | Kumplio',
    description:
      'Centraliza información sensible, entiende qué debes proteger y convierte brechas de privacidad en acciones, responsables y evidencia revisable.',
  },
}

const comparison = [
  ['Mapa de datos, tratamientos y proveedores', false, false, true],
  ['Brechas relacionadas con obligaciones y responsables', false, false, true],
  ['Evidencia con responsable, vigencia y revisión', false, true, true],
  ['Acciones ejecutables con criterios de cierre', false, false, true],
  ['Asistencia IA con contexto y revisión humana', false, false, true],
  ['Historial de decisiones y resultados', false, true, true],
]

const faqs = [
  {
    question: '¿Qué hace un software de protección de datos?',
    answer:
      'Ayuda a saber qué datos personales existen, para qué se usan, dónde están, quién interviene, qué terceros participan y qué brechas necesitan trabajo. Kumplio conecta ese contexto con acciones, responsables, evidencia y revisión humana.',
  },
  {
    question: '¿Kumplio declara automáticamente que una empresa cumple?',
    answer:
      'No. Kumplio organiza fuentes, contexto, tratamientos, controles y evidencia; propone próximos pasos; y conserva revisión humana para las decisiones relevantes.',
  },
  {
    question: '¿Kumplio está pensado para la Ley 21.719?',
    answer:
      'Sí. La preparación para la Ley 21.719 es el foco inicial del producto en Chile: inventario de tratamientos, responsables, terceros, brechas, controles, evidencia y acciones de cierre.',
  },
  {
    question: '¿También sirve para cumplimiento normativo?',
    answer:
      'Sí, como marco más amplio. El producto parte por protección de datos y privacidad en Chile, y su modelo de fuentes, obligaciones, controles, evidencia y acciones puede extenderse a otros marcos cuando corresponda.',
  },
  {
    question: '¿Quién desarrolla Kumplio?',
    answer:
      'Kumplio es un producto desarrollado por n3uralia, factoría chilena de inteligencia artificial aplicada y software para operaciones reales.',
  },
]

const coreCapabilities = [
  {
    name: 'Isidora',
    stage: 'Analiza',
    description: 'Relaciona antecedentes, fuentes y obligaciones para distinguir qué importa en tu situación.',
  },
  {
    name: 'Verónica',
    stage: 'Resuelve',
    description: 'Convierte brechas en controles, evidencia esperada y acciones concretas con criterio de cierre.',
  },
  {
    name: 'Julieta',
    stage: 'Revisa',
    description: 'Contrasta conclusiones y reservas antes de que una decisión sensible avance con respaldo suficiente.',
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
        name: 'Software de protección de datos y Ley 21.719 en Chile',
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
            name: 'Software de protección de datos en Chile',
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
            <Button asChild><Link href="/#resolver">Describe tu situación</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
              <ShieldCheck className="h-4 w-4" /> Protección de datos para organizaciones en Chile
            </div>
            <h1 className="mt-6 max-w-5xl text-balance text-5xl font-black leading-tight tracking-[-0.04em] md:text-7xl">
              Protege tus datos y prepárate para la Ley 21.719 con una ruta clara.
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
              Kumplio reúne contexto, tratamientos, proveedores, controles y evidencia para ayudarte a entender qué debes proteger y convertir una brecha concreta en una resolución revisable y respaldada.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild><Link href="/#resolver">Describe tu situación <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button size="lg" variant="outline" asChild><Link href="/demo">Ver demo con datos ficticios</Link></Button>
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">
              No necesitas partir eligiendo un módulo. Empieza por el problema que necesitas resolver y conserva revisión humana en las decisiones relevantes.
            </p>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Respuesta directa</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">¿Qué debe resolver una plataforma de protección de datos?</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Debe ayudarte a saber qué datos tienes, cómo se usan, quién participa y qué evidencia existe; después debe transformar ese contexto en acciones concretas y una decisión que pueda revisarse.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                [SearchCheck, 'Describe tu situación', 'Parte por una brecha, una solicitud, un tercero o una obligación concreta, no por un módulo.'],
                [SearchCheck, 'Analiza', 'Relaciona datos, tratamientos, terceros, fuentes y obligaciones aplicables.'],
                [Workflow, 'Resuelve', 'Convierte brechas en acciones, controles, responsables y evidencia esperada.'],
                [FileCheck2, 'Revisa', 'Contrasta conclusiones y reservas antes de avanzar hacia Evidencia y cierre.'],
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
                Una herramienta puede almacenar archivos. Kumplio mantiene relacionada la información personal, el tratamiento, la brecha, la acción, la decisión y la evidencia que respalda el resultado.
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
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Cómo trabaja Kumplio</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Tres capacidades principales, una sola ruta de resolución.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                El flujo principal separa análisis, resolución y revisión para reducir traspasos innecesarios y mantener una revisión independiente.
              </p>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {coreCapabilities.map((capability, index) => (
                <article key={capability.name} className="rounded-2xl border border-border bg-card p-6">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">0{index + 1} · {capability.stage}</p>
                  <h3 className="mt-4 text-2xl font-black">{capability.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{capability.description}</p>
                </article>
              ))}
            </div>
            <p className="mt-7 max-w-3xl text-sm leading-7 text-muted-foreground">
              Cuando el caso lo requiere, Kumplio activa especialistas adicionales para riesgo cuantitativo, cambio regulatorio, planificación detallada o análisis histórico. La decisión final permanece bajo control humano.
            </p>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Del expediente al cierre</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight">Una recomendación aislada no basta.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Kumplio mantiene el contexto, las acciones y el respaldo relacionados para que puedas volver a la decisión y entender por qué avanzó.
              </p>
            </div>
            <ol className="space-y-3">
              {[
                ['1', 'Situación', 'Describe la brecha, solicitud, tercero o necesidad concreta.'],
                ['2', 'Expediente', 'Antecedentes, documentos, fuentes y preguntas abiertas quedan relacionados.'],
                ['3', 'Resolución', 'Acciones, controles, responsables sugeridos y criterios de cierre quedan explícitos.'],
                ['4', 'Evidencia y cierre', 'Revisión humana, evidencia y decisiones quedan conectadas con el resultado.'],
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

        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Chile primero</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Construido para la realidad de protección de datos en Chile.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Kumplio prioriza la Ley 21.719, fuentes oficiales chilenas, lenguaje operativo en español, precios en pesos chilenos y un modelo pensado para organizaciones que necesitan ordenar privacidad y protección de datos sin perder trazabilidad.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              {['Ley 21.719','LeyChile / BCN','Diario Oficial','Inventario de tratamientos','Evidencia organizacional privada','Revisión humana','Precios en CLP'].map((item) => (
                <span key={item} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium">{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-24">
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
          <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">Empieza por la situación que necesitas resolver.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Kumplio organiza el contexto y te guía desde el análisis hasta una decisión respaldada por acciones, evidencia y revisión humana.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild><Link href="/#resolver">Describe tu situación <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/pricing">Ver planes en CLP</Link></Button>
          </div>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <Footer />
    </div>
  )
}