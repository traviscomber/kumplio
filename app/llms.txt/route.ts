import {
  N3URALIA_CANONICAL_URL,
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
Product company: ${N3URALIA_NAME}
Company site: ${N3URALIA_CANONICAL_URL}
Relationship: Kumplio is a product developed by n3uralia.

## What Kumplio does

- Connects official regulatory sources with private organizational context.
- Structures obligations, controls, evidence, risks, findings and actions.
- Coordinates missions with responsible people, success criteria and human review.
- Preserves provenance, versions, decisions and reviewable results.
- Prioritizes preparation for Chilean Law 21.719 on personal data protection.

## Important public pages

- Product: ${SITE_URL}/software-cumplimiento-chile
- Law 21.719 solution: ${SITE_URL}/features/ley-21719
- Law 21.719 guides: ${SITE_URL}/resources/ley-21719
- Use cases: ${SITE_URL}/use-cases
- Public fictional demo: ${SITE_URL}/demo
- Pricing in CLP: ${SITE_URL}/pricing
- FAQ: ${SITE_URL}/faq
- Security: ${SITE_URL}/security
- Kumplio and n3uralia: ${SITE_URL}/powered-by-n3uralia
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
