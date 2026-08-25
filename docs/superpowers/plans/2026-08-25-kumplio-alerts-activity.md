# Kumplio Alerts + Activity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add canonical `/app/alertas` and `/app/actividad` surfaces that project existing tenant-scoped operational state into an actionable attention queue and a human-readable recent history without adding persistence or weakening authorization.

**Architecture:** Add two bounded product read models under `lib/product/operations`: one converts existing daily priorities/case state into deterministic alerts, the other converts existing `compliance_case_events` plus continuous-review timeline items into a bounded chronological activity feed. Server pages resolve the authenticated workspace using the same access pattern as Inicio, query only existing organization-scoped tables, and render canonical `/app/*` links. Navigation exposes the two surfaces only after both routes exist, and a permanent contract is wired into `check:app-close`.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Supabase, Tailwind CSS, lucide-react, Node `.mjs` release-contract scripts.

**Spec:** `docs/superpowers/specs/2026-08-25-kumplio-alerts-activity-design.md`

## Global Constraints

- No database migrations or new persistence models.
- No email, push, SMS, mark-read, archive, snooze, notification preferences, event bus, second audit table, analytics infrastructure, or compliance scoring.
- Preserve existing tenant/workspace scoping and RLS assumptions; never broaden reads across organizations.
- Canonical user-visible destinations must remain under `/app/*`.
- Do not expose retries, prompts, tokens, queue names, internal agent IDs, raw provider mechanics, or chain-of-thought.
- An empty Alertas surface must not imply global compliance.
- Activity is a projection of existing persisted events/transitions, not a new source of truth.
- Preserve all Bloque 16 restrictions and existing Product Polish/App Close contracts.

---

## File Structure

**Create**
- `lib/product/operations/alerts.ts` — pure deterministic alert projection and ordering.
- `lib/product/operations/activity.ts` — pure human-readable activity projection and bounded chronology.
- `app/app/alertas/page.tsx` — authenticated server surface for the attention queue.
- `app/app/actividad/page.tsx` — authenticated server surface for recent meaningful activity.
- `scripts/check-alerts-activity.mjs` — permanent source-level release contract.

**Modify**
- `components/app-navigation.tsx` — expose Alertas and Actividad after routes are real.
- `package.json` — add `check:alerts-activity` and include it in `check:app-close`.

No schema/migration files are part of this plan.

---

### Task 1: Deterministic alert read model

**Files:**
- Create: `lib/product/operations/alerts.ts`
- Test: `scripts/check-alerts-activity.mjs`

**Interfaces:**
- Consumes: existing `DailyPriority`-shaped values and active case state already queried by authenticated surfaces.
- Produces: `buildOperationalAlerts(input): OperationalAlert[]`.

`OperationalAlert` must be:

```ts
export type OperationalAlert = {
  id: string
  category: 'Decisión requerida' | 'Revisión pendiente' | 'Evidencia requerida' | 'Acción pendiente' | 'Cambio relevante'
  title: string
  reason: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  occurredAt: string | null
  href: string
}
```

Input contract:

```ts
export type OperationalAlertInput = {
  priorities: Array<{
    id: string
    type: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    title: string
    summary: string
    href?: string | null
  }>
  cases: Array<{
    id: string
    title: string
    status: string
    updatedAt?: string | null
  }>
}
```

- [ ] **Step 1: Write the failing contract for the alert model**

Create `scripts/check-alerts-activity.mjs` initially with:

```js
import fs from 'node:fs'

function read(path) {
  if (!fs.existsSync(path)) throw new Error(`Missing ${path}`)
  return fs.readFileSync(path, 'utf8')
}

const alerts = read('lib/product/operations/alerts.ts')

for (const marker of [
  'buildOperationalAlerts',
  "'Decisión requerida'",
  "'Revisión pendiente'",
  "'Evidencia requerida'",
  "'Acción pendiente'",
  "'Cambio relevante'",
  '/app/casos/',
]) {
  if (!alerts.includes(marker)) throw new Error(`Alert model missing: ${marker}`)
}

if (/Math\.random|Date\.now\(\).*severity|riskScore|complianceScore/.test(alerts)) {
  throw new Error('Alert ordering/category must remain deterministic and must not add scoring')
}

console.log('Alerts + Activity contract: PASS')
```

- [ ] **Step 2: Run the contract and verify RED**

Run:

```bash
node scripts/check-alerts-activity.mjs
```

Expected: FAIL with `Missing lib/product/operations/alerts.ts`.

- [ ] **Step 3: Implement the minimal deterministic model**

