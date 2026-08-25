# Kumplio Final Product Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the canonical authenticated Kumplio experience feel professionally finished through tighter navigation, hierarchy, responsive/accessibility polish, clearer case/document/evidence relationships, and permanent regression guards without adding product scope.

**Architecture:** Keep the existing `/app/*` layout, `AppNavigation`, authenticated-home model, case-workspace model, and persistence untouched. Polish only canonical presentation/composition layers and their source-level contracts, while fixing any remaining user-visible legacy route escapes discovered in those canonical surfaces.

**Tech Stack:** Next.js 16.2.6, React 19, TypeScript 5.7.3, Tailwind CSS, existing UI primitives, Supabase-backed existing read/write models, Node assertion guardrails, GitHub Actions/Vercel.

**Spec:** `docs/superpowers/specs/2026-08-25-kumplio-product-polish-design.md`

## Global Constraints

- Keep canonical `/app/*` information architecture and existing product capabilities.
- No database migrations, RLS changes, compliance scoring, new product modules, analytics/event infrastructure, billing/payment changes, provider-assurance shortcuts, or replacement design system.
- One dominant next action per primary work surface.
- Preserve truthful review/evidence boundaries and all Bloque 16 claim-safety contracts.
- Prefer whitespace/typography/dividers over additional nested cards.
- Mobile, tablet, keyboard focus, and long-content behavior are first-class requirements.
- Compatibility redirects may remain, but canonical JSX must not intentionally link users into legacy routes.

---

### Task 1: Harden and polish canonical product navigation

**Files:**
- Modify: `components/app-navigation.tsx`
- Create: `scripts/check-product-polish-v1.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing `AppNavigation()` and `/app/inicio`, `/app/casos`, `/app/documentos`, `/app/evidencia` routes.
- Produces: responsive/focus-safe canonical navigation and initial `npm run check:product-polish` contract.

- [ ] **Step 1: Write the failing product-polish navigation contract**

Create `scripts/check-product-polish-v1.mjs` with source assertions for canonical destinations, active-state semantics, visible focus treatment, and absence of legacy hrefs:

```js
import assert from 'node:assert/strict'
import fs from 'node:fs'

const nav = fs.readFileSync('components/app-navigation.tsx', 'utf8')

