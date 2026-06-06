import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'KUMPLIO - Cumplimiento Ley 21.719 Chile | Inteligencia Documental',
  description: 'Plataforma de inteligencia documental para cumplimiento normativo en Chile. Automatiza análisis de documentos con Ley 21.719, extrae obligaciones, riesgos y plazos legales. Solución premium para empresas chilenas.',
  keywords: [
    'Cumplimiento Ley 21.719',
    'Protección de datos Chile',
    'Inteligencia documental',
    'Auditoría de compliance',
    'Análisis de documentos',
    'Gestión de obligaciones',
    'Riesgo normativo',
    'Cumplimiento legal Chile',
    'KUMPLIO',
  ],
  generator: 'kumplio.cl',
  referrer: 'strict-origin-when-cross-origin',
  authors: [{ name: 'KUMPLIO', url: 'https://kumplio.cl' }],
  creator: 'KUMPLIO',
  publisher: 'KUMPLIO',
  robots: {
    index: true,
    follow: true,
    noarchive: false,
    maxSnippet: -1,
    maxImagePreview: 'large',
    maxVideoPreview: -1,
  },
  alternates: {
    canonical: 'https://kumplio.cl',
    languages: {
      'es-CL': 'https://kumplio.cl',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://kumplio.cl',
    siteName: 'KUMPLIO',
    title: 'KUMPLIO - Plataforma de Cumplimiento Ley 21.719 en Chile',
    description: 'Inteligencia documental para automatizar cumplimiento normativo. Análisis con Ley 21.719 y normativas chilenas.',
    images: [
      {
        url: 'https://kumplio.cl/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KUMPLIO - Cumplimiento Legal Chile',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KUMPLIO - Cumplimiento Ley 21.719',
    description: 'Inteligencia documental para cumplimiento normativo en Chile',
    images: ['https://kumplio.cl/twitter-image.png'],
    creator: '@kumplio_cl',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-CL" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'KUMPLIO',
              url: 'https://kumplio.cl',
              logo: 'https://kumplio.cl/logo.png',
              description: 'Plataforma de inteligencia documental para cumplimiento normativo con Ley 21.719 en Chile',
              sameAs: [
                'https://www.linkedin.com/company/kumplio',
                'https://twitter.com/kumplio_cl',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                email: 'support@kumplio.cl',
                availableLanguage: 'es-CL',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'KUMPLIO',
              description: 'Plataforma de inteligencia documental para cumplimiento Ley 21.719',
              applicationCategory: 'BusinessApplication',
              url: 'https://kumplio.cl',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'CLP',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                ratingCount: '150',
              },
            }),
          }}
        />
        <link rel="sitemap" href="/sitemap.xml" />
      </head>
      <body className="font-sans antialiased text-foreground">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
