# Kumplio Daily Operations Close Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/app/inicio` the canonical daily operating desk with one dominant next action, deterministic priorities, actionable cases, relevant changes, and safe continuity back to recomputed persisted state.

**Architecture:** Extend the existing `buildAuthenticatedHomeModel` read model rather than creating new state. Keep `DailyComplianceContent` as the server-side composition layer over existing persisted summary/timeline/case sources, and make the UI consume only the bounded home model. Add source-level release contracts to prevent legacy navigation, technical timeline noise, unsupported claims, and regressions in the Bloque 16/UI Golden Path gates.

**Tech Stack:** Next.js 16.2.6, React 19, TypeScript 5.7.3, Supabase SSR/admin client, Node assertion/guardrail scripts, GitHub Actions/Vercel release gates.

**Spec:** `docs/superpowers/specs/2026-08-25-kumplio-daily-operations-design.md`

## Global Constraints

- Reuse the authenticated-home read model, case/workspace persistence, evidence/document mutations, operational-plan/review state, tenant isolation/RLS, and already-persisted audit/event data.
- Do not add new product modules, compliance scoring, destructive migrations, relaxed RLS, billing/payment changes, a second event bus/analytics subsystem, or duplicated case/action/evidence state.
- `/app/inicio` remains the canonical daily desk and all product destinations remain under `/app/*`.
- Exactly one dominant next action may be rendered when actionable work exists; priorities are capped at three.
- Progress acknowledgement requires a successful persisted mutation.
- Unknown/review-required/insufficient evidence states remain visible; no new copy may imply unsupported compliance, certification, evidence sufficiency, or provider verification.
- Bloque 16 and UI Golden Path guardrails remain authoritative.

---

### Task 1: Strengthen the authenticated-home read model contract

**Files:**
- Modify: `lib/product/home/authenticated-home.ts`
- Modify: `scripts/test-authenticated-home-model.mjs`

**Interfaces:**
- Consumes: existing `buildAuthenticatedHomeModel(input)` and legacy-route canonicalization.
- Produces: bounded `nextAction`, max-three canonical `priorities`, canonical active-case links, and filtered meaningful `changes` without changing persistence.

- [ ] **Step 1: Write failing model tests**

Add assertions that a model with five priorities exposes exactly three, only one `nextAction`, all priority/case destinations start with `/app/`, an invalid `initialNextAction.href` falls back to `/app/inicio`, and changes with zero meaningful deltas are omitted.

```js
const invalidInitial = buildAuthenticatedHomeModel({
  health: { status: 'attention', label: 'Atención', explanation: 'Pendiente.' },
  priorities: [],
  changes: [],
  initialNextAction: { title: 'Continuar', href: '/review-center' },
})
assert.deepEqual(invalidInitial.nextAction, { title: 'Continuar', href: '/app/inicio' })
assert.ok(model.priorities.every(item => item.href.startsWith('/app/')))
assert.ok(model.cases.every(item => item.href.startsWith('/app/casos/')))
assert.equal(model.priorities.length, 3)
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/test-authenticated-home-model.mjs`

Expected: FAIL because `initialNextAction` currently bypasses `canonicalHref()`.

- [ ] **Step 3: Implement minimal canonicalization**

Change only the initial-action branch so it uses the same canonical destination contract as priorities:

```ts
const initialNextAction = input.initialNextAction
  ? { ...input.initialNextAction, href: canonicalHref(input.initialNextAction.href) }
  : null

const nextAction = priorities[0]
  ? { title: priorities[0].title, href: priorities[0].href }
  : initialNextAction || { title: 'Crear o revisar un caso', href: '/app/casos' }
```

- [ ] **Step 4: Run focused test and confirm GREEN**

Run the same Node command. Expected: `Authenticated home model: PASS`.

- [ ] **Step 5: Commit**

```bash
git add lib/product/home/authenticated-home.ts scripts/test-authenticated-home-model.mjs
git commit -m "fix: harden daily home routing contract"
```

---

### Task 2: Make relevant changes a bounded product signal

**Files:**
- Modify: `lib/product/home/authenticated-home.ts`
- Modify: `scripts/test-authenticated-home-model.mjs`
- Modify: `app/dashboard/daily-content.tsx`

**Interfaces:**
- Consumes: persisted `ComplianceTimelineItem` values already returned by `getComplianceTimeline`.
- Produces: `home.changes` containing only timeline items with meaningful persisted deltas; UI labels them as relevant changes rather than raw history.

