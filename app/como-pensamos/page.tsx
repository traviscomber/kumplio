import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Eye, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

const principles = [
  {
    icon: Eye,
    title: 'Claridad antes que volumen',
    description:
      'Kumplio prioriza antes de mostrar. Presenta lo que merece atención y mantiene el detalle disponible cuando realmente se necesita.',
  },
  {
    icon: ShieldCheck,
    title: 'Prevención antes que corrección',
    description:
      'La experiencia guía, explica y evita errores antes de que ocurran. Las acciones críticas conservan revisión y trazabilidad.',
  },
  {
    icon: CheckCircle2,
    title: 'Automatización con control humano',
    description:
      'Kumplio analiza, prepara y propone. Las decisiones legales, económicas o irreversibles permanecen en manos de las personas.',
  },
]

export const metadata: Metadata = {
  title: 'Cómo trabaja Kumplio | IA, evidencia y revisión humana en Chile',
  description:
    'Metodología de Kumplio para reducir la complejidad del cumplimiento en Chile sin reducir el rigor: fuentes trazables, evidencia, automatización gobernada y revisión humana.',
  alternates: { canonical: '/como-pensamos' },
  openGraph: {
    type: 'article',
    url: '/como-pensamos',
    title: 'Cómo trabaja Kumplio | IA, evidencia y revisión humana en Chile',
    description: 'Principios de producto: claridad, trazabilidad, prevención y automatización con control humano.',
  },
}

export default function ComoPensamosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <section className="relative overflow-hidden border-b border-border px-6 pb-24 pt-28 md:pb-32 md:pt-36">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(184,245,66,0.10),transparent_30%),radial-gradient(circle_at_80%_25%,rgba(70,95,130,0.15),transparent_28%)]" />
          <div className="container mx-auto max-w-5xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> The Kumplio Way
            </div>

            <h1 className="mt-7 max-w-4xl text-balance text-4xl font-extrabold leading-tight tracking-[-0.03em] sm:text-5xl md:text-6xl">
              Lo complejo ocurre por dentro. Tú ves solo lo que importa.
            </h1>

            <p className="mt-7 max-w-3xl text-pretty text-lg leading-8 text-muted-foreground">
              El cumplimiento puede ser complejo. Usarlo no debería serlo. Kumplio organiza, revisa y prioriza antes de presentarte una situación, explica por qué importa y propone el siguiente paso sin quitarte el control.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-[10px] font-bold">
                <Link href="/sign-up">Comenzar <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-[10px]">
                <Link href="/#como-funciona">Ver cómo funciona</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 md:py-32">
          <div className="container mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Diseñado para simplificar</p>
              <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl md:text-5xl">
                La tecnología trabaja en segundo plano. Las decisiones importantes siguen en tus manos.
              </h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {principles.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-[20px] border border-border bg-card p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/20 px-6 py-24 md:py-32">
          <div className="container mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Cómo trabajamos</p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl">
                Kumplio trabaja primero. Tú decides.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">
                No trasladamos al usuario la arquitectura, los agentes, las reglas ni el volumen de información. Presentamos una narrativa breve, seria y trazable.
              </p>
            </div>

            <div className="space-y-3">
              {[
                ['1', 'Entendemos', 'Reunimos el contexto disponible antes de pedir información adicional.'],
                ['2', 'Encontramos', 'Separamos lo importante del ruido y conservamos el fundamento.'],
                ['3', 'Explicamos', 'Mostramos qué ocurrió, por qué importa y qué evidencia lo respalda.'],
                ['4', 'Proponemos', 'Preparamos una acción concreta y nos detenemos antes de la decisión crítica.'],
              ].map(([number, title, description]) => (
                <div key={number} className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[56px_1fr] sm:items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">{number}</div>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24 text-center md:py-32">
          <div className="container mx-auto max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Nuestra responsabilidad</p>
            <h2 className="mt-5 text-balance text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl md:text-5xl">
              Reducir la complejidad sin reducir el rigor.
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Kumplio no busca impresionar. Busca que entiendas qué merece atención, tengas una recomendación responsable y puedas volver a tu trabajo con tranquilidad.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