Create `lib/product/operations/alerts.ts` with the exported types above and this behavior:

```ts
const categoryWeight: Record<OperationalAlert['category'], number> = {
  'Decisión requerida': 0,
  'Revisión pendiente': 1,
  'Evidencia requerida': 2,
  'Acción pendiente': 3,
  'Cambio relevante': 4,
}

const severityWeight: Record<OperationalAlert['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export function buildOperationalAlerts(input: OperationalAlertInput): OperationalAlert[] {
  const priorityAlerts = input.priorities.map((priority) => ({
    id: `priority:${priority.id}`,
    category: categoryForPriority(priority.type),
    title: priority.title,
    reason: priority.summary,
    severity: priority.severity,
    occurredAt: null,
    href: canonicalHref(priority.href),
  }))

  const caseAlerts = input.cases.flatMap((item) => {
    const category = categoryForCaseStatus(item.status)
    if (!category) return []
    return [{
      id: `case:${item.id}:${item.status}`,
      category,
      title: item.title,
      reason: reasonForCaseStatus(item.status),
      severity: severityForCaseStatus(item.status),
      occurredAt: item.updatedAt || null,
      href: `/app/casos/${item.id}`,
    } satisfies OperationalAlert]
  })

  return dedupe([...priorityAlerts, ...caseAlerts])
    .sort((a, b) => categoryWeight[a.category] - categoryWeight[b.category]
      || severityWeight[a.severity] - severityWeight[b.severity]
      || timestamp(b.occurredAt) - timestamp(a.occurredAt)
      || a.id.localeCompare(b.id))
}
```

Implement helpers with these deterministic mappings:

- priority `type` containing `review` → `Revisión pendiente`;
- containing `evidence` or `document` → `Evidencia requerida`;
- containing `change`, `regulatory`, or `regulation` → `Cambio relevante`;
- otherwise → `Acción pendiente`;
- case `pending_review` → `Revisión pendiente`;
- `changes_requested` → `Decisión requerida`;
- `failed` → `Decisión requerida`;
- other case statuses do not create an additional case alert;
- unknown priority hrefs fall back to `/app/inicio`; `/cases/<id>` canonicalizes to `/app/casos/<id>`; `/documents` to `/app/documentos`; `/evidence` to `/app/evidencia`.

`dedupe` must prefer the first alert for the same `href + category + title`, so existing ranked priorities are not duplicated by case state.

- [ ] **Step 4: Run the focused contract**

Run:

```bash
node scripts/check-alerts-activity.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/product/operations/alerts.ts scripts/check-alerts-activity.mjs
git commit -m "feat: add operational alert read model"
```

---

### Task 2: Canonical Alertas surface

**Files:**
- Create: `app/app/alertas/page.tsx`
- Modify: `scripts/check-alerts-activity.mjs`

**Interfaces:**
- Consumes: `buildOperationalAlerts` from Task 1; `refreshDailyComplianceSummary`; authenticated workspace access; existing `compliance_cases` rows.
- Produces: canonical `/app/alertas` read-only operational inbox.

- [ ] **Step 1: Extend the contract before creating the page**

Append checks:

```js
const alertPage = read('app/app/alertas/page.tsx')
for (const marker of [
  'buildOperationalAlerts',
  "redirect('/sign-in?next=/app/alertas')",
  "getWorkspaceAccess",
  "eq('organization_id', organizationId)",
  'Qué requiere tu atención',
  'no significa que todas tus obligaciones estén cumplidas',
]) {
  if (!alertPage.includes(marker)) throw new Error(`Alertas surface missing: ${marker}`)
}
if (/service_role|\/cases\//.test(alertPage)) throw new Error('Alertas must preserve canonical tenant-scoped product boundaries')
```

- [ ] **Step 2: Run RED**

Run `node scripts/check-alerts-activity.mjs`.

Expected: FAIL with missing `app/app/alertas/page.tsx`.

- [ ] **Step 3: Implement the server page**

Follow the authenticated access shape used by `DailyComplianceContent`:

```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/sign-in?next=/app/alertas')
const admin = createAdminClient()
const access = await getWorkspaceAccess(admin, user.id)
if (!access) redirect('/onboarding')
const organizationId = access.organizationId
```

Load in parallel:

```ts
const [dailySummary, { data: cases }] = await Promise.all([
  refreshDailyComplianceSummary(admin, organizationId),
  admin.from('compliance_cases')
    .select('id,title,status,updated_at')
    .eq('organization_id', organizationId)
    .not('status', 'in', '(closed,archived)')
    .order('updated_at', { ascending: false })
    .limit(50),
])
```

