import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/public-site'

export const metadata: Metadata = {
  title: 'Términos de Servicio | Kumplio',
  description: 'Términos y condiciones de uso de Kumplio y reglas aplicables a sus servicios.',
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/terms` },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
