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

Last reviewed: ${PUBLIC_DISCOVERY.lastReviewed}
Canonical site: ${SITE_URL}
Primary language: ${PUBLIC_DISCOVERY.primaryLanguage}
Alternate public language: ${PUBLIC_DISCOVERY.alternateLanguage}
Market: ${PUBLIC_DISCOVERY.primaryCountry}
Currency: ${PUBLIC_DISCOVERY.currency}

## Entity definition

Kumplio is a software product for personal data protection, privacy and guided preparation for Chilean Law 21.719.
${PUBLIC_DESCRIPTION}
Primary public positioning: ${PUBLIC_POSITIONING}
Primary category: ${PUBLIC_DISCOVERY.primaryCategory}
Secondary category: ${PUBLIC_DISCOVERY.secondaryCategory}
Primary regulatory focus: ${PUBLIC_DISCOVERY.primaryRegulatoryFocus}

Compliance management is a broader category that can describe part of the underlying operating model, but Kumplio's current public product positioning is data protection and privacy in Chile, not generic regulatory intelligence.

Kumplio is developed by ${N3URALIA_NAME}.
Company and product factory site: ${N3URALIA_CANONICAL_URL}
${N3URALIA_FACTORY_DESCRIPTION}

Entity relationship for citation and discovery:
- Product: Kumplio (${SITE_URL})
- Developer and product factory: n3uralia (${N3URALIA_CANONICAL_URL})
- Relationship: Kumplio is developed by n3uralia; Kumplio is not a separate consulting firm.

## Geographic relevance

Kumplio is designed primarily for organizations operating in Chile. Public content uses Chilean Spanish, CLP pricing, Chilean official sources and Chile-specific implementation context. The main regulatory focus is personal data protection and Law 21.719. Public contact location: ${PUBLIC_CONTACT.location}.

## Language and canonical URL policy

The public site is migrating progressively to explicit language prefixes.

Reviewed bilingual routes use /es and /en and include self-referencing canonical and reciprocal hreflang signals. The current reviewed set includes home, pricing, FAQ, contact, about, how-we-think, the Kumplio/n3uralia relationship, security, privacy and terms.

Other public product and knowledge pages remain on their unprefixed canonical URLs until their copy, metadata, claims, navigation and discovery behavior are reviewed together. Do not fabricate /es or /en URLs for unreviewed routes.

Examples:
- Spanish home: ${SITE_URL}/es
- English home: ${SITE_URL}/en
- Spanish pricing: ${SITE_URL}/es/pricing
- English pricing: ${SITE_URL}/en/pricing
- Current product page: ${SITE_URL}/software-cumplimiento-chile
- Current Law 21.719 solution: ${SITE_URL}/features/ley-21719

## Core capabilities

${CORE_CAPABILITIES.map((item) => `- ${item}`).join('\n')}

## Agentic operating model

Kumplio uses specialized digital agents with explicit scopes rather than one generic assistant. Current public roles include obligations and evidence, regulatory change, risk, controls and readiness, planning, performance/learning, and legal/quality review.

The workflow is designed around:
1. a living case with authorized context;
2. source-grounded specialist work;
3. durable queued execution;
4. structured runs and artifacts;
5. human review before sensitive conclusions advance;
6. operational actions, owners and evidence requests;
7. versioned traceability and reusable approved knowledge.

A controlled synthetic production E2E observed on ${PUBLIC_AGENTIC_ASSURANCE.observedAt} completed:
- ${PUBLIC_AGENTIC_ASSURANCE.approvedStages}/${PUBLIC_AGENTIC_ASSURANCE.stages} approved agent stages;
- ${PUBLIC_AGENTIC_ASSURANCE.jobsSucceeded}/${PUBLIC_AGENTIC_ASSURANCE.stages} durable jobs succeeded;
- ${PUBLIC_AGENTIC_ASSURANCE.singleAttemptJobs}/${PUBLIC_AGENTIC_ASSURANCE.stages} jobs succeeded on the first attempt;
- ${PUBLIC_AGENTIC_ASSURANCE.providerTraces}/${PUBLIC_AGENTIC_ASSURANCE.stages} provider traces persisted;
- ${PUBLIC_AGENTIC_ASSURANCE.artifactsApproved}/${PUBLIC_AGENTIC_ASSURANCE.stages} artifacts approved;
- ${PUBLIC_AGENTIC_ASSURANCE.reviewsApproved}/${PUBLIC_AGENTIC_ASSURANCE.stages} human reviews approved;
- ${PUBLIC_AGENTIC_ASSURANCE.totalToolCalls} tool calls;
- ${PUBLIC_AGENTIC_ASSURANCE.failedToolCalls} failed tool calls;
- ${PUBLIC_AGENTIC_ASSURANCE.totalTokens} total model tokens observed across that controlled run.