Build alerts from `dailySummary.priorities` and cases. Render:

- page heading `Qué requiere tu atención`;
- concise helper `Alertas reúne situaciones ya detectadas por Kumplio que requieren revisión o acción.`;
- list grouped only visually by category, preserving model order;
- each item shows category text, title, reason, severity label, timestamp when present, and `Revisar` canonical link;
- empty state title `No hay asuntos pendientes en esta vista.`;
- empty helper exactly includes `Esto refleja la información observada por Kumplio y no significa que todas tus obligaciones estén cumplidas.`;
- focus-visible treatment on every action link.

Do not add mutation buttons.

- [ ] **Step 4: Run focused contract**

Run `node scripts/check-alerts-activity.mjs`.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/app/alertas/page.tsx scripts/check-alerts-activity.mjs
git commit -m "feat: add canonical alerts surface"
```

---

### Task 3: Human-readable activity read model

**Files:**
- Create: `lib/product/operations/activity.ts`
- Modify: `scripts/check-alerts-activity.mjs`

**Interfaces:**
- Consumes: organization-scoped `compliance_case_events` rows and existing continuous-review timeline items.
- Produces: `buildOperationalActivity(input): OperationalActivityItem[]`.

Types:

```ts
export type OperationalActivityItem = {
  id: string
  label: string
  detail: string | null
  occurredAt: string
  href: string
  context: string | null
}

export type OperationalActivityInput = {
  caseEvents: Array<{
    id: string
    caseId: string
    caseTitle?: string | null
    eventType: string
    summary?: string | null
    createdAt: string
  }>
  continuousReviews: Array<{
    id: string
    date: string
    headline: string
    changesFound: number
    criticalItems: number
  }>
  limit?: number
}
```

- [ ] **Step 1: Add RED contract markers**

Append:

```js
const activity = read('lib/product/operations/activity.ts')
for (const marker of [
  'buildOperationalActivity',
  'Caso creado',
  'Análisis actualizado',
  'Evidencia agregada',
  'Revisión solicitada',
  'Revisión completada',
  'Acción actualizada',
  'Caso cerrado',
  '/app/casos/',
  '/app/inicio',
]) {
  if (!activity.includes(marker)) throw new Error(`Activity model missing: ${marker}`)
}
```

- [ ] **Step 2: Run RED**

Expected: FAIL because `lib/product/operations/activity.ts` does not exist.

- [ ] **Step 3: Implement activity projection**

Map `eventType.toLowerCase()` by semantic fragments:

```ts
function labelForEvent(type: string) {
  if (type.includes('created')) return 'Caso creado'
  if (type.includes('evidence') || type.includes('artifact')) return 'Evidencia agregada'
  if (type.includes('review_requested') || type.includes('pending_review')) return 'Revisión solicitada'
  if (type.includes('review') || type.includes('approved') || type.includes('rejected')) return 'Revisión completada'
  if (type.includes('action') || type.includes('plan')) return 'Acción actualizada'
  if (type.includes('closed') || type.includes('completed')) return 'Caso cerrado'
  return 'Análisis actualizado'
}
```

Continuous review rows become:

```ts
{
  id: `continuous:${row.id}`,
  label: 'Análisis actualizado',
  detail: row.headline,
  occurredAt: row.date,
  href: '/app/inicio',
  context: row.changesFound > 0 || row.criticalItems > 0
    ? `${row.changesFound} cambios · ${row.criticalItems} críticos`
    : 'Revisión continua',
}
```

Case events link to `/app/casos/${caseId}` and use `caseTitle` as context. Merge both arrays, sort descending by parsed timestamp then stable `id`, and return `slice(0, clamp(limit || 50, 1, 100))`.

Do not return raw `eventType` in rendered fields.

- [ ] **Step 4: Run focused contract**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/product/operations/activity.ts scripts/check-alerts-activity.mjs
git commit -m "feat: add operational activity read model"
```

---

### Task 4: Canonical Actividad surface

**Files:**
- Create: `app/app/actividad/page.tsx`
- Modify: `scripts/check-alerts-activity.mjs`

**Interfaces:**
- Consumes: `buildOperationalActivity`, `getComplianceTimeline`, existing `compliance_case_events`, existing `compliance_cases` titles.
- Produces: canonical `/app/actividad` bounded recent chronology.

- [ ] **Step 1: Extend the contract**

Append:

