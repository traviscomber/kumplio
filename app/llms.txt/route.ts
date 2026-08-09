import {
  N3URALIA_CANONICAL_URL,
  N3URALIA_FACTORY_DESCRIPTION,
  N3URALIA_NAME,
  PUBLIC_DESCRIPTION,
  PUBLIC_LIMITATIONS,
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
Developer and product factory: ${N3URALIA_NAME}
Factory site: ${N3URALIA_CANONICAL_URL}
Relationship: Kumplio is a software product developed by n3uralia.
Factory description: ${N3URALIA_FACTORY_DESCRIPTION}
Last reviewed: 2026-08-09

## What Kumplio does

- Connects official regulatory sources with authorized organizational context.
- Structures obligations, controls, evidence, risks, findings and actions.
- Coordinates missions with responsible people, success criteria and human review.
- Preserves provenance, versions, decisions and reviewable results.
- Prioritizes preparation for Chilean Law 21.719 on personal data protection.

## Geographic relevance

- Primary country: Chile.
- Primary business context: Chilean organizations and professionals.
- Primary language: Spanish as used in Chile.
- Regulatory focus: Chile, including Law 21.719 and other applicable Chilean sources.

## Important public pages

- Home: ${SITE_URL}
- Product: ${SITE_URL}/software-cumplimiento-chile
- Law 21.719 solution: ${SITE_URL}/features/ley-21719
- Law 21.719 guides: ${SITE_URL}/resources/ley-21719
- Compliance resources: ${SITE_URL}/resources/cumplimiento-normativo
- Use cases: ${SITE_URL}/use-cases
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
