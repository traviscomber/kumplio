import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Clock3, FileCheck2, ShieldCheck, TimerReset } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

const outcomes = [
  {
    title: 'Recupera horas de revisión manual',
    description: 'Tu equipo deja de buscar entre normas, correos y documentos. Kumplio presenta solo lo que requiere atención.',
    metric: 'Menos búsqueda',
  },
  {
    title: 'Reduce el riesgo de actuar tarde',
    description: 'Los cambios relevantes aparecen relacionados con la empresa antes de convertirse en una urgencia.',
    metric: 'Más anticipación',
  },
  {
    title: 'Llega preparado a una auditoría',
    description: 'La fuente, la evidencia, las decisiones y los responsables quedan registrados mientras el trabajo avanza.',
    metric: 'Evidencia lista',
  },
  {
    title: 'Decide con contexto en minutos',
    description: 'Cada asunto llega priorizado, explicado y con una siguiente acción revisable por una persona.',
    metric: 'Decisiones rápidas',
  },
]

const monday = [
  ['Antes', 'Revisar correos, leyes, contratos y planillas para entender qué ocurrió.'],
  ['Con Kumplio', 'Abrir una decisión preparada con impacto, evidencia y siguiente paso.'],
  ['Resultado', 'El trabajo comienza en minutos y queda trazable desde el primer día.'],
]

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111723]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Kumplio"><Image src="/logo-kumplio.svg" alt="Kumplio" width={150} height={64} priority className="h-12 w-auto" /></Link>
          <div className="hidden items-center gap-7 lg:flex">
            <a href="#resultados" className="text-sm font-medium text-white/65 hover:text-white">Resultados</a>
            <a href="#lunes" className="text-sm font-medium text-white/65 hover:text-white">Qué cambia</a>
            <Link href="/demo" className="text-sm font-medium text-white/65 hover:text-white">Demostración</Link>
            <Link href="/pricing" className="text-sm font-medium text-white/65 hover:text-white">Planes</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden text-sm font-semibold text-white/80 hover:text-white sm:block">Ingresar</Link>
            <Button asChild className="h-11 rounded-[10px] px-5 font-bold"><Link href="/sign-up">Probar con mi empresa</Link></Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative border-b border-white/10 px-5 pb-24 pt-36 sm:px-8 md:pb-32 md:pt-44 lg:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(184,245,66,0.11),transparent_27%),radial-gradient(circle_at_82%_30%,rgba(75,98,130,0.18),transparent_30%)]" />
          <div className="mx-auto grid max-w-[1440px] items-center gap-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20">
            <div>
              <p className="text-sm font-bold text-primary">Menos incertidumbre. Más trabajo resuelto.</p>
              <h1 className="mt-6 max-w-[860px] text-balance text-[44px] font-extrabold leading-[1.06] tracking-[-0.04em] sm:text-[58px] md:text-[70px]">
                Recupera tiempo, reduce riesgo y llega preparado a cada decisión.
              </h1>
              <p className="mt-7 max-w-[720px] text-pretty text-[17px] leading-8 text-white/62 sm:text-lg">
                Kumplio revisa qué cambió, identifica cómo afecta a tu empresa y deja preparado el trabajo para que tu equipo avance sin empezar desde cero.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-13 rounded-[10px] px-7 text-sm font-bold"><Link href="/demo">Ver el resultado en 2 minutos <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <Button size="lg" variant="outline" asChild className="h-13 rounded-[10px] border-white/15 bg-white/[0.025] px-7 text-sm font-semibold hover:bg-white/[0.07]"><Link href="/sign-up">Probar con mi empresa</Link></Button>
              </div>
              <div className="mt-9 grid max-w-[720px] gap-3 text-sm text-white/55 sm:grid-cols-3">
                {['Menos revisión manual', 'Decisiones más rápidas', 'Evidencia preparada'].map((item) => <div key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /><span>{item}</span></div>)}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#151c28] p-5 shadow-[0_28px_100px_rgba(0,0,0,0.45)] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Resultado preparado hoy</p>
              <h2 className="mt-3 text-3xl font-extrabold text-white">De 21 documentos, solo 2 requieren revisión.</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">Kumplio descartó el ruido y dejó una decisión explicada para el gerente.</p>
              <div className="mt-6 space-y-3">
                {[
                  ['19 documentos descartados', 'No tienen impacto en este cambio', FileCheck2],
                  ['2 contratos afectados', 'Con las cláusulas relevantes identificadas', ShieldCheck],
                  ['4 minutos para decidir', 'Impacto, evidencia y acción preparados', TimerReset],
                ].map(([title, subtitle, Icon]) => (
                  <div key={String(title)} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                    <div><p className="text-sm font-bold text-white">{String(title)}</p><p className="mt-1 text-xs text-white/45">{String(subtitle)}</p></div>
                  </div>
                ))}
              </div>
              <Button asChild className="mt-6 w-full rounded-[10px] font-bold"><Link href="/demo">Ver cómo se logró <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </div>
        </section>

        <section id="resultados" className="border-b border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Lo que gana tu empresa</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.025em] md:text-5xl">El valor no está en tener más información. Está en resolver antes y demostrar mejor.</h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {outcomes.map((outcome) => (
                <article key={outcome.title} className="rounded-[20px] border border-white/10 bg-card p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{outcome.metric}</p>
                  <h3 className="mt-5 text-xl font-bold">{outcome.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">{outcome.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="lunes" className="px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Qué cambia el lunes</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.025em] md:text-5xl">Tu equipo deja de investigar desde cero y empieza con una decisión preparada.</h2>
              <p className="mt-6 text-base leading-7 text-white/55">Kumplio trabaja antes de que la reunión comience: reúne el contexto, descarta lo irrelevante y organiza la siguiente acción.</p>
            </div>
            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-card">
              {monday.map(([label, text], index) => (
                <div key={label} className="grid gap-3 border-b border-white/10 p-6 last:border-0 sm:grid-cols-[130px_1fr] sm:items-center">
                  <p className={`text-sm font-bold ${index === 2 ? 'text-primary' : 'text-white/45'}`}>{label}</p>
                  <p className="text-sm leading-7 text-white/70">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#0d131e] px-5 py-24 text-center sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <Clock3 className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-6 text-balance text-4xl font-extrabold tracking-tight md:text-5xl">Comprueba el resultado antes de aprender el producto.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/55">Recorre una mañana real: desde un cambio normativo hasta una decisión lista para aprobar.</p>
            <Button size="lg" asChild className="mt-8 h-13 rounded-[10px] px-8 font-bold"><Link href="/demo">Ver la demostración <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
