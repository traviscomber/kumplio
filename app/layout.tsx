import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { ClientProviders } from '@/app/providers'
import {
  CORE_CAPABILITIES,
  N3URALIA_CANONICAL_URL,
  N3URALIA_NAME,
  N3URALIA_URL,
  PUBLIC_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from '@/lib/public-site'

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const title = 'Kumplio | Software de cumplimiento normativo e inteligencia regulatoria en Chile'
const description = `${PUBLIC_DESCRIPTION} Producto desarrollado por n3uralia.`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: `%s | ${SITE_NAME}` },
  description,
  keywords: [
    'software cumplimiento normativo Chile',
    'plataforma compliance Chile',
    'software Ley 21.719',
    'cumplimiento protección de datos Chile',
    'inteligencia regulatoria Chile',
    'evidencia auditable',
    'gestión de obligaciones y controles',
    'misiones de cumplimiento',
    'Kumplio',
    'n3uralia',
  ],
  applicationName: SITE_NAME,
  authors: [{ name: N3URALIA_NAME, url: N3URALIA_CANONICAL_URL }],
  creator: N3URALIA_NAME,
  publisher: N3URALIA_NAME,
  category: 'business software',
  classification: 'Software de cumplimiento normativo e inteligencia regulatoria para Chile',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: '/',
    languages: { 'es-CL': '/' },
    types: {
      'text/plain': '/llms.txt',
      'application/rss+xml': '/feed.xml',
      'application/json': '/kumplio.json',
    },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    type: 'website',
    locale: SITE_LOCALE.replace('-', '_'),
    url: '/',
    siteName: 'Kumplio — powered by n3uralia',
    title,
    description,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Kumplio, software de cumplimiento normativo en Chile powered by n3uralia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/twitter-image'],
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
  other: {
    'powered-by': N3URALIA_NAME,
    company: N3URALIA_NAME,
    product: SITE_NAME,
    country: 'Chile',
    language: SITE_LOCALE,
    'content-authority': 'Kumplio editorial team, powered by n3uralia',
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
      '@id': `${N3URALIA_CANONICAL_URL}/#organization`,
      name: N3URALIA_NAME,
      alternateName: 'N3uralia',
      url: N3URALIA_URL,
      description:
        'Empresa chilena de IA aplicada, automatización y software para operaciones reales en Chile y Latinoamérica.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Santiago',
        addressCountry: 'CL',
      },
      areaServed: [
        { '@type': 'Country', name: 'Chile' },
        { '@type': 'Place', name: 'Latinoamérica' },
      ],
      knowsAbout: [
        'Inteligencia artificial aplicada',
        'Sistemas multiagente',
        'Automatización empresarial',
        'Software fullstack',
        'Inteligencia operacional',
        'Cumplimiento normativo',
      ],
    },
    {
      '@type': 'Brand',
      '@id': `${SITE_URL}/#brand`,
      name: SITE_NAME,
      alternateName: 'Kumplio by n3uralia',
      url: SITE_URL,
      slogan: 'Del conocimiento a la ejecución verificable',
      logo: `${SITE_URL}/logo-kumplio.svg`,
      parentOrganization: { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      alternateName: 'Kumplio powered by n3uralia',
      description,
      inLanguage: SITE_LOCALE,
      publisher: { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
      about: { '@id': `${SITE_URL}/#software` },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
      name: SITE_NAME,
      alternateName: 'Kumplio powered by n3uralia',
      url: SITE_URL,
      description: PUBLIC_DESCRIPTION,
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Compliance management and regulatory intelligence software',
      operatingSystem: 'Web',
      inLanguage: SITE_LOCALE,
      areaServed: { '@type': 'Country', name: 'Chile' },
      brand: { '@id': `${SITE_URL}/#brand` },
      creator: { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
      provider: { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
      featureList: CORE_CAPABILITIES,
      offers: {
        '@type': 'AggregateOffer',
        url: `${SITE_URL}/pricing`,
        priceCurrency: 'CLP',
        lowPrice: '79990',
        highPrice: '699990',
        offerCount: '3',
      },
    },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={SITE_LOCALE} className={`${montserrat.variable} bg-background`}>
      <head>
        <meta name="geo.placename" content="Santiago, Chile" />
        <meta name="geo.region" content="CL-RM" />
        <meta name="ICBM" content="-33.4489, -70.6693" />
        <link rel="author" href={N3URALIA_URL} />
        <link rel="publisher" href={N3URALIA_URL} />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="Kumplio LLM context" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="Kumplio full LLM context" />
        <link rel="alternate" type="application/json" href="/kumplio.json" title="Kumplio public facts" />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" title="Kumplio recursos Chile" />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
        />
        <link rel="sitemap" href="/sitemap.xml" />
      </head>
      <body className="font-sans antialiased text-foreground" suppressHydrationWarning>
        <ClientProviders>{children}</ClientProviders>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