```js
const activityPage = read('app/app/actividad/page.tsx')
for (const marker of [
  'buildOperationalActivity',
  "redirect('/sign-in?next=/app/actividad')",
  'getWorkspaceAccess',
  "from('compliance_case_events')",
  "eq('organization_id', organizationId)",
  "from('compliance_cases')",
  'Actividad reciente',
]) {
  if (!activityPage.includes(marker)) throw new Error(`Actividad surface missing: ${marker}`)
}
for (const forbidden of ['attempt_count', 'max_attempts', 'prompt', 'token', 'agent_id', 'queue']) {
  if (activityPage.includes(forbidden)) throw new Error(`Actividad exposes technical plumbing: ${forbidden}`)
}
```

- [ ] **Step 2: Run RED**

Expected: FAIL because `app/app/actividad/page.tsx` is missing.

- [ ] **Step 3: Implement tenant-scoped bounded queries**

Use the same auth/workspace pattern as Alertas, with `next=/app/actividad`.

Load:

```ts
const [timeline, { data: events }] = await Promise.all([
  getComplianceTimeline(admin, organizationId, 20),
  admin.from('compliance_case_events')
    .select('id,case_id,event_type,summary,created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(60),
])
```

Collect unique `case_id` values, then query `compliance_cases` with both `.eq('organization_id', organizationId)` and `.in('id', caseIds)`; build an id→title map. Never trust event ownership without the organization filter.

Pass at most 50 rendered items to the read model.

Render:

- heading `Actividad reciente`;
- helper `Un historial legible de acciones y revisiones ya registradas en tu organización.`;
- semantic `<ol>` timeline;
- label, detail, context, formatted timestamp, and canonical `Ver contexto` link;
- empty state `Todavía no hay actividad reciente para mostrar.`;
- focus-visible treatment.

- [ ] **Step 4: Run focused contract**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/app/actividad/page.tsx scripts/check-alerts-activity.mjs
git commit -m "feat: add canonical activity surface"
```

---

### Task 5: Navigation integration

**Files:**
- Modify: `components/app-navigation.tsx`
- Modify: `scripts/check-alerts-activity.mjs`

**Interfaces:**
- Consumes: real routes from Tasks 2 and 4.
- Produces: discoverable Alertas and Actividad links without legacy destinations.

- [ ] **Step 1: Add navigation assertions**

Append:

```js
const nav = read('components/app-navigation.tsx')
for (const marker of [
  "{ href: '/app/alertas', label: 'Alertas'",
  "{ href: '/app/actividad', label: 'Actividad'",
]) {
  if (!nav.includes(marker)) throw new Error(`Navigation missing: ${marker}`)
}
if (/href: '\/app\/alertas'.*available: false/.test(nav)) throw new Error('Alertas must be enabled after the route exists')
```

- [ ] **Step 2: Run RED**

Expected: FAIL because Alertas is disabled and Actividad is absent.

- [ ] **Step 3: Update navigation minimally**

Import `History` (or `ListChecks`) from lucide-react. Keep Inicio/Casos/Documentos primary. Secondary items become:

```ts
const secondaryItems = [
  { href: '/app/evidencia', label: 'Evidencia', icon: BriefcaseBusiness, available: true },
  { href: '/app/alertas', label: 'Alertas', icon: Bell, available: true },
  { href: '/app/actividad', label: 'Actividad', icon: History, available: true },
  { href: '/app/configuracion', label: 'Configuración', icon: Settings, available: false },
] as const
```

Preserve current horizontal overflow, hit targets, `aria-current`, and `focus-visible` behavior.

- [ ] **Step 4: Run focused contract**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/app-navigation.tsx scripts/check-alerts-activity.mjs
git commit -m "feat: expose alerts and activity navigation"
```

---

### Task 6: Strengthen claim safety and canonical-boundary contract

**Files:**
- Modify: `scripts/check-alerts-activity.mjs`

**Interfaces:**
- Consumes: all implementation files from Tasks 1–5.
- Produces: permanent regression protection for scope boundaries.

- [ ] **Step 1: Add forbidden-plumbing and legacy-route checks**

Add:

