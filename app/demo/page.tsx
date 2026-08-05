import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileSearch, ShieldCheck, TimerReset } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Resultado real con Kumplio',
  description: 'Una demostración breve de cómo una empresa reduce revisión manual, anticipa riesgo y llega a una decisión preparada.',
}

const steps = [
  {
    time: '08:00',
    title: 'La empresa recibe un cambio.',
    description: 'Sin Kumplio, el equipo tendría que revisar la norma, buscar documentos y preguntar quién conoce el proceso.',
    outcome: 'Punto de partida: 21 documentos potencialmente relacionados.',
    icon: FileSearch,
  },
  {
    time: '08:01',
    title: 'Kumplio elimina el ruido.',
    description: 'Relaciona el cambio con contratos, políticas, proveedores y evidencias, y descarta lo que no requiere acción.',
    outcome: 'Resultado: 19 documentos descartados y 2 contratos afectados.',
    icon: ShieldCheck,
  },
  {
    time: '08:02',
    title: 'La decisión llega preparada.',
    description: 'El impacto, la evidencia disponible y la siguiente acción aparecen reunidos en un solo lugar.',
    outcome: 'Resultado: 6 horas estimadas de revisión manual evitadas.',
    icon: TimerReset,
  },
  {
    time: '08:04',
    title: 'El gerente decide y el trabajo comienza.',
    description: 'La persona aprueba, ajusta o descarta. La decisión conserva fuente, responsable y justificación.',
    outcome: 'Resultado: decisión en 4 minutos y evidencia trazable desde el inicio.',
    icon: CheckCircle2,
  },
]

const resultCards = [
  ['6 horas', 'de revisión manual estimada recuperada'],
  ['19 de 21', 'documentos descartados automáticamente'],
  ['4 minutos', 'para comprender y decidir'],
  ['1 expediente', 'con fuente, evidencia y responsable'],
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-[#111723]">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Volver a Kumplio"><Image src="/logo-kumplio.svg" alt="Kumplio" width={140} height={56} priority className="h-11 w-auto" /></Link>
          <Button asChild className="rounded-[10px] font-bold"><Link href="/sign-up">Probar con mi empresa</Link></Button>
        </div>
      </header>

      <main>
        <section className="border-b border-white/10 px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/55 hover:text-white"><ArrowLeft className="h-4 w-4" /> Volver</Link>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-primary">Demostración de dos minutos</p>
            <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.035em] sm:text-6xl">De 21 documentos posibles a una decisión clara en 4 minutos.</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/55">No te mostraremos módulos. Te mostraremos qué cambia en el trabajo de una empresa cuando Kumplio prepara el análisis antes que el equipo.</p>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-5xl space-y-5">
            {steps.map(({ time, title, description, outcome, icon: Icon }, index) => (
              <article key={time} className="grid gap-5 rounded-[24px] border border-white/10 bg-card p-6 sm:grid-cols-[100px_64px_1fr] sm:items-start sm:p-8">
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Paso {index + 1}</p><p className="mt-2 text-2xl font-extrabold text-primary">{time}</p></div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
                <div><h2 className="text-2xl font-extrabold">{title}</h2><p className="mt-3 text-base leading-7 text-white/65">{description}</p><p className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.05] px-4 py-3 text-sm font-semibold text-primary">{outcome}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0d131e] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-2 text-primary"><Clock3 className="h-5 w-5" /><p className="text-sm font-bold">Resultado de esta mañana</p></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {resultCards.map(([value, label]) => (
                <article key={value} className="rounded-2xl border border-white/10 bg-card p-5">
                  <p className="text-3xl font-extrabold text-white">{value}</p>
                  <p className="mt-2 text-sm leading-6 text-white/50">{label}</p>
                </article>
              ))}
            </div>
            <div className="mt-10 grid gap-6 rounded-[24px] border border-primary/20 bg-primary/[0.06] p-7 sm:grid-cols-[1fr_auto] sm:items-center sm:p-10">
              <div>
                <h2 className="text-3xl font-extrabold">El resultado no es más información. Es menos trabajo para llegar a una mejor decisión.</h2>
                <p className="mt-4 max-w-2xl leading-7 text-white/55">Kumplio reduce búsqueda, coordinación y trabajo repetitivo sin quitar el control a la persona.</p>
              </div>
              <Button size="lg" asChild className="rounded-[10px] px-7 font-bold"><Link href="/sign-up">Probar con mi empresa <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
