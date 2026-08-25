# Kumplio Activation First-Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move a newly onboarded user from deterministic diagnosis directly into the correct existing work surface, preserve case context, acknowledge the first successful useful action truthfully, and return continuity to `/app/inicio`.

**Architecture:** Keep the existing onboarding persistence, case/document mutations, and authenticated shell. Add a small activation handoff state to the onboarding UI, build destination URLs from the existing diagnosis plus onboarding-created `caseId`, and reuse existing document/case success paths for truthful progress feedback. No new database model, analytics subsystem, evidence state, scoring system, or RLS exception is introduced.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.7, Supabase-backed existing mutations, Node `.mjs` guardrail tests, Vercel previews.

**Spec:** `docs/superpowers/specs/2026-08-25-kumplio-activation-first-action-design.md`

## Global Constraints

- Primary metric: time to first useful action.
- `/app/inicio` remains canonical home but is not an obligatory stop after diagnosis.
- `upload_document` routes to `/app/documentos`; `review_context` and `confirm_scope` route to `/app/casos`.
- Preserve existing onboarding persistence and existing case/document mutation paths.
- Do not add a second onboarding model, parallel evidence store, compliance scoring, RLS exceptions, billing/payment changes, tours, gamification, or new modules.
- Never claim verified evidence, sufficiency, or compliance from onboarding inputs or upload success alone.
- Invalid or unsafe destination/context falls back to `/app/inicio`.
- Implementation must follow TDD and the exact-HEAD release gates in the spec.

---

### Task 1: Activation destination builder

**Files:**
- Create: `lib/product/onboarding/activation-handoff.ts`
- Create: `scripts/test-activation-handoff.mjs`
- Modify: `package.json`
- Modify: `scripts/check-contextual-onboarding-home-phase-v1.mjs`

**Interfaces:**
- Consumes: `OnboardingDiagnosis` from `lib/product/onboarding/contextual-diagnosis.ts` and optional onboarding-created `caseId: string | null | undefined`.
- Produces: `buildActivationHandoff(diagnosis, caseId): { title: string; explanation: string; primaryHref: string; primaryLabel: string; secondaryHref: '/app/inicio' }`.

- [ ] **Step 1: Write the failing behavior test**

Create `scripts/test-activation-handoff.mjs` with assertions for:

```js
import assert from 'node:assert/strict'
import { buildActivationHandoff } from '../lib/product/onboarding/activation-handoff.ts'

const contextDiagnosis = {
  caseTitle: 'Resolver situación personal: revisar contexto',
  status: 'information_incomplete',
  nextAction: { title: 'Revisar el contexto de tu situación personal', href: '/app/casos' },
}

const documentDiagnosis = {
  caseTitle: 'Resolver para la organización: documentos',
  status: 'action_required',
  nextAction: { title: 'Subir el primer documento disponible', href: '/app/documentos' },
}

assert.equal(buildActivationHandoff(contextDiagnosis, 'case-123').primaryHref, '/app/casos?case=case-123&activation=1')
assert.equal(buildActivationHandoff(documentDiagnosis, 'case-123').primaryHref, '/app/documentos?case=case-123&activation=1')
assert.equal(buildActivationHandoff(contextDiagnosis, null).primaryHref, '/app/inicio')
assert.equal(buildActivationHandoff({ ...contextDiagnosis, nextAction: { ...contextDiagnosis.nextAction, href: '/review-center' } }, 'case-123').primaryHref, '/app/inicio')
assert.equal(buildActivationHandoff(contextDiagnosis, 'case-123').secondaryHref, '/app/inicio')
assert.equal(buildActivationHandoff(contextDiagnosis, 'case-123').primaryLabel, contextDiagnosis.nextAction.title)
assert.ok(!buildActivationHandoff(contextDiagnosis, 'case-123').explanation.toLowerCase().includes('cumplimiento confirmado'))

console.log('Activation handoff: PASS')
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/test-activation-handoff.mjs
```

Expected: FAIL because `lib/product/onboarding/activation-handoff.ts` does not exist.

- [ ] **Step 3: Implement the minimal destination builder**

Create `lib/product/onboarding/activation-handoff.ts` with a narrow whitelist:

