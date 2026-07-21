import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClientProviders } from '@/app/providers'
import { VeraFloatingChat } from '@/components/vera-floating-chat'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const title = 'KUMPLIO | Plataforma de cumplimiento continuo y evidencia auditable'
const description =
  'KUMPLIO convierte regulaciones, contratos y políticas en obligaciones, controles, evidencia, hallazgos y planes de acción. Incluye preparación para la Ley 21.719 y otros marcos regulatorios en Chile.'

export const metadata: Metadata = {
  metadataBase: new URL('https://kumplio.app'),
  title: { default: title, template: '%s | KUMPLIO' },
  description,
  keywords: [
    'plataforma de cumplimiento continuo',
    'gestión de obligaciones legales',
    'controles de cumplimiento',
    'evidencia auditable',
    'gestión de hallazgos',
    'planes de acción compliance',
    'auditoría de cumplimiento',
    'compliance Chile',
    'Ley 21.719',
    'protección de datos Chile',
    'cumplimiento transporte',
    'cumplimiento contractual',
    'KUMPLIO',
    'n3uralia',
  ],
  generator: 'kumplio.app',
  applicationName: 'KUMPLIO',
  referrer: 'strict-origin-when-cross-origin',
  authors: [{ name: 'KUMPLIO by n3uralia', url: 'https://www.n3uralia.com' }],
  creator: 'KUMPLIO by n3uralia',
  publisher: 'KUMPLIO by n3uralia',
  robots: { index: true, follow: true, maxSnippet: -1, maxImagePreview: 'large', maxVideoPreview: -1 },
  alternates: { canonical: '/', languages: { 'es-CL': '/' } },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: '/',
    siteName: 'KUMPLIO',
    title,
    description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'KUMPLIO — Cumplimiento continuo y evidencia auditable' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/twitter-image.png'] },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
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

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'KUMPLIO by n3uralia',
  url: 'https://kumplio.app',
  logo: 'https://kumplio.app/logo.png',
  description,
  parentOrganization: { '@type': 'Organization', name: 'n3uralia', url: 'https://www.n3uralia.com' },
  areaServed: { '@type': 'Country', name: 'Chile' },
}

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'KUMPLIO',
  description,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://kumplio.app',
  areaServed: 'CL',
  inLanguage: 'es-CL',
  featureList: [
    'Mapa de obligaciones',
    'Controles de cumplimiento',
    'Biblioteca de evidencias',
    'Gestión de hallazgos y riesgos',
    'Planes de acción y trazabilidad',
    'Preparación para la Ley 21.719',
    'Integración con sistemas operacionales',
    'Revisión humana de resultados asistidos por IA',
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <head>
        <meta name="geo.placename" content="Chile" />
        <meta name="geo.region" content="CL" />
        <meta name="coverage" content="Chile" />
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        <link rel="sitemap" href="/sitemap.xml" />
      </head>
      <body className="font-sans antialiased text-foreground" suppressHydrationWarning>
        <ClientProviders>{children}<VeraFloatingChat /></ClientProviders>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
