import {
  N3URALIA_CANONICAL_URL,
  N3URALIA_FACTORY_DESCRIPTION,
  N3URALIA_NAME,
  PUBLIC_AGENTIC_ASSURANCE,
  PUBLIC_CONTACT,
  PUBLIC_DESCRIPTION,
  PUBLIC_DISCOVERY,
  PUBLIC_LIMITATIONS,
  PUBLIC_POSITIONING,
  SITE_URL,
} from '@/lib/public-site'

export const dynamic = 'force-static'

export function GET() {
  const content = `# Kumplio

> ${PUBLIC_DESCRIPTION}

Canonical site: ${SITE_URL}
Primary market: ${PUBLIC_DISCOVERY.primaryCountry}
Primary language: ${PUBLIC_DISCOVERY.primaryLanguage}
Alternate public language: ${PUBLIC_DISCOVERY.alternateLanguage}
Currency: ${PUBLIC_DISCOVERY.currency}
Product: Kumplio
Primary category: ${PUBLIC_DISCOVERY.primaryCategory}
Secondary category: ${PUBLIC_DISCOVERY.secondaryCategory}
Primary positioning: ${PUBLIC_POSITIONING}
Primary regulatory focus: ${PUBLIC_DISCOVERY.primaryRegulatoryFocus}
Developer and product factory: ${N3URALIA_NAME}
Factory site: ${N3URALIA_CANONICAL_URL}
Relationship: Kumplio is a software product developed by n3uralia.
Factory description: ${N3URALIA_FACTORY_DESCRIPTION}
Last reviewed: ${PUBLIC_DISCOVERY.lastReviewed}

## What Kumplio does now

- Helps organizations operating in Chile protect personal data and prepare for Law 21.719.
- Centralizes processing activities, providers, controls, evidence, decisions and unresolved questions.
- Converts privacy gaps into actions, suggested owners, dependencies, evidence requirements and reviewable closure criteria.
- Coordinates specialized digital agents inside explicit boundaries and authorized context.
- Requires human review before sensitive conclusions advance.
- Preserves provenance, versions, source references, decisions and reviewable artifacts.

## Product scope

Primary scope: data protection, privacy and Law 21.719 in Chile.
Secondary category: compliance management. Broader regulatory use cases are possible, but they are not the primary public positioning of Kumplio today.

## Geographic relevance

- Primary country: ${PUBLIC_DISCOVERY.primaryCountry}.
- Primary public contact location: ${PUBLIC_CONTACT.location}.
- Primary business context: Chilean organizations and professionals.
- Primary language: Spanish as used in Chile; reviewed public pages may also have an English version.
- Primary regulatory focus: personal data protection and Law 21.719.
- Currency: ${PUBLIC_DISCOVERY.currency}.

## Canonical language routing

Kumplio is migrating the public site route by route. Fully reviewed translated pages use canonical /es and /en URLs. Pages that are not yet fully localized keep their existing unprefixed canonical URL. Do not invent /es or /en versions for routes not listed as localized below.

Localized examples:
- Spanish home: ${SITE_URL}/es
- English home: ${SITE_URL}/en
- Spanish demo: ${SITE_URL}/es/demo
- English demo: ${SITE_URL}/en/demo
- Spanish pricing: ${SITE_URL}/es/pricing
- English pricing: ${SITE_URL}/en/pricing
- Spanish FAQ: ${SITE_URL}/es/faq
- English FAQ: ${SITE_URL}/en/faq
- Spanish about: ${SITE_URL}/es/about
- English about: ${SITE_URL}/en/about

Current unprefixed canonical product and knowledge routes:
- Data protection software: ${SITE_URL}/software-cumplimiento-chile
- Law 21.719 solution: ${SITE_URL}/features/ley-21719
- Law 21.719 guides: ${SITE_URL}/resources/ley-21719
- General resources: ${SITE_URL}/resources/cumplimiento-normativo
- Use cases: ${SITE_URL}/use-cases
- Enterprise Studio: ${SITE_URL}/enterprise

## Machine-readable discovery

- Short LLM context: ${SITE_URL}/llms.txt
- Full LLM context: ${SITE_URL}/llms-full.txt
- Public facts JSON: ${SITE_URL}/kumplio.json
- RSS resources feed: ${SITE_URL}/feed.xml
- XML sitemap: ${SITE_URL}/sitemap.xml
- Robots policy: ${SITE_URL}/robots.txt

## Controlled technical assurance

A controlled synthetic production E2E observed on ${PUBLIC_AGENTIC_ASSURANCE.observedAt} completed ${PUBLIC_AGENTIC_ASSURANCE.approvedStages}/${PUBLIC_AGENTIC_ASSURANCE.stages} agent stages, ${PUBLIC_AGENTIC_ASSURANCE.jobsSucceeded}/${PUBLIC_AGENTIC_ASSURANCE.stages} durable jobs, ${PUBLIC_AGENTIC_ASSURANCE.artifactsApproved}/${PUBLIC_AGENTIC_ASSURANCE.stages} approved artifacts and ${PUBLIC_AGENTIC_ASSURANCE.reviewsApproved}/${PUBLIC_AGENTIC_ASSURANCE.stages} human reviews, with ${PUBLIC_AGENTIC_ASSURANCE.failedJobs} failed jobs and ${PUBLIC_AGENTIC_ASSURANCE.failedToolCalls} failed tool calls.

This is technical assurance of the controlled flow, not customer evidence or a compliance certification.

## Source and claim policy

Regulatory claims should identify an official source, date and version. Public regulatory knowledge and private organizational memory are treated separately. Missing evidence must not be converted into a positive compliance conclusion. Fictional or synthetic data must not be described as customer evidence.

## Limitations

${PUBLIC_LIMITATIONS.map((item) => `- ${item}`).join('\n')}

## Contact

Email: ${PUBLIC_CONTACT.email}
Phone: ${PUBLIC_CONTACT.phone}
Location: ${PUBLIC_CONTACT.location}
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
