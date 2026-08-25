# Kumplio — Three-Agent Core Orchestration

Date: 2026-08-25
Status: APPROVED DESIGN
Scope: simplify the active multi-agent workflow while preserving historical compatibility

## 1. Objective

Reduce Kumplio's standard case-resolution workflow from a five-stage specialist chain to a three-stage core:

`Analizar → Resolver → Revisar`

The change targets latency, token use, handoff complexity, and product comprehensibility without removing persisted agent identities, historical artifacts, specialist capabilities, or human review boundaries.

## 2. Current state

The catalog currently preserves seven agent identities:

- Isidora — obligations, sources, applicability and documentary evidence
- Rodrigo — regulatory risk and prioritization
- Javier — execution plans
- Beatriz — regulatory change intelligence
- Verónica — controls, evidence, gaps and closure readiness
- Andrés — performance, recurrence and learning
- Julieta (`catalina` historical id) — legal/quality review and communication

The standard workflows execute four or five stages. The integral assessment currently chains Isidora → Rodrigo → Verónica → Javier → Julieta. Each later stage receives prior artifacts for committee contrast, increasing context size and latency.

## 3. Target model

### Stage 1 — Analizar

Primary identity: `isidora`.

Responsibilities:

- extract obligations, requirements, source citations and applicability;
- identify missing information and documentary gaps;
- perform bounded risk triage sufficient to classify materiality, urgency and uncertainty;
- keep legal text, inferred interpretation and risk assumptions clearly separated.

This stage absorbs the routine portion of Rodrigo's work. Rodrigo remains a valid specialist identity but is no longer mandatory in the standard chain.

Escalate to Rodrigo only when the case requires meaningful quantitative scenario analysis, sensitivity, financial exposure or a dedicated residual-risk opinion.

### Stage 2 — Resolver

Primary identity: `veronica`.

Responsibilities:

- compare obligations against controls and evidence;
- distinguish missing evidence from confirmed non-compliance;
- identify gaps, exceptions and closure blockers;
- propose concrete remediation actions, responsible-role suggestions, dependencies and closure criteria.

This stage absorbs the routine portion of Javier's plan-generation work. Javier remains a valid specialist identity but is no longer mandatory in the standard chain.

Escalate to Javier only when the case requires a non-trivial multi-phase roadmap, RACI, change-management plan, complex dependencies or a dedicated execution plan.

### Stage 3 — Revisar

Primary identity: `catalina` (displayed as Julieta).

Responsibilities:

- independently review prior outputs;
- classify assertions as supported, inferred or unsupported;
- identify contradictions, reservations and unresolved questions;
- ensure human review is explicit;
- produce the bounded final recommendation and next decision.

Julieta remains separate from the producing stages so the system preserves an independent quality gate.

## 4. Specialists on demand

### Beatriz

Activate when the case contains a temporal regulatory-change question, including:

- new or amended regulation;
- comparison of versions;
- effective-date analysis;
- official-publication monitoring;
- regulatory delta or impact assessment.

Beatriz should not run for a static compliance case that does not require change intelligence.

### Rodrigo

Activate only when dedicated quantitative or scenario risk work is materially useful beyond Stage 1 triage.

### Javier

Activate only when execution complexity requires a dedicated planning artifact beyond Stage 2 remediation actions.

### Andrés

Activate after or outside the core case workflow for:

- recurrence analysis;
- trend detection;
- cycle-time and quality analytics;
- precedents and learning;
- organizational improvement.

Andrés should not be on the critical path for resolving an individual case.

## 5. Compatibility strategy

Do not delete or rename any existing agent id.

Historical workflows and persisted stage/artifact records must remain readable and executable according to their original definition/version.

New workflows use a new orchestration version. Compatibility rules:

1. existing persisted workflows keep their recorded stage definitions and agent ids;
2. new workflow creation resolves to the simplified three-stage definition;
3. old artifacts from Rodrigo/Javier/Beatriz/Andrés continue to render as valid specialist contributions;
4. retry, review, audit, close/archive, and artifact-versioning behavior remain unchanged;
5. `catalina` remains the stored id for Julieta;
6. no destructive migration is required.

If the current persistence model does not record enough workflow-definition version information to safely distinguish historical workflows, the implementation must add a non-destructive compatibility layer in application logic before changing defaults. Do not rewrite historical rows.

## 6. Workflow definitions

### New compliance assessment

Core stages:

1. `isidora` — `Análisis normativo y riesgo`
2. `veronica` — `Resolución, controles y evidencia`
3. `catalina` — `Revisión de calidad`

Dependencies: `0 → 1 → 2`.

### New contract review

