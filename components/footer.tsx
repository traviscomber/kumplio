'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'

const productLinks = [
  ['Cómo funciona', '/#como-funciona'],
  ['Ley 21.719', '/features/ley-21719'],
  ['Casos de uso', '/use-cases'],
  ['Demo pública', '/demo'],
  ['Planes', '/pricing'],
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
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
          <div>
            <Image src="/logo-kumplio.svg" alt="Kumplio" width={120} height={48} className="h-12 w-auto" />
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
              Kumplio ayuda a las organizaciones a transformar conocimiento en decisiones y decisiones en ejecución verificable.
            </p>
            <p className="mt-4 text-xs font-semibold text-muted-foreground">Kumplio by n3uralia · Santiago, Chile</p>
          </div>

          <FooterColumn title="Producto" links={productLinks} />
          <FooterColumn title="Empresa" links={companyLinks} />

          <div>
            <h3 className="font-semibold">Contacto</h3>
            <ul className="mt-5 space-y-4 text-sm text-muted-foreground">
              <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /><a href="mailto:info@kumplio.app" className="hover:text-primary">info@kumplio.app</a></li>
              <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /><a href="tel:+56993826127" className="hover:text-primary">+56 9 9382 6127</a></li>
              <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /><span>Santiago, Chile</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-muted/20">
        <div className="container mx-auto flex flex-col gap-4 px-6 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} Kumplio by n3uralia. Todos los derechos reservados.</p>
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
