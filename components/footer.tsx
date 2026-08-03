'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, BrainCircuit, Mail, MapPin, Phone } from 'lucide-react'
import {
  N3URALIA_CONTACT_REFERRAL_URL,
  N3URALIA_REFERRAL_URL,
  N3URALIA_SOLUTIONS_REFERRAL_URL,
  PUBLIC_CONTACT,
} from '@/lib/public-site'

const productLinks = [
  ['Software de cumplimiento Chile', '/software-cumplimiento-chile'],
  ['Cómo funciona', '/#como-funciona'],
  ['Ley 21.719', '/features/ley-21719'],
  ['Casos de uso', '/use-cases'],
  ['Demo pública', '/demo'],
  ['Planes', '/pricing'],
]

const resourceLinks = [
  ['Guías Ley 21.719', '/resources/ley-21719'],
  ['Centro de recursos', '/resources/cumplimiento-normativo'],
  ['Preguntas frecuentes', '/faq'],
  ['Sobre Kumplio', '/about'],
  ['Powered by n3uralia', '/powered-by-n3uralia'],
]

const companyLinks = [
  ['Enterprise Studio', '/enterprise'],
  ['Ingresar', '/sign-in'],
  ['Crear organización', '/sign-up'],
  ['Contacto', '/contact'],
]

const legalLinks = [
  ['Privacidad', '/privacy'],
  ['Términos', '/terms'],
  ['Seguridad', '/security'],
  ['llms.txt', '/llms.txt'],
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <section className="border-b border-border bg-primary/[0.045]">
        <div className="container mx-auto grid gap-6 px-6 py-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Powered by n3uralia</p>
              <h2 className="mt-2 text-xl font-bold">Kumplio es un producto construido por n3uralia.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                N3uralia diseña sistemas de IA, automatización y software fullstack para operaciones reales en Chile y Latinoamérica. Kumplio aplica esa capacidad al cumplimiento normativo y la inteligencia regulatoria.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a href={N3URALIA_SOLUTIONS_REFERRAL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold hover:border-primary/50">
              Ver soluciones n3uralia <ArrowUpRight className="h-4 w-4" />
            </a>
            <a href={N3URALIA_CONTACT_REFERRAL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
              Agendar diagnóstico <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_1fr]">
          <div>
            <Image src="/logo-kumplio.svg" alt="Kumplio" width={120} height={48} className="h-12 w-auto" />
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
              Software chileno de cumplimiento normativo e inteligencia regulatoria para convertir fuentes, obligaciones y contexto en controles, misiones, evidencia y decisiones revisables.
            </p>
            <a href={N3URALIA_REFERRAL_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary hover:underline">
              Powered by n3uralia <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <FooterColumn title="Producto" links={productLinks} />
          <FooterColumn title="Recursos" links={resourceLinks} />
          <FooterColumn title="Empresa" links={companyLinks} />

          <div>
            <h3 className="font-semibold">Contacto</h3>
            <ul className="mt-5 space-y-4 text-sm text-muted-foreground">
              <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /><a href={`mailto:${PUBLIC_CONTACT.email}`} className="hover:text-primary">{PUBLIC_CONTACT.email}</a></li>
              <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /><a href={PUBLIC_CONTACT.phoneHref} className="hover:text-primary">{PUBLIC_CONTACT.phone}</a></li>
              <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /><span>{PUBLIC_CONTACT.location}</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-muted/20">
        <div className="container mx-auto flex flex-col gap-4 px-6 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} Kumplio. Producto de n3uralia. Todos los derechos reservados.</p>
          <div className="flex flex-wrap gap-5">{legalLinks.map(([label, href]) => <Link key={href} href={href} className="hover:text-primary">{label}</Link>)}</div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-5 space-y-3 text-sm">
        {links.map(([label, href]) => <li key={href}><Link href={href} className="text-muted-foreground transition-colors hover:text-primary">{label}</Link></li>)}
      </ul>
    </div>
  )
}
