import { chileComplianceGuides, officialLey21719Reference } from '@/lib/chile-compliance-content'
import {
  CORE_CAPABILITIES,
  N3URALIA_CANONICAL_URL,
  N3URALIA_FACTORY_DESCRIPTION,
  N3URALIA_NAME,
  PUBLIC_AGENTIC_ASSURANCE,
  PUBLIC_CONTACT,
  PUBLIC_DESCRIPTION,
  PUBLIC_DISCOVERY,
  PUBLIC_LIMITATIONS,
  PUBLIC_POSITIONING,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from '@/lib/public-site'

export const dynamic = 'force-static'

export function GET() {
  const payload = {
    schema_version: '1.3',
    last_reviewed: PUBLIC_DISCOVERY.lastReviewed,
    product: {
      name: SITE_NAME,
      url: SITE_URL,
      locale: SITE_LOCALE,
      languages: [PUBLIC_DISCOVERY.primaryLanguage, PUBLIC_DISCOVERY.alternateLanguage],
      country: PUBLIC_DISCOVERY.primaryCountry,
      market: PUBLIC_DISCOVERY.primaryCountry,
      primary_category: PUBLIC_DISCOVERY.primaryCategory,
      secondary_category: PUBLIC_DISCOVERY.secondaryCategory,
      primary_positioning: PUBLIC_POSITIONING,
      primary_regulatory_focus: PUBLIC_DISCOVERY.primaryRegulatoryFocus,
      description: PUBLIC_DESCRIPTION,
      developed_by: {
        name: N3URALIA_NAME,
        url: N3URALIA_CANONICAL_URL,
        role: 'developer_and_product_factory',
        description: N3URALIA_FACTORY_DESCRIPTION,
      },
      geographic_relevance: {
        country: PUBLIC_DISCOVERY.primaryCountry,
        public_contact_location: PUBLIC_CONTACT.location,
        primary_language: PUBLIC_DISCOVERY.primaryLanguage,
        alternate_public_language: PUBLIC_DISCOVERY.alternateLanguage,
        currency: PUBLIC_DISCOVERY.currency,
      },
      capabilities: CORE_CAPABILITIES,
      limitations: PUBLIC_LIMITATIONS,
    },
    canonical_routing: {
      strategy: 'progressive_locale_migration',
      default_language: 'es-CL',
      localized_prefixes: ['/es', '/en'],
      rule:
        'Only fully reviewed translated routes use /es and /en canonicals. Routes not yet localized keep their existing unprefixed canonical URL.',
      localized_pages: {
        home: { es: `${SITE_URL}/es`, en: `${SITE_URL}/en` },
        pricing: { es: `${SITE_URL}/es/pricing`, en: `${SITE_URL}/en/pricing` },
        faq: { es: `${SITE_URL}/es/faq`, en: `${SITE_URL}/en/faq` },
        contact: { es: `${SITE_URL}/es/contact`, en: `${SITE_URL}/en/contact` },
        about: { es: `${SITE_URL}/es/about`, en: `${SITE_URL}/en/about` },
        thinking: { es: `${SITE_URL}/es/como-pensamos`, en: `${SITE_URL}/en/como-pensamos` },
        relationship: {
          es: `${SITE_URL}/es/powered-by-n3uralia`,
          en: `${SITE_URL}/en/powered-by-n3uralia`,
        },
        security: { es: `${SITE_URL}/es/security`, en: `${SITE_URL}/en/security` },
        privacy: { es: `${SITE_URL}/es/privacy`, en: `${SITE_URL}/en/privacy` },
        terms: { es: `${SITE_URL}/es/terms`, en: `${SITE_URL}/en/terms` },
      },
    },
    pricing_clp: [
      { plan: 'Esencial', monthly_price: 79990, vat_included: false, users_up_to: 5 },
      { plan: 'Profesional', monthly_price: 249990, vat_included: false, users_up_to: 20 },
      { plan: 'Acompañado', monthly_price_from: 699990, vat_included: false },
      { plan: 'Enterprise Studio', project_price_from: 5000000, vat_included: false },
    ],
    billing: {
      account_creation_starts_billing: false,
      workspace_creation_starts_billing: false,
      note: 'Contracting and invoicing are confirmed separately.',
    },
    law_21719: {
      official_source: officialLey21719Reference,
      general_effective_date: '2026-12-01',
      guides: chileComplianceGuides.map((guide) => ({
        slug: guide.slug,
        title: guide.title,
        url: `${SITE_URL}/resources/ley-21719/${guide.slug}`,
        legal_basis: guide.legalBasis,
        direct_answer: guide.directAnswer,
      })),
    },
    agentic_assurance: {
      ...PUBLIC_AGENTIC_ASSURANCE,
      customer_evidence: false,
      compliance_certification: false,
    },
    public_pages: {
      home_es: `${SITE_URL}/es`,
      home_en: `${SITE_URL}/en`,
      product: `${SITE_URL}/software-cumplimiento-chile`,
      law_solution: `${SITE_URL}/features/ley-21719`,
      law_guides: `${SITE_URL}/resources/ley-21719`,
      compliance_resources: `${SITE_URL}/resources/cumplimiento-normativo`,
      use_cases: `${SITE_URL}/use-cases`,
      demo: `${SITE_URL}/demo`,
      pricing_es: `${SITE_URL}/es/pricing`,
      pricing_en: `${SITE_URL}/en/pricing`,
      enterprise: `${SITE_URL}/enterprise`,
      faq_es: `${SITE_URL}/es/faq`,
      faq_en: `${SITE_URL}/en/faq`,
      about_es: `${SITE_URL}/es/about`,
      about_en: `${SITE_URL}/en/about`,
      security_es: `${SITE_URL}/es/security`,
      security_en: `${SITE_URL}/en/security`,
      relationship_es: `${SITE_URL}/es/powered-by-n3uralia`,
      relationship_en: `${SITE_URL}/en/powered-by-n3uralia`,
      developer: N3URALIA_CANONICAL_URL,
    },
    discovery: {
      llms: `${SITE_URL}/llms.txt`,
      llms_full: `${SITE_URL}/llms-full.txt`,
      public_facts: `${SITE_URL}/kumplio.json`,
      rss: `${SITE_URL}/feed.xml`,
      sitemap: `${SITE_URL}/sitemap.xml`,
      robots: `${SITE_URL}/robots.txt`,
      crawler_policy:
        'Public discovery is allowed while authenticated/private workspace routes are disallowed and marked noindex.',
    },
    contact: PUBLIC_CONTACT,
  }

  return Response.json(payload, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
