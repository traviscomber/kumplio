# Kumplio — Final Product Polish

Date: 2026-08-25
Status: APPROVED DESIGN
Scope: Bloque 17 — final professional product polish

## 1. Objective

Raise the authenticated Kumplio experience from functionally complete to professionally finished without adding product scope or changing the underlying compliance/data architecture.

The polish applies to the canonical `/app/*` experience, primarily:

- `/app/inicio`
- `/app/casos`
- `/app/casos/[id]`
- `/app/documentos`
- `/app/evidencia`
- authenticated product navigation and shared states

The goal is improved clarity, visual hierarchy, confidence, accessibility, responsiveness, and consistency.

## 2. Product principle

Polish is subtraction and hierarchy, not feature expansion.

Every authenticated screen should answer, in order:

1. Where am I?
2. What is the current state?
3. What needs my attention?
4. What is the single best next action?
5. What supporting detail do I need before acting?

The product must expose operational meaning rather than internal system mechanics.

## 3. Navigation

Keep the existing canonical `AppNavigation` architecture and `/app/*` destinations.

Primary navigation remains focused on existing real capabilities:

- Inicio
- Casos
- Documentos

Evidencia remains available as an existing secondary capability. Alertas and Configuración remain hidden until they represent real product surfaces.

Improve navigation presentation rather than changing information architecture:

- clearer active state;
- consistent spacing and hit targets;
- graceful horizontal/mobile behavior;
- visible keyboard focus;
- no legacy destinations exposed to users;
- no duplicate navigation hierarchy competing with the product nav.

## 4. Visual hierarchy

Reduce the repeated "card inside card" appearance across authenticated screens.

Use containers only when they communicate a meaningful grouping or interaction boundary. Prefer whitespace, typography, subtle dividers, and section rhythm for secondary information.

Hierarchy should be visibly consistent:

- page identity / context;
- current status;
- dominant next action;
- supporting work sections;
- secondary history/detail.

There must not be multiple visually dominant CTAs competing on one screen.

Do not introduce a new visual design system. Reuse the existing typography, spacing, colors, components, Tailwind tokens, and interaction primitives.

## 5. Inicio

Keep the approved operating hierarchy:

`Estado actual → Siguiente acción → Prioridades → Casos activos → Cambios relevantes`.

Professional polish should:

- shorten redundant introductory copy;
- make the next action immediately scannable;
- reduce unnecessary bordered containers;
- maintain a maximum of three priorities;
- keep cases and changes visually secondary to the next action;
- use concise empty states that still provide an appropriate next step;
- preserve truthful bounded status language.

No new dashboard metrics or scoring are introduced.

## 6. Casos and expediente

The case list should optimize for scanning and resuming work. Case rows/cards should make status, title/context, and next relevant action understandable without decorative complexity.

The canonical case workspace should strengthen the existing sequence:

`Estado del caso → Siguiente decisión → Fundamento → Contribuciones → Evidencia/Revisión → Últimos avances`.

Polish requirements:

- stronger distinction between primary decision and supporting analysis;
- reduce visual competition among specialist contributions;
- keep normative grounding readable but subordinate to the decision;
- clearly distinguish pending review, insufficient evidence, and verified persisted states;
- long case titles and identifiers must wrap/truncate gracefully;
- no technical traces, retry counters, provider mechanics, prompts, tokens, queues, or legacy live views.

Human review boundaries and claim safety remain unchanged.

## 7. Documentos and Evidencia

These surfaces remain supporting capabilities rather than parallel product centers.

Polish should make their relationship to active work clearer through copy, contextual links, and hierarchy already supported by persisted case/workspace context.

Requirements:

- one clear upload/contribution action when appropriate;
- concise explanation of what an uploaded item means and does not mean;
- review/integrity status language consistent with the case workspace;
- contextual return to the relevant case when existing context is available;
- useful empty states rather than blank grids;
- no claim that upload alone verifies evidence or compliance.

Do not create a new evidence lifecycle or storage model.

## 8. Copy

Reduce explanatory layers while preserving legal/compliance precision.

Prefer short operational language:

- `Estado actual`
- `Siguiente acción`
- `Pendiente de revisión`
- `Evidencia insuficiente`
- `Últimos avances`

Avoid repeating the same concept in eyebrow, heading, subheading, card title, and helper copy.

