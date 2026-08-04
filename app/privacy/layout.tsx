import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/public-site'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Kumplio',
  description: 'Política de privacidad y protección de datos personales de Kumplio en cumplimiento con la Ley 19.628 y Ley 21.719 de Chile.',
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/privacy` },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
