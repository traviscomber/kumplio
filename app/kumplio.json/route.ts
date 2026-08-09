import { chileComplianceGuides, officialLey21719Reference } from '@/lib/chile-compliance-content'
import {
  CORE_CAPABILITIES,
  CUSTOMER_OUTCOMES,
  N3URALIA_CANONICAL_URL,
  N3URALIA_FACTORY_DESCRIPTION,
  N3URALIA_NAME,
  PUBLIC_CONTACT,
  PUBLIC_DESCRIPTION,
  PUBLIC_LIMITATIONS,
  PUBLIC_POSITIONING,
  SPECIALIST_OUTCOMES,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from '@/lib/public-site'

export const dynamic = 'force-static'

export function GET() {
  const payload = {
    schema_version: '1.3',
    last_reviewed: '2026-08-09',
    product: {
      name: SITE_NAME,
      url: SITE_URL,
      locale: SITE_LOCALE,
      country: 'Chile',
      market: 'Chile',
      primary_category: 'Compliance operating system',
      positioning: PUBLIC_POSITIONING,
      description: PUBLIC_DESCRIPTION,
      value_model: 'outcome_oriented',
      customer_outcomes: CUSTOMER_OUTCOMES,
      specialist_system: SPECIALIST_OUTCOMES,
      priority_verticals: [
        'Protección de datos y privacidad',
        'Ley 21.719',
        'Preparación de auditoría',
        'Evaluación de proveedores y terceros',
        'Contratos y obligaciones',
        'Políticas e implementación',
        'Cambios regulatorios',
      ],
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
    law_21719: {
      role_in_product: 'priority_vertical_not_entire_product',
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
      outcomes: `${SITE_URL}/use-cases`,
      law_solution: `${SITE_URL}/features/ley-21719`,
      law_guides: `${SITE_URL}/resources/ley-21719`,
      resources: `${SITE_URL}/resources/cumplimiento-normativo`,
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
