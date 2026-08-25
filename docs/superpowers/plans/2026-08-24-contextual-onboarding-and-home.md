# Contextual Onboarding and Authenticated Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver persistent first-login onboarding for Persona, Profesional, and Empresa plus a focused `/app/inicio` experience.

**Architecture:** A pure diagnosis module normalizes onboarding input and produces bounded initial work. A versioned, tenant-safe SQL RPC persists the workspace/profile/project/case atomically through the authenticated API. The existing daily-summary home is composed into a product-focused view with capped priorities, canonical case links, and guided empty states.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, Supabase/PostgreSQL, Node contract tests.

**Spec:** `docs/superpowers/specs/2026-08-24-contextual-onboarding-and-home-design.md`

## Global Constraints

- Support exactly `persona`, `profesional`, and `empresa` in one product.
- Do not create parallel case, document, evidence, or obligation models.
- Onboarding answers are context, never verified evidence or compliance.
- Persist through one authenticated, versioned RPC with tenant and idempotency guards.
- Use plain Spanish and guided empty states.
- Show at most three home priorities and one dominant next action.
- Keep `/app/*` protected and canonical.
- `typecheck`, targeted checks, `next build`, `release:check`, Vercel, and smoke must pass before completion.

---

### Task 1: Deterministic onboarding diagnosis

**Files:**
- Create: `lib/product/onboarding/contextual-diagnosis.ts`
- Create: `scripts/test-contextual-onboarding-diagnosis.mjs`
- Modify: `package.json`
- Modify: `scripts/release-check.mjs`

**Interfaces:**
- Produces: `OnboardingContext`, `OnboardingDiagnosis`, `buildInitialDiagnosis(input)`.
- Consumes: no database or network dependencies.

- [ ] **Step 1: Write the failing behavior test**

Create a Node test that imports the transpiled source through the repository's established source-test pattern and asserts that all three user types produce a title, bounded status, dominant next action, no more than three gaps/actions, and `evidenceStatus: 'not_verified'`.

- [ ] **Step 2: Run the test and verify RED**

Run: `node scripts/test-contextual-onboarding-diagnosis.mjs`  
Expected: FAIL because `lib/product/onboarding/contextual-diagnosis.ts` does not exist.

- [ ] **Step 3: Implement the pure diagnosis module**

Define literal unions for user type, urgency, industry, organization size, and document availability. Normalize free text and derive deterministic gaps/actions without legal conclusions. Reject empty problem statements at the input boundary.

- [ ] **Step 4: Verify GREEN and wire release checks**

Run: `node scripts/test-contextual-onboarding-diagnosis.mjs`  
Expected: PASS for Persona, Profesional, Empresa, caps, and evidence boundary.

Add `check:contextual-onboarding` to `package.json` and `scripts/release-check.mjs`.

- [ ] **Step 5: Commit**

```bash
git add lib/product/onboarding/contextual-diagnosis.ts scripts/test-contextual-onboarding-diagnosis.mjs package.json scripts/release-check.mjs
git commit -m "feat: add contextual onboarding diagnosis"
```

### Task 2: Atomic persistent initialization contract

**Files:**
- Create: `supabase/migrations/20260825010000_contextual_onboarding_v2.sql`
- Modify: `app/api/onboarding/initialize/route.ts`
- Create: `scripts/check-contextual-onboarding-persistence-v1.mjs`
- Modify: `package.json`
- Modify: `scripts/release-check.mjs`

**Interfaces:**
- Consumes: `buildInitialDiagnosis(input)` from Task 1.
- Produces: `initialize_contextual_workspace_v2(...)` and JSON response `{ organizationId, projectId, caseId, initialized, diagnosis }`.

- [ ] **Step 1: Write the failing persistence contract**

Assert the migration and route include: advisory lock, authenticated actor validation, membership reuse, active profile attributes, deterministic onboarding key, project/case reuse, audit event, service-role restriction, Zod discriminated fields, and one RPC call.

- [ ] **Step 2: Run the guardrail and verify RED**

Run: `node scripts/check-contextual-onboarding-persistence-v1.mjs`  
Expected: FAIL because the migration and v2 RPC are absent.

- [ ] **Step 3: Add the versioned SQL RPC**

Create a security-invoker function using `set search_path to ''`, user-scoped advisory locking, verified actor identity, existing membership reuse, one active compliance profile, deterministic metadata keys, and audit insertion. Grant execution only to trusted server roles.

- [ ] **Step 4: Update the authenticated route**

Use a discriminated Zod schema for the three user types, build the deterministic diagnosis server-side, call the v2 RPC exactly once, return stable Spanish errors, and preserve idempotent existing identifiers.

- [ ] **Step 5: Verify GREEN**

