import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, FileSearch, Scale, ShieldCheck, TimerReset } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Cómo funciona Kumplio',
  description: 'Una demostración breve de cómo Kumplio detecta un cambio, revisa la empresa y prepara una decisión trazable.',
}

const steps = [
  {
    time: '08:00',
    title: 'Cambió una obligación.',
    description: 'Kumplio registra la fuente oficial, la fecha y el cambio relevante.',
    detail: 'No crea una tarea todavía. Primero entiende si el cambio realmente afecta a esta empresa.',
    icon: Scale,
  },
  {
    time: '08:01',
    title: 'Revisó la empresa.',
    description: 'Relacionó la obligación con contratos, políticas, proveedores y evidencias.',
    detail: 'Descartó 18 documentos que no requieren acción y encontró 2 contratos afectados.',
    icon: FileSearch,
  },
  {
    time: '08:02',
    title: 'Preparó la decisión.',
    description: 'Ordenó el impacto, la evidencia disponible y el precedente de la organización.',
    detail: 'La recomendación puede revisarse y siempre conserva su fundamento.',
    icon: ShieldCheck,
  },
  {
    time: '08:04',
    title: 'La persona decide.',
    description: 'El gerente aprueba, ajusta o descarta la recomendación con justificación.',
    detail: 'Solo después se crea el trabajo, con responsable, fecha y evidencia esperada.',
    icon: CheckCircle2,
  },
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
            <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.035em] sm:text-6xl">Una obligación cambia. Kumplio prepara lo que debes decidir.</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/55">Esta empresa es ficticia. El recorrido muestra el producto completo sin módulos, jerga ni configuración previa.</p>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-5xl space-y-5">
            {steps.map(({ time, title, description, detail, icon: Icon }, index) => (
              <article key={time} className="grid gap-5 rounded-[24px] border border-white/10 bg-card p-6 sm:grid-cols-[100px_64px_1fr] sm:items-start sm:p-8">
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Paso {index + 1}</p><p className="mt-2 text-2xl font-extrabold text-primary">{time}</p></div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
                <div><h2 className="text-2xl font-extrabold">{title}</h2><p className="mt-3 text-base leading-7 text-white/65">{description}</p><p className="mt-3 text-sm leading-6 text-white/40">{detail}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0d131e] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-5xl gap-8 rounded-[24px] border border-primary/20 bg-primary/[0.06] p-7 sm:grid-cols-[1fr_auto] sm:items-center sm:p-10">
            <div>
              <div className="flex items-center gap-2 text-primary"><TimerReset className="h-5 w-5" /><p className="text-sm font-bold">Tiempo del gerente: 4 minutos</p></div>
              <h2 className="mt-4 text-3xl font-extrabold">El sistema hace el trabajo previo. La decisión sigue siendo humana.</h2>
              <p className="mt-4 max-w-2xl leading-7 text-white/55">Kumplio reduce búsqueda, coordinación y trabajo repetitivo para que la persona decida con evidencia.</p>
            </div>
            <Button size="lg" asChild className="rounded-[10px] px-7 font-bold"><Link href="/sign-up">Probar con mi empresa <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>
    </div>
  )
}