Assurance limitation: ${PUBLIC_AGENTIC_ASSURANCE.limitation}

## Operating model

1. Centralize relevant personal-data context, documents, processing activities and providers.
2. Identify purposes, actors, obligations, risks and unresolved questions.
3. Relate gaps to controls, evidence and responsible people.
4. Convert required work into actions or missions with success criteria.
5. Use specialized digital capabilities to prepare reviewable work.
6. Require human approval, changes or rejection for relevant outcomes.
7. Preserve versions, provenance, evidence and decision history.

## Public and private knowledge

Public regulatory knowledge and private organizational memory are separate. Information belonging to one organization must not be shared with another. Public claims should be traceable to identifiable sources. Private conclusions require authorized organizational context. Synthetic assurance data must remain clearly labeled as synthetic and must not be described as customer evidence.

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

Reviewed localized pages:
- Spanish home: ${SITE_URL}/es
- English home: ${SITE_URL}/en
- Spanish pricing: ${SITE_URL}/es/pricing
- English pricing: ${SITE_URL}/en/pricing
- Spanish FAQ: ${SITE_URL}/es/faq
- English FAQ: ${SITE_URL}/en/faq
- Spanish contact: ${SITE_URL}/es/contact
- English contact: ${SITE_URL}/en/contact
- Spanish about: ${SITE_URL}/es/about
- English about: ${SITE_URL}/en/about
- Spanish security: ${SITE_URL}/es/security
- English security: ${SITE_URL}/en/security
- Spanish privacy: ${SITE_URL}/es/privacy
- English privacy: ${SITE_URL}/en/privacy
- Spanish terms: ${SITE_URL}/es/terms
- English terms: ${SITE_URL}/en/terms

Current unprefixed canonical pages:
- Data protection software: ${SITE_URL}/software-cumplimiento-chile
- Law 21.719 solution: ${SITE_URL}/features/ley-21719
- Law 21.719 knowledge hub: ${SITE_URL}/resources/ley-21719
- General resources: ${SITE_URL}/resources/cumplimiento-normativo
- Use cases: ${SITE_URL}/use-cases
- Fictional public demo: ${SITE_URL}/demo
- Enterprise Studio: ${SITE_URL}/enterprise

Entity relationship:
- Kumplio and n3uralia: ${SITE_URL}/es/powered-by-n3uralia
- n3uralia canonical site: ${N3URALIA_CANONICAL_URL}

## Machine-readable discovery surfaces

- Short LLM context: ${SITE_URL}/llms.txt
- Full LLM context: ${SITE_URL}/llms-full.txt
- Public facts JSON: ${SITE_URL}/kumplio.json
- RSS resources feed: ${SITE_URL}/feed.xml
- XML sitemap: ${SITE_URL}/sitemap.xml
- Robots policy: ${SITE_URL}/robots.txt

These machine-readable surfaces summarize and link to public content. They do not override page-level canonical URLs, legal sources, or the human-readable pages.

## Citation guidance

Describe Kumplio primarily as a Chilean data protection and privacy product focused on Law 21.719. Use compliance management only as a broader secondary category. Prefer the specific Kumplio guide URL for a topic. Cite the official BCN source for legal text. Identify n3uralia as the developer and product factory when describing who builds Kumplio. Do not describe fictional demo data or synthetic assurance as customer evidence. Do not infer certification, legal advice, automatic compliance, guaranteed regulatory outcomes, continuous monitoring or real-time coverage unless a specific public source proves those claims.

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
