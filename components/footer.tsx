'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import { getPublicSiteHref, type PublicLocale } from '@/lib/i18n/public-routing'
import { N3URALIA_REFERRAL_URL, PUBLIC_CONTACT } from '@/lib/public-site'

type FooterLink = [label: string, href: string]

type FooterCopy = {
  description: string
  product: string
  resources: string
  company: string
  contact: string
  rights: string
  productLinks: FooterLink[]
  resourceLinks: FooterLink[]
  companyLinks: FooterLink[]
  legalLinks: FooterLink[]
}

function publicHref(locale: PublicLocale, pathname: string, hash = '') {
  return `${getPublicSiteHref(pathname, locale)}${hash}`
}

function getFooterCopy(locale: PublicLocale): FooterCopy {
  if (locale === 'en') {
    return {
      description:
        'Guided resolution for privacy, regulatory, contractual and compliance situations in Chile, with a current public focus on data protection, Law 21.719, evidence, traceability and human review.',
      product: 'Product',
      resources: 'Resources',
      company: 'Company',
      contact: 'Contact',
      rights: 'All rights reserved.',
      productLinks: [
        ['Data protection software', publicHref(locale, '/software-cumplimiento-chile')],
        ['Law 21.719', publicHref(locale, '/features/ley-21719')],
        ['Guided resolution', publicHref(locale, '/', '#resolver')],
        ['Public demo', publicHref(locale, '/demo')],
        ['Plans', publicHref(locale, '/pricing')],
      ],
      resourceLinks: [
        ['Law 21.719 guides', publicHref(locale, '/resources/ley-21719')],
        ['Resource center', publicHref(locale, '/resources/cumplimiento-normativo')],
        ['Use cases', publicHref(locale, '/use-cases')],
        ['FAQ', publicHref(locale, '/faq')],
        ['How we think', publicHref(locale, '/como-pensamos')],
      ],
      companyLinks: [
        ['About Kumplio', publicHref(locale, '/about')],
        ['Enterprise Studio', publicHref(locale, '/enterprise')],
        ['Kumplio and n3uralia', publicHref(locale, '/powered-by-n3uralia')],
        ['Contact', publicHref(locale, '/contact')],
        ['Sign in', '/sign-in'],
      ],
      legalLinks: [
        ['Privacy', publicHref(locale, '/privacy')],
        ['Terms', publicHref(locale, '/terms')],
        ['Security', publicHref(locale, '/security')],
        ['LLM context', '/llms.txt'],
        ['Full LLM context', '/llms-full.txt'],
        ['Public facts', '/kumplio.json'],
      ],
    }
  }

  return {
    description:
      'Resolución guiada de situaciones regulatorias, contractuales y de cumplimiento en Chile, con foco público actual en protección de datos, Ley 21.719, evidencia, trazabilidad y revisión humana.',
    product: 'Producto',
    resources: 'Recursos',
    company: 'Empresa',
    contact: 'Contacto',
    rights: 'Todos los derechos reservados.',
    productLinks: [
      ['Software de protección de datos', publicHref(locale, '/software-cumplimiento-chile')],
      ['Ley 21.719', publicHref(locale, '/features/ley-21719')],
      ['Resolución guiada', publicHref(locale, '/', '#resolver')],
      ['Demostración pública', publicHref(locale, '/demo')],
      ['Planes', publicHref(locale, '/pricing')],
    ],
    resourceLinks: [
      ['Guías Ley 21.719', publicHref(locale, '/resources/ley-21719')],
      ['Centro de recursos', publicHref(locale, '/resources/cumplimiento-normativo')],
      ['Casos de uso', publicHref(locale, '/use-cases')],
      ['Preguntas frecuentes', publicHref(locale, '/faq')],
      ['Cómo pensamos', publicHref(locale, '/como-pensamos')],
    ],
    companyLinks: [
      ['Sobre Kumplio', publicHref(locale, '/about')],
      ['Enterprise Studio', publicHref(locale, '/enterprise')],
      ['Kumplio y n3uralia', publicHref(locale, '/powered-by-n3uralia')],
      ['Contacto', publicHref(locale, '/contact')],
      ['Ingresar', '/sign-in'],
    ],
    legalLinks: [
      ['Privacidad', publicHref(locale, '/privacy')],
      ['Términos', publicHref(locale, '/terms')],
      ['Seguridad', publicHref(locale, '/security')],
      ['Contexto LLM', '/llms.txt'],
      ['Contexto LLM completo', '/llms-full.txt'],
      ['Datos públicos', '/kumplio.json'],
    ],
  }
}

export function Footer({ locale = 'es' }: { locale?: PublicLocale }) {
  const currentYear = new Date().getFullYear()
  const copy = getFooterCopy(locale)

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_1fr]">
          <div>
            <Image src="/kumplio-logo-canonical.png" alt="Kumplio" width={455} height={171} className="h-auto w-[150px] object-contain" />
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
              {copy.description}
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

          <FooterColumn title={copy.product} links={copy.productLinks} />
          <FooterColumn title={copy.resources} links={copy.resourceLinks} />
          <FooterColumn title={copy.company} links={copy.companyLinks} />

          <div>
            <h3 className="font-semibold">{copy.contact}</h3>
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
          <p>© {currentYear} Kumplio. {copy.rights}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {copy.legalLinks.map(([label, href]) => <Link key={href} href={href} className="hover:text-primary">{label}</Link>)}
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-5 space-y-3 text-sm">
        {links.map(([label, href]) => <li key={href}><Link href={href} className="text-muted-foreground transition-colors hover:text-primary">{label}</Link></li>)}
      </ul>
    </div>
  )
}