Run: `node scripts/check-contextual-onboarding-persistence-v1.mjs`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260825010000_contextual_onboarding_v2.sql app/api/onboarding/initialize/route.ts scripts/check-contextual-onboarding-persistence-v1.mjs package.json scripts/release-check.mjs
git commit -m "feat: persist contextual onboarding atomically"
```

### Task 3: Three-context onboarding interface

**Files:**
- Modify: `components/onboarding/workspace-onboarding-form.tsx`
- Modify: `app/onboarding/page.tsx`
- Create: `scripts/check-contextual-onboarding-ui-v1.mjs`
- Modify: `package.json`
- Modify: `scripts/release-check.mjs`

**Interfaces:**
- Consumes: Task 2 API payload and response.
- Produces: a four-step accessible form that redirects to `/app/inicio?case=<uuid>`.

- [ ] **Step 1: Write the failing UI contract**

Assert the source exposes the three exact context labels, required problem question, approved intent suggestions, conditional fields, bounded result preview, evidence disclaimer, pending-state duplicate prevention, and canonical redirect.

- [ ] **Step 2: Run the guardrail and verify RED**

Run: `node scripts/check-contextual-onboarding-ui-v1.mjs`  
Expected: FAIL against the current organization-only form.

- [ ] **Step 3: Implement the four-step form**

Keep one component with focused subcomponents and shared field state. Render only relevant questions, validate each step locally, preview the deterministic result copy, preserve state after errors, and submit the normalized payload once.

- [ ] **Step 4: Verify GREEN and accessibility source boundaries**

Run: `node scripts/check-contextual-onboarding-ui-v1.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/onboarding/workspace-onboarding-form.tsx app/onboarding/page.tsx scripts/check-contextual-onboarding-ui-v1.mjs package.json scripts/release-check.mjs
git commit -m "feat: add three-context onboarding flow"
```

### Task 4: Focused authenticated home

**Files:**
- Create: `lib/product/home/authenticated-home.ts`
- Modify: `app/dashboard/daily-content.tsx`
- Modify: `app/app/inicio/page.tsx`
- Create: `scripts/test-authenticated-home-model.mjs`
- Create: `scripts/check-authenticated-home-ui-v1.mjs`
- Modify: `package.json`
- Modify: `scripts/release-check.mjs`

**Interfaces:**
- Produces: `buildAuthenticatedHomeModel(...)` with primary status, one next action, maximum three priorities, changes, cases, and expirations.
- Consumes: existing daily summary, timeline, compliance cases, documents, and optional initial diagnosis metadata.

- [ ] **Step 1: Write failing home-model tests**

Assert priority capping, next-action selection, canonical case URLs, meaningful-change filtering, and omission of unreliable expirations.

- [ ] **Step 2: Verify RED**

Run: `node scripts/test-authenticated-home-model.mjs`  
Expected: FAIL because the home model is absent.

- [ ] **Step 3: Implement the pure home model**

Map existing records to a small presentation model. Prefer a valid highest priority, then the initial diagnosis, then a guided setup action. Never expose internal engine versions or raw scores in the primary model.

- [ ] **Step 4: Write and run the failing UI contract**

Run: `node scripts/check-authenticated-home-ui-v1.mjs`  
Expected: FAIL until the page uses the focused sections and canonical links.

- [ ] **Step 5: Refactor the home UI to consume the model**

Render primary status, dominant CTA, at most three priorities, meaningful changes, active cases, and conditional expirations. Replace metric-wall language with plain-Spanish guided states.

- [ ] **Step 6: Verify GREEN**

Run both home scripts and expect PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/product/home/authenticated-home.ts app/dashboard/daily-content.tsx app/app/inicio/page.tsx scripts/test-authenticated-home-model.mjs scripts/check-authenticated-home-ui-v1.mjs package.json scripts/release-check.mjs
git commit -m "feat: focus authenticated home on next action"
```

### Task 5: Phase contract and full verification

**Files:**
- Create: `scripts/check-contextual-onboarding-home-phase-v1.mjs`
- Modify: `ROADMAP.md`
- Modify: `package.json`
- Modify: `scripts/release-check.mjs`

**Interfaces:**
- Consumes all Task 1–4 contracts.
- Produces one phase-level release gate.

- [ ] **Step 1: Write the failing phase contract**

Assert canonical routes, all three contexts, persistence migration, focused home, roadmap status, package command, and release-check registration.

- [ ] **Step 2: Verify RED**

Run: `node scripts/check-contextual-onboarding-home-phase-v1.mjs`  
Expected: FAIL before roadmap and release wiring are complete.

- [ ] **Step 3: Complete roadmap and release wiring**

Mark the contextual onboarding/home slice active with its factual delivered boundary; do not mark the full brief complete.

- [ ] **Step 4: Run targeted and full verification**

Run:

```bash
node scripts/test-contextual-onboarding-diagnosis.mjs
node scripts/check-contextual-onboarding-persistence-v1.mjs
node scripts/check-contextual-onboarding-ui-v1.mjs
node scripts/test-authenticated-home-model.mjs
node scripts/check-authenticated-home-ui-v1.mjs
node scripts/check-contextual-onboarding-home-phase-v1.mjs
npx tsc --noEmit --pretty false
npm run build
node scripts/release-check.mjs
git diff --check
```

Expected: all commands exit 0; Next.js build completes without errors.

- [ ] **Step 5: Commit**

```bash
git add ROADMAP.md package.json scripts/release-check.mjs scripts/check-contextual-onboarding-home-phase-v1.mjs
git commit -m "chore: gate contextual onboarding and home"
```