- [ ] **Step 1: Write failing tests for meaningful-change filtering and bounded count**

Extend the fixture with more than five meaningful items plus zero-delta noise and assert:

```js
assert.equal(modelWithManyChanges.changes.length, 5)
assert.ok(modelWithManyChanges.changes.every(item => item.changesFound > 0 || item.criticalItems > 0))
```

Add a source guard assertion that the authenticated home UI does not render provider traces, token usage, queue/job mechanics, or agent prompts.

- [ ] **Step 2: Run focused tests and confirm RED where the UI contract is missing**

Run:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/test-authenticated-home-model.mjs
node scripts/check-authenticated-home-ui-v1.mjs
```

Expected: the new UI/source marker fails until the relevant-changes section is aligned.

- [ ] **Step 3: Align the UI copy and empty behavior**

In `DailyComplianceContent`, rename the section to `Cambios relevantes` and use copy that explains only changes affecting work. Keep the existing filtered `home.changes`; do not query or render raw audit/provider/agent logs. If there are no items, collapse the detailed list to one concise empty message.

- [ ] **Step 4: Run both focused checks and confirm GREEN**

Expected: both commands PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/product/home/authenticated-home.ts scripts/test-authenticated-home-model.mjs app/dashboard/daily-content.tsx scripts/check-authenticated-home-ui-v1.mjs
git commit -m "feat: focus home on relevant persisted changes"
```

---

### Task 3: Make active cases and the dominant action preserve daily context

**Files:**
- Modify: `lib/product/home/authenticated-home.ts`
- Modify: `scripts/test-authenticated-home-model.mjs`
- Modify: `app/dashboard/daily-content.tsx`

**Interfaces:**
- Consumes: active cases from `compliance_cases` and optional onboarding-created selected case.
- Produces: direct `/app/casos/<caseId>` case links and a dominant action whose case context is preserved when its source priority/action already identifies a case.

- [ ] **Step 1: Add failing context-continuity tests**

Use a priority whose canonical destination is `/cases/c1` and assert the dominant action is `/app/casos/c1`. Add a case list assertion for `/app/casos/c1`. Add an invalid/unscoped destination assertion that falls back to `/app/inicio`.

- [ ] **Step 2: Run focused model test and verify RED only for any missing context behavior**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/test-authenticated-home-model.mjs`.

If all model assertions already pass, add the missing UI guard to `check-authenticated-home-ui-v1.mjs` first and confirm that guard RED before production changes; do not manufacture a production change when the model already satisfies the spec.

- [ ] **Step 3: Apply the minimal UI/model adjustment**

Keep `Cases` links sourced exclusively from `home.cases`. Keep `PriorityCard` links sourced exclusively from canonicalized `home.priorities`. Do not reconstruct legacy URLs in JSX. Where selected onboarding case context is used for `initialNextAction`, resolve to `/app/casos/<selectedCase.id>` when the action is case-oriented and no more-specific canonical href exists.

- [ ] **Step 4: Run authenticated-home checks**

```bash
npm run check:authenticated-home
npm run check:contextual-onboarding-home
npm run check:activation-first-action
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/product/home/authenticated-home.ts scripts/test-authenticated-home-model.mjs app/dashboard/daily-content.tsx scripts/check-authenticated-home-ui-v1.mjs
git commit -m "fix: preserve daily case context"
```

---

### Task 4: Reduce Inicio to the approved operating hierarchy

**Files:**
- Modify: `app/dashboard/daily-content.tsx`
- Modify: `scripts/check-authenticated-home-ui-v1.mjs`

**Interfaces:**
- Consumes: `home.primaryStatus`, `home.nextAction`, `home.priorities`, `home.cases`, `home.changes`.
- Produces: one visual hierarchy in the order Estado actual → Siguiente acción → Prioridades → Casos activos → Cambios relevantes.

- [ ] **Step 1: Add a failing source-level hierarchy contract**

Update `check-authenticated-home-ui-v1.mjs` to assert the five section markers occur in the approved order and that the source contains only one `Siguiente acción` CTA section.

```js
const markers = ['Estado actual', 'Siguiente acción', 'Prioridades actuales', 'Casos activos', 'Cambios relevantes']
let cursor = -1
for (const marker of markers) {
  const next = source.indexOf(marker)
  assert.ok(next > cursor, `${marker} must appear in operating order`)
  cursor = next
}
```

- [ ] **Step 2: Run the UI check and confirm RED**

Run: `node scripts/check-authenticated-home-ui-v1.mjs`.

Expected: FAIL because current copy/order does not exactly implement the approved hierarchy markers.

- [ ] **Step 3: Make the minimal presentation changes**

Adjust labels/order only as needed. Keep the current server composition and components. Remove the trailing explanatory score card if it competes with the daily loop; preserve its safety statement by folding concise non-claim copy into the priority section rather than adding another primary card.

- [ ] **Step 4: Run home and product checks**

```bash
npm run check:authenticated-home
npm run check:product-workflows
npm run check:ui-golden-path
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/daily-content.tsx scripts/check-authenticated-home-ui-v1.mjs
git commit -m "feat: simplify daily operating hierarchy"
```

---

### Task 5: Add the Daily Operations end-to-end release contract

**Files:**
- Create: `scripts/check-daily-operations-close-v1.mjs`
- Modify: `scripts/check-contextual-onboarding-home-phase-v1.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Tasks 1–4 and existing Block 17 checks.
- Produces: `npm run check:daily-operations` and inclusion in the canonical Block 17 phase gate.

