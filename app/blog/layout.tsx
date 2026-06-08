import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | KUMPLIO - Noticias Compliance y Ley 21.719',
  description: 'Blog con artículos, noticias y guías sobre cumplimiento normativo, Ley 21.719, protección de datos y compliance en Chile.',
  robots: 'index, follow',
  canonical: 'https://kumplio.cl/blog',
  openGraph: {
    title: 'Blog KUMPLIO - Compliance en Chile',
    description: 'Artículos sobre Ley 21.719, protección de datos y cumplimiento normativo',
    type: 'website',
    url: 'https://kumplio.cl/blog',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
