import Link from 'next/link'
import { ArrowRight, BadgeCheck, Building2, CheckCircle2, Clock3, FileCheck2, ShieldAlert, Sparkles, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

export const metadata = {
  title: 'Demo pública',
  description: 'Recorrido guiado por una organización ficticia para entender cómo Kumplio transforma conocimiento en ejecución verificable.',
}

const timeline = [
  { time: '09:02', title: 'Cambio normativo detectado', detail: 'La fuente fue registrada con fecha, versión y procedencia.', icon: ShieldAlert },
  { time: '09:07', title: 'Impacto relacionado', detail: 'Se identificaron políticas, controles y responsables que requieren revisión.', icon: Building2 },
  { time: '09:12', title: 'Misión preparada', detail: 'El trabajo quedó organizado con criterios de éxito y evidencia esperada.', icon: Target },
  { time: '09:28', title: 'Resultado listo para aprobar', detail: 'La propuesta conserva fundamento, fuentes y cambios realizados.', icon: BadgeCheck },
]

const decisions = [
  ['Revisar política de privacidad', 'Impacto alto', 'Pendiente'],
  ['Solicitar actualización de contrato', 'Impacto medio', 'En curso'],
  ['Aprobar mapa de responsables', 'Listo para revisar', 'Decisión'],
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <main>
        <section className="border-b border-white/10 px-5 pb-16 pt-32 sm:px-8 md:pt-40 lg:px-12">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-bold text-amber-200"><Sparkles className="h-4 w-4" /> Demostración con datos ficticios</div>
                <h1 className="mt-6 max-w-4xl text-balance text-5xl font-extrabold leading-[1.06] tracking-[-0.04em] sm:text-6xl">Conoce a Empresa Horizonte.</h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-white/60">Una organización ficticia creada únicamente para mostrar cómo Kumplio conecta cambios, decisiones, misiones y resultados. No representa a un cliente real.</p>
              </div>
              <Button size="lg" asChild className="h-13 rounded-xl px-7 font-bold"><Link href="/sign-up">Crear mi organización <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </div>
        </section>

        <section className="px-5 py-10 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-[1280px] gap-6 lg:grid-cols-[0.72fr_1.28fr]">
            <aside className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-card p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Organización</p>
                <h2 className="mt-3 text-2xl font-extrabold">Empresa Horizonte</h2>
                <p className="mt-2 text-sm leading-6 text-white/50">Servicios profesionales · 85 personas · Chile</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Metric label="Conocimiento" value="76%" />
                  <Metric label="Trabajo activo" value="4 misiones" />
                  <Metric label="Decisiones" value="3" />
                  <Metric label="Resultados" value="12" />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-card p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Objetivo actual</p>
                <h3 className="mt-3 text-xl font-bold">Prepararse para la Ley 21.719</h3>
                <p className="mt-3 text-sm leading-6 text-white/50">Organizar obligaciones, documentos, responsables y brechas en una misión ejecutable.</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[64%] rounded-full bg-primary" /></div>
                <div className="mt-2 flex justify-between text-xs text-white/40"><span>Avance demostrativo</span><span>64%</span></div>
              </div>

              <div className="rounded-3xl border border-primary/20 bg-primary/[0.06] p-6">
                <p className="text-sm font-bold text-primary">Qué mirar en esta demo</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-white/60">
                  {['Qué cambió y por qué importa.', 'Qué decisión necesita una persona.', 'Cómo se convierte en una misión.', 'Cómo se conserva evidencia y trazabilidad.'].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />{item}</li>)}
                </ul>
              </div>
            </aside>

            <div className="space-y-6">
              <section className="rounded-3xl border border-white/10 bg-card p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Prioridades de hoy</p><h2 className="mt-2 text-3xl font-extrabold">3 decisiones necesitan atención</h2></div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-2 text-xs text-white/50"><Clock3 className="h-4 w-4" /> Lectura estimada: 2 minutos</span>
                </div>
                <div className="mt-7 space-y-3">
                  {decisions.map(([title, reason, status], index) => (
                    <div key={title} className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-[40px_1fr_auto] sm:items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">{index + 1}</div>
                      <div><p className="font-bold">{title}</p><p className="mt-1 text-sm text-white/45">{reason}</p></div>
                      <span className="w-fit rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/60">{status}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#0d131e] p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Cómo avanzó el trabajo</p>
                <h2 className="mt-2 text-3xl font-extrabold">De una señal a un resultado revisable</h2>
                <div className="mt-8 space-y-0">
                  {timeline.map(({ time, title, detail, icon: Icon }, index) => (
                    <div key={title} className="relative grid grid-cols-[54px_1fr] gap-4 pb-8 last:pb-0">
                      {index < timeline.length - 1 && <div className="absolute left-[26px] top-11 h-[calc(100%-28px)] w-px bg-white/10" />}
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                      <div className="pt-1"><div className="flex flex-wrap items-center gap-3"><h3 className="font-bold">{title}</h3><span className="text-xs text-white/35">{time}</span></div><p className="mt-2 text-sm leading-6 text-white/50">{detail}</p></div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-5 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-card p-6"><FileCheck2 className="h-7 w-7 text-primary" /><p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-white/35">Evidencia relacionada</p><p className="mt-2 text-3xl font-extrabold">18 archivos</p><p className="mt-2 text-sm leading-6 text-white/50">Políticas, contratos y respaldos con origen y relación demostrativa.</p></div>
                <div className="rounded-3xl border border-white/10 bg-card p-6"><BadgeCheck className="h-7 w-7 text-primary" /><p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-white/35">Resultado</p><p className="mt-2 text-3xl font-extrabold">Listo para revisar</p><p className="mt-2 text-sm leading-6 text-white/50">La persona conserva la decisión final y su fundamento.</p></div>
              </section>
            </div>
          </div>
        </section>

        <section className="mt-12 border-t border-white/10 bg-[#0d131e] px-5 py-24 text-center sm:px-8 lg:px-12">
          <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">La demo muestra el recorrido. Tu organización aporta el contexto real.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/55">Al comenzar, Kumplio utiliza únicamente la información autorizada de tu organización y mantiene separados los datos de cada empresa.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button size="lg" asChild className="h-13 rounded-xl px-8 font-bold"><Link href="/sign-up">Comenzar <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button size="lg" variant="outline" asChild className="h-13 rounded-xl border-white/15 bg-transparent px-8 font-semibold"><Link href="/use-cases">Ver casos de uso</Link></Button></div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/[0.035] p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-white/35">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>
}

function PublicNav() {
  return <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111723]/90 backdrop-blur-xl"><div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12"><Link href="/" className="font-extrabold tracking-[0.2em]">KUMPLIO</Link><div className="hidden items-center gap-7 md:flex"><Link href="/use-cases" className="text-sm text-white/65 hover:text-white">Casos</Link><Link href="/enterprise" className="text-sm text-white/65 hover:text-white">Enterprise</Link><Link href="/pricing" className="text-sm text-white/65 hover:text-white">Planes</Link></div><Button asChild className="rounded-xl font-bold"><Link href="/sign-up">Comenzar</Link></Button></div></nav>
}