```ts
import type { OnboardingDiagnosis } from './contextual-diagnosis'

type HandoffDiagnosis = Pick<OnboardingDiagnosis, 'caseTitle' | 'status' | 'nextAction'>

export function buildActivationHandoff(diagnosis: HandoffDiagnosis, caseId?: string | null) {
  const safeCaseId = caseId?.trim()
  const allowed = diagnosis.nextAction.href === '/app/casos' || diagnosis.nextAction.href === '/app/documentos'
  const primaryHref = allowed && safeCaseId
    ? `${diagnosis.nextAction.href}?case=${encodeURIComponent(safeCaseId)}&activation=1`
    : '/app/inicio'

  return {
    title: diagnosis.caseTitle,
    explanation: explanationFor(diagnosis.status),
    primaryHref,
    primaryLabel: diagnosis.nextAction.title,
    secondaryHref: '/app/inicio' as const,
  }
}

function explanationFor(status: HandoffDiagnosis['status']) {
  if (status === 'action_required') return 'Hay una acción prioritaria que conviene resolver primero antes de seguir ampliando el diagnóstico.'
  if (status === 'information_incomplete') return 'Falta confirmar contexto o antecedentes antes de sacar conclusiones; esta es la mejor siguiente acción.'
  return 'Ya existe suficiente contexto inicial para avanzar con una primera acción concreta y trazable.'
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/test-activation-handoff.mjs
```

Expected: `Activation handoff: PASS`.

- [ ] **Step 5: Wire the focused test into the canonical Block 17 gate**

Add to `package.json`:

```json
"check:activation-handoff": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/test-activation-handoff.mjs"
```

Update `scripts/check-contextual-onboarding-home-phase-v1.mjs` so the phase guardrail also requires the activation handoff contract. Do not add a separate release path.

- [ ] **Step 6: Run the Block 17 gate**

Run:

```bash
npm run check:activation-handoff
npm run check:contextual-onboarding-home
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/product/onboarding/activation-handoff.ts scripts/test-activation-handoff.mjs scripts/check-contextual-onboarding-home-phase-v1.mjs package.json
git commit -m "feat: add activation handoff routing"
```

---

### Task 2: Keep the diagnosis on screen and hand off directly

**Files:**
- Modify: `components/onboarding/workspace-onboarding-form.tsx`
- Modify: `scripts/check-contextual-onboarding-ui-v1.mjs`

**Interfaces:**
- Consumes: `buildActivationHandoff()` from Task 1 and `data.workspace?.caseId` from the existing `/api/onboarding/initialize` response.
- Produces: a post-persistence activation handoff UI with one primary contextual CTA and one secondary `/app/inicio` CTA.

- [ ] **Step 1: Add failing UI guardrail assertions**

Extend `scripts/check-contextual-onboarding-ui-v1.mjs` to require all of the following source markers in `components/onboarding/workspace-onboarding-form.tsx`:

```text
buildActivationHandoff
activationHandoff
Ir a mi siguiente acción
Ver mi inicio
```

And forbid the old unconditional completion redirect marker:

```text
router.replace(`/app/inicio?case=
```

- [ ] **Step 2: Run the UI guardrail and verify RED**

Run:

```bash
npm run check:contextual-onboarding-ui
```

Expected: FAIL because the activation handoff state/CTAs are not present and the old direct redirect still exists.

- [ ] **Step 3: Add activation handoff state**

In `components/onboarding/workspace-onboarding-form.tsx`:

```ts
import Link from 'next/link'
import { buildActivationHandoff } from '@/lib/product/onboarding/activation-handoff'

const [activationHandoff, setActivationHandoff] = useState<ReturnType<typeof buildActivationHandoff> | null>(null)
```

After successful `/api/onboarding/initialize` persistence:

```ts
const caseId = data.workspace?.caseId as string | undefined
window.sessionStorage.removeItem(GUIDED_ONBOARDING_DRAFT_KEY)
setActivationHandoff(buildActivationHandoff(diagnosis, caseId))
```

Remove the unconditional `router.replace(...)` after successful persistence. Remove `useRouter` if it is no longer used elsewhere in the file.

- [ ] **Step 4: Render the compact handoff after persistence**

When `activationHandoff` is non-null, render a replacement section rather than the four-step form. The content must include:

```tsx
<h2>Tu primer paso ya está claro</h2>
<h3>{activationHandoff.title}</h3>
<p>{activationHandoff.explanation}</p>
<Button asChild>
  <Link href={activationHandoff.primaryHref}>
    Ir a mi siguiente acción
  </Link>
</Button>
<Button asChild variant="outline">
  <Link href={activationHandoff.secondaryHref}>
    Ver mi inicio
  </Link>
</Button>
```

Show `activationHandoff.primaryLabel` adjacent to the primary CTA so the user knows exactly what will happen next. Do not use copy that implies verified evidence or compliance.

- [ ] **Step 5: Run focused onboarding gates**

Run:

```bash
npm run check:contextual-onboarding
npm run check:contextual-onboarding-persistence
npm run check:contextual-onboarding-ui
npm run check:activation-handoff
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add components/onboarding/workspace-onboarding-form.tsx scripts/check-contextual-onboarding-ui-v1.mjs
git commit -m "feat: hand off onboarding to first action"
```

---

### Task 3: Make the document path activation-aware and truthful

**Files:**
- Modify: `app/documents/content.tsx`
- Create: `scripts/check-activation-document-progress-v1.mjs`
- Modify: `package.json`
- Modify: `scripts/check-contextual-onboarding-home-phase-v1.mjs`

**Interfaces:**
- Consumes: query parameters `activation=1` and `case=<id>` from Task 1.
- Reuses: the existing persisted upload success callback in `DocumentsContent`.
- Produces: activation-specific acknowledgement only after `DocumentUpload` reports success.

- [ ] **Step 1: Write the failing source guardrail**

Create `scripts/check-activation-document-progress-v1.mjs` to assert that `app/documents/content.tsx`:

```js
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync('app/documents/content.tsx', 'utf8')

