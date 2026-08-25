# Kumplio Three-Agent Core Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce new Kumplio case workflows to a bounded `Analizar → Resolver → Revisar` core while preserving historical workflows, specialist identities, persisted artifacts, retries, review, audit and closure behavior.

**Architecture:** Introduce versioned workflow definitions in application logic rather than rewriting persisted rows. New workflow creation resolves to a v2 core definition; historical workflow execution resolves against the recorded/persisted stage shape or v1 compatibility definition. Extend existing Isidora and Verónica schemas/prompts to absorb routine risk triage and remediation planning, keep Julieta (`catalina`) as the independent final reviewer, and route Rodrigo/Javier/Beatriz/Andrés only through deterministic bounded specialist rules.

**Tech Stack:** Next.js 16, TypeScript, Zod, Supabase persistence, OpenAI structured outputs, Node guardrail scripts, GitHub Actions/Vercel release gates.

**Spec:** `docs/superpowers/specs/2026-08-25-kumplio-three-agent-core-design.md`

## Global Constraints

- Do not delete or rename any existing `AgentId`.
- Preserve `catalina` as the stored id for Julieta.
- Do not rewrite historical workflow rows or artifact records.
- Do not change tenant isolation/RLS, auth, billing/payment, provider assurance, audit/event persistence, atomic review or case-close semantics.
- New standard workflows must complete without Rodrigo, Javier, Beatriz or Andrés unless deterministic routing explicitly requires them.
- Optional specialist failure must not corrupt core workflow state.
- Julieta remains an independent final quality stage and human review remains required under existing contracts.
- Keep context bounded and deterministic; never expose chain-of-thought or internal reasoning.

---

### Task 1: Version workflow definitions without breaking historical execution

**Files:**
- Modify: `lib/agents/orchestration.ts`
- Create: `scripts/check-three-agent-workflow-versioning-v1.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing `WorkflowType`, `WorkflowDefinition`, `getWorkflowDefinition`, `getWorkflowStage`, `getWorkflowTemplates`.
- Produces: version-aware workflow definitions for new execution plus explicit v1 compatibility definitions.

- [ ] **Step 1: Write the failing versioning contract**

Create `scripts/check-three-agent-workflow-versioning-v1.mjs` asserting that source contains both a historical v1 definition and a v2 default definition, that v2 compliance assessment has exactly three core stages, and that v1 still contains historical Rodrigo/Javier stages.

```js
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync('lib/agents/orchestration.ts', 'utf8')
assert.ok(source.includes('WORKFLOW_DEFINITIONS_V1'))
assert.ok(source.includes('WORKFLOW_DEFINITIONS_V2'))
assert.ok(source.includes("version: 'v2'"))
assert.ok(source.includes("agentId: 'isidora'"))
assert.ok(source.includes("agentId: 'veronica'"))
assert.ok(source.includes("agentId: 'catalina'"))
assert.ok(source.includes("agentId: 'rodrigo'"), 'historical v1 must remain readable')
assert.ok(source.includes("agentId: 'javier'"), 'historical v1 must remain readable')
```

- [ ] **Step 2: Run the check and confirm RED**

Run: `node scripts/check-three-agent-workflow-versioning-v1.mjs`

Expected: FAIL because the source currently has only one unversioned definition set.

- [ ] **Step 3: Add explicit v1/v2 workflow definitions**

Refactor `lib/agents/orchestration.ts` so the current arrays are preserved as `WORKFLOW_DEFINITIONS_V1`, and add `WORKFLOW_DEFINITIONS_V2` with new default stages:

```ts
export type WorkflowVersion = 'v1' | 'v2'

