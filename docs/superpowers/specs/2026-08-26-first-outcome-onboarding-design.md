# Kumplio First-Outcome Onboarding Design

Date: 2026-08-26
Status: Approved
Branch: `agent/first-outcome-onboarding`

## Objective

A newly authenticated Kumplio user should not land on a dashboard that assumes prior product knowledge. The first experience should guide the user from account creation to a meaningful first compliance outcome with minimal setup.

## Core principle

Onboarding is not a product tour. It is the shortest path to the first useful result.

Canonical first-run journey:

`Bienvenido → Conozcamos tu organización → Qué necesitas resolver → Primer caso → Analiza`

Returning users continue to `/app/inicio` and should not be forced through onboarding again.

## Entry behavior

`/app` remains the authenticated entry point, but routing becomes state-aware:

- genuinely new/incomplete user → onboarding
- completed onboarding / existing historical user → `/app/inicio`
- user with meaningful historical organization, case, or progress data must be treated as existing and must not be blocked by onboarding

The implementation must preserve grandfathering behavior for existing users.

## Experience

### Step 1 — Welcome

Headline: `Empecemos por entender tu organización.`

Explain in one short paragraph that Kumplio will ask only what it needs to guide the first case. No feature tour.

### Step 2 — Organization context

Collect only high-value context required for useful guidance:

- organization name
- organization type / sector (coarse selection)
- approximate size band
- user's role

Do not require secondary profile/configuration fields before value delivery.

### Step 3 — First intent

Ask one primary question:

`¿Qué necesitas resolver primero?`

Suggested choices:

- Prepararme para la Ley 21.719
- Ordenar proveedores y terceros
- Resolver una solicitud de una persona
- Gestionar un incidente o riesgo
- Otro

The user may provide a short free-text description to add context.

### Step 4 — First case handoff

Use the existing case/intake domain rather than inventing a parallel onboarding-only case model. The onboarding should prepare/create the first case through existing product primitives, then send the user to the canonical `Analiza` experience.

### Completion

Persist onboarding completion only when enough context exists and the user has successfully reached the first-case handoff. Do not mark complete merely because a welcome modal was dismissed.

After completion, `/app` and future sessions resolve normally to `/app/inicio`.

## Persistence

Use existing tenant/profile/organization primitives where they can truthfully store onboarding context. Add the smallest explicit onboarding state necessary to distinguish incomplete new users from completed users.

Requirements:

- server-authoritative state, not localStorage-only
- resumable across devices/sessions
- tenant isolated / RLS protected
- idempotent completion
- safe for historical users

## UX constraints

- maximum three user-input screens before first-case handoff
- clear progress indicator
- back navigation without losing persisted progress
- mobile-first responsive layout
- keyboard accessible controls and visible focus
- no forced tutorial of navigation, agents, evidence screens, or configuration
- no legal/compliance claims beyond existing verified product language

## Existing-user safety

This is non-negotiable. Any user with historical product evidence (for example an existing organization relationship, case, assessment, progress, or other established app activity according to current schema) must bypass mandatory onboarding unless they explicitly choose to revisit it.

No migration may strand existing users behind required fields that did not previously exist.

## Scope

In scope:

- authenticated first-run routing
- onboarding UI
- minimal organization context
- first intent selection
- handoff into existing first-case / analysis flow
- persisted completion/resume state
- regression and release-gate coverage

Out of scope:

- public landing
- redesign of `/app/inicio`
- billing/pricing
- broad organization settings redesign
- agent architecture changes
- evidence model changes
- unrelated authenticated modules

## Success criteria

- brand-new account is guided into onboarding before dashboard
- existing/historical account continues directly to normal app
- user reaches first case/analysis after at most three input screens
- refresh/session change resumes onboarding safely
- completion is persisted server-side
- no duplicate first case is created on retry
- Release Gate, Application Validation, Release Qualification/Foundation, typecheck, build and smoke remain green
