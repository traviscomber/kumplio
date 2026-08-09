import { chileComplianceGuides, officialLey21719Reference } from '@/lib/chile-compliance-content'
import {
  CORE_CAPABILITIES,
  N3URALIA_CANONICAL_URL,
  N3URALIA_FACTORY_DESCRIPTION,
  N3URALIA_NAME,
  PUBLIC_CONTACT,
  PUBLIC_DESCRIPTION,
  PUBLIC_LIMITATIONS,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from '@/lib/public-site'

export const dynamic = 'force-static'

export function GET() {
  const payload = {
    schema_version: '1.1',
    last_reviewed: '2026-08-09',
    product: {
      name: SITE_NAME,
      url: SITE_URL,
      locale: SITE_LOCALE,
      country: 'Chile',
      market: 'Chile',
      category: 'Privacy, compliance management and regulatory intelligence software',
      description: PUBLIC_DESCRIPTION,
      developed_by: {
        name: N3URALIA_NAME,
        url: N3URALIA_CANONICAL_URL,
        role: 'developer_and_product_factory',
        description: N3URALIA_FACTORY_DESCRIPTION,
      },
      geographic_relevance: {
        country: 'Chile',
        public_contact_location: PUBLIC_CONTACT.location,
        language: SITE_LOCALE,
        currency: 'CLP',
      },
      capabilities: CORE_CAPABILITIES,
      limitations: PUBLIC_LIMITATIONS,
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
    public_pages: {
      home: SITE_URL,
      product: `${SITE_URL}/software-cumplimiento-chile`,
      law_solution: `${SITE_URL}/features/ley-21719`,
      law_guides: `${SITE_URL}/resources/ley-21719`,
      compliance_resources: `${SITE_URL}/resources/cumplimiento-normativo`,
      use_cases: `${SITE_URL}/use-cases`,
      demo: `${SITE_URL}/demo`,
      pricing: `${SITE_URL}/pricing`,
      enterprise: `${SITE_URL}/enterprise`,
      faq: `${SITE_URL}/faq`,
      about: `${SITE_URL}/about`,
      security: `${SITE_URL}/security`,
      relationship: `${SITE_URL}/powered-by-n3uralia`,
      developer: N3URALIA_CANONICAL_URL,
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
