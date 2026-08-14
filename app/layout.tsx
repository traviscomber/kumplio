import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { ClientProviders } from '@/app/providers'
import { PUBLIC_SITE_METADATA } from '@/lib/i18n/public-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, isEnglishPublicPathReady, withPublicLocale } from '@/lib/i18n/public-routing'
import {
  N3URALIA_CANONICAL_URL,
  N3URALIA_NAME,
  N3URALIA_URL,
  SITE_NAME,
  SITE_URL,
} from '@/lib/public-site'

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export async function generateMetadata(): Promise<Metadata> {
  const { locale, pathname } = await getPublicRequestContext()
  const copy = PUBLIC_SITE_METADATA[locale]
  const canonical = pathname ? withPublicLocale(pathname, locale) : '/'
  const englishReady = pathname ? isEnglishPublicPathReady(pathname) : false
  const shouldIndex = locale !== 'en' || !pathname || englishReady

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: copy.title, template: `%s | ${SITE_NAME}` },
    description: copy.description,
    keywords: copy.keywords,
    applicationName: SITE_NAME,
    authors: [{ name: N3URALIA_NAME, url: N3URALIA_CANONICAL_URL }],
    creator: N3URALIA_NAME,
    publisher: N3URALIA_NAME,
    category: 'business software',
    classification: copy.classification,
    referrer: 'origin-when-cross-origin',
    robots: {
      index: shouldIndex,
      follow: true,
      nocache: false,
      googleBot: {
        index: shouldIndex,
        follow: true,
        noimageindex: false,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical,
      languages: pathname
        ? {
            'es-CL': withPublicLocale(pathname, 'es'),
            ...(englishReady ? { en: withPublicLocale(pathname, 'en') } : {}),
            'x-default': withPublicLocale(pathname, 'es'),
          }
        : { 'es-CL': '/', 'x-default': '/' },
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
      locale: copy.openGraphLocale,
      url: canonical,
      siteName: SITE_NAME,
      title: copy.title,
      description: copy.description,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt:
            locale === 'es'
              ? 'Kumplio, protección de datos y guía experta con evidencia y revisión humana'
              : 'Kumplio, data protection and guided compliance with evidence and human review',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
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
      category: copy.category,
      country: 'Chile',
      language: copy.htmlLang,
      'content-authority': 'Kumplio editorial team, powered by n3uralia',
    },
  }
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

function buildGraph(locale: 'es' | 'en') {
  const copy = PUBLIC_SITE_METADATA[locale]
  const localizedHome = `${SITE_URL}${withPublicLocale('/', locale)}`
  const pricingUrl = `${SITE_URL}${getPublicSiteHref('/pricing', locale)}`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${N3URALIA_CANONICAL_URL}/#organization`,
        name: N3URALIA_NAME,
        alternateName: 'N3uralia',
        url: N3URALIA_URL,
        description:
          locale === 'es'
            ? 'Empresa chilena de IA aplicada, automatización y software para operaciones reales en Chile y Latinoamérica.'
            : 'Chilean applied-AI, automation and software company building products for real operations in Chile and Latin America.',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Santiago',
          addressCountry: 'CL',
        },
        areaServed: [
          { '@type': 'Country', name: 'Chile' },
          { '@type': 'Place', name: locale === 'es' ? 'Latinoamérica' : 'Latin America' },
        ],
        knowsAbout:
          locale === 'es'
            ? [
                'Inteligencia artificial aplicada',
                'Sistemas multiagente',
                'Automatización empresarial',
                'Software fullstack',
                'Protección de datos personales',
                'Privacidad y Ley 21.719',
                'Resolución guiada de obligaciones',
                'Cumplimiento normativo',
              ]
            : [
                'Applied artificial intelligence',
                'Multi-agent systems',
                'Business automation',
                'Full-stack software',
                'Personal data protection',
                'Privacy and Chilean Law 21.719',
                'Guided compliance resolution',
                'Compliance management',
              ],
      },
      {
        '@type': 'Brand',
        '@id': `${SITE_URL}/#brand`,
        name: SITE_NAME,
        alternateName: 'Kumplio by n3uralia',
        url: localizedHome,
        slogan: copy.brandSlogan,
        logo: `${SITE_URL}/logo-kumplio.svg`,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website-${locale}`,
        url: localizedHome,
        name: SITE_NAME,
        alternateName: 'Kumplio powered by n3uralia',
        description: copy.description,
        inLanguage: copy.htmlLang,
        publisher: { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
        about: { '@id': `${SITE_URL}/#software` },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${SITE_URL}/#software`,
        name: SITE_NAME,
        alternateName: 'Kumplio powered by n3uralia',
        url: localizedHome,
        description: copy.description,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Data protection, privacy and guided compliance resolution',
        operatingSystem: 'Web',
        inLanguage: copy.htmlLang,
        areaServed: { '@type': 'Country', name: 'Chile' },
        audience:
          locale === 'es'
            ? [
                { '@type': 'BusinessAudience', audienceType: 'Empresas y organizaciones' },
                { '@type': 'ProfessionalAudience', audienceType: 'Profesionales de privacidad, compliance y legal' },
              ]
            : [
                { '@type': 'BusinessAudience', audienceType: 'Companies and organizations operating in Chile' },
                { '@type': 'ProfessionalAudience', audienceType: 'Privacy, compliance and legal professionals' },
              ],
        brand: { '@id': `${SITE_URL}/#brand` },
        creator: { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
        provider: { '@id': `${N3URALIA_CANONICAL_URL}/#organization` },
        featureList: copy.capabilities,
        offers: [
          {
            '@type': 'Offer',
            name: locale === 'es' ? 'Plan Esencial' : 'Essential plan',
            url: pricingUrl,
            price: '79990',
            priceCurrency: 'CLP',
            availability: 'https://schema.org/InStock',
          },
          {
            '@type': 'Offer',
            name: locale === 'es' ? 'Plan Profesional' : 'Professional plan',
            url: pricingUrl,
            price: '249990',
            priceCurrency: 'CLP',
            availability: 'https://schema.org/InStock',
          },
          {
            '@type': 'Offer',
            name: locale === 'es' ? 'Plan Acompañado' : 'Guided plan',
            url: pricingUrl,
            price: '699990',
            priceCurrency: 'CLP',
            availability: 'https://schema.org/InStock',
          },
        ],
      },
    ],
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale } = await getPublicRequestContext()
  const copy = PUBLIC_SITE_METADATA[locale]
  const graph = buildGraph(locale)

  return (
    <html lang={copy.htmlLang} className={`${montserrat.variable} bg-background`}>
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
