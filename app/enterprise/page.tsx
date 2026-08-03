import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  Building2,
  Check,
  GitBranch,
  GraduationCap,
  Plug,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

export const metadata = {
  title: 'Kumplio Enterprise Studio',
  description: 'Diseñamos e implementamos una plataforma organizacional personalizada sobre el núcleo de Kumplio, desde $5.000.000 CLP + IVA.',
}

const enterpriseContactHref = '/contact?service=enterprise'

const beforeAfter = [
  ['Procesos dispersos en Excel, correo y documentos', 'Un espacio único con contexto, responsables y trazabilidad'],
  ['Integraciones manuales y doble digitación', 'Conectores y automatizaciones diseñados para tu operación'],
  ['Software genérico que obliga a adaptar la empresa', 'Una experiencia configurada para tus procesos y lenguaje'],
  ['Proyectos aislados difíciles de mantener', 'Una solución construida sobre una plataforma evolutiva'],
]

const scope = [
  { icon: GitBranch, title: 'Arquitectura', text: 'Modelo de entidades, procesos, permisos, integraciones y trazabilidad.' },
  { icon: Blocks, title: 'Aplicación web', text: 'Experiencia personalizada, responsive y alineada con tu marca.' },
  { icon: Workflow, title: 'Misiones y automatización', text: 'Flujos ejecutables con criterios de éxito, decisiones y evidencia.' },
  { icon: Plug, title: 'Integraciones', text: 'Conexión con herramientas existentes mediante APIs y conectores.' },
  { icon: Sparkles, title: 'Inteligencia aplicada', text: 'Habilidades IA contextualizadas para resultados concretos, no chat genérico.' },
  { icon: GraduationCap, title: 'Implementación', text: 'Configuración, capacitación, documentación y acompañamiento de salida.' },
]

export default function EnterprisePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <main>
        <section className="relative overflow-hidden border-b border-white/10 px-5 pb-24 pt-36 sm:px-8 md:pb-32 md:pt-44 lg:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(184,245,66,0.12),transparent_28%),radial-gradient(circle_at_85%_30%,rgba(72,92,126,0.22),transparent_32%)]" />
          <div className="mx-auto max-w-[1240px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-bold text-primary">
              <Building2 className="h-4 w-4" /> Kumplio Enterprise Studio
            </div>
            <h1 className="mt-7 max-w-5xl text-balance text-5xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Construimos tu sistema organizacional sobre una plataforma que ya funciona.
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-white/60">
              Diseñamos una aplicación Fullstack para tus procesos, integraciones y equipos sin comenzar desde cero ni crear un desarrollo imposible de mantener.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-13 rounded-xl px-7 font-bold">
                <Link href={enterpriseContactHref}>Solicitar diagnóstico <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-13 rounded-xl border-white/15 bg-white/[0.025] px-7 font-semibold">
                <Link href="/demo">Ver una demo de Kumplio</Link>
              </Button>
            </div>
            <div className="mt-10 inline-flex flex-col rounded-2xl border border-white/10 bg-card p-5 sm:flex-row sm:items-center sm:gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Proyecto inicial</p>
                <p className="mt-2 text-3xl font-extrabold">Desde $5.000.000 + IVA</p>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/50 sm:mt-0">El alcance y precio final dependen de procesos, integraciones, usuarios, seguridad y nivel de personalización.</p>
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1240px]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Antes y después</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">No vendemos horas de desarrollo. Cambiamos cómo opera tu organización.</h2>
            <div className="mt-12 overflow-hidden rounded-3xl border border-white/10">
              {beforeAfter.map(([before, after], index) => (
                <div key={before} className={`grid gap-5 p-6 md:grid-cols-2 md:p-8 ${index ? 'border-t border-white/10' : ''}`}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">Antes</p>
                    <p className="mt-2 text-base leading-7 text-white/55">{before}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Con Kumplio</p>
                    <p className="mt-2 flex gap-3 text-base font-semibold leading-7"><Check className="mt-1 h-5 w-5 shrink-0 text-primary" />{after}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0d131e] px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1240px]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Qué puede incluir</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">Una solución completa, no una colección de pantallas.</h2>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {scope.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-card p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                  <h3 className="mt-5 text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Cuándo tiene sentido</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight">Enterprise no es para todos.</h2>
              <p className="mt-5 text-base leading-7 text-white/55">Lo recomendamos cuando la suscripción estándar ya no cubre la complejidad real de tu operación.</p>
            </div>
            <div className="space-y-3">
              {[
                'Tienes procesos propios que no caben en una solución estándar.',
                'Necesitas integrar Microsoft 365, Google Workspace, ERP, CRM u otras fuentes.',
                'Operas varias empresas, áreas o clientes con permisos diferenciados.',
                'Requieres branding, SSO, flujos de aprobación o reportes personalizados.',
                'Quieres convertir una operación manual en un producto digital escalable.',
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-card p-4 text-sm leading-6 text-white/65">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />{item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#0d131e] px-5 py-24 text-center sm:px-8 lg:px-12">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">Primero entendemos el problema. Después definimos si necesitas Fullstack.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/55">El diagnóstico debe confirmar el resultado, alcance, riesgos y costo antes de proponer un proyecto.</p>
          <Button size="lg" asChild className="mt-8 h-13 rounded-xl px-8 font-bold"><Link href={enterpriseContactHref}>Solicitar diagnóstico <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function PublicNav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111723]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="font-extrabold tracking-[0.2em]">KUMPLIO</Link>
        <div className="hidden items-center gap-7 md:flex">
          <Link href="/use-cases" className="text-sm text-white/65 hover:text-white">Casos</Link>
          <Link href="/demo" className="text-sm text-white/65 hover:text-white">Demo</Link>
          <Link href="/pricing" className="text-sm text-white/65 hover:text-white">Planes</Link>
        </div>
        <Button asChild className="rounded-xl font-bold"><Link href="/sign-up">Comenzar</Link></Button>
      </div>
    </nav>
  )
}