export const WORKFLOW_DEFINITIONS_V1 = { /* current definitions unchanged */ }
export const WORKFLOW_DEFINITIONS_V2 = {
  compliance_assessment: {
    version: 'v2',
    type: 'compliance_assessment',
    label: 'Evaluación integral',
    description: 'Analizar, resolver y revisar con especialistas opcionales cuando aportan valor.',
    stages: [
      { index: 0, agentId: 'isidora', label: 'Análisis normativo y riesgo', dependsOn: [], task: '...' },
      { index: 1, agentId: 'veronica', label: 'Resolución, controles y evidencia', dependsOn: [0], task: '...' },
      { index: 2, agentId: 'catalina', label: 'Revisión de calidad', dependsOn: [0, 1], task: '...' },
    ],
  },
  contract_review: { /* same three-agent pattern */ },
  control_assessment: { /* bounded Verónica + Julieta path; avoid duplicate calls when possible */ },
} satisfies Record<WorkflowType, WorkflowDefinition>
```

Update getters so the default is v2 while callers can explicitly ask for v1:

```ts
export function getWorkflowDefinition(type: string, version: WorkflowVersion = 'v2') {
  const catalog = version === 'v1' ? WORKFLOW_DEFINITIONS_V1 : WORKFLOW_DEFINITIONS_V2
  return catalog[type as WorkflowType] || null
}
```

- [ ] **Step 4: Run focused check and existing orchestration checks**

```bash
node scripts/check-three-agent-workflow-versioning-v1.mjs
npm run check:agent-committee
npm run check:workflow-persistence
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/agents/orchestration.ts scripts/check-three-agent-workflow-versioning-v1.mjs package.json
git commit -m "feat: version three-agent workflow definitions"
```

---

### Task 2: Extend Isidora to perform bounded risk triage

**Files:**
- Modify: `lib/agents/schemas.ts`
- Modify: `lib/agents/prompts.ts`
- Create: `scripts/check-three-agent-analysis-contract-v1.mjs`

**Interfaces:**
- Consumes: existing Isidora output schema.
- Produces: Isidora v2 output fields `riskTriage` and explicit assumptions sufficient for routine prioritization without invoking Rodrigo.

- [ ] **Step 1: Write a failing schema/prompt contract**

Assert that Isidora contains a bounded triage structure and prompt language forbidding full quantitative modeling:

```js
assert.ok(schemaSource.includes('riskTriage'))
assert.ok(schemaSource.includes('materiality'))
assert.ok(schemaSource.includes('urgency'))
assert.ok(schemaSource.includes('assumptions'))
assert.ok(promptSource.includes('triage de riesgo'))
assert.ok(promptSource.includes('no sustituye un análisis cuantitativo dedicado'))
```

- [ ] **Step 2: Run and confirm RED**

Run: `node scripts/check-three-agent-analysis-contract-v1.mjs`

Expected: FAIL because Isidora currently owns only obligations/applicability.

- [ ] **Step 3: Extend the existing Isidora schema minimally**

Add:

```ts
riskTriage: z.array(z.object({
  topic: z.string(),
  materiality: z.enum(['low', 'medium', 'high', 'critical', 'unknown']),
  urgency: z.enum(['low', 'medium', 'high', 'critical', 'unknown']),
  confidence,
  assumptions: z.array(z.string()),
  requiresDedicatedRiskAnalysis: z.boolean(),
}))
```

Increment only Isidora's schema version.

- [ ] **Step 4: Update Isidora's prompt boundary**

Make Isidora responsible for routine materiality/urgency triage while explicitly escalating scenario analysis, sensitivity and monetary modeling to Rodrigo.

- [ ] **Step 5: Verify focused and grounding contracts**

```bash
node scripts/check-three-agent-analysis-contract-v1.mjs
npm run check:sst-agent-grounding
npm run check:isidora-applicability
npm run check:isidora-case-relevance
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/agents/schemas.ts lib/agents/prompts.ts scripts/check-three-agent-analysis-contract-v1.mjs
git commit -m "feat: add bounded risk triage to analysis"
```

---

### Task 3: Extend Verónica to produce remediation actions and closure criteria

**Files:**
- Modify: `lib/agents/schemas.ts`
- Modify: `lib/agents/prompts.ts`
- Create: `scripts/check-three-agent-resolution-contract-v1.mjs`

**Interfaces:**
- Consumes: normalized Stage 1 output plus existing control/evidence context.
- Produces: `remediationActions` and `closureCriteria` within Verónica's existing artifact model, replacing routine Javier calls.

- [ ] **Step 1: Write the failing contract**

Require Verónica schema/prompt markers:

```js
for (const marker of ['remediationActions', 'ownerRole', 'dependencies', 'closureCriteria']) {
  assert.ok(schemaSource.includes(marker), `missing ${marker}`)
}
assert.ok(promptSource.includes('acciones correctivas'))
assert.ok(promptSource.includes('escala a Javier'))
```

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-three-agent-resolution-contract-v1.mjs`.