Core stages:

1. `isidora` — `Cláusulas, obligaciones y riesgo`
2. `veronica` — `Controles, respaldo y acciones`
3. `catalina` — `Revisión jurídica y de calidad`

Dedicated Rodrigo/Javier stages are not standard.

### New control assessment

Core stages:

1. `veronica` — `Diseño, evidencia y riesgo`
2. `veronica` or a bounded resolution stage using the same identity — `Brechas y acciones`
3. `catalina` — `Revisión de calidad`

Preferred implementation: avoid two independent LLM calls with the same identity if the first Verónica stage can safely produce both assessment and remediation in one bounded schema. The target is three logical product stages, not mechanically three model calls.

## 7. Routing rules

Specialist activation must be deterministic and bounded. It may use case/workflow metadata and explicit user intent, but must not create an open-ended agent loop.

Examples:

- regulatory change/version/effective-date intent → include Beatriz;
- scenario/quantitative risk request → include Rodrigo;
- complex rollout/RACI/multi-phase remediation request → include Javier;
- trend/precedent/learning request → run Andrés outside the synchronous critical path.

The core workflow must still be able to complete when none of these specialists is activated.

## 8. Context and token budget

The committee contrast layer should stop forwarding an arbitrary pile of all previous artifacts to every stage.

For core stages:

- Stage 1 receives source/case context, not committee contrast;
- Stage 2 receives only the normalized Stage 1 output plus directly relevant persisted evidence/control context;
- Stage 3 receives bounded summaries of the core outputs and any on-demand specialist artifacts.

Keep source citations and structured evidence necessary for review, but cap context deterministically. Do not expose chain-of-thought or internal reasoning.

## 9. Schemas

Prefer extending existing structured schemas rather than introducing parallel artifact models.

Stage 1 output must cover enough of current Isidora + routine Rodrigo responsibilities to support Stage 2, including:

- summary;
- obligations/requirements;
- sources;
- applicability/limitations;
- missing information;
- bounded risk triage with urgency/materiality/confidence and explicit assumptions;
- human review boundary.

Stage 2 output must cover enough of current Verónica + routine Javier responsibilities to support closure, including:

- control/evidence assessment;
- gaps/exceptions;
- evidence sufficiency status;
- remediation actions;
- suggested responsible roles/dependencies;
- closure criteria;
- human review boundary.

Stage 3 keeps Julieta's independent assertion review, contradictions, reservations and decision recommendation.

## 10. UI behavior

The product should present the simplified model as three understandable contributions:

- Análisis
- Resolución
- Revisión

Do not surface internal routing as a parade of agent personas.

When an on-demand specialist contributes, show it as contextual support, for example:

- Cambio regulatorio
- Análisis cuantitativo de riesgo
- Plan de ejecución
- Aprendizaje organizacional

The UI must continue to emphasize the case state and next decision over the mechanics of how many agents ran.

## 11. Failure and fallback behavior

- A specialist failure must not corrupt the core workflow state.
- Optional specialists may produce a visible reservation or missing-analysis marker rather than block the case unless their output is explicitly required by the selected workflow/intent.
- Julieta may block approval when missing specialist work creates a material unresolved issue.
- Retries remain bounded and versioned under the existing retry contract.
- Human review remains required where existing contracts require it.

## 12. Security and compliance boundaries

Do not change:

- tenant isolation/RLS;
- auth boundaries;
- artifact persistence semantics;
- atomic review or case-close behavior;
- audit/event persistence;
- provider-retention/assurance gates;
- claim-safety rules;
- billing/payment behavior.

No agent may claim legal certainty, verified compliance or evidence sufficiency beyond persisted evidence and existing claim contracts.

## 13. Testing and migration gates

Implementation must include permanent contracts proving:

1. new default workflows use the simplified core;
2. historical agent ids remain supported;
3. historical workflow/stage records remain readable;
4. Julieta remains an independent final quality stage;
5. specialist routing is bounded and deterministic;
6. standard cases do not run Rodrigo/Javier/Beatriz/Andrés unnecessarily;
7. optional specialist artifacts remain consumable by review/UI;
8. workflow persistence, retry/versioning, concurrency, stale recovery, review and close/archive contracts remain green;
9. Release Gate, Foundation, typecheck, production build, smoke and Vercel pass on the exact HEAD.

## 14. Success condition

A normal Kumplio case can move from evidence to decision with substantially fewer mandatory model calls and less accumulated context while preserving traceability, specialist depth when needed, independent quality review, historical compatibility and human approval boundaries.

The user experiences one coherent flow: `Analizar → Resolver → Revisar`, not a committee meeting.