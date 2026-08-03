import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  Check,
  CircleCheckBig,
  Code2,
  Headphones,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

const plans = [
  {
    name: 'Esencial',
    eyebrow: 'Hazlo con Kumplio',
    price: '$79.990',
    period: 'al mes + IVA',
    description: 'Para organizaciones que ya tienen una persona responsable y necesitan ordenar, ejecutar y demostrar el cumplimiento.',
    icon: ShieldCheck,
    cta: 'Comenzar con Kumplio',
    href: '/sign-up?plan=esencial',
    highlighted: false,
    features: [
      '1 organización y hasta 5 usuarios',
      'Misiones de cumplimiento guiadas',
      'Equipo IA especializado',
      'Evidencias, decisiones y trazabilidad',
      'Reportes ejecutivos',
      'Soporte por correo',
    ],
  },
  {
    name: 'Profesional',
    eyebrow: 'Automatiza tu operación',
    price: '$249.990',
    period: 'al mes + IVA',
    description: 'Para equipos que necesitan mayor capacidad, seguimiento continuo y coordinación entre áreas.',
    icon: Layers3,
    cta: 'Elegir Profesional',
    href: '/sign-up?plan=profesional',
    highlighted: true,
    badge: 'Recomendado',
    features: [
      'Todo lo incluido en Esencial',
      'Hasta 20 usuarios',
      'Misiones y playbooks avanzados',
      'Monitoreo de cambios regulatorios',
      'Bandeja de decisiones y revisiones',
      'Automatizaciones e integraciones estándar',
      'Soporte prioritario',
    ],
  },
  {
    name: 'Acompañado',
    eyebrow: 'Hazlo con nosotros',
    price: 'Desde $699.990',
    period: 'al mes + IVA',
    description: 'Plataforma, equipo IA y acompañamiento periódico para que el sistema avance junto a tu organización.',
    icon: Headphones,
    cta: 'Conversar con un especialista',
    href: '/contact?service=acompanado',
    highlighted: false,
    features: [
      'Todo lo incluido en Profesional',
      'Onboarding y configuración asistida',
      'Reunión mensual de avance',
      'Revisión de misiones prioritarias',
      'Configuración de playbooks y responsables',
      'Soporte para adopción interna',
      'Plan de trabajo trimestral',
    ],
  },
]

const fullstackIncludes = [
  'Descubrimiento y arquitectura de la solución',
  'Diseño UX/UI alineado a tu organización',
  'Aplicación web personalizada',
  'Procesos, playbooks y agentes especializados',
  'Integraciones con tus sistemas',
  'Configuración de infraestructura y seguridad',
  'Implementación, capacitación y salida a producción',
]

