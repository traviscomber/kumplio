import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClientProviders } from '@/app/providers'
import { VeraFloatingChat } from '@/components/vera-floating-chat'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const title = 'KUMPLIO | Cumplimiento continuo y evidencia auditable'
const description = 'Plataforma chilena de cumplimiento continuo que convierte regulaciones, contratos y políticas en obligaciones, controles, evidencia, hallazgos y planes de acción.'

export const metadata: Metadata = {
  metadataBase: new URL('https://kumplio.app'),
  title: { default: title, template: '%s | KUMPLIO' },
  description,
  keywords: ['cumplimiento continuo', 'software compliance Chile', 'gestión de obligaciones', 'controles de cumplimiento', 'evidencia auditable', 'Ley 21.719', 'KUMPLIO'],
  applicationName: 'KUMPLIO',
  authors: [{ name: 'KUMPLIO by n3uralia', url: 'https://www.n3uralia.com' }],
  creator: 'KUMPLIO by n3uralia',
  publisher: 'KUMPLIO by n3uralia',
  robots: { index: true, follow: true, maxSnippet: -1, maxImagePreview: 'large', maxVideoPreview: -1 },
  alternates: { canonical: '/', languages: { 'es-CL': '/' } },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: {
    type: 'website', locale: 'es_CL', url: '/', siteName: 'KUMPLIO', title, description,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'KUMPLIO — Cumplimiento continuo y evidencia auditable' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/twitter-image'] },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, userScalable: true,
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#ffffff' }, { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }],
}

const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization', '@id': 'https://kumplio.app/#organization', name: 'KUMPLIO', alternateName: 'KUMPLIO by n3uralia',
      url: 'https://kumplio.app', logo: 'https://kumplio.app/logo-kumplio.svg', description,
      parentOrganization: { '@type': 'Organization', name: 'n3uralia', url: 'https://www.n3uralia.com' },
      areaServed: { '@type': 'Country', name: 'Chile' },
    },
    {
      '@type': 'WebSite', '@id': 'https://kumplio.app/#website', url: 'https://kumplio.app', name: 'KUMPLIO', alternateName: 'KUMPLIO Compliance',
      inLanguage: 'es-CL', publisher: { '@id': 'https://kumplio.app/#organization' },
    },
    {
      '@type': 'SoftwareApplication', '@id': 'https://kumplio.app/#software', name: 'KUMPLIO', url: 'https://kumplio.app', description,
      applicationCategory: 'BusinessApplication', operatingSystem: 'Web', inLanguage: 'es-CL', areaServed: 'CL',
      creator: { '@id': 'https://kumplio.app/#organization' },
      featureList: ['Mapa de obligaciones', 'Controles de cumplimiento', 'Biblioteca de evidencias', 'Gestión de hallazgos y riesgos', 'Planes de acción', 'Preparación para la Ley 21.719'],
    },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <head>
        <meta name="geo.placename" content="Chile" />
        <meta name="geo.region" content="CL" />
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
        <link rel="sitemap" href="/sitemap.xml" />
      </head>
      <body className="font-sans antialiased text-foreground" suppressHydrationWarning>
        <ClientProviders>{children}<VeraFloatingChat /></ClientProviders>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