for (const marker of [
  'useSearchParams',
  "searchParams.get('activation') === '1'",
  "searchParams.get('case')",
  'Primer antecedente agregado',
  '/app/inicio',
]) assert.ok(source.includes(marker), `missing marker: ${marker}`)

const successIndex = source.indexOf('function handleUploadSuccess')
const activationCopyIndex = source.indexOf('Primer antecedente agregado')
assert.ok(successIndex >= 0 && activationCopyIndex > successIndex, 'activation confirmation must be driven by upload success')

for (const forbidden of ['evidencia verificada', 'cumplimiento confirmado']) {
  assert.ok(!source.toLowerCase().includes(forbidden), `forbidden activation claim: ${forbidden}`)
}

console.log('Activation document progress: PASS')
```

- [ ] **Step 2: Run and verify RED**

Run:

```bash
node scripts/check-activation-document-progress-v1.mjs
```

Expected: FAIL on the missing activation markers.

- [ ] **Step 3: Add activation-aware upload confirmation**

In `app/documents/content.tsx`, use `useSearchParams()` and read:

```ts
const searchParams = useSearchParams()
const isActivation = searchParams.get('activation') === '1'
const activationCaseId = searchParams.get('case')
```

Keep the existing normal success copy unchanged for ordinary traffic. In `handleUploadSuccess()`, when `isActivation && activationCaseId`, set:

```ts
setSuccessMessage('Primer antecedente agregado. El documento quedó cargado y enviado a análisis; todavía requiere revisión humana.')
```

Otherwise preserve:

```ts
setSuccessMessage('Documento cargado y enviado a análisis.')
```

When activation success is present, render a small continuation link/button to `/app/inicio?case=${encodeURIComponent(activationCaseId)}` with copy `Volver a Inicio y ver el siguiente paso`.

Do not show the activation completion copy before `handleUploadSuccess()` fires.

- [ ] **Step 4: Run focused guardrails**

Run:

```bash
node scripts/check-activation-document-progress-v1.mjs
npm run check:contextual-onboarding-home
```

Expected: PASS.

- [ ] **Step 5: Wire the check into package/gate**

Add:

```json
"check:activation-document-progress": "node scripts/check-activation-document-progress-v1.mjs"
```

Require it from `scripts/check-contextual-onboarding-home-phase-v1.mjs`.

- [ ] **Step 6: Commit**

```bash
git add app/documents/content.tsx scripts/check-activation-document-progress-v1.mjs scripts/check-contextual-onboarding-home-phase-v1.mjs package.json
git commit -m "feat: confirm first document activation progress"
```

---

### Task 4: Preserve case context on the context/scope path

**Files:**
- Modify: `app/app/casos/page.tsx`
- Create: `scripts/check-activation-case-context-v1.mjs`
- Modify: `package.json`
- Modify: `scripts/check-contextual-onboarding-home-phase-v1.mjs`

**Interfaces:**
- Consumes: `case=<id>&activation=1` generated by Task 1.
- Reuses: the existing canonical case detail route `/app/casos/[id]` and its current compatibility behavior.
- Produces: deterministic forwarding from activation-aware case-list entry to the onboarding-created case.

- [ ] **Step 1: Write the failing guardrail**

Create `scripts/check-activation-case-context-v1.mjs` asserting that `app/app/casos/page.tsx` reads `searchParams`, validates an activation case id, and redirects to `/app/casos/${caseId}?activation=1`. The guardrail must also reject legacy `/cases/` as the activation destination constructed by this page.

Representative assertions:

```js
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync('app/app/casos/page.tsx', 'utf8')
for (const marker of ['searchParams', 'activation', 'case', '/app/casos/']) {
  assert.ok(source.includes(marker), `missing marker: ${marker}`)
}
assert.ok(!source.includes('redirect(`/cases/${'), 'activation entry must not construct a legacy case URL')
console.log('Activation case context: PASS')
```

- [ ] **Step 2: Run and verify RED**

Run:

```bash
node scripts/check-activation-case-context-v1.mjs
```

Expected: FAIL because the current canonical case list page does not consume activation context.

- [ ] **Step 3: Add the activation-aware redirect**

Update `app/app/casos/page.tsx` to accept `searchParams: Promise<Record<string, string | string[] | undefined>>`. Resolve `activation` and `case`; when `activation === '1'` and `case` is a non-empty scalar string, redirect to:

```ts
redirect(`/app/casos/${encodeURIComponent(caseId)}?activation=1`)
```

Otherwise preserve the page's existing normal behavior exactly.

This task does **not** change `app/app/casos/[id]/page.tsx` yet. Its existing compatibility redirect remains outside the activation entry builder; changing case-detail architecture belongs to C — Expediente, not A — Activación.

- [ ] **Step 4: Run focused checks**

Run:

```bash
node scripts/check-activation-case-context-v1.mjs
npm run check:product-workflows
npm run check:contextual-onboarding-home
```

Expected: PASS.

- [ ] **Step 5: Wire the check into package/gate**

Add:

```json
"check:activation-case-context": "node scripts/check-activation-case-context-v1.mjs"
```

Require it from `scripts/check-contextual-onboarding-home-phase-v1.mjs`.

- [ ] **Step 6: Commit**

```bash
git add app/app/casos/page.tsx scripts/check-activation-case-context-v1.mjs scripts/check-contextual-onboarding-home-phase-v1.mjs package.json
git commit -m "feat: preserve activation case context"
```

---

### Task 5: End-to-end activation contract and release verification

**Files:**
- Create: `scripts/check-activation-first-action-v1.mjs`
- Modify: `package.json`
- Modify: `scripts/check-contextual-onboarding-home-phase-v1.mjs`

**Interfaces:**
- Consumes: Task 1 routing, Task 2 handoff, Task 3 document acknowledgement, Task 4 case context forwarding.
- Produces: one Block 17 source-level regression contract covering the complete activation chain.

- [ ] **Step 1: Write the end-to-end source contract**

Create `scripts/check-activation-first-action-v1.mjs` that reads the touched production files and requires this chain:

```text
workspace-onboarding-form.tsx
  -> buildActivationHandoff
