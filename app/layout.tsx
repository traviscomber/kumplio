import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { ClientProviders } from '@/app/providers'
import { VeraFloatingChat } from '@/components/vera-floating-chat'

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const title = 'Kumplio | Del conocimiento a la ejecución verificable'
const description = 'Kumplio ayuda a las organizaciones a entender qué cambió, decidir qué importa y ejecutar misiones con evidencia, responsables y revisión humana.'

export const metadata: Metadata = {
  metadataBase: new URL('https://kumplio.app'),
  title: { default: title, template: '%s | Kumplio' },
  description,
  keywords: [
    'inteligencia organizacional',
    'cumplimiento verificable',
    'software compliance Chile',
    'gestión de misiones',
    'evidencia auditable',
    'Ley 21.719',
    'Kumplio',
  ],
  applicationName: 'Kumplio',
  authors: [{ name: 'Kumplio by n3uralia', url: 'https://www.n3uralia.com' }],
  creator: 'Kumplio by n3uralia',
  publisher: 'Kumplio by n3uralia',
  robots: { index: true, follow: true, maxSnippet: -1, maxImagePreview: 'large', maxVideoPreview: -1 },
  alternates: { canonical: '/', languages: { 'es-CL': '/' } },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: '/',
    siteName: 'Kumplio',
    title,
    description,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Kumplio — Del conocimiento a la ejecución verificable' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/twitter-image'] },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7f2' },
    { media: '(prefers-color-scheme: dark)', color: '#111723' },
  ],
}

const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://kumplio.app/#organization',
      name: 'Kumplio',
      alternateName: 'Kumplio by n3uralia',
      url: 'https://kumplio.app',
      logo: 'https://kumplio.app/logo-kumplio.svg',
      description,
      parentOrganization: { '@type': 'Organization', name: 'n3uralia', url: 'https://www.n3uralia.com' },
      areaServed: { '@type': 'Country', name: 'Chile' },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://kumplio.app/#website',
      url: 'https://kumplio.app',
      name: 'Kumplio',
      inLanguage: 'es-CL',
      publisher: { '@id': 'https://kumplio.app/#organization' },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://kumplio.app/#software',
      name: 'Kumplio',
      url: 'https://kumplio.app',
      description,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'es-CL',
      areaServed: 'CL',
      creator: { '@id': 'https://kumplio.app/#organization' },
      featureList: [
        'Conocimiento regulatorio con fuentes identificables',
        'Contexto privado de la organización',
        'Misiones con responsables y criterios de éxito',
        'Resultados y evidencias trazables',
        'Revisión y decisiones humanas',
        'Preparación para la Ley 21.719',
      ],
    },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL" className={`${montserrat.variable} bg-background`}>
      <head>
        <meta name="geo.placename" content="Chile" />
        <meta name="geo.region" content="CL" />
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
        <link rel="sitemap" href="/sitemap.xml" />
      </head>
      <body className="font-sans antialiased text-foreground" suppressHydrationWarning>
        <ClientProviders>
          {children}
          <VeraFloatingChat />
        </ClientProviders>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
