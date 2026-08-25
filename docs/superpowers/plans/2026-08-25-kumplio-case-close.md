# Kumplio Case-Centric App Close Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close Kumplio’s authenticated product experience around a single canonical case-centric loop from grounded context through action, evidence, human review, closure, and recomputed Inicio.

**Architecture:** Replace the current `/app/casos/[id] -> /cases/[id]` escape with a canonical authenticated case page that composes the existing case workspace, baseline assurance, similar-case context, operational plan, evidence/review state, and closure behavior under `/app/*`. Reuse existing persisted case/action/evidence/review models and existing close/audit contracts; this plan changes presentation, routing, and bounded orchestration only, not core persistence semantics.

**Tech Stack:** Next.js 16.2.6, React 19, TypeScript 5.7.3, Supabase SSR/admin client, existing compliance/case/evidence/review domain modules, Node source/behavior guardrails, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-25-kumplio-case-close-design.md`

## Global Constraints

- Canonical authenticated case navigation is `/app/casos/<caseId>`.
- Reuse existing case persistence/lifecycle, operational plan/actions, source/fragment/obligation/requirement relationships, document/evidence/control lifecycle, human review/audit primitives, specialist outputs, authenticated shell, and `/app/inicio` recomputation.
- Do not create a parallel case model, evidence status model, workflow engine, compliance score, agent orchestration layer, destructive migration, relaxed RLS, billing/payment change, or provider-assurance shortcut.
- Exactly one dominant next action may appear at the top of a case when actionable work exists.
- Uploaded/received evidence must not be represented as accepted or verified unless the existing reviewed state supports that wording.
- Closure must continue to honor existing lifecycle, review, evidence, and audit preconditions.
- Specialist outputs may expose conclusions/provenance/review state, never prompts, chain-of-thought, token usage, provider internals, queue/job IDs, retry mechanics, or raw model payloads.
- Bloque 16 remains authoritative; no new claims of full compliance, certification, final deletion 3/3, PITR observed, OpenAI Standard/MAM confirmed, tenant configuration verified 3/3, external pilot completion, or self-service beta readiness.
- Existing UI Golden Path and Bloque 16 guardrails may be extended but not weakened or removed.

---

### Task 1: Make `/app/casos/[id]` the real canonical case page

**Files:**
- Modify: `app/app/casos/[id]/page.tsx`
- Modify: `app/cases/[caseId]/page.tsx`
- Create: `components/cases/canonical-case-page.tsx`
- Create: `scripts/check-canonical-case-entry-v1.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing `GuidedCaseWorkspace`, `CaseBaselineAssurance`, `SimilarCasesPanel`, `CaseOperationalPlan`.
- Produces: `CanonicalCasePage({ caseId }: { caseId: string })` rendered by `/app/casos/[id]`; legacy `/cases/[caseId]` becomes a redirect to the canonical route.

- [ ] **Step 1: Write the failing canonical-entry guard**

Create `scripts/check-canonical-case-entry-v1.mjs` and assert:

```js
import assert from 'node:assert/strict'
import fs from 'node:fs'

const canonical = fs.readFileSync('app/app/casos/[id]/page.tsx', 'utf8')
const legacy = fs.readFileSync('app/cases/[caseId]/page.tsx', 'utf8')

assert.ok(!canonical.includes('redirect(`/cases/${id}`)'), 'Canonical case route must not escape to legacy /cases')
assert.ok(canonical.includes('CanonicalCasePage'), 'Canonical case route must render the canonical case experience')
assert.ok(legacy.includes('redirect(`/app/casos/${caseId}`)'), 'Legacy case route must redirect into /app/casos')
```

Add `"check:canonical-case-entry": "node scripts/check-canonical-case-entry-v1.mjs"` to `package.json`.

- [ ] **Step 2: Run the focused check and confirm RED**

Run: `npm run check:canonical-case-entry`

Expected: FAIL because `/app/casos/[id]` currently redirects to `/cases/[id]`.

