import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, FileSearch, Scale, ShieldCheck, TimerReset } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

const flow = [
  ['Detectamos', 'Kumplio revisa cambios normativos y la información disponible de tu empresa.'],
  ['Comprendemos', 'Relaciona el cambio con contratos, políticas, proveedores, procesos y evidencias.'],
  ['Preparamos', 'Ordena el impacto y deja lista la decisión o el trabajo que corresponde.'],
  ['Demostramos', 'Conserva la fuente, la evidencia, la decisión humana y el resultado.'],
]

const beforeAfter = [
  ['Buscar qué cambió', 'Kumplio identifica lo relevante.'],
  ['Revisar todos los documentos', 'Solo ves los documentos afectados.'],
  ['Crear tareas manualmente', 'El trabajo queda preparado.'],
  ['Armar evidencia para auditoría', 'La trazabilidad se construye durante el proceso.'],
]

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111723]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Kumplio"><Image src="/logo-kumplio.svg" alt="Kumplio" width={150} height={64} priority className="h-12 w-auto" /></Link>
          <div className="hidden items-center gap-7 lg:flex">
            <a href="#como-funciona" className="text-sm font-medium text-white/65 hover:text-white">Cómo funciona</a>
            <a href="#resultado" className="text-sm font-medium text-white/65 hover:text-white">Qué cambia</a>
            <Link href="/features/ley-21719" className="text-sm font-medium text-white/65 hover:text-white">Ley 21.719</Link>
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
              <p className="text-sm font-bold text-primary">Cumplimiento claro para empresas chilenas</p>
              <h1 className="mt-6 max-w-[820px] text-balance text-[44px] font-extrabold leading-[1.06] tracking-[-0.04em] sm:text-[58px] md:text-[70px]">
                Tu empresa siempre sabe qué hacer después.
              </h1>
              <p className="mt-7 max-w-[700px] text-pretty text-[17px] leading-8 text-white/62 sm:text-lg">
                Kumplio revisa normativa, contratos, políticas y evidencias para mostrarte qué cambió, cómo afecta a tu empresa y qué decisión debes tomar.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-13 rounded-[10px] px-7 text-sm font-bold"><Link href="/demo">Ver cómo funciona <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <Button size="lg" variant="outline" asChild className="h-13 rounded-[10px] border-white/15 bg-white/[0.025] px-7 text-sm font-semibold hover:bg-white/[0.07]"><Link href="/sign-up">Probar con mi empresa</Link></Button>
              </div>
              <div className="mt-9 grid max-w-[680px] gap-3 text-sm text-white/55 sm:grid-cols-3">
                {['La evidencia primero', 'Una decisión a la vez', 'La persona mantiene el control'].map((item) => <div key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /><span>{item}</span></div>)}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#151c28] p-5 shadow-[0_28px_100px_rgba(0,0,0,0.45)] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Hoy, 08:00</p>
              <h2 className="mt-3 text-3xl font-extrabold text-white">Preparé una decisión para ti.</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">Detecté un cambio, revisé la empresa y descarté lo que no corresponde.</p>
              <div className="mt-6 space-y-3">
                {[
                  ['Nueva obligación detectada', 'Fuente oficial verificada', Scale],
                  ['2 contratos afectados', 'Los demás no requieren cambios', FileSearch],
                  ['1 decisión pendiente', 'Tiempo estimado: 4 minutos', TimerReset],
                ].map(([title, subtitle, Icon]) => (
                  <div key={String(title)} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                    <div><p className="text-sm font-bold text-white">{String(title)}</p><p className="mt-1 text-xs text-white/45">{String(subtitle)}</p></div>
                  </div>
                ))}
              </div>
              <Button asChild className="mt-6 w-full rounded-[10px] font-bold"><Link href="/demo">Revisar esta decisión <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-b border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Cómo funciona</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.025em] md:text-5xl">Kumplio hace el trabajo previo. Tu equipo conserva la decisión.</h2>
            </div>
            <div className="mt-12 grid gap-4 lg:grid-cols-4">
              {flow.map(([title, description], index) => (
                <article key={title} className="rounded-[20px] border border-white/10 bg-card p-6">
                  <p className="text-xs font-bold text-primary">0{index + 1}</p>
                  <h3 className="mt-5 text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="resultado" className="px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Qué cambia</p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.025em] md:text-5xl">Menos tiempo buscando. Más certeza para decidir.</h2>
              <p className="mt-6 text-base leading-7 text-white/55">No necesitas aprender otro sistema complejo. Kumplio presenta la siguiente acción correcta y conserva cómo se llegó a ella.</p>
            </div>
            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-card">
              {beforeAfter.map(([before, after]) => (
                <div key={before} className="grid gap-3 border-b border-white/10 p-5 last:border-0 sm:grid-cols-2 sm:items-center">
                  <p className="text-sm text-white/40 line-through">{before}</p>
                  <p className="flex items-center gap-2 text-sm font-semibold text-white"><ShieldCheck className="h-4 w-4 text-primary" />{after}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#0d131e] px-5 py-24 text-center sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-balance text-4xl font-extrabold tracking-tight md:text-5xl">Entiende Kumplio en menos de dos minutos.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/55">Recorre una situación real: desde el cambio normativo hasta la decisión preparada.</p>
            <Button size="lg" asChild className="mt-8 h-13 rounded-[10px] px-8 font-bold"><Link href="/demo">Ver la demostración <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
