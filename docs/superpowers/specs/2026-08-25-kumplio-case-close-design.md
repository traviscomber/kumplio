# Kumplio — Case-Centric App Close

Date: 2026-08-25
Status: APPROVED DESIGN
Scope: Bloque 17 — C: Expediente + cierre transversal

## 1. Objective

Close the authenticated Kumplio product experience around a single coherent operating loop:

```text
Inicio
→ Caso
→ qué ocurre y por qué
→ fuentes / fragmentos / obligaciones / requisitos
→ acción concreta
→ evidencia
→ revisión humana
→ cierre
→ Inicio recomputado
```

The goal is not to add more modules. The goal is to make existing capabilities feel like one product and to eliminate remaining fragmentation, legacy navigation, technical leakage, ambiguous states, and disconnected completion paths.

## 2. Product spine

The canonical explanatory chain is:

```text
Fuente
→ Fragmento
→ Obligación
→ Requisito
→ Caso
→ Acción
→ Evidencia
→ Revisión
→ Cierre
```

This chain is a presentation and navigation contract over existing persisted data and existing domain relationships. It does not authorize a parallel knowledge graph, duplicate evidence model, new case store, or second workflow engine.

## 3. Case as the primary work context

The case/expediente becomes the main place where the user understands:

- what happened or what needs attention;
- why Kumplio considers it relevant;
- which official or reviewed sources support the analysis;
- which obligations or requirements are implicated;
- what action is expected next;
- which evidence exists and its review state;
- which human review is pending or completed;
- what is required before closure;
- what changed after a successful action.

The UI must not make users reconstruct this chain across unrelated legacy surfaces.

## 4. Information hierarchy inside a case

The preferred hierarchy is:

1. **Estado del caso** — current bounded status, urgency, ownership, and one next action.
2. **Qué ocurre y por qué** — concise context and reason for attention.
3. **Fundamento** — sources, excerpts/fragments, obligations, and requirements, progressively disclosed.
4. **Plan / acciones** — existing persisted actions, owners, due dates, blockers, and completion state.
5. **Evidencia** — existing evidence/document items, provenance, review status, and insufficiency when applicable.
6. **Revisión humana** — decision/review status and reviewer-visible outputs.
7. **Cierre** — only when existing closure preconditions are satisfied.
8. **Historial relevante** — bounded product events, not raw infrastructure logs.

Exactly one dominant next action should be visible at the top when actionable work exists.

## 5. Specialists in the user flow

Existing specialist outputs may appear in the case as understandable contributions such as:

- análisis normativo;
- evaluación de riesgo;
- controles y evidencia;
- plan de acción;
- revisión jurídica/calidad.

Do not expose:

- prompts;
- chain-of-thought/reasoning traces;
- token usage;
- provider request internals;
- queue/job IDs;
- retry mechanics;
- raw model payloads.

The product should communicate conclusions, provenance, confidence/review state, and human decision boundaries rather than execution plumbing.

## 6. Source and requirement presentation

Sources and requirements must preserve the distinction between:

- official source;
- extracted or cited fragment;
- interpreted obligation;
- applicability to the organization/case;
- operational requirement/action.

Where applicability or sufficiency is unresolved, the UI must show that state explicitly. It must not collapse “source exists” into “requirement satisfied”.

## 7. Evidence lifecycle

Reuse the existing evidence/document/control lifecycle. The UI should make evidence state legible, including distinctions such as:

- uploaded/received;
- associated with work context;
- pending review;
- accepted/rejected/insufficient where those states already exist;
- verified only when the existing reviewed state supports that wording.

Do not introduce a second evidence status system or promote uploads to verified evidence automatically.

## 8. Human review and closure

Closure remains governed by existing case lifecycle, human review, and evidence preconditions.

The case close surface should answer:

- what is complete;
- what remains open;
- which evidence or review is blocking closure;
- who made the relevant human decision where available;
- what the closure action will change.

A successful close should return the user to `/app/inicio` or provide an explicit continuation there so the daily desk recomputes priorities and next action from persisted state.

No new shortcut may bypass existing close/audit contracts.

## 9. Cross-surface alignment

After the case spine is coherent, align existing authenticated surfaces only where they already have real functionality.

### Documentos

- remains the canonical document/evidence contribution surface;
- links back to the relevant case when context exists;
- does not present all uploads as accepted or verified evidence.

### Personas

- only align existing real functionality and navigation;
- do not invent a completed Personas module to fill the menu.