- [ ] **Step 3: Extract the existing case composition without changing behavior**

Create `components/cases/canonical-case-page.tsx`:

```tsx
import { CaseBaselineAssurance } from '@/components/cases/case-baseline-assurance'
import { CaseOperationalPlan } from '@/components/cases/case-operational-plan'
import { GuidedCaseWorkspace } from '@/components/cases/guided-case-workspace'
import { SimilarCasesPanel } from '@/components/cases/similar-cases-panel'

export function CanonicalCasePage({ caseId }: { caseId: string }) {
  return (
    <>
      <GuidedCaseWorkspace caseId={caseId} />
      <CaseBaselineAssurance caseId={caseId} />
      <SimilarCasesPanel caseId={caseId} />
      <CaseOperationalPlan caseId={caseId} />
    </>
  )
}
```

- [ ] **Step 4: Point both routes in the correct direction**

`app/app/casos/[id]/page.tsx` renders `CanonicalCasePage`; `app/cases/[caseId]/page.tsx` performs only `redirect(`/app/casos/${caseId}`)`.

- [ ] **Step 5: Run the focused check and confirm GREEN**

Run: `npm run check:canonical-case-entry`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/app/casos/[id]/page.tsx app/cases/[caseId]/page.tsx components/cases/canonical-case-page.tsx scripts/check-canonical-case-entry-v1.mjs package.json
git commit -m "fix: make authenticated case route canonical"
```

---

### Task 2: Introduce a bounded case read model and one dominant next action

**Files:**
- Create: `lib/product/cases/case-workspace-model.ts`
- Create: `scripts/test-case-workspace-model.mjs`
- Modify: `components/cases/canonical-case-page.tsx`
- Modify: `package.json`

**Interfaces:**
- Produces:

```ts
export type CaseWorkspaceModel = {
  status: { label: string; explanation: string }
  nextAction: { title: string; href: string } | null
  context: { summary: string; whyItMatters: string }
  blockers: string[]
}

export function buildCaseWorkspaceModel(input: CaseWorkspaceInput): CaseWorkspaceModel
```

- Consumes only existing persisted case/action/review/evidence summaries passed in by the case composition layer.

- [ ] **Step 1: Write failing model tests**

Add tests that prove:

```js
assert.equal(model.nextAction?.href.startsWith('/app/'), true)
assert.equal(modelWithOpenAction.nextAction?.title, 'Completar acción pendiente')
assert.equal(modelBlocked.nextAction, null)
assert.ok(modelBlocked.blockers.includes('Revisión humana pendiente'))
```

Also assert only one `nextAction` object exists in the returned model.

- [ ] **Step 2: Run the model test and confirm RED**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/test-case-workspace-model.mjs`

Expected: FAIL because the builder does not exist.

- [ ] **Step 3: Implement the minimal deterministic builder**

Priority order:

```text
open persisted action
→ evidence review required
→ human review required
→ closure eligible
→ no dominant action
```

All internal hrefs must canonicalize to `/app/casos/<caseId>` or an existing `/app/documentos` destination.

- [ ] **Step 4: Render a single top-of-case status/next-action section**

`CanonicalCasePage` receives/builds the model and renders one `Estado del caso` section and at most one primary CTA. Do not remove existing workspace/plan components yet.

- [ ] **Step 5: Run tests and confirm GREEN**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/test-case-workspace-model.mjs
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add lib/product/cases/case-workspace-model.ts scripts/test-case-workspace-model.mjs components/cases/canonical-case-page.tsx package.json
git commit -m "feat: add canonical case workspace model"
```

---

### Task 3: Present the grounded chain without implying satisfaction

**Files:**
- Modify: `components/cases/guided-case-workspace.tsx`
- Create: `components/cases/case-grounding-chain.tsx`
- Create: `scripts/check-case-grounding-chain-v1.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: the existing source/fragment/obligation/requirement information already loaded or persisted for the guided case workspace.
- Produces: a progressive-disclosure `CaseGroundingChain` section with product labels `Fuente`, `Fragmento`, `Obligación`, `Requisito` and explicit applicability/sufficiency state.

