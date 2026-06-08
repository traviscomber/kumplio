import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClientProviders } from '@/app/providers'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'KUMPLIO - Cumplimiento Ley 21.719 Chile | IA & LLM para Compliance Legal',
  description: 'KUMPLIO: Plataforma con IA y LLM para cumplimiento automático de Ley 21.719 en Chile. 7 agentes expertos, análisis de documentos, cuantificación de riesgos, roadmaps de cumplimiento. Solución enterprise para empresas chilenas. Desarrollado por n3uralia.com',
  keywords: [
    // Compliance General
    'Cumplimiento Ley 21.719',
    'Protección de datos Chile',
    'IA legal Chile',
    'LLM compliance',
    'Inteligencia documental',
    'Auditoría de compliance',
    'Análisis de documentos IA',
    'Gestión de obligaciones legales',
    'Riesgo normativo Chile',
    'Agentes IA legal',
    
    // Regional Keywords - Metropolitan & Major Cities
    'compliance legal santiago',
    'ley 21.719 santiago',
    'compliance valparaíso',
    'compliance concepción',
    'compliance puente alto',
    'compliance maipú',
    'ley datos viña del mar',
    
    // Regional Coverage
    'cumplimiento legal tarapacá',
    'compliance legal antofagasta',
    'cumplimiento atacama',
    'compliance legal o\'higgins',
    'cumplimiento legal bío bío',
    'compliance araucanía',
    'cumplimiento legal los ríos',
    'compliance los lagos',
    'cumplimiento legal aysén',
    'compliance magallanes',
    
    // Industry Specific - Transport
    'compliance transporte chile',
    'regulaciones transporte',
    'ley transporte chile',
    'cumplimiento transportista',
    'reglamento vías públicas',
    
    // Industry Specific - Mining
    'compliance minería chile',
    'regulaciones minería',
    'ley seguridad minería',
    'cumplimiento minero',
    'reglamento minería chile',
    
    // Legal Frameworks
    'ley 19.628 datos',
    'cumplimiento laboral chile',
    'regulaciones ambientales',
    'ley 20.045 sistemas',
    'decreto 40 seguridad',
    'ley 20.255 pensiones',
    
    // Brand & Organization
    'n3uralia',
    'KUMPLIO',
    'kumplio.app',
  ],
  generator: 'kumplio.app',
  referrer: 'strict-origin-when-cross-origin',
  authors: [{ name: 'KUMPLIO by n3uralia', url: 'https://www.n3uralia.com' }],
  creator: 'KUMPLIO (n3uralia.com)',
  publisher: 'KUMPLIO by n3uralia',
  robots: {
    index: true,
    follow: true,
    noarchive: false,
    maxSnippet: -1,
    maxImagePreview: 'large',
    maxVideoPreview: -1,
  },
  alternates: {
    canonical: 'https://kumplio.app',
    languages: {
      'es-CL': 'https://kumplio.app',
      'es-ES': 'https://kumplio.es',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://kumplio.app',
    siteName: 'KUMPLIO - Compliance IA para Ley 21.719',
    title: 'KUMPLIO: Agentes IA para Cumplimiento Ley 21.719 | Desarrollado por n3uralia',
    description: 'Sistema experto con 7 agentes IA y LLM para automatizar cumplimiento de Ley 21.719. Análisis de documentos, cuantificación de riesgos, recomendaciones estratégicas. Desarrollado por n3uralia.com para empresas chilenas.',
    images: [
      {
        url: 'https://kumplio.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KUMPLIO - Sistema de Compliance IA | n3uralia.com',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KUMPLIO: IA para Cumplimiento Ley 21.719 | n3uralia',
    description: 'Agentes IA expertos en compliance legal. Análisis automático con LLM. Desarrollado por n3uralia.com',
    images: ['https://kumplio.app/twitter-image.png'],
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
        {/* Geographic & Geo Tags for Chile */}
        <meta name="geo.placename" content="Chile" />
        <meta name="geo.region" content="CL" />
        <meta name="geo.position" content="-33.8688;-151.2093" />
        <meta name="ICBM" content="-33.8688,-151.2093" />
        
        {/* Regional Coverage Meta Tags */}
        <meta name="coverage" content="Chile" />
        <meta name="distribution" content="global" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'KUMPLIO by n3uralia',
              url: 'https://kumplio.app',
              parentOrganization: {
                '@type': 'Organization',
                name: 'n3uralia',
                url: 'https://www.n3uralia.com',
              },
              logo: 'https://kumplio.app/logo.png',
              description: 'Plataforma de IA y LLM para cumplimiento automático de Ley 21.719 con 7 agentes expertos. Desarrollado por n3uralia.com',
              sameAs: [
                'https://www.linkedin.com/company/kumplio',
                'https://twitter.com/kumplio_cl',
                'https://www.n3uralia.com',
              ],
              areaServed: {
                '@type': 'Country',
                name: 'CL',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                email: 'support@kumplio.app',
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
              description: 'Sistema experto con IA y LLM para cumplimiento automático de Ley 21.719 en Chile',
              applicationCategory: 'BusinessApplication',
              url: 'https://kumplio.app',
              creator: {
                '@type': 'Organization',
                name: 'n3uralia',
                url: 'https://www.n3uralia.com',
              },
              operatingSystem: 'Web',
              areaServed: 'CL',
              inLanguage: 'es-CL',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'CLP',
                description: 'Prueba gratis sin tarjeta de crédito',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                ratingCount: '150',
              },
              featureList: [
                'Agentes IA expertos',
                'Análisis automático con LLM',
                'Cuantificación de riesgos',
                'Compliance con Ley 21.719',
                'Razonamiento transparente',
                'SERNAC precedent database',
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'KUMPLIO Chile',
              url: 'https://kumplio.app',
              description: 'Cumplimiento legal con IA para empresas chilenas',
              geo: {
                '@type': 'GeoShape',
                box: '-56.5,−27.1 -66.4,−17.5',
                description: 'Chile (focus area)',
              },
              areaServed: {
                '@type': 'Country',
                name: 'CL',
              },
              parentOrganization: {
                '@type': 'Organization',
                name: 'n3uralia',
                url: 'https://www.n3uralia.com',
              },
            }),
          }}
        />
        <link rel="sitemap" href="/sitemap.xml" />
        
        {/* JSON-LD Schema References */}
        <link rel="alternate" href="/schema-service.json" type="application/ld+json" />
        <link rel="alternate" href="/schema-software.json" type="application/ld+json" />
        <link rel="alternate" href="/schema-industries.json" type="application/ld+json" />
        <link rel="alternate" href="/schema-regions.json" type="application/ld+json" />
      </head>
      <body className="font-sans antialiased text-foreground">
        <ClientProviders>
          {children}
        </ClientProviders>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