for (const href of ['/app/inicio', '/app/casos', '/app/documentos', '/app/evidencia']) {
  assert.ok(nav.includes(href), `App navigation missing canonical destination: ${href}`)
}
assert.match(nav, /aria-current/)
assert.match(nav, /focus-visible:/)
assert.match(nav, /overflow-x-auto/)
assert.doesNotMatch(nav, /href:\s*['"]\/(advisor|cases|documents|evidence)['"]/)

console.log('Product polish: PASS')
```

Add the script to `package.json` only after confirming the direct Node script is RED.

- [ ] **Step 2: Run the new contract and confirm RED**

Run: `node scripts/check-product-polish-v1.mjs`

Expected: FAIL because canonical navigation currently lacks explicit `focus-visible:` styling.

- [ ] **Step 3: Apply minimal navigation polish**

Keep current information architecture. Update `NavigationLink` classes to provide strong keyboard focus, consistent tap targets, and mobile-safe spacing. Use the existing `overflow-x-auto`; do not add another nav or hamburger system.

Example target class shape:

```tsx
className={cn(
  'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  active
    ? 'bg-primary text-primary-foreground shadow-sm'
    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
)}
```

- [ ] **Step 4: Add package script and verify GREEN**

Add:

```json
"check:product-polish": "node scripts/check-product-polish-v1.mjs"
```

Run:

```bash
npm run check:product-polish
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/app-navigation.tsx scripts/check-product-polish-v1.mjs package.json
git commit -m "feat: polish canonical app navigation"
```

---

### Task 2: Simplify Inicio visual hierarchy and copy

**Files:**
- Modify: `app/app/inicio/page.tsx`
- Modify: `app/dashboard/daily-content.tsx`
- Modify: `scripts/check-product-polish-v1.mjs`

**Interfaces:**
- Consumes: existing `buildAuthenticatedHomeModel()` output.
- Produces: same operating order with less redundant copy and less card density; no model/data changes.

- [ ] **Step 1: Add failing Inicio hierarchy/polish assertions**

Extend `check-product-polish-v1.mjs`:

```js
const homePage = fs.readFileSync('app/app/inicio/page.tsx', 'utf8')
const daily = fs.readFileSync('app/dashboard/daily-content.tsx', 'utf8')

for (const marker of ['Estado actual', 'Siguiente acción', 'Prioridades actuales', 'Casos activos', 'Cambios relevantes']) {
  assert.ok(`${homePage}\n${daily}`.includes(marker), `Missing Inicio marker: ${marker}`)
}
assert.ok((daily.match(/Siguiente acción/g) || []).length === 1, 'Inicio must expose one dominant next-action section')
assert.doesNotMatch(homePage, /Tu situación hoy[\s\S]*Qué necesita tu atención[\s\S]*Kumplio ordena lo importante/, 'Inicio intro remains overly layered')
```

- [ ] **Step 2: Run and confirm RED**

Run: `npm run check:product-polish`

Expected: FAIL on redundant layered intro copy.

- [ ] **Step 3: Make minimal Inicio presentation changes**

Reduce the page header to one page identity plus one supporting sentence. Keep `DailyComplianceContent` order unchanged. Reduce container weight on secondary sections: keep the status and next-action boundaries strong; use lighter section separators for priorities/cases/changes where possible rather than adding nested borders.

Example header direction:

```tsx
<header className="mx-auto mb-8 max-w-5xl">
  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Qué necesita tu atención</h1>
  <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Una vista clara de lo que cambió y el siguiente paso que conviene resolver.</p>
</header>
```

Do not change ranking, cases queries, or status semantics.

- [ ] **Step 4: Verify focused contracts**

Run:

```bash
npm run check:product-polish
npm run check:daily-operations
npm run check:authenticated-home
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/app/inicio/page.tsx app/dashboard/daily-content.tsx scripts/check-product-polish-v1.mjs
git commit -m "feat: refine authenticated home hierarchy"
```

---

### Task 3: Professionalize case list and remove remaining visible legacy escapes

**Files:**
- Modify: `app/cases/page.tsx`
- Modify: `components/cases-workspace.tsx`
- Modify: `scripts/check-product-polish-v1.mjs`
- Update affected existing route guardrails only if they explicitly require legacy visible links.

**Interfaces:**
- Consumes: existing case/workflow data already supplied to `CasesWorkspace`.
- Produces: canonical case links `/app/casos/<id>`, one primary case action, reduced card density, and no visible technical trace navigation.

- [ ] **Step 1: Add failing canonical case-list assertions**

Extend the polish contract:

```js
const cases = fs.readFileSync('components/cases-workspace.tsx', 'utf8')
assert.doesNotMatch(cases, /href=\{`\/cases\/\$\{item\.id\}`\}/)
assert.doesNotMatch(cases, /\/cases\/\$\{item\.id\}\/live/)
assert.doesNotMatch(cases, />Trazabilidad</)
assert.match(cases, /`\/app\/casos\/\$\{item\.id\}`/)
assert.match(cases, /focus-visible:/)
```

Also require successful case creation to route into the canonical app:

```js
assert.match(cases, /router\.push\(`\/app\/casos\/\$\{data\.complianceCase\.id\}`\)/)
```

- [ ] **Step 2: Run and confirm RED**

Run: `npm run check:product-polish`

Expected: FAIL because `CasesWorkspace` currently routes creation/card CTAs to `/cases/*` and exposes `/live` trace navigation.

- [ ] **Step 3: Canonicalize actions and simplify presentation**

Change:

```ts
router.push(`/app/casos/${data.complianceCase.id}`)
```

and:

```tsx
<Link href={`/app/casos/${item.id}`}>...</Link>
```

Remove the secondary `Trazabilidad` button; the canonical expediente already contains `Últimos avances`.

Visually, keep filters and the main case action, but reduce each case card's decorative layers. Preserve status chips, title, concise description, `caseMessage(item)`, context/date metadata, and one primary button. Add `focus-visible` to filter buttons and interactive case actions.

- [ ] **Step 4: Align legacy-sensitive guardrails if needed and verify**

Run:

```bash
npm run check:product-polish
npm run check:app-close
npm run check:contextual-onboarding-home
npm run check:ui-golden-path
```

If an existing guard fails solely because it explicitly expects the removed `/cases/*` or `/live` user-visible link, update that exact assertion to require the canonical route/history behavior while leaving substantive workflow/security assertions intact.

- [ ] **Step 5: Commit**

```bash
git add app/cases/page.tsx components/cases-workspace.tsx scripts/check-product-polish-v1.mjs scripts/*.mjs
git commit -m "fix: keep case list in canonical product flow"
```

---

### Task 4: Refine expediente decision hierarchy and long-content behavior

**Files:**
- Modify: `components/cases/guided-case-workspace.tsx`
- Modify: `components/cases/case-specialist-contributions.tsx`
- Modify: `components/cases/case-grounding-chain.tsx`
- Modify: `scripts/check-product-polish-v1.mjs`

**Interfaces:**
- Consumes: existing `buildCaseWorkspaceModel`, persisted artifacts/reviews/stages/events.
- Produces: clearer decision-first expediente hierarchy with supporting analysis visually subordinate; no query/model changes.

- [ ] **Step 1: Add failing expediente polish assertions**

Require the canonical workspace to keep a single model-driven primary action and safe responsive wrapping:

```js
const guided = fs.readFileSync('components/cases/guided-case-workspace.tsx', 'utf8')
assert.match(guided, /workspaceModel\.nextAction/)
assert.match(guided, /break-words|overflow-wrap|truncate|line-clamp/)
assert.match(guided, /focus-visible:/)
assert.doesNotMatch(guided, /Intentos utilizados|Ver trazabilidad|Ejecuciones IA|Workflow ·/)
```

Require supporting components to remain bounded product concepts:

```js
const specialists = fs.readFileSync('components/cases/case-specialist-contributions.tsx', 'utf8')
const grounding = fs.readFileSync('components/cases/case-grounding-chain.tsx', 'utf8')
assert.match(specialists, /Contribuciones al expediente/)
assert.match(grounding, /Fuente|Fragmento|Obligación|Requisito/)
```

- [ ] **Step 2: Run and confirm RED on missing responsive/focus marker**

Run: `npm run check:product-polish`

Expected: FAIL if the main decision CTA/title lacks the required focus/long-content marker.

- [ ] **Step 3: Apply presentation-only expediente polish**

Keep the existing top `Estado del caso` section and one `workspaceModel.nextAction`. Add safe title wrapping (`break-words`) and explicit focus treatment to the dominant CTA. Reduce specialist contribution visual emphasis through lighter boundaries/spacing so the decision and evidence/review states remain stronger.

Keep grounding chain visible but stylistically secondary. Do not modify artifact/review data semantics.

- [ ] **Step 4: Verify case contracts**

Run:

```bash
npm run check:product-polish
npm run check:app-close
npm run check:case-workspace-model
npm run check:case-grounding-chain
npm run check:case-specialist-surface
npm run check:case-evidence-review
```

If exact script names differ, use the existing corresponding `package.json` check commands already wired into `check:app-close`; do not create duplicate behavioral checks.

- [ ] **Step 5: Commit**

```bash
git add components/cases/guided-case-workspace.tsx components/cases/case-specialist-contributions.tsx components/cases/case-grounding-chain.tsx scripts/check-product-polish-v1.mjs
git commit -m "feat: refine expediente decision hierarchy"
```

---

### Task 5: Polish Documentos as a supporting contribution surface

**Files:**
- Modify: `app/documents/client.tsx`
- Modify: `app/documents/content.tsx`
- Modify: `scripts/check-product-polish-v1.mjs`

**Interfaces:**
- Consumes: existing activation `case` query context and existing `DocumentUpload`/`DocumentsList` callbacks.
- Produces: cleaner responsive upload/library layout, concise claim-safe copy, and contextual return to case when available.

- [ ] **Step 1: Add failing Documentos assertions**

```js
const docsClient = fs.readFileSync('app/documents/client.tsx', 'utf8')
const docs = fs.readFileSync('app/documents/content.tsx', 'utf8')
assert.match(docsClient, /px-4[^\n]*sm:px-6|px-4/)
assert.match(docs, /Volver al caso/)
assert.match(docs, /requiere revisión humana/)
assert.doesNotMatch(docs, /cumplimiento confirmado|evidencia verificada automáticamente/i)
```

Add an assertion that the page does not present multiple upload-equivalent dominant CTAs.

- [ ] **Step 2: Run and confirm RED**

Run: `npm run check:product-polish`

Expected: FAIL on responsive container marker because the client currently uses fixed `px-6`.

- [ ] **Step 3: Simplify layout and copy**

Use `px-4 sm:px-6` in the canonical content container. Keep one main upload area and the documents library. Shorten the intro and `Cómo funciona`/`Alcance actual` helper copy where repetitive, but preserve the explicit statement that upload/extraction does not establish compliance and still requires review.

If `activationCaseId` exists, keep `Volver al caso` as the primary success continuation and make Inicio secondary.

- [ ] **Step 4: Verify**

Run:

```bash
npm run check:product-polish
npm run check:activation-first-action
npm run check:authenticated-cross-surface-close
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/documents/client.tsx app/documents/content.tsx scripts/check-product-polish-v1.mjs
git commit -m "feat: polish document contribution flow"
```

---

### Task 6: Polish Evidencia hierarchy, empty states, and canonical context

**Files:**
- Modify: `app/evidence/page.tsx`
- Modify: `components/evidence/evidence-workspace.tsx` only where presentation requires it
- Modify: `components/evidence/evidence-requests-panel.tsx` only where presentation requires it
- Modify: `scripts/check-product-polish-v1.mjs`

**Interfaces:**
- Consumes: existing evidence, requests, cases, controls, documents, members datasets.
- Produces: evidence-supporting hierarchy and claim-safe states; persistence unchanged.

- [ ] **Step 1: Add failing evidence presentation assertions**

```js
const evidencePage = fs.readFileSync('app/evidence/page.tsx', 'utf8')
assert.match(evidencePage, /Pendiente de revisión|revisión/i)
assert.doesNotMatch(evidencePage, /Biblioteca verificable/, 'Page metadata/copy must not imply all stored evidence is verified')
assert.match(evidencePage, /px-4[^\n]*sm:px-6|px-4/)
```

Also require any case links rendered by evidence/request components to use `/app/casos/` rather than `/cases/` when such links exist.

- [ ] **Step 2: Run and confirm RED**

Run: `npm run check:product-polish`

Expected: FAIL because current metadata describes the surface as a `Biblioteca verificable` and the main container uses fixed `px-6`.

- [ ] **Step 3: Apply evidence polish**

Change metadata description to bounded language such as:

```ts
description: 'Evidencias, solicitudes y revisión asociadas al trabajo de cumplimiento en Kumplio.'
```

Use responsive `px-4 sm:px-6`, shorten the page intro, and make requests/review needs visually precede the broader evidence library when that ordering is already supported by the current composition.

Do not change evidence validation/integrity state derivation.

- [ ] **Step 4: Verify evidence and app-close contracts**

Run:

```bash
npm run check:product-polish
npm run check:app-close
npm run check:ui-golden-path
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/evidence/page.tsx components/evidence/evidence-workspace.tsx components/evidence/evidence-requests-panel.tsx scripts/check-product-polish-v1.mjs
git commit -m "feat: refine evidence support surface"
```

---

### Task 7: Complete shared responsive, accessibility, and empty/error-state pass

**Files:**
- Modify only canonical files already touched in Tasks 1–6 where the contract reveals a gap.
- Modify: `scripts/check-product-polish-v1.mjs`

**Interfaces:**
- Consumes: polished canonical surfaces from Tasks 1–6.
- Produces: source-level regression contract for responsive/accessibility/state consistency.

- [ ] **Step 1: Expand the contract with cross-surface invariants**

Add checks that canonical primary product sources contain:

```js
const canonicalSources = [
  'components/app-navigation.tsx',
  'app/dashboard/daily-content.tsx',
  'components/cases-workspace.tsx',
  'components/cases/guided-case-workspace.tsx',
  'app/documents/content.tsx',
  'app/evidence/page.tsx',
].map((file) => [file, fs.readFileSync(file, 'utf8')])

for (const [file, source] of canonicalSources) {
  assert.doesNotMatch(source, /href=["'{`]\/cases(?:\/|["'}`])/, `${file} exposes legacy cases route`)
  assert.doesNotMatch(source, /Intentos utilizados|provider trace|token usage|agent prompt/i, `${file} exposes technical plumbing`)
}
```

For interactive-heavy sources (`AppNavigation`, `CasesWorkspace`, `GuidedCaseWorkspace`), require `focus-visible:`. Require mobile-first spacing/wrapping markers (`sm:`, `flex-col`, or grid collapse) on the main surfaces.

- [ ] **Step 2: Run and confirm any remaining RED**

Run: `npm run check:product-polish`

Expected: any remaining failure identifies a concrete accessibility/responsive gap rather than a new feature request.

- [ ] **Step 3: Make only contract-required corrections**

Examples allowed:

- add `focus-visible:ring-*` to a button/link class;
- add `break-words` to a long title;
- change fixed `px-6` to `px-4 sm:px-6`;
- make metadata wrap before CTA;
- add concise empty-state next action using an existing route;
- ensure error/success text remains visible and not color-only.

Do not refactor unrelated shared primitives.

- [ ] **Step 4: Run all focused product checks**

```bash
npm run check:product-polish
npm run check:activation-first-action
npm run check:daily-operations
npm run check:app-close
npm run check:ui-golden-path
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components app scripts/check-product-polish-v1.mjs
git commit -m "fix: harden polished app responsiveness and access"
```

---

### Task 8: Wire Product Polish into the permanent release gate

**Files:**
- Modify: `scripts/check-app-close-v1.mjs`
- Modify: `scripts/check-contextual-onboarding-home-phase-v1.mjs` only if this remains the canonical Bloque 17 aggregate entry point
- Modify: `package.json` only if final script wiring differs from Task 1

**Interfaces:**
- Consumes: `npm run check:product-polish` from Tasks 1–7.
- Produces: permanent inclusion of final polish contract in the existing app-close/Bloque 17 gate.

- [ ] **Step 1: Add a failing aggregate wiring assertion**

In `check-app-close-v1.mjs`, add the polish check to the `checks` list before running it manually:

```js
['scripts/check-product-polish-v1.mjs'],
```

If the phase aggregate has an explicit list of required app-close scripts, add `check:product-polish` there too.

- [ ] **Step 2: Run aggregate and confirm RED only if wiring/package entry is incomplete**

Run:

```bash
npm run check:app-close
```

Expected: FAIL if the script/package/aggregate relationship is incomplete; otherwise, if it passes immediately, do not manufacture a failure—verify the wiring by temporarily asserting the package marker before the final implementation change.

- [ ] **Step 3: Complete minimal wiring**

Ensure exactly one package script exists:

```json
"check:product-polish": "node scripts/check-product-polish-v1.mjs"
```

and the existing app-close/Bloque 17 aggregate executes it.

- [ ] **Step 4: Verify permanent gates**

```bash
npm run check:product-polish
npm run check:app-close
npm run check:contextual-onboarding-home
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-app-close-v1.mjs scripts/check-contextual-onboarding-home-phase-v1.mjs package.json
git commit -m "test: gate final product polish"
```

---

### Task 9: Exact-HEAD release verification and visual QA where accessible

**Files:**
- No production changes unless a verified failure requires a bounded fix.

**Interfaces:**
- Consumes: Tasks 1–8.
- Produces: merge-ready professional polish with evidence for the exact HEAD.

- [ ] **Step 1: Run focused contracts**

```bash
npm run check:product-polish
npm run check:activation-first-action
npm run check:daily-operations
npm run check:app-close
npm run check:ui-golden-path
```

Expected: all PASS.

- [ ] **Step 2: Run release validation**

```bash
npm run release:check
npm run typecheck
npm run build
```

Expected: all PASS.

- [ ] **Step 3: Verify CI for the exact HEAD**

Require success for the same commit SHA from:

- Release Gate;
- Application Validation including typecheck/build;
- Release Qualification Foundation including smoke;
- lockfile workflow when triggered;
- both Vercel preview statuses.

- [ ] **Step 4: Perform browser QA if authenticated deployment access is available**

Using the existing browser-verification workflow, inspect approximately 390px, 768px, and desktop widths for:

- `/app/inicio`;
- `/app/casos`;
- one representative `/app/casos/<id>`;
- `/app/documentos`;
- `/app/evidencia`.

Confirm meaningful content, no framework overlay, no obvious overflow/clipped primary actions, usable navigation, and no console-level fatal errors.

If Vercel/browser authentication cannot be obtained, record the limitation explicitly and do not claim visual QA passed.

- [ ] **Step 5: Review diff against scope**

Confirm no migrations, RLS changes, payments, new product modules, scoring changes, provider assurance shortcuts, or Bloque 16 claim changes entered the branch. Confirm canonical user-facing JSX contains no intentional `/cases/*`, `/documents`, `/evidence`, `/advisor`, or other legacy-navigation escapes where `/app/*` equivalents exist.

- [ ] **Step 6: Mark PR ready only after fresh exact-HEAD evidence is green**

Use squash merge only after all required checks are green for the current HEAD.

## Self-review

- **Spec coverage:** Navigation, hierarchy, Inicio, Casos/expediente, Documentos, Evidencia, copy, responsive behavior, accessibility, shared states, technical boundaries, legacy cleanup, permanent polish contract, release verification, and browser-QA limitation are each mapped to Tasks 1–9.
- **Placeholder scan:** No TBD/TODO/future placeholders; each implementation step specifies exact files, commands, and expected behavior.
- **Type consistency:** No new data interfaces are introduced. Existing `AppNavigation`, `buildAuthenticatedHomeModel`, `buildCaseWorkspaceModel`, `CasesWorkspace`, `DocumentsContent`, and `EvidencePageContent` contracts are preserved.
