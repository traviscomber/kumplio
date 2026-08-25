# Contextual Onboarding and Authenticated Home Design

**Date:** 2026-08-24  
**Status:** Approved in chat  
**Source:** `KUMPLIO — PRODUCT WORKFLOWS + AUTHENTICATED EXPERIENCE`, sections 3–5, 20–27

## Objective

Give Persona, Profesional, and Empresa users one coherent first-login flow that captures their problem, persists a bounded compliance context, creates an initial diagnosis and case, and lands them on an authenticated home that answers what needs attention and what to do next.

This phase extends the existing product. It does not create three separate products, parallel case models, or demo-only state.

## Scope

### Included

- One four-step contextual onboarding for Persona, Profesional, and Empresa.
- Context-specific questions with a shared visual and interaction model.
- Server-side validation and tenant-scoped, atomic initialization.
- Persistence of user type, intent, context, urgency, target date, and initial diagnosis.
- Creation or reuse of the organization/workspace, compliance profile, initial project, and initial case.
- Redirect to `/app/inicio` after successful initialization.
- A home composition with one primary status, one dominant next action, at most three priorities, meaningful recent changes, active cases, and relevant expirations when data exists.
- Guided empty states in plain Spanish.
- Automated contract, behavior, type, build, and release verification.

### Excluded

- Full `/app/personas`, `/app/requisitos`, `/app/alertas`, `/app/actividad`, and `/app/configuracion` modules.
- New specialist orchestration, regulatory-change processing, or predictive learning.
- Replacing the existing case, evidence, document, obligation, or audit models.
- Claiming compliance from onboarding answers alone.

## Product Model

All three user types operate inside the same tenant-scoped Kumplio system:

- **Persona:** a private personal workspace. The organization record is an implementation boundary, not organization-oriented product language.
- **Profesional:** a professional workspace that can later contain client-related cases without requiring a separate application.
- **Empresa:** an organization workspace with company and workforce context.

The canonical type is `persona | profesional | empresa`. It is persisted in the active `organization_compliance_profiles.attributes` document together with the onboarding context. Existing organization, membership, project, case, and audit boundaries remain authoritative.

## Onboarding Flow

### Step 1 — Who are you?

Select exactly one context: Persona, Profesional, or Empresa. The selection changes later questions and copy but not the underlying product.

### Step 2 — What do you need to solve?

Capture required free text under the label `¿Qué necesitas proteger, ordenar o resolver?` and an optional suggested intent. Suggestions come from the approved brief and remain editable context, not legal conclusions.

### Step 3 — Relevant context

Ask only fields relevant to the selected type:

- Persona: region, urgency, target date, and whether documents are already available.
- Profesional: professional activity, industry served, approximate active clients, region, urgency, target date, and available documents.
- Empresa: organization name, industry, organization size, approximate worker count, region, urgency, target date, and available documents.

Names from the authenticated profile remain editable. Company-only language is hidden for Persona.

### Step 4 — Initial result preview and confirmation

Show the case title, bounded initial status, up to three detected information gaps, prioritized starter actions, recommended document categories, and the next step. The preview must state that it is based on provided context and requires evidence before validation or closure.

Submitting creates the durable workspace and initial work. A retry is idempotent: it must not duplicate memberships, active profiles, projects, or cases.

## Persistence and Initialization

Extend `initialize_workspace` through a new versioned RPC rather than performing multiple browser-side mutations. The route authenticates the user, validates the payload with Zod, and calls the RPC once.

The RPC must:

1. acquire an advisory lock scoped to the user;
2. reuse an existing membership or create the appropriate workspace and owner membership;
3. update the user profile names;
4. create one active compliance profile containing normalized industry/region fields and bounded onboarding attributes;
5. create or reuse the initial project and case with deterministic idempotency keys in metadata;
6. persist the initial diagnosis as structured case metadata without asserting verified compliance;
7. append an audit event describing initialization; and
8. return organization, project, case, and initialization identifiers.

No onboarding answer counts as evidence. Detected gaps are `information_missing` or `needs_review`; initial actions are recommendations until supported and reviewed.

## Initial Diagnosis

Diagnosis generation is deterministic in this phase. A pure server module converts validated onboarding input into:

- a plain-Spanish case title;
- one bounded status;
- zero to three gaps;
- one to three starter actions;
- recommended document categories;
- a dominant next action; and
- relevant specialist labels already present in Kumplio, presented as assistance rather than technical execution.

The module contains no database access, making its behavior independently testable. AI enrichment is explicitly deferred.

## Authenticated Home

`/app/inicio` consumes the active workspace and existing daily-summary, timeline, case, and document data. It renders:

1. **Primary status:** one of En orden, Requiere atención, Acción necesaria, or Información incompleta.
2. **Next action:** one dominant CTA derived from the highest valid priority or the initial diagnosis.
3. **Current priorities:** no more than three.
4. **Recent changes:** only meaningful timeline entries.
5. **Active cases:** a short list linked to canonical `/app/casos/[id]` URLs.
6. **Upcoming expirations:** only relevant items; omitted when no reliable data exists.

Internal scores and engine identifiers are not primary UI. Technical agent execution and raw reasoning remain hidden. Existing source-backed explanations remain available in deeper workflows.

## Navigation and Return Context

After onboarding, redirect to `/app/inicio?case=<id>` so the home can highlight the newly created work without storing unsafe redirect targets. Existing authenticated users retain the active workspace selection. A future last-context feature may use a validated internal path; it is not required in this phase.

## Error Handling

- Unauthenticated requests return `401` and the page redirects to sign-in with a safe internal `next` value.
- Invalid JSON or fields return `400` with stable error codes.
- Existing initialized work returns the existing identifiers instead of `409` where consistency is verified.
- Database failures return a generic Spanish message to the client and log only safe error codes.
- The form preserves entered values after recoverable errors and prevents duplicate submission while pending.

## Security and Auditability

- `/app/*` remains protected server-side.
- Initialization is tenant-scoped and server/RPC controlled.
- Browser roles cannot call trusted initialization internals directly beyond the authenticated route contract.
- Important state creation records actor, timestamp, source, and resulting identifiers.
- No raw chain-of-thought is stored or displayed.
- No compliance, verification, or closure state is promoted without evidence and human review.

## Testing and Acceptance

The phase is complete when automated checks prove:

- each user type produces the correct normalized context and context-specific questions;
- deterministic diagnosis never returns more than three gaps or actions and never claims verified compliance;
- invalid payloads are rejected;
- the initialization contract is idempotent and tenant-scoped by source guardrails and SQL fixtures;
- successful onboarding redirects to `/app/inicio` and exposes the initial next action;
- home priorities are capped at three and technical score/engine copy is not primary output;
- canonical routes remain stable;
- typecheck, relevant contract checks, `next build`, `release:check`, Vercel, and production smoke pass.

## Delivery Boundary

This is the first executable slice of Phase 1 from the brief. It delivers real persisted first value for all three user contexts. The next slice can add Personas, Requisitos, and Alertas against this shared context rather than inventing disconnected screens.