- [ ] **Step 3: Add bounded remediation fields to Verónica**

```ts
remediationActions: z.array(z.object({
  title: z.string(),
  description: z.string(),
  ownerRole: z.string().nullable(),
  dependencies: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  closureCriteria: z.array(z.string()),
  requiresDedicatedPlan: z.boolean(),
}))
```

Do not remove existing `controlAssessments` or `findings`.

- [ ] **Step 4: Update Verónica's prompt**

Define routine remediation ownership but explicitly route complex RACI, multi-phase rollout or change-management work to Javier.

- [ ] **Step 5: Verify evidence/control contracts**

```bash
node scripts/check-three-agent-resolution-contract-v1.mjs
npm run check:control-evidence-lifecycle
npm run check:case-operational-plan
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/agents/schemas.ts lib/agents/prompts.ts scripts/check-three-agent-resolution-contract-v1.mjs
git commit -m "feat: add remediation output to resolution stage"
```

---

### Task 4: Add deterministic specialist routing

**Files:**
- Modify: `lib/agents/orchestrator.ts`
- Create: `scripts/test-three-agent-specialist-routing.mjs`

**Interfaces:**
- Consumes: `CaseIntent`, normalized goal text and optional explicit routing metadata.
- Produces: core tasks plus a bounded `specialists` array; no open-ended agent loop.

- [ ] **Step 1: Write table-driven failing tests**

Test at least these cases:

```js
[
  { goal: 'Revisar cumplimiento general', expected: [] },
  { goal: 'Qué cambió en la nueva norma y cuándo entra en vigencia', expected: ['beatriz'] },
  { goal: 'Modelar escenarios de multa e impacto financiero', expected: ['rodrigo'] },
  { goal: 'Necesito RACI y rollout por fases', expected: ['javier'] },
  { goal: 'Analizar recurrencias y tiempos de ciclo', expected: ['andres'] },
]
```

Also assert the standard plan always contains Isidora/Verónica/Julieta in core order and does not include Rodrigo/Javier/Beatriz/Andrés as mandatory core tasks.

- [ ] **Step 2: Run and confirm RED**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/test-three-agent-specialist-routing.mjs`.

Expected: FAIL because `buildTasks` currently includes Rodrigo/Javier in most standard intents.

- [ ] **Step 3: Refactor orchestration plan shape**

Introduce:

```ts
export type OrchestrationPlan = {
  intent: CaseIntent
  audience: UserAudience
  goal: string
  missingContext: string[]
  tasks: AgentTask[]        // three core product stages
  specialists: AgentTask[]  // zero or bounded optional specialist contributions
  finalReviewer: 'catalina'
}
```

Core tasks must map to `Analizar`, `Resolver`, `Revisar`. Specialist routing must be deterministic from explicit intent/terms and deduplicate identities.

- [ ] **Step 4: Keep Andrés outside synchronous critical path**

For `improve-system`, return Andrés in `specialists` with an explicit `asyncPreferred: true`/equivalent bounded metadata rather than replacing the core case resolution path.

- [ ] **Step 5: Run focused tests**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/test-three-agent-specialist-routing.mjs
npm run check:agent-committee
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/agents/orchestrator.ts scripts/test-three-agent-specialist-routing.mjs
git commit -m "feat: route specialists only when needed"
```

---

### Task 5: Bound committee context for the three-stage core

**Files:**
- Modify: `lib/agents/committee.ts`
- Modify: `lib/agents/workflow-stage-executor.ts`
- Create: `scripts/check-three-agent-context-budget-v1.mjs`

**Interfaces:**
- Consumes: persisted artifacts and current workflow stage.
- Produces: stage-aware bounded context: none for Stage 1, normalized relevant prior output for Stage 2, bounded summaries for Stage 3 plus optional specialists.

- [ ] **Step 1: Write failing context-budget assertions**

Require explicit caps and stage-aware selection. At minimum:

