# First-Outcome Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guide genuinely new authenticated users from account creation to their first useful Kumplio case/analysis while allowing existing users to enter the app normally.

**Architecture:** Add a server-authoritative onboarding state resolver at the authenticated entry boundary, backed by the smallest persistence change compatible with the current Supabase tenant/profile schema. Build a focused three-screen onboarding flow that reuses existing organization and case/intake primitives and hands off to the canonical analysis experience instead of creating a parallel workflow.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres/RLS, Tailwind CSS, existing Kumplio case/intake domain and release-gate scripts.

**Spec:** `docs/superpowers/specs/2026-08-26-first-outcome-onboarding-design.md`

## Global Constraints

- Existing/historical users must never be stranded behind mandatory onboarding.
- Onboarding state must be server-authoritative and resumable across sessions/devices.
- Maximum three user-input screens before first-case handoff.
- Reuse existing organization and case/intake primitives; do not create a parallel case model.
- Completion must be idempotent and first-case creation must not duplicate on retry.
- Preserve tenant isolation and RLS.
- Do not change public landing, pricing, agent architecture, or evidence semantics.
- Release Gate, Application Validation, Release Qualification/Foundation, typecheck, build and smoke must remain green.

---

### Task 1: Map existing identity, organization and first-case primitives

**Files:**
- Inspect: authenticated auth/profile helpers, tenant/organization schema and migrations
- Inspect: existing case/intake creation actions and `/app/casos` flow
- Test: existing auth/tenant/case contract tests

**Interfaces:**
- Produces: exact existing primitives to be reused by Tasks 2–5.

- [ ] Identify the canonical server-side current-user/profile/tenant resolver used by authenticated routes.
- [ ] Identify schema evidence that safely distinguishes historical users from genuinely new users.
- [ ] Identify the canonical organization update/create primitive.
- [ ] Identify the canonical case/intake creation primitive and analysis destination.
- [ ] Run the narrow existing tests for those primitives and record a green baseline.
- [ ] If existing primitives cannot support the approved design without broader restructuring, stop and revise the spec before implementation.

### Task 2: Add onboarding-state persistence with grandfathering

**Files:**
- Create/Modify: smallest Supabase migration required by the discovered schema
- Create/Modify: focused onboarding state server helper
- Test: onboarding state + RLS/grandfathering contract

**Interfaces:**
- Produces: `getOnboardingState(...)`, persisted draft/progress, idempotent completion operation.

- [ ] Write failing tests proving a genuinely new user is incomplete while a historical user bypasses onboarding.
- [ ] Run tests and verify RED for missing onboarding state.
- [ ] Add the minimal schema/state needed; do not make new required columns that break historical rows.
- [ ] Implement historical-user grandfathering from existing evidence.
- [ ] Add/verify RLS or equivalent tenant-safe access rules.
- [ ] Run focused tests and verify GREEN.
- [ ] Commit the persistence/state slice.

### Task 3: Make authenticated entry routing state-aware

**Files:**
- Modify: `app/app/page.tsx`
- Create/Modify: onboarding route boundary as needed
- Test: authenticated routing contract

**Interfaces:**
- Consumes: `getOnboardingState(...)` from Task 2.
- Produces: new users → onboarding; completed/historical users → `/app/inicio`.

- [ ] Write failing routing tests for new, resumed, completed and historical users.
- [ ] Run and verify RED.
- [ ] Replace unconditional `/app/inicio` redirect with state-aware server routing.
- [ ] Ensure direct access to onboarding cannot regress completed users into a mandatory loop.
- [ ] Run focused tests and verify GREEN.
- [ ] Commit routing slice.

### Task 4: Build the three-screen onboarding experience

**Files:**
- Create: focused onboarding page/components under authenticated app
- Create/Modify: server actions for draft persistence
- Test: onboarding UI/action contracts

**Interfaces:**
- Consumes: persisted onboarding state and existing organization primitive.
- Produces: organization context + first intent draft.

- [ ] Write failing tests for welcome/context/intent progression and resume behavior.
- [ ] Run and verify RED.
- [ ] Build Step 1 welcome and progress indicator.
- [ ] Build organization context inputs: name, coarse sector/type, size band, user role.
- [ ] Persist each completed step server-side so refresh/device changes can resume.
- [ ] Build `¿Qué necesitas resolver primero?` choices plus optional short free text.
- [ ] Add back navigation without data loss.
- [ ] Verify mobile, keyboard and focus behavior in component/browser tests where available.
- [ ] Run focused tests and verify GREEN.
- [ ] Commit UI slice.

### Task 5: Handoff to the first case and Analiza

**Files:**
- Modify: onboarding completion action
- Reuse/Modify: existing case/intake action only as required for idempotent onboarding invocation
- Test: first-case handoff contract

**Interfaces:**
- Consumes: onboarding organization context + first intent.
- Produces: one canonical first case and redirect to existing analysis flow.

- [ ] Write failing test proving retry does not create two first cases.
- [ ] Run and verify RED.
- [ ] Translate onboarding intent into the existing case/intake input contract.
- [ ] Create/reuse exactly one canonical case using an idempotency strategy consistent with current domain patterns.
- [ ] Mark onboarding complete only after successful case handoff.
- [ ] Redirect to the existing `Analiza`/case destination.
- [ ] Run focused tests and verify GREEN.
- [ ] Commit handoff slice.

### Task 6: Regression, browser QA and release qualification

**Files:**
- Modify only if qualification exposes a regression.

**Interfaces:**
- Produces: release-qualified onboarding with existing-user safety evidence.

- [ ] Run typecheck.
- [ ] Run auth/tenant/RLS and onboarding focused tests.
- [ ] Run Release Gate.
- [ ] Run Application Validation.
- [ ] Run Release Qualification/Foundation.
- [ ] Run production build.
- [ ] Run smoke.
- [ ] Browser QA: brand-new user → onboarding → first case → Analiza.
- [ ] Browser QA: refresh midway → resumes at correct step with data intact.
- [ ] Browser QA: existing/historical user → `/app/inicio` with no forced onboarding.
- [ ] Browser QA: mobile width and keyboard-only progression.
- [ ] Inspect final diff for accidental changes to public landing, pricing, evidence semantics or agent architecture.
- [ ] Commit qualification-only fixes if necessary; do not create an empty commit.
