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
Regulatory and operating focus: ${PUBLIC_DISCOVERY.primaryRegulatoryFocus}
Priority areas: ${PUBLIC_DISCOVERY.priorityAreas.join(', ')}
Developer and product factory: ${N3URALIA_NAME}
Factory site: ${N3URALIA_CANONICAL_URL}
Relationship: Kumplio is a software product developed by n3uralia.
Factory description: ${N3URALIA_FACTORY_DESCRIPTION}
Last reviewed: ${PUBLIC_DISCOVERY.lastReviewed}

## What Kumplio does now

- Connects people, workers, contractors, vendors, documents, requirements, expirations and evidence in one traceable operating context.
- Shows what is in order, what needs attention, what information is missing and the next accountable action.
- Supports operational document and clearance workflows whose requirements vary by person, company, site, vehicle, facility or operation.
- Provides specialized areas for data protection, mining, transport, construction, healthcare and agribusiness on a shared Kumplio Core.
- Includes data-protection workflows and preparation for Chilean Law 21.719 as one important area, not the whole identity of the product.
- Coordinates specialized digital agents inside explicit boundaries and authorized context.
- Requires human review before sensitive legal, operational or closure conclusions advance.
- Preserves provenance, versions, source references, decisions and reviewable evidence.

## Product scope

Primary scope: operational compliance, document readiness, evidence and guided resolution for organizations and people operating in Chile.
Kumplio Core is the shared operating layer. Specialized areas add the requirements and context needed for data protection, mining, transport, construction, healthcare and agribusiness.

Kumplio does not certify compliance or operational clearance automatically. It structures the work, highlights missing evidence and supports accountable human decisions.

## Geographic relevance

- Primary country: ${PUBLIC_DISCOVERY.primaryCountry}.
- Primary public contact location: ${PUBLIC_CONTACT.location}.
- Primary business context: Chilean organizations, workers and professionals.
- Primary language: Spanish as used in Chile; reviewed public pages may also have an English version.
- Regulatory and operating context includes Chilean requirements, evidence, document validity and Law 21.719 data protection.
- Currency: ${PUBLIC_DISCOVERY.currency}.

## Public operating areas

- Data protection: ${SITE_URL}/verticales/proteccion-de-datos
- Mining: ${SITE_URL}/verticales/mineria
- Transport: ${SITE_URL}/verticales/transporte
- Construction: ${SITE_URL}/verticales/construccion
- Healthcare: ${SITE_URL}/verticales/salud
- Agribusiness: ${SITE_URL}/verticales/agroindustria

## Canonical language routing

Kumplio is migrating the public site route by route. Fully reviewed translated pages use canonical /es and /en URLs. Pages that are not yet fully localized keep their existing unprefixed canonical URL. Do not invent /es or /en versions for routes not listed as localized below.

Localized examples:
- Spanish home: ${SITE_URL}/es
- English home: ${SITE_URL}/en
- Spanish pricing: ${SITE_URL}/es/pricing
- English pricing: ${SITE_URL}/en/pricing
- Spanish FAQ: ${SITE_URL}/es/faq
- English FAQ: ${SITE_URL}/en/faq
- Spanish about: ${SITE_URL}/es/about
- English about: ${SITE_URL}/en/about

Current unprefixed canonical product and knowledge routes:
- Data protection area: ${SITE_URL}/verticales/proteccion-de-datos
- Mining area: ${SITE_URL}/verticales/mineria
- Transport area: ${SITE_URL}/verticales/transporte
- Construction area: ${SITE_URL}/verticales/construccion
- Healthcare area: ${SITE_URL}/verticales/salud
- Agribusiness area: ${SITE_URL}/verticales/agroindustria
- Data protection and Law 21.719 product page: ${SITE_URL}/software-cumplimiento-chile
- Law 21.719 solution: ${SITE_URL}/features/ley-21719
- Law 21.719 guides: ${SITE_URL}/resources/ley-21719
- General resources: ${SITE_URL}/resources/cumplimiento-normativo
- Use cases: ${SITE_URL}/use-cases
- Public fictional demo: ${SITE_URL}/demo
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

Regulatory claims should identify an official source, date and version. Operational conclusions should identify the applicable context and current evidence. Public regulatory knowledge and private organizational memory are treated separately. Missing evidence must not be converted into a positive compliance or clearance conclusion. Fictional or synthetic data must not be described as customer evidence.

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