```js
assert.ok(committee.includes('MAX_COMMITTEE_ARTIFACTS'))
assert.ok(committee.includes('MAX_COMMITTEE_CHARS'))
assert.ok(executor.includes('buildBoundedCommitteeContext'))
```

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-three-agent-context-budget-v1.mjs`.

- [ ] **Step 3: Replace arbitrary last-six forwarding with bounded selection**

Create an exported helper such as:

```ts
export function buildBoundedCommitteeContext(input: {
  agentId: AgentId
  stageIndex: number
  artifacts: ArtifactRecord[]
  workflowVersion?: 'v1' | 'v2'
}) { /* deterministic selection and character caps */ }
```

For v1, preserve compatibility with existing semantics as closely as possible. For v2, do not send committee contrast to Stage 1; Stage 2 receives only relevant analysis/specialist input; Stage 3 receives bounded summaries needed for independent review.

- [ ] **Step 4: Wire the stage executor without changing persistence**

Keep artifact creation, retry versioning, status transitions and provider-trace persistence untouched; only change the context assembly path.

- [ ] **Step 5: Run resilience contracts**

```bash
node scripts/check-three-agent-context-budget-v1.mjs
npm run check:agent-retry-versioning
npm run check:workflow-concurrency
npm run check:stale-workflow-recovery
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/agents/committee.ts lib/agents/workflow-stage-executor.ts scripts/check-three-agent-context-budget-v1.mjs
git commit -m "perf: bound multi-agent context propagation"
```

---

### Task 6: Preserve historical workflows while defaulting new creation to v2

**Files:**
- Modify: workflow-creation API/service files that create `agent_workflows` / `agent_workflow_stages` after locating them by existing imports/usages of `getWorkflowDefinition` or `COMPLIANCE_ASSESSMENT_WORKFLOW`
- Modify: `lib/agents/orchestration.ts` if compatibility resolver is needed
- Create: `scripts/check-three-agent-historical-compat-v1.mjs`

**Interfaces:**
- Consumes: persisted workflow/stage rows and new workflow creation requests.
- Produces: new workflows using v2; historical rows resolve against their persisted stages/v1 semantics without rewrite.

- [ ] **Step 1: Locate the exact creation boundary before editing**

Search the repository for calls that insert into `agent_workflows` and `agent_workflow_stages`, and for imports of `getWorkflowDefinition`, `getWorkflowStage`, or `COMPLIANCE_ASSESSMENT_WORKFLOW`. Record those exact files in the commit notes; do not create a parallel workflow service.

- [ ] **Step 2: Write a failing compatibility guard**

Assert that new creation explicitly requests/records `v2` or otherwise derives v2 deterministically, while executor/recovery code can still resolve historical v1 stage identities.

- [ ] **Step 3: Add a non-destructive application compatibility layer**

If a persisted workflow already has stage rows, trust those stage rows as historical truth and do not regenerate them from the new default definition. For new creation, generate stage rows from v2 definitions. If a workflow-version metadata field already exists, use it; if it does not, do not add a destructive migration—derive historical compatibility from existing persisted stage shape and keep version selection in application logic.

- [ ] **Step 4: Verify persistence/recovery/review/close contracts**

```bash
node scripts/check-three-agent-historical-compat-v1.mjs
npm run check:workflow-persistence
npm run check:agent-retry-versioning
npm run check:atomic-agent-review
npm run check:stale-workflow-recovery
npm run check:case-close-audit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add <located-workflow-creation-files> lib/agents/orchestration.ts scripts/check-three-agent-historical-compat-v1.mjs
git commit -m "fix: preserve historical workflow compatibility"
```

---

### Task 7: Simplify the user-facing contribution model to Analizar → Resolver → Revisar

**Files:**
- Modify: `components/cases/case-specialist-contributions.tsx`
- Modify: `components/cases/guided-case-workspace.tsx` only if required for labels/order
- Create: `scripts/check-three-agent-product-surface-v1.mjs`

**Interfaces:**
- Consumes: existing persisted artifacts, including old Rodrigo/Javier/Beatriz/Andrés artifacts.
- Produces: three primary contribution groups with optional specialist support shown contextually, not as a mandatory persona parade.

- [ ] **Step 1: Write the failing product-surface contract**

Require primary labels:

```js
for (const marker of ['Análisis', 'Resolución', 'Revisión']) assert.ok(source.includes(marker))
for (const forbidden of ['Riesgos', 'Plan de acción', 'Intentos utilizados']) assert.ok(!primarySurface.includes(forbidden))
```

Also require optional support labels such as `Cambio regulatorio`, `Análisis cuantitativo de riesgo`, and `Plan de ejecución` to remain renderable when old/on-demand artifacts exist.

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-three-agent-product-surface-v1.mjs`.