### Alertas / Actividad

- if existing real functionality exists, present bounded relevant product events/alerts;
- do not expose raw audit/provider/queue logs;
- do not create a new event subsystem.

### Configuración

- only expose existing settings that are actually supported;
- do not imply tenant assurance, provider configuration, or security controls are verified when Bloque 16 evidence remains open.

Missing modules remain intentionally absent or progressively disclosed rather than represented by fake completeness.

## 10. Legacy route and navigation close

The authenticated app must not send users to legacy product surfaces when a canonical `/app/*` destination exists.

The close pass must identify and eliminate remaining user-facing escapes such as old dashboard/review-center/cases/documents paths, while preserving deliberate public/external URLs.

Auth return-context behavior must continue preserving pathname + query string.

## 11. Empty, loading, error, and blocked states

Every primary case section must have a truthful bounded state.

Examples:

- no linked source yet;
- no action assigned yet;
- evidence pending review;
- review required before closure;
- insufficient evidence;
- action failed and was not persisted;
- case closed successfully.

Do not use optimistic completion copy before persistence succeeds.

## 12. Mobile and responsive behavior

The canonical case loop must remain usable on mobile:

- dominant next action stays visible and tappable;
- long source/evidence detail uses progressive disclosure;
- status and blocking states remain readable without horizontal overflow;
- navigation remains within the authenticated shell.

This phase does not require a visual redesign unrelated to the operating flow.

## 13. Claims and Bloque 16 boundary

This close does not change the authority of Bloque 16.

Allowed product language remains bounded to demonstrated state. The app must not newly claim:

- cumplimiento total;
- certificación;
- eliminación final 3/3;
- PITR observado;
- OpenAI Standard or MAM confirmed;
- tenant configuration verified 3/3;
- external pilot completed;
- self-service beta ready.

Unknown, blocked, review-required, and insufficient-evidence states remain visible.

## 14. Data and architecture boundaries

Reuse existing:

- case persistence and lifecycle;
- operational-plan/actions;
- source/fragment/obligation/requirement relationships;
- document/evidence/control lifecycle;
- review/audit primitives;
- agent/specialist persisted outputs;
- authenticated shell and canonical routing;
- `/app/inicio` recomputation.

Do not add unless the existing model is provably insufficient and design is explicitly upgraded first:

- new parallel case model;
- new evidence store/status model;
- new workflow engine;
- new compliance score;
- new agent orchestration layer;
- destructive migrations;
- relaxed RLS;
- billing/payment changes;
- provider assurance shortcuts.

## 15. Testing strategy

Implementation follows TDD and small reversible PRs.

Minimum behavioral contracts:

1. a case exposes one dominant next action when actionable work exists;
2. canonical case navigation stays under `/app/casos/*`;
3. source → fragment → obligation → requirement relationships are visible without implying satisfaction;
4. evidence state reflects existing persisted review state truthfully;
5. specialist outputs render product conclusions without technical plumbing;
6. closure remains blocked when existing preconditions are not satisfied;
7. successful persisted closure provides continuation to `/app/inicio`;
8. failed mutations do not show success/closure acknowledgement;
9. no user-facing legacy authenticated route escapes remain in touched flows;
10. no new unsupported claim language enters the authenticated product;
11. mobile/source-level contracts preserve the primary operating hierarchy;
12. existing Bloque 16 and UI Golden Path gates remain intact.

## 16. Release contract

Before each merge:

- focused case/product checks pass;
- Release Gate passes;
- Application Validation/typecheck/build passes;
- Release Qualification Foundation/smoke passes;
- Vercel previews are green for the exact HEAD;
- diff review confirms no migrations/RLS/billing/provider-assurance scope creep;
- no weakened or removed existing guardrails.

A final app-close aggregate contract should permanently gate the case-centric flow and cross-surface canonical routing.

## 17. Success condition

Kumplio’s authenticated experience can be described truthfully as one coherent operating product:

```text
user sees what matters
→ understands why
→ opens the relevant case
→ sees grounded requirements and specialist conclusions
→ performs a concrete persisted action
→ provides/links evidence
→ receives human-reviewed state
→ closes only when allowed
→ returns to Inicio with recomputed work
```

At that point the **application/product experience** may be considered technically closed for Bloque 17.

This does not mean Bloque 16 external evidence is complete, self-service beta is ready, or blocked compliance/provider claims are unlocked.