- [ ] **Step 1: Write the failing source contract**

Require these product markers and forbid satisfaction conflation:

```js
for (const marker of ['Fuente', 'Fragmento', 'Obligación', 'Requisito', 'Aplicabilidad']) assert.ok(source.includes(marker))
for (const forbidden of ['Fuente encontrada = requisito cumplido', 'Requisito satisfecho automáticamente']) assert.ok(!source.includes(forbidden))
```

- [ ] **Step 2: Run and confirm RED**

Run: `npm run check:case-grounding-chain` after wiring the new script.

- [ ] **Step 3: Extract the chain into `CaseGroundingChain`**

Render existing values only. Empty states must use truthful copy such as `Aún no hay una fuente vinculada` or `Aplicabilidad pendiente de revisión`.

- [ ] **Step 4: Keep deep details progressively disclosed**

Use native `<details>`/`<summary>` or an already-existing disclosure component; no new dependency.

- [ ] **Step 5: Run focused checks and typecheck**

```bash
npm run check:case-grounding-chain
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add components/cases/guided-case-workspace.tsx components/cases/case-grounding-chain.tsx scripts/check-case-grounding-chain-v1.mjs package.json
git commit -m "feat: expose grounded case chain"
```

---

### Task 4: Make specialist contributions product-facing and hide execution plumbing

**Files:**
- Modify: `components/cases/guided-case-workspace.tsx`
- Create: `components/cases/case-specialist-contributions.tsx`
- Create: `scripts/check-case-specialist-surface-v1.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing persisted specialist/agent outputs already displayed or available in the guided case experience.
- Produces: bounded contribution categories: `Análisis normativo`, `Evaluación de riesgo`, `Controles y evidencia`, `Plan de acción`, `Revisión jurídica/calidad`.

- [ ] **Step 1: Write the failing source guard**

The rendered case surface must not contain user-facing labels/fields for:

```text
prompt
chain of thought
reasoning trace
token usage
provider request
queue job
retry count
raw payload
```

Require the five product contribution labels above.

- [ ] **Step 2: Run and confirm RED**

Run: `npm run check:case-specialists`.

- [ ] **Step 3: Add `CaseSpecialistContributions`**

Map existing persisted outputs into the five product categories, exposing conclusion, provenance/source references when available, confidence/review state where already persisted, and human-boundary copy.

- [ ] **Step 4: Remove/relocate technical execution detail from the user-facing case flow**

Do not delete underlying persistence or admin/debug capabilities; only remove them from the primary case presentation.

- [ ] **Step 5: Run focused guard + Golden Path**

```bash
npm run check:case-specialists
npm run check:ui-golden-path
```

- [ ] **Step 6: Commit**

```bash
git add components/cases/guided-case-workspace.tsx components/cases/case-specialist-contributions.tsx scripts/check-case-specialist-surface-v1.mjs package.json
git commit -m "feat: simplify specialist case contributions"
```

---

### Task 5: Align evidence and human-review states with persisted truth

**Files:**
- Modify: `components/cases/case-baseline-assurance.tsx`
- Modify: `components/cases/guided-case-workspace.tsx`
- Create: `scripts/check-case-evidence-review-surface-v1.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing document/evidence/control/review status values.
- Produces: explicit user-facing states for received/linked/pending review/accepted/rejected/insufficient/verified only when supported.

- [ ] **Step 1: Add failing evidence-language contract**

Require `Pendiente de revisión`, `Evidencia insuficiente` or equivalent bounded state support and reject unconditional language such as:

```text
Evidencia verificada
Cumplimiento confirmado
Todo en regla
```

unless source-level conditionals prove the label is gated by an accepted/verified reviewed state.

- [ ] **Step 2: Run and confirm RED**

Run: `npm run check:case-evidence-review`.

- [ ] **Step 3: Align existing evidence cards/status copy**

Do not introduce new status enums. Map only existing persisted states to bounded labels.