- [ ] **Step 3: Group artifacts by product contribution, not mandatory identity count**

Map Isidora → `Análisis`, Verónica → `Resolución`, Julieta → `Revisión`. Map Rodrigo/Beatriz/Javier/Andrés to optional contextual support. Historical artifacts remain visible and are not discarded.

- [ ] **Step 4: Keep case state/next decision visually dominant**

Do not add a new agent dashboard. Preserve the current polished case hierarchy and existing human-review language.

- [ ] **Step 5: Verify case/app close contracts**

```bash
node scripts/check-three-agent-product-surface-v1.mjs
npm run check:app-close
npm run check:product-polish
npm run check:ui-golden-path
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/cases/case-specialist-contributions.tsx components/cases/guided-case-workspace.tsx scripts/check-three-agent-product-surface-v1.mjs
git commit -m "feat: simplify specialist contributions to three stages"
```

---

### Task 8: Add the permanent three-agent release gate and exact-HEAD verification

**Files:**
- Create: `scripts/check-three-agent-core-v1.mjs`
- Modify: `scripts/check-app-close-v1.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Tasks 1–7.
- Produces: `npm run check:three-agent-core` wired into the canonical application close/release path.

- [ ] **Step 1: Write the aggregate guard before wiring it**

The script must assert:

- v2 defaults have three core product stages;
- v1 historical definitions remain present;
- Isidora has bounded risk triage;
- Verónica has remediation/closure outputs;
- Julieta is the final independent reviewer;
- specialist routing is deterministic and optional;
- committee context is bounded;
- product surface uses `Análisis → Resolución → Revisión`;
- no existing `AgentId` was removed.

- [ ] **Step 2: Wire `check:three-agent-core` into `package.json` and `check-app-close-v1.mjs`**

```json
"check:three-agent-core": "node scripts/check-three-agent-core-v1.mjs"
```

- [ ] **Step 3: Run focused aggregate checks**

```bash
npm run check:three-agent-core
npm run check:app-close
npm run check:agent-committee
npm run check:workflow-persistence
npm run check:agent-retry-versioning
npm run check:atomic-agent-review
npm run check:stale-workflow-recovery
npm run check:case-close-audit
```

Expected: PASS.

- [ ] **Step 4: Run full release validation on the exact HEAD**

```bash
npm run release:check
npm run typecheck
npm run build
```

Require Foundation smoke and the normal GitHub/Vercel checks to pass on the same commit SHA.

- [ ] **Step 5: Review scope before integration**

Confirm there are no migrations, RLS changes, billing/payment changes, provider-assurance shortcuts, destructive historical rewrites, deleted agent ids, or UI regressions that expose internal reasoning.

- [ ] **Step 6: Mark the PR ready only after exact-HEAD evidence is green**

Use squash merge only after the branch is mergeable and all required checks pass.

## Self-review

- Spec coverage: Tasks 1 and 6 cover versioning/historical compatibility; Tasks 2–3 cover absorbed responsibilities; Task 4 covers deterministic specialist routing; Task 5 covers token/context budget; Task 7 covers user-facing simplification; Task 8 covers permanent gates and release verification.
- Placeholder scan: no TBD/TODO/future implementation placeholders. Task 6 deliberately requires locating the existing workflow creation boundary before editing because the repository search surface did not expose that call site during planning; it explicitly forbids creating a parallel service and defines the exact persistence behavior required.
- Type consistency: `WorkflowVersion`, `OrchestrationPlan.specialists`, Isidora `riskTriage`, Verónica `remediationActions`, and the v1/v2 definition selection are introduced once and referenced consistently across later tasks.