```js
const canonicalSurfaces = [alertPage, activityPage]
const forbiddenPlumbing = [
  'attempt_count', 'max_attempts', 'retry', 'prompt', 'token_usage',
  'agent_id', 'provider_response', 'queue_name', 'chain-of-thought',
]
for (const source of canonicalSurfaces) {
  for (const marker of forbiddenPlumbing) {
    if (source.includes(marker)) throw new Error(`Canonical operations UI exposes plumbing: ${marker}`)
  }
  if (/href=["'`]\/cases\//.test(source)) throw new Error('Canonical operations UI links to legacy /cases route')
}
if (!alertPage.includes('no significa que todas tus obligaciones estén cumplidas')) {
  throw new Error('Alertas empty state must remain claim-safe')
}
if (!activity.includes('slice(0')) throw new Error('Activity rendering must remain bounded')
```

- [ ] **Step 2: Run the contract**

Expected: PASS. If it fails, change only the implementation that violates the approved spec; do not weaken the assertion merely to get green.

- [ ] **Step 3: Commit**

```bash
git add scripts/check-alerts-activity.mjs
git commit -m "test: harden alerts and activity boundaries"
```

---

### Task 7: Wire permanent gate into App Close

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: `scripts/check-alerts-activity.mjs`.
- Produces: `npm run check:alerts-activity` and App Close enforcement.

- [ ] **Step 1: Add a RED package assertion to the script**

Append to `scripts/check-alerts-activity.mjs`:

```js
const pkg = JSON.parse(read('package.json'))
if (pkg.scripts?.['check:alerts-activity'] !== 'node scripts/check-alerts-activity.mjs') {
  throw new Error('package.json must expose check:alerts-activity')
}
if (!String(pkg.scripts?.['check:app-close'] || '').includes('check:alerts-activity')) {
  throw new Error('check:app-close must include check:alerts-activity')
}
```

- [ ] **Step 2: Run RED**

Expected: FAIL with missing package script.

- [ ] **Step 3: Update `package.json`**

Add:

```json
"check:alerts-activity": "node scripts/check-alerts-activity.mjs"
```

Insert `npm run check:alerts-activity &&` into the existing `check:app-close` chain. Preserve every existing gate; do not replace or remove any command.

- [ ] **Step 4: Run focused and aggregate checks**

Run:

```bash
npm run check:alerts-activity
npm run check:app-close
```

Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/check-alerts-activity.mjs
git commit -m "test: gate alerts and activity release"
```

---

### Task 8: Exact-HEAD verification and release review

**Files:**
- No product files unless verification identifies a concrete regression.

**Interfaces:**
- Consumes: Tasks 1–7.
- Produces: merge-ready evidence for one exact SHA.

- [ ] **Step 1: Run focused product contracts**

```bash
npm run check:alerts-activity
npm run check:product-polish
npm run check:app-close
```

Expected: PASS.

- [ ] **Step 2: Run typecheck and production build**

Use the repository's existing commands from `package.json`, including the exact typecheck and production-build commands used by Foundation/Application Validation.

Expected: PASS with no TypeScript or Next.js build errors.

- [ ] **Step 3: Run existing Foundation/smoke and Release Gate paths**

Trigger or observe the repository's standard GitHub Actions checks for the exact implementation HEAD. Required green evidence:

- Foundation contracts;
- typecheck;
- production build;
- smoke;
- Application Validation;
- Release Gate / qualification;
- Vercel preview checks.

Do not use green results from an earlier SHA as evidence for the final SHA.

- [ ] **Step 4: Review scope**

Compare the implementation branch against `main`. Confirm no changes under:

- `supabase/migrations/`;
- payment/billing code;
- RLS/security policy files;
- provider-assurance shortcuts;
- new scoring systems.

Expected changed scope: operations read models, two `/app/*` pages, navigation, package scripts, contract, spec/plan.

- [ ] **Step 5: Browser QA when available**

At approximately 390px and desktop width, verify:

- `/app/alertas` loads for an authenticated user;
- `/app/actividad` loads for an authenticated user;
- navigation does not clip critical actions;
- empty and populated states wrap correctly;
- every action stays canonical under `/app/*`;
- no console errors.

If authenticated browser access is unavailable, record that limitation and do not claim this step passed visually.

- [ ] **Step 6: Final commit only if verification required a fix**

For each concrete verification fix, repeat the relevant focused RED/GREEN cycle and commit with a narrow message. Re-run all exact-HEAD checks after the final commit.

---

## Self-review

- Spec coverage: Alertas purpose, deterministic categories/order, Actividad chronology, tenant boundaries, canonical links, navigation, responsive/accessibility markers, claim-safe empty state, no persistence expansion, release gate, and exact-HEAD verification are all assigned to tasks.
- Scope: Alertas and Actividad share the same operation-continuity slice and existing data sources, so they remain one plan rather than independent subsystems.
- No placeholders: all implementation tasks specify exact files, interfaces, mappings, query boundaries, copy, and verification commands.
- Type consistency: `OperationalAlert`, `OperationalAlertInput`, `OperationalActivityItem`, and `OperationalActivityInput` are defined once and consumed by later tasks under the same names.