- [ ] **Step 4: Make human-review blocking state visible**

If evidence or closure requires review, show who/what is pending when available and never render closure acknowledgement before the persisted mutation succeeds.

- [ ] **Step 5: Run focused guard + lifecycle gates**

```bash
npm run check:case-evidence-review
npm run check:control-evidence-lifecycle
npm run check:atomic-agent-review
```

- [ ] **Step 6: Commit**

```bash
git add components/cases/case-baseline-assurance.tsx components/cases/guided-case-workspace.tsx scripts/check-case-evidence-review-surface-v1.mjs package.json
git commit -m "fix: align case evidence and review states"
```

---

### Task 6: Make closure legible, blocked when required, and return to Inicio

**Files:**
- Modify: `components/cases/case-operational-plan.tsx`
- Modify: the existing case close action/route used by this component only if needed to preserve canonical continuation
- Create: `scripts/check-case-close-experience-v1.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing case lifecycle and close/audit mutation contracts.
- Produces: closure UI that explains complete/open/blocking items and only acknowledges success after the existing persisted close succeeds; successful continuation targets `/app/inicio`.

- [ ] **Step 1: Write the failing close-experience contract**

Require markers for `Cierre`, blocked/review state, `/app/inicio`, and the existing atomic close/audit primitive. Reject any source path that bypasses that primitive.

- [ ] **Step 2: Run and confirm RED**

Run: `npm run check:case-close-experience`.

- [ ] **Step 3: Align close UI around existing preconditions**

Render what is complete, what remains open, review/evidence blockers, and what the close action changes. Do not duplicate the eligibility calculation if an existing domain helper/response already provides it.

- [ ] **Step 4: Ensure successful close continues to canonical Inicio**

Use existing redirect/navigation behavior after persisted success; no optimistic success before the mutation response.

- [ ] **Step 5: Run close/audit gates**

```bash
npm run check:case-close-experience
npm run check:case-close-audit
npm run check:case-lifecycle
```

- [ ] **Step 6: Commit**

```bash
git add components/cases/case-operational-plan.tsx scripts/check-case-close-experience-v1.mjs package.json <existing-close-action-file-if-changed>
git commit -m "feat: close the canonical case loop"
```

---

### Task 7: Align Documentos and remaining touched surfaces to case context

**Files:**
- Modify: `app/app/documentos/page.tsx` and/or the existing document upload component used there
- Modify: only existing real Personas/Alertas/Actividad/Configuración surfaces that are already linked from authenticated navigation and demonstrably functional
- Create: `scripts/check-authenticated-cross-surface-close-v1.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing `case`/`caseId` context already used by activation/document flows.
- Produces: canonical back-links to `/app/casos/<caseId>` when context exists; no fake module completion.

- [ ] **Step 1: Add failing cross-surface contract**

Require document case-context continuation and reject user-facing legacy routes such as `/dashboard`, `/review-center`, `/cases/`, `/documents` where canonical `/app/*` equivalents exist.

- [ ] **Step 2: Run and confirm RED**

Run: `npm run check:authenticated-cross-surface-close`.

- [ ] **Step 3: Fix only real touched flows**

Documentos gets explicit return-to-case context when available. For Personas/Alertas/Actividad/Configuración, either preserve an existing real functional surface or keep it intentionally absent/progressively disclosed; do not build placeholder modules.

- [ ] **Step 4: Run product navigation checks**

```bash
npm run check:authenticated-cross-surface-close
npm run check:product-workflows
npm run check:contextual-onboarding-home
```

- [ ] **Step 5: Commit**

```bash
git add app/app/documentos package.json scripts/check-authenticated-cross-surface-close-v1.mjs <only-existing-functional-surface-files-changed>
git commit -m "fix: align authenticated case context across surfaces"
```

---

### Task 8: Add the final app-close aggregate gate

