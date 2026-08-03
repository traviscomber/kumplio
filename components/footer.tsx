'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import { N3URALIA_REFERRAL_URL, PUBLIC_CONTACT } from '@/lib/public-site'

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
]

const companyLinks = [
  ['Enterprise Studio', '/enterprise'],
  ['Kumplio y n3uralia', '/powered-by-n3uralia'],
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
      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_1fr]">
          <div>
            <Image src="/logo-kumplio.svg" alt="Kumplio" width={120} height={48} className="h-12 w-auto" />
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
              Software chileno de cumplimiento normativo e inteligencia regulatoria para convertir fuentes, obligaciones y contexto en controles, misiones, evidencia y decisiones revisables.
            </p>
            <a
              href={N3URALIA_REFERRAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
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
          <p>© {currentYear} Kumplio. Todos los derechos reservados.</p>
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
