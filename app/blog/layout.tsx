import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/public-site'

export const metadata: Metadata = {
  title: 'Blog | Kumplio - Noticias de cumplimiento y Ley 21.719',
  description: 'Artículos, noticias y guías sobre cumplimiento normativo, Ley 21.719, protección de datos y compliance en Chile.',
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'Blog Kumplio - Cumplimiento en Chile',
    description: 'Artículos sobre Ley 21.719, protección de datos y cumplimiento normativo.',
    type: 'website',
    url: `${SITE_URL}/blog`,
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