**Files:**
- Create: `scripts/check-app-close-v1.mjs`
- Modify: `scripts/check-contextual-onboarding-home-phase-v1.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Tasks 1–7 plus existing A/B activation/daily-operation gates.
- Produces: `npm run check:app-close` permanently gating Bloque 17 product closure.

- [ ] **Step 1: Create the aggregate contract before wiring it**

The script must execute or inspect:

```text
check:canonical-case-entry
case workspace model
check:case-grounding-chain
check:case-specialists
check:case-evidence-review
check:case-close-experience
check:authenticated-cross-surface-close
check:daily-operations
check:activation-first-action
```

It must also reject unsupported product claims and known legacy authenticated escapes.

- [ ] **Step 2: Wire the aggregate into the canonical Bloque 17 phase gate and confirm RED**

Add `"check:app-close": "node scripts/check-app-close-v1.mjs"` and require it from `check-contextual-onboarding-home-phase-v1.mjs` before the aggregate is fully satisfied.

Run: `npm run check:contextual-onboarding-home`.

Expected: FAIL until all required markers/checks exist.

- [ ] **Step 3: Make only contract-required corrections**

Do not broaden scope to Bloque 16 external evidence or new modules.

- [ ] **Step 4: Run focused final product gates**

```bash
npm run check:app-close
npm run check:contextual-onboarding-home
npm run check:daily-operations
npm run check:activation-first-action
npm run check:ui-golden-path
```

- [ ] **Step 5: Commit**

```bash
git add scripts/check-app-close-v1.mjs scripts/check-contextual-onboarding-home-phase-v1.mjs package.json
git commit -m "test: gate authenticated app close"
```

---

### Task 9: Exact-HEAD release verification and Bloque 17 closure readiness

**Files:**
- No production files unless a verified failure requires a bounded fix.

**Interfaces:**
- Consumes: completed Tasks 1–8.
- Produces: a merge-ready exact HEAD with evidence sufficient to call the application/product experience technically closed for Bloque 17.

- [ ] **Step 1: Run focused case and product checks**

```bash
npm run check:canonical-case-entry
npm run check:app-close
npm run check:contextual-onboarding-home
npm run check:daily-operations
npm run check:activation-first-action
npm run check:case-close-audit
npm run check:control-evidence-lifecycle
npm run check:ui-golden-path
```

- [ ] **Step 2: Run the release validation commands**

```bash
npm run release:check
npm run typecheck
npm run build
```

Expected: all PASS.

- [ ] **Step 3: Verify exact-HEAD CI and deployment**

Require success for the same SHA from:

```text
Release Gate
Application Validation / typecheck / build
Release Qualification Foundation / smoke
Vercel – kumplio
Vercel – v0-normative-compliance-analysis
```

- [ ] **Step 4: Review the complete PR diff for forbidden scope**

Confirm no destructive migrations, RLS relaxation, billing/payment changes, provider-assurance shortcuts, new compliance scoring, new event/workflow engines, fake modules, or weakened guardrails entered the branch.

- [ ] **Step 5: Verify product claims boundary**

Confirm the authenticated app contains no new language claiming full compliance, certification, final deletion 3/3, PITR observed, OpenAI Standard/MAM confirmed, tenant verification 3/3, external pilot completion, or self-service beta readiness.

- [ ] **Step 6: Mark PR ready and squash-merge only after all exact-HEAD evidence is green**

The merge commit closes **Bloque 17 product experience**, not Bloque 16 external evidence.

## Self-review

- Spec coverage: Tasks 1–9 cover the canonical case route, case hierarchy, grounded source chain, specialist presentation, evidence lifecycle, human review, closure, cross-surface alignment, legacy-route close, responsive/source-level operating contract, final aggregate gate, and exact-HEAD release verification.
- Placeholder scan: no TBD/TODO/future-work placeholders are used. File choices that depend on an already-existing close action are explicitly constrained to the existing action used by `CaseOperationalPlan`; no new interface is invented.
- Type consistency: `CanonicalCasePage({ caseId })` and `buildCaseWorkspaceModel(input)` are the only new cross-task interfaces; all other work composes existing domain components and persistence contracts.
