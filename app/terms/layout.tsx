import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos de Servicio | KUMPLIO',
  description: 'Términos y condiciones de uso de KUMPLIO. Acuerdo legal entre usuario y KUMPLIO.',
  robots: 'index, follow',
  canonical: 'https://kumplio.cl/terms',
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