Keep claim-safety language where it materially changes interpretation, but move repeated caveats to the most relevant decision/evidence boundary rather than duplicating them everywhere.

No new wording may imply certified compliance, verified tenant/provider assurance, guaranteed sufficiency, or any Bloque 16 state not backed by evidence.

## 9. Responsive behavior

Treat mobile and tablet as first-class layouts, not compressed desktop.

Target validation widths:

- approximately 390px mobile;
- approximately 768px tablet;
- standard desktop widths.

Requirements:

- navigation remains usable without clipped critical actions;
- dominant CTA remains visible and tappable;
- grids collapse in a meaningful order;
- long titles, status labels, and action text do not overflow;
- secondary metadata may wrap or collapse before primary action/context;
- minimum interactive targets remain comfortably usable.

## 10. Accessibility and interaction quality

Improve existing surfaces without changing interaction architecture:

- visible `:focus-visible` treatment for links/buttons;
- `aria-current` for active navigation remains intact;
- semantic headings preserve logical order;
- status is not communicated by color alone;
- disabled/unavailable actions are distinguishable and understandable;
- loading, empty, success, and error feedback remains textual as well as visual;
- decorative icons remain hidden from assistive technology where appropriate.

Do not add animation that delays work. Motion, if already used, should remain subtle and respect reduced-motion behavior.

## 11. Loading, empty, error, and success states

Shared product states should feel intentional and consistent.

Empty states should explain:

- what is absent;
- why it matters when useful;
- the next available action, if one exists.

Errors must not navigate as though an operation succeeded. Successful persisted actions may show concise progress acknowledgement and then return users to the appropriate canonical context.

Do not invent progress for read-only actions.

## 12. Technical boundaries

Reuse existing:

- authenticated app layout;
- `AppNavigation`;
- authenticated-home read model;
- case-workspace read model;
- case/document/evidence persistence;
- existing UI primitives and Tailwind tokens;
- existing auth return-context contract;
- existing Release Gate / Bloque 16 / UI Golden Path contracts.

Do not add:

- database migrations;
- new RLS policies or exceptions;
- new compliance scoring;
- new product modules;
- new analytics/event infrastructure;
- billing/payment changes;
- provider-assurance shortcuts;
- a replacement design system.

## 13. Legacy cleanup boundary

Remove or prevent user-visible legacy escapes from canonical `/app/*` surfaces when equivalent product context already exists in the canonical experience.

Compatibility redirects may remain where needed for historical links, but canonical JSX and navigation must not intentionally send users back into legacy product routes.

Do not delete legacy implementation solely for code cleanliness in this phase; deletion is allowed only when directly required to prevent a visible duplicate/escape and existing tests prove compatibility.

## 14. Product-polish release contract

Add a permanent `check:product-polish` contract and wire it into the canonical Bloque 17/application close gate.

At minimum it should protect:

1. canonical `/app/*` navigation;
2. one dominant next-action pattern on Inicio and expediente;
3. approved operating hierarchy markers;
4. absence of known technical-plumbing labels in canonical product surfaces;
5. absence of user-visible legacy route links from canonical JSX;
6. critical evidence/review claim-safety language;
7. responsive-safe class/structure markers for primary navigation and key work surfaces;
8. focus/accessibility markers for canonical navigation and primary actions.

The contract supplements, not replaces, existing behavioral/model tests and release gates.

## 15. Testing and release

Implementation follows TDD and small reversible commits.

Before merge, the exact HEAD must pass:

- focused product-polish contracts;
- authenticated-home and case-workspace contracts;
- activation/daily-operations/app-close contracts;
- UI Golden Path and Bloque 16 guardrails;
- typecheck;
- production build;
- Foundation/smoke;
- Release Gate;
- Vercel preview checks.

Where browser access is available, perform visual QA at mobile, tablet, and desktop widths and check console errors. If authenticated browser access is unavailable, do not claim visual verification; rely on source/CI evidence and state the limitation.

## 16. Success condition

Kumplio feels intentionally designed rather than merely assembled: users can orient themselves quickly, identify one next action, scan cases and evidence without technical noise, understand review boundaries, and move through the canonical `/app/*` experience comfortably on mobile and desktop.

The application may then be considered professionally polished at the product-experience layer, while Bloque 16 external evidence gates remain independently authoritative.