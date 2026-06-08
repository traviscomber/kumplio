import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad | KUMPLIO',
  description: 'Política de privacidad y protección de datos personales de KUMPLIO en cumplimiento con la Ley 19.628 y Ley 21.719 de Chile.',
  robots: 'index, follow',
  canonical: 'https://kumplio.cl/privacy',
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