- [ ] **Step 1: Write the failing aggregate contract**

Create a Node script that checks source/model markers for:

```js
const required = [
  'Siguiente acción',
  'Prioridades actuales',
  'Casos activos',
  'Cambios relevantes',
  '/app/inicio',
  '/app/casos/',
]
```

It must reject known legacy destinations in home JSX, reject raw technical terms (`provider trace`, `token usage`, `queue job`, `agent prompt`) in rendered daily sections, and reject unsupported claim phrases (`cumplimiento confirmado`, `certificado`).

- [ ] **Step 2: Wire the script before satisfying it and confirm RED**

Add:

```json
"check:daily-operations": "node scripts/check-daily-operations-close-v1.mjs"
```

and invoke it from `check-contextual-onboarding-home-phase-v1.mjs`. Run `npm run check:daily-operations`; expected FAIL until all markers/contracts are satisfied.

- [ ] **Step 3: Make only contract-required corrections**

Fix source markers/canonical links/copy discovered by the aggregate check. Do not broaden scope into C — Expediente or new modules.

- [ ] **Step 4: Run the Block 17 focused gate**

```bash
npm run check:daily-operations
npm run check:contextual-onboarding-home
npm run check:activation-first-action
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-daily-operations-close-v1.mjs scripts/check-contextual-onboarding-home-phase-v1.mjs package.json app/dashboard/daily-content.tsx lib/product/home/authenticated-home.ts
git commit -m "test: gate daily operations close"
```

---

### Task 6: Final exact-HEAD verification and integration readiness

**Files:**
- No production files unless a verified gate failure requires a bounded fix.

**Interfaces:**
- Consumes: completed Tasks 1–5.
- Produces: merge-ready B — Operación diaria with fresh evidence for the exact HEAD.

- [ ] **Step 1: Run focused contracts**

```bash
npm run check:authenticated-home
npm run check:daily-operations
npm run check:contextual-onboarding-home
npm run check:activation-first-action
npm run check:ui-golden-path
```

- [ ] **Step 2: Run release validation**

```bash
npm run release:check
npm run typecheck
npm run build
```

Expected: all PASS.

- [ ] **Step 3: Verify CI/Vercel for the exact HEAD**

Require Release Gate, Application Validation/typecheck/build, Release Qualification Foundation/smoke, and both Vercel previews to report success for the same commit SHA.

- [ ] **Step 4: Review diff for scope and claims**

Confirm no migrations, RLS, billing/payment, provider assurance, new modules, new scoring, or C — Expediente redesign entered the branch. Confirm Bloque 16/UI Golden Path guardrails remain intact.

- [ ] **Step 5: Mark PR ready only after all evidence is green**

Use squash merge only after the exact HEAD is mergeable and all required checks are green.

## Self-review

- Spec coverage: all 15 design sections are represented by Tasks 1–6; relevant-changes omission behavior is handled without a new event subsystem.
- Placeholder scan: no TBD/TODO/future implementation placeholders.
- Type consistency: the plan keeps the existing `buildAuthenticatedHomeModel` signature and existing `home.primaryStatus`, `home.nextAction`, `home.priorities`, `home.cases`, and `home.changes` interfaces; no parallel state model is introduced.
