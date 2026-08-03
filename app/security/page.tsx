import type { Metadata } from 'next'
import Link from 'next/link'
import { Database, Eye, KeyRound, LockKeyhole, ShieldCheck, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Seguridad',
  description: 'Enfoque de seguridad, aislamiento de organizaciones y revisión humana en Kumplio.',
  alternates: { canonical: '/security' },
}

const controls = [
  {
    icon: LockKeyhole,
    title: 'Aislamiento por organización',
    text: 'Los datos privados se relacionan con una organización y se protegen mediante permisos y políticas de acceso en la base de datos.',
  },
  {
    icon: UserCheck,
    title: 'Autenticación y membresías',
    text: 'El acceso al workspace requiere una cuenta autenticada y una membresía válida en la organización correspondiente.',
  },
  {
    icon: Database,
    title: 'Persistencia trazable',
    text: 'Misiones, resultados, revisiones y eventos conservan identificadores y relaciones que permiten reconstruir el trabajo realizado.',
  },
  {
    icon: Eye,
    title: 'Revisión humana',
    text: 'Las propuestas generadas mediante inteligencia artificial requieren validación humana cuando afectan decisiones jurídicas, de riesgo o cumplimiento.',
  },
  {
    icon: KeyRound,
    title: 'Acceso restringido',
    text: 'Las funciones administrativas y los datos internos se limitan según el rol y el contexto de la organización.',
  },
  {
    icon: ShieldCheck,
    title: 'Desarrollo seguro',
    text: 'Kumplio aplica validación de entradas, controles de autorización y revisión de cambios antes de publicar funcionalidades sensibles.',
  },
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-extrabold tracking-[0.18em]">KUMPLIO</Link>
          <Button asChild><Link href="/contact">Contactar</Link></Button>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-6 py-24 md:py-32">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Seguridad y confianza</p>
            <h1 className="mt-4 max-w-4xl text-balance text-5xl font-black tracking-tight md:text-7xl">
              Protegemos el contexto privado de cada organización.
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-muted-foreground">
              Kumplio separa el conocimiento público del contexto privado de cada empresa. La seguridad se diseña alrededor de autenticación, autorización, aislamiento de datos, trazabilidad y revisión humana.
            </p>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-3">
            {controls.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-bold">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold">Alcance actual</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Esta página describe controles y principios actualmente aplicados por Kumplio. No afirma certificaciones externas, disponibilidad garantizada ni cumplimiento de estándares que todavía no hayan sido auditados formalmente.
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              Para consultas de seguridad, privacidad o evaluación de proveedores, escribe a <a className="font-semibold text-primary hover:underline" href="mailto:info@kumplio.app">info@kumplio.app</a>.
            </p>
          </div>
        </section>

        <section className="px-6 py-24 text-center">
          <h2 className="mx-auto max-w-3xl text-4xl font-bold">¿Necesitas revisar requisitos de seguridad o tratamiento de datos?</h2>
          <Button size="lg" asChild className="mt-8"><Link href="/contact">Conversar con Kumplio</Link></Button>
        </section>
      </main>

      <Footer />
    </div>
  )
}