activation-handoff.ts
  -> /app/casos or /app/documentos
  -> case + activation query context
app/app/casos/page.tsx
  -> activation case forwarding
app/documents/content.tsx
  -> success-only activation confirmation
  -> /app/inicio continuation
```

Also reject these legacy/unsafe markers in the activation-specific code paths:

```text
/review-center
/dashboard
cumplimiento confirmado
evidencia verificada
```

- [ ] **Step 2: Run the contract**

Run:

```bash
node scripts/check-activation-first-action-v1.mjs
```

Expected: PASS after Tasks 1–4.

- [ ] **Step 3: Add the canonical script and phase gate**

Add:

```json
"check:activation-first-action": "node scripts/check-activation-first-action-v1.mjs"
```

Require it from `scripts/check-contextual-onboarding-home-phase-v1.mjs` so `release:check` exercises the entire activation chain.

- [ ] **Step 4: Run all focused product checks**

Run:

```bash
npm run check:contextual-onboarding
npm run check:contextual-onboarding-persistence
npm run check:contextual-onboarding-ui
npm run check:authenticated-home
npm run check:product-workflows
npm run check:activation-handoff
npm run check:activation-document-progress
npm run check:activation-case-context
npm run check:activation-first-action
npm run check:contextual-onboarding-home
```

Expected: all PASS.

- [ ] **Step 5: Run the full verification suite**

Run:

```bash
npm run release:check
npm run typecheck
npm run build
```

Expected: all exit 0. Then verify the repository's Release Gate, Application Validation, Release Qualification Foundation, smoke, and both Vercel previews are green for the exact HEAD before merge.

- [ ] **Step 6: Review scope before merge**

Confirm the diff contains only activation/onboarding/case-entry/document-progress tests and UI logic. There must be no migrations, RLS changes, billing/payment changes, provider-assurance changes, or B/C phase redesign.

- [ ] **Step 7: Commit**

```bash
git add scripts/check-activation-first-action-v1.mjs scripts/check-contextual-onboarding-home-phase-v1.mjs package.json
git commit -m "test: gate activation first-action flow"
```

---

## Self-review result

- Spec coverage: diagnosis handoff, direct contextual CTA, safe fallback, case identity continuity, document useful-action confirmation, truthful copy, `/app/inicio` continuation, TDD, and release gates are covered.
- Measurement: no analytics subsystem is added. Existing persisted timestamps/audit data remain the source for later measurement work, as required by the spec.
- Context/scope useful-action limitation: this plan preserves the onboarding-created case and gets the user to that case context. It deliberately does not invent a new persisted `context_complete` event. If implementation proves there is no existing persisted case action that can truthfully constitute context/scope advancement, execution must stop before adding a new persistence model and return to design, exactly as required by the spec.
- Non-goals: B — Operación diaria and C — Expediente redesign remain out of scope.