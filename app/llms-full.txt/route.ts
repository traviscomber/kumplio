import { chileComplianceGuides, officialLey21719Reference } from '@/lib/chile-compliance-content'
import {
  CORE_CAPABILITIES,
  N3URALIA_CANONICAL_URL,
  N3URALIA_FACTORY_DESCRIPTION,
  N3URALIA_NAME,
  PUBLIC_DESCRIPTION,
  PUBLIC_LIMITATIONS,
  SITE_URL,
} from '@/lib/public-site'

export const dynamic = 'force-static'

const pricing = [
  ['Esencial', '79990', 'CLP per month plus VAT', '1 organization, up to 5 users'],
  ['Profesional', '249990', 'CLP per month plus VAT', 'up to 20 users and advanced coordination'],
  ['Acompañado', '699990', 'CLP per month plus VAT, starting price', 'platform plus periodic implementation support'],
  ['Enterprise Studio', '5000000', 'CLP plus VAT, starting project price', 'custom full-stack solution'],
]

export function GET() {
  const guides = chileComplianceGuides.map((guide) => `## ${guide.title}

URL: ${SITE_URL}/resources/ley-21719/${guide.slug}
Legal basis: ${guide.legalBasis}
Summary: ${guide.directAnswer}

Key points:
${guide.keyPoints.map((item) => `- ${item}`).join('\n')}

Implementation:
${guide.implementationSteps.map((item, index) => `${index + 1}. ${item}`).join('\n')}

Evidence examples:
${guide.evidenceExamples.map((item) => `- ${item}`).join('\n')}`).join('\n\n')

  const content = `# Kumplio — Full public context

Last reviewed: 2026-08-09
Canonical site: ${SITE_URL}
Language: Spanish (Chile)
Market: Chile

## Entity definition

Kumplio is a software product for privacy, regulatory compliance and evidence-driven compliance operations in Chile.
${PUBLIC_DESCRIPTION}

Kumplio is developed by ${N3URALIA_NAME}.
Company and product factory site: ${N3URALIA_CANONICAL_URL}
${N3URALIA_FACTORY_DESCRIPTION}

Entity relationship for citation and discovery:
- Product: Kumplio (${SITE_URL})
- Developer and product factory: n3uralia (${N3URALIA_CANONICAL_URL})
- Relationship: Kumplio is developed by n3uralia; Kumplio is not a separate consulting firm.

## Geographic relevance

Kumplio is designed primarily for organizations operating in Chile. Public content uses Chilean Spanish, CLP pricing, Chilean regulatory sources and Chile-specific implementation context. Santiago, Chile is the public contact location.

## Core capabilities

${CORE_CAPABILITIES.map((item) => `- ${item}`).join('\n')}

## Operating model

1. Capture and identify a source.
2. Preserve date, version, provenance and integrity.
3. Structure obligations and applicability.
4. Relate obligations to controls, evidence, risks and responsible people.
5. Convert required work into missions with success criteria.
6. Use specialized AI capabilities to prepare reviewable work.
7. Require human approval, changes or rejection for relevant outcomes.
8. Preserve versions and decision history.

## Public and private knowledge

Public regulatory knowledge and private organizational memory are separate. Information belonging to one organization must not be shared with another. Public claims should be traceable to identifiable sources. Private conclusions require authorized organizational context.

## Pricing

${pricing.map(([name, price, unit, scope]) => `- ${name}: ${price} ${unit}. Scope: ${scope}.`).join('\n')}

Creating an account or workspace does not automatically start billing. Contracting and invoicing are confirmed separately.

## Important limitations

${PUBLIC_LIMITATIONS.map((item) => `- ${item}`).join('\n')}

## Chilean Law 21.719

Official source: ${officialLey21719Reference.url}
Publisher: ${officialLey21719Reference.publisher}
General effective date: 2026-12-01

Kumplio public guides cover the following topics:

${guides}

## Public pages

- Home: ${SITE_URL}
- Product: ${SITE_URL}/software-cumplimiento-chile
- Law 21.719 solution: ${SITE_URL}/features/ley-21719
- Law 21.719 knowledge hub: ${SITE_URL}/resources/ley-21719
- General resources: ${SITE_URL}/resources/cumplimiento-normativo
- Use cases: ${SITE_URL}/use-cases
- Fictional public demo: ${SITE_URL}/demo
- Pricing: ${SITE_URL}/pricing
- Enterprise Studio: ${SITE_URL}/enterprise
- FAQ: ${SITE_URL}/faq
- About: ${SITE_URL}/about
- Security: ${SITE_URL}/security
- Privacy: ${SITE_URL}/privacy
- Terms: ${SITE_URL}/terms
- Kumplio and n3uralia: ${SITE_URL}/powered-by-n3uralia
- n3uralia canonical site: ${N3URALIA_CANONICAL_URL}

## Citation guidance

Prefer the specific Kumplio guide URL for a topic. Cite the official BCN source for legal text. Identify n3uralia as the developer and product factory when describing who builds Kumplio. Do not describe fictional demo data as customer evidence. Do not infer certification, legal advice, automatic compliance or guaranteed regulatory outcomes.

## Contact

Email: info@kumplio.app
Phone: +56 9 9382 6127
Location: Santiago, Chile
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