const comparison = [
  ['Quiero empezar rápido', 'Esencial'],
  ['Necesito automatizar y coordinar equipos', 'Profesional'],
  ['Quiero apoyo continuo', 'Acompañado'],
  ['Necesito una plataforma propia', 'Fullstack'],
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111723]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Kumplio" className="flex items-center">
            <Image src="/logo-kumplio.svg" alt="Kumplio" width={150} height={64} priority className="h-12 w-auto" />
          </Link>
          <div className="hidden items-center gap-7 lg:flex">
            <Link href="/" className="text-sm font-medium text-white/65 hover:text-white">Inicio</Link>
            <Link href="/features/ley-21719" className="text-sm font-medium text-white/65 hover:text-white">Ley N.º 21.719</Link>
            <Link href="/pricing" className="text-sm font-semibold text-primary">Planes</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden text-sm font-semibold text-white/80 hover:text-white sm:block">Ingresar</Link>
            <Button asChild className="h-11 rounded-[10px] px-5 font-bold">
              <Link href="/sign-up">Solicitar acceso</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden border-b border-white/10 px-5 pb-20 pt-36 sm:px-8 md:pb-28 md:pt-44 lg:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(184,245,66,0.12),transparent_28%),radial-gradient(circle_at_80%_35%,rgba(75,98,130,0.2),transparent_30%)]" />
          <div className="mx-auto max-w-[1100px] text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-4 py-2 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Precios simples en pesos chilenos
            </div>
            <h1 className="mx-auto mt-7 max-w-[900px] text-balance text-4xl font-extrabold leading-tight tracking-[-0.035em] sm:text-5xl md:text-6xl">
              Elige cuánto quieres hacer con Kumplio y cuánto quieres que hagamos contigo.
            </h1>
            <p className="mx-auto mt-6 max-w-[760px] text-pretty text-lg leading-8 text-white/60">
              Empieza con la plataforma, suma acompañamiento cuando lo necesites o construye una solución completa diseñada para tu organización.
            </p>
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
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-primary">{plan.eyebrow}</p>
                    <h2 className="mt-2 text-2xl font-bold">{plan.name}</h2>
                    <p className="mt-4 min-h-[84px] text-sm leading-6 text-white/55">{plan.description}</p>
                    <div className="mt-7">
                      <p className="text-4xl font-extrabold tracking-tight">{plan.price}</p>
                      <p className="mt-1 text-sm text-white/45">{plan.period}</p>
                    </div>
                    <Button asChild variant={plan.highlighted ? 'default' : 'outline'} className="mt-7 h-12 w-full rounded-[10px] font-bold">
                      <Link href={plan.href}>{plan.cta}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                    <div className="mt-8 border-t border-white/10 pt-6">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">Incluye</p>
                      <ul className="mt-4 space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex gap-3 text-sm leading-6 text-white/65">
                            <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0d131e] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[26px] border border-primary/20 bg-[linear-gradient(135deg,rgba(184,245,66,0.09),rgba(255,255,255,0.025))]">
            <div className="grid gap-10 p-7 md:p-10 lg:grid-cols-[0.92fr_1.08fr] lg:p-14">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                  <Code2 className="h-6 w-6" />
                </div>
                <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-primary">Kumplio Fullstack</p>
                <h2 className="mt-3 text-balance text-4xl font-extrabold leading-tight tracking-[-0.025em] md:text-5xl">
                  Tu propia plataforma de cumplimiento.
                </h2>
                <p className="mt-5 max-w-[620px] text-base leading-7 text-white/58">
                  Diseñamos e implementamos una aplicación completa con tus procesos, integraciones, identidad y necesidades operativas.
                </p>
                <div className="mt-8 rounded-2xl border border-white/10 bg-black/10 p-5">
                  <p className="text-sm text-white/45">Proyecto desde</p>
                  <p className="mt-1 text-4xl font-extrabold">$5.000.000</p>
                  <p className="mt-1 text-sm text-white/45">+ IVA · alcance definido en propuesta</p>
                </div>
                <Button asChild size="lg" className="mt-7 h-13 rounded-[10px] px-7 font-bold">
                  <Link href="/contact?service=fullstack">Solicitar propuesta <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-[#111723]/70 p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold">Qué puede incluir</h3>
                </div>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {fullstackIncludes.map((item) => (
                    <li key={item} className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-4 text-sm leading-6 text-white/65">
                      <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm leading-6 text-white/60">
                  El valor final depende de integraciones, usuarios, automatizaciones, migración de datos y nivel de personalización.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Decisión simple</p>
              <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">¿Cuál te conviene?</h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {comparison.map(([need, answer]) => (
                <div key={need} className="flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-card p-5">
                  <div className="flex items-center gap-3">
                    {answer === 'Fullstack' ? <Code2 className="h-5 w-5 text-primary" /> : answer === 'Acompañado' ? <Users className="h-5 w-5 text-primary" /> : <ShieldCheck className="h-5 w-5 text-primary" />}
                    <p className="text-sm text-white/60">{need}</p>
                  </div>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{answer}</span>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <p className="text-sm text-white/48">Todos los precios están expresados en pesos chilenos y no incluyen IVA.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
