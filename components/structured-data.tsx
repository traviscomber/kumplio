import Script from 'next/script'

export function StructuredData() {
  return (
    <>
      {/* Organization Schema */}
      <Script
        id="schema-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'KUMPLIO',
            alternateName: 'KUMPLIO by n3uralia',
            description:
              'Plataforma de IA para análisis de cumplimiento normativo conforme a Ley 21.719 en Chile',
            url: 'https://kumplio.cl',
            logo: 'https://kumplio.cl/logo.png',
            sameAs: [
              'https://www.linkedin.com/company/kumplio',
              'https://twitter.com/kumplio',
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+56-9-9382-6127',
              contactType: 'Customer Service',
              email: 'support@kumplio.cl',
              availableLanguage: ['es', 'en'],
            },
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Santiago',
              addressCountry: 'CL',
            },
            areaServed: 'CL',
            knowsAbout: [
              'Ley 21.719',
              'Compliance',
              'Protección de Datos',
              'Inteligencia Artificial',
            ],
            foundingDate: '2024',
          }),
        }}
      />

      {/* Local Business Schema */}
      <Script
        id="schema-localbusiness"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'KUMPLIO - Compliance IA',
            description:
              'Plataforma de IA para análisis de cumplimiento normativo en Chile',
            url: 'https://kumplio.cl',
            telephone: '+56-9-93826127',
            email: 'support@kumplio.cl',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Santiago',
              addressLocality: 'Santiago',
              addressRegion: 'RM',
              addressCountry: 'CL',
            },
            areaServed: [
              {
                '@type': 'City',
                name: 'Santiago',
              },
              {
                '@type': 'City',
                name: 'Valparaíso',
              },
              {
                '@type': 'City',
                name: 'Concepción',
              },
            ],
            priceRange: '$',
            image: 'https://kumplio.cl/og-image.png',
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: '500',
            },
          }),
        }}
      />

      {/* Service Schema */}
      <Script
        id="schema-service"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Análisis de Cumplimiento Ley 21.719',
            description:
              'Análisis automático de documentos y cumplimiento normativo conforme a Ley 21.719 usando IA',
            provider: {
              '@type': 'Organization',
              name: 'KUMPLIO',
              url: 'https://kumplio.cl',
            },
            areaServed: 'CL',
            availableLanguage: ['es', 'en'],
            serviceType: 'Legal Compliance Analysis',
            offers: {
              '@type': 'Offer',
              price: '4390',
              priceCurrency: 'CLP',
              description: 'Plan Pro mensual',
              availability: 'https://schema.org/InStock',
              url: 'https://kumplio.cl/pricing',
            },
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'KUMPLIO Planes',
              itemListElement: [
                {
                  '@type': 'Offer',
                  name: 'Gratuito',
                  price: '0',
                  priceCurrency: 'CLP',
                },
                {
                  '@type': 'Offer',
                  name: 'Pro',
                  price: '4390',
                  priceCurrency: 'CLP',
                },
              ],
            },
          }),
        }}
      />

      {/* Breadcrumb Schema */}
      <Script
        id="schema-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://kumplio.cl/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Pricing',
                item: 'https://kumplio.cl/pricing',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Blog',
                item: 'https://kumplio.cl/blog',
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: 'About',
                item: 'https://kumplio.cl/about',
              },
            ],
          }),
        }}
      />

      {/* FAQ Schema */}
      <Script
        id="schema-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '¿Qué es la Ley 21.719?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'La Ley 21.719 sobre Consentimiento Informado regula cómo las empresas deben obtener consentimiento explícito de personas antes de procesar datos personales en Chile.',
                },
              },
              {
                '@type': 'Question',
                name: '¿A quién aplica la Ley 21.719?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Aplica a todas las empresas, organismos públicos y organizaciones que procesen datos personales de personas en Chile.',
                },
              },
              {
                '@type': 'Question',
                name: '¿Cuáles son las multas por incumplimiento?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Las multas pueden ser de hasta 10,000 UF (aproximadamente $370 millones CLP) por infracciones muy graves.',
                },
              },
            ],
          }),
        }}
      />
    </>
  )
}
