import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export function FocusPanel({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card p-6 sm:p-8">
      {eyebrow && <p className="text-sm font-semibold text-primary">{eyebrow}</p>}
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      {description && <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>}
      {children}
    </section>
  )
}

export function PrimaryAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground transition-opacity hover:opacity-90">
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  )
}

export function CalmState({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-semibold text-primary">
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      {children}
    </div>
  )
}
