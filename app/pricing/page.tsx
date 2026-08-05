import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Headphones, Layers3, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

const plans = [
  {
    name: 'Esencial',
    outcome: 'Deja de ordenar el cumplimiento en planillas.',
    price: '$79.990',
    period: 'al mes + IVA',
    description: 'Para una empresa que necesita reunir obligaciones, decisiones y evidencias en un flujo claro y trazable.',
    icon: ShieldCheck,
    cta: 'Empezar a ordenar',
    href: '/sign-up?plan=esencial',
    highlighted: false,
    results: [
      'Una sola vista de lo que requiere atención',
      'Trabajo asignado con responsable y fecha',
      'Evidencia organizada mientras avanzas',
      'Menos seguimiento manual por correo',
      'Estado ejecutivo disponible en minutos',
    ],
  },
  {
    name: 'Profesional',
    outcome: 'Anticipa cambios y coordina equipos antes de que aparezca la urgencia.',
    price: '$249.990',
    period: 'al mes + IVA',
    description: 'Para organizaciones que necesitan seguimiento continuo, decisiones preparadas y coordinación entre varias áreas.',
    icon: Layers3,
    cta: 'Reducir trabajo manual',
    href: '/sign-up?plan=profesional',
    highlighted: true,
    badge: 'Mayor impacto',
    results: [
      'Cambios relevantes priorizados automáticamente',
      'Menos documentos y asuntos que revisar',
      'Decisiones explicadas con evidencia y contexto',
      'Equipos alineados sobre el siguiente paso',
      'Auditorías más simples por trazabilidad continua',
    ],
  },
  {
    name: 'Acompañado',
    outcome: 'Avanza con una operación guiada, no solo con una herramienta.',
    price: 'Desde $699.990',
    period: 'al mes + IVA',
    description: 'Para empresas que quieren acelerar la adopción y mantener prioridades, responsables y resultados bajo revisión periódica.',
    icon: Headphones,
    cta: 'Conversar sobre mi empresa',
    href: '/contact?service=acompanado',
    highlighted: false,
    results: [
      'Configuración inicial junto a tu equipo',
      'Prioridades revisadas periódicamente',
      'Bloqueos y atrasos visibles antes de escalar',
      'Mejor adopción entre las áreas responsables',
      'Plan de avance conectado con tus objetivos',
    ],
  },
]

const choice = [
  ['Quiero dejar las planillas y ordenar evidencia', 'Esencial'],
  ['Quiero anticipar cambios y coordinar varias áreas', 'Profesional'],
  ['Quiero que nos ayuden a implementar y avanzar', 'Acompañado'],
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111723]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Kumplio"><Image src="/logo-kumplio.svg" alt="Kumplio" width={150} height={64} priority className="h-12 w-auto" /></Link>
          <div className="hidden items-center gap-7 lg:flex">
            <Link href="/" className="text-sm font-medium text-white/65 hover:text-white">Inicio</Link>
            <Link href="/demo" className="text-sm font-medium text-white/65 hover:text-white">Demostración</Link>
            <Link href="/pricing" className="text-sm font-semibold text-primary">Planes</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden text-sm font-semibold text-white/80 hover:text-white sm:block">Ingresar</Link>
            <Button asChild className="h-11 rounded-[10px] px-5 font-bold"><Link href="/sign-up">Probar con mi empresa</Link></Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden border-b border-white/10 px-5 pb-20 pt-36 sm:px-8 md:pb-28 md:pt-44 lg:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(184,245,66,0.12),transparent_28%),radial-gradient(circle_at_80%_35%,rgba(75,98,130,0.2),transparent_30%)]" />
          <div className="mx-auto max-w-[1050px] text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-4 py-2 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" /> Planes según el resultado que necesitas</div>
            <h1 className="mx-auto mt-7 max-w-[900px] text-balance text-4xl font-extrabold leading-tight tracking-[-0.035em] sm:text-5xl md:text-6xl">Elige cuánto trabajo manual quieres recuperar y cuánto acompañamiento necesita tu equipo.</h1>
            <p className="mx-auto mt-6 max-w-[760px] text-pretty text-lg leading-8 text-white/60">Todos los planes buscan el mismo resultado: menos tiempo buscando, decisiones más rápidas y evidencia preparada mientras la empresa avanza.</p>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => {
                const Icon = plan.icon
                return (
                  <article key={plan.name} className={`relative flex h-full flex-col rounded-[22px] border p-7 md:p-8 ${plan.highlighted ? 'border-primary bg-primary/[0.055] shadow-[0_24px_80px_rgba(184,245,66,0.08)]' : 'border-white/10 bg-card'}`}>
                    {plan.badge && <span className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{plan.badge}</span>}
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                    <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-primary">{plan.name}</p>
                    <h2 className="mt-3 text-2xl font-extrabold">{plan.outcome}</h2>
                    <p className="mt-4 min-h-[72px] text-sm leading-6 text-white/55">{plan.description}</p>
                    <div className="mt-7"><p className="text-4xl font-extrabold tracking-tight">{plan.price}</p><p className="mt-1 text-sm text-white/45">{plan.period}</p></div>
                    <Button asChild variant={plan.highlighted ? 'default' : 'outline'} className="mt-7 h-12 w-full rounded-[10px] font-bold"><Link href={plan.href}>{plan.cta}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                    <div className="mt-8 border-t border-white/10 pt-6">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">Qué cambia</p>
                      <ul className="mt-4 space-y-3">
                        {plan.results.map((result) => <li key={result} className="flex gap-3 text-sm leading-6 text-white/65"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" /><span>{result}</span></li>)}
                      </ul>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0d131e] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1050px]">
            <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Decisión simple</p><h2 className="mt-3 text-3xl font-extrabold md:text-4xl">Elige por el problema que quieres dejar atrás.</h2></div>
            <div className="mt-10 space-y-4">
              {choice.map(([need, answer]) => <div key={need} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm leading-6 text-white/65">{need}</p><span className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{answer}</span></div>)}
            </div>
            <div className="mt-12 text-center"><p className="text-sm text-white/48">Precios en pesos chilenos, sin IVA. Puedes comenzar con un plan y aumentar el acompañamiento cuando la organización lo necesite.</p></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
