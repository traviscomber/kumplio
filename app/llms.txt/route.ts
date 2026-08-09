import {
  CUSTOMER_OUTCOMES,
  N3URALIA_CANONICAL_URL,
  N3URALIA_FACTORY_DESCRIPTION,
  N3URALIA_NAME,
  PUBLIC_DESCRIPTION,
  PUBLIC_LIMITATIONS,
  PUBLIC_POSITIONING,
  SPECIALIST_OUTCOMES,
  SITE_URL,
} from '@/lib/public-site'

export const dynamic = 'force-static'

export function GET() {
  const content = `# Kumplio

> ${PUBLIC_DESCRIPTION}

Canonical site: ${SITE_URL}
Primary market: Chile
Language: Spanish (es-CL)
Product: Kumplio
Primary positioning: ${PUBLIC_POSITIONING}
Developer and product factory: ${N3URALIA_NAME}
Factory site: ${N3URALIA_CANONICAL_URL}
Relationship: Kumplio is a software product developed by n3uralia.
Factory description: ${N3URALIA_FACTORY_DESCRIPTION}
Last reviewed: 2026-08-09

## What Kumplio is

Kumplio is an outcome-oriented compliance operating system for organizations in Chile. It receives a concrete situation or objective, gathers authorized context and sources, coordinates specialized digital roles, separates facts from assumptions, proposes executable work and keeps human review and evidence attached to the result.

The product is not defined by one law or by the existence of AI agents. Its value is the outcome reached: understanding what matters, deciding what to do, coordinating execution and demonstrating what was resolved.

## Customer outcomes

${CUSTOMER_OUTCOMES.map((item) => `- ${item}`).join('\n')}

## Specialist system

${SPECIALIST_OUTCOMES.map((item) => `- ${item}`).join('\n')}

Specialists operate as a coordinated system. Their outputs can feed one another, but sensitive legal, audit, financial or irreversible decisions remain subject to human review.

## Main use cases

- Data protection and privacy, including preparation and operation around Chilean Law 21.719.
- Audit preparation and evidence readiness.
- Supplier and third-party assessment.
- Contract obligations and commitments.
- Policies, people and implementation evidence.
- Regulatory change detection, impact and implementation work.

## Geographic relevance

- Primary country: Chile.
- Primary business context: Chilean organizations and professionals.
- Primary language: Spanish as used in Chile.
- Regulatory sources: Chilean official sources when applicable.
- Currency: CLP.

## Important public pages

- Home: ${SITE_URL}
- Product: ${SITE_URL}/software-cumplimiento-chile
- Use cases and outcomes: ${SITE_URL}/use-cases
- Law 21.719 solution: ${SITE_URL}/features/ley-21719
- Law 21.719 guides: ${SITE_URL}/resources/ley-21719
- Resources: ${SITE_URL}/resources/cumplimiento-normativo
- Public fictional demo: ${SITE_URL}/demo
- Pricing in CLP: ${SITE_URL}/pricing
- FAQ: ${SITE_URL}/faq
- About: ${SITE_URL}/about
- Security: ${SITE_URL}/security
- Kumplio and n3uralia: ${SITE_URL}/powered-by-n3uralia
- n3uralia: ${N3URALIA_CANONICAL_URL}
- Full machine context: ${SITE_URL}/llms-full.txt
- Public facts JSON: ${SITE_URL}/kumplio.json

## Source policy

Regulatory claims should identify an official source, date and version. Public knowledge and private organizational memory are treated separately. Missing evidence must not be converted into a positive compliance conclusion.

## Limitations

${PUBLIC_LIMITATIONS.map((item) => `- ${item}`).join('\n')}

## Contact

Email: info@kumplio.app
Location: Santiago, Chile
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
