# Kumplio — Daily Operations Close

Date: 2026-08-25
Status: APPROVED DESIGN
Scope: Bloque 17 — B: Operación diaria

## 1. Objective

Make `/app/inicio` the canonical daily operating desk for authenticated users so they can understand what matters now, take one obvious next action, see a bounded set of priorities, return to active cases, and continue work without losing context.

This phase does not create new modules or weaken Bloque 16 evidence, security, tenant-isolation, or claim gates.

## 2. Target daily loop

```text
/app/inicio
→ current state
→ one dominant next action
→ up to three priorities
→ active cases / recent meaningful changes
→ action surface
→ persisted progress
→ return to /app/inicio
→ recomputed next action
```

The daily loop must be usable without exposing internal agent execution, chain-of-thought, queue mechanics, or infrastructure details.

## 3. Product principles

1. One dominant next action; secondary information never competes with it.
2. Maximum three priorities on Inicio.
3. Every priority must explain what is pending and why it matters.
4. Navigation stays inside canonical `/app/*` surfaces.
5. Return paths preserve relevant case/query context.
6. A visible progress message must only follow a persisted successful mutation.
7. Unknowns, review requirements, and evidence insufficiency remain visible.
8. No score or UI state may imply verified compliance without the existing evidence/review contracts.

## 4. Inicio information architecture

`/app/inicio` should present, in this order:

1. **Estado actual** — concise, bounded summary from persisted organization/case state.
2. **Siguiente acción** — one dominant CTA with a concrete reason and canonical destination.
3. **Prioridades** — zero to three items, ordered deterministically from existing persisted state.
4. **Casos activos** — concise list of relevant active cases with direct canonical links.
5. **Cambios relevantes** — only meaningful persisted changes that affect what the user should do next; do not expose raw technical logs.

Empty states should collapse gracefully instead of filling the page with placeholder cards.

## 5. Next-action contract

The home model remains the single source of truth for the dominant next action.

A next action must include:

- a short title;
- a bounded explanation/reason;
- a canonical internal href under `/app/*`;
- optional case context when a persisted case is relevant.

If a destination cannot be resolved safely, fall back to `/app/inicio` rather than a legacy route or unscoped mutation.

Known legacy routes must continue to canonicalize to existing `/app/*` destinations.

## 6. Priority contract

Home shows no more than three priorities.

Each priority should derive from existing persisted work state and expose:

- title;
- reason/status;
- canonical destination;
- case identity when applicable.

Ordering must remain deterministic and explainable from persisted state. This phase does not add a new scoring engine.

## 7. Active cases

Active cases on Inicio should be directly actionable rather than decorative.

Each item should expose existing case identity/status and link to `/app/casos/<caseId>`.

Do not duplicate the case model or create a parallel home-only representation of case state beyond a read model/view model.

## 8. Relevant changes

Inicio may surface recent changes only when they help the user decide what to do next, for example:

- a human review changed an outcome;
- a requested document/evidence item changed state;
- an operational plan item became due/blocked/completed;
- a case meaningfully changed status.

Do not surface raw queue events, provider traces, internal agent prompts, token usage, or low-level audit noise.

If existing persisted sources are insufficient to derive this safely, omit the section rather than invent a new event subsystem in this phase.

## 9. Context continuity

All daily-operation CTAs must preserve relevant case context through existing authenticated routing conventions.

Auth interruption must preserve the exact intended `/app/*` return path, including query parameters.

When an action completes successfully, the user must have an obvious path back to `/app/inicio` where state is recomputed from persisted data.

## 10. Progress and copy safety

Progress acknowledgements may say what changed, for example:

- `Contexto actualizado`;
- `Antecedente agregado`;
- `Revisión registrada`;
- `Acción completada`.

They must not claim:

- `cumplimiento confirmado`;
- `certificado`;
- `evidencia suficiente` unless the existing review/evidence state explicitly supports it;
- external provider configuration as verified when Bloque 16 still records it as unknown/blocked.

## 11. State and architecture boundaries

Reuse existing:

- authenticated-home read model;
- case/workspace persistence;
- existing evidence/document mutations;
- operational-plan/review state;
- tenant isolation and RLS;
- audit/event data already persisted.

Do not add:

- new product modules;
- new compliance scoring;
- destructive migrations;
- relaxed RLS;
- billing/payment changes;
- a second event bus or analytics subsystem;
- duplicated case/action/evidence state.

## 12. Error handling

- Missing destination → `/app/inicio`.
- Missing case context → canonical safe surface; never unscoped mutation.
- Failed mutation → no progress confirmation.
- Stale/unknown evidence state → keep unknown/review-required state visible.
- Empty priorities/cases/changes → collapse the section cleanly.

## 13. Testing and release gates

Implementation follows TDD.

Minimum behavioral coverage:

1. Inicio exposes exactly one dominant next action when actionable work exists.
2. Priorities are capped at three and deterministic.
3. Every home destination is canonical `/app/*`.
4. Active case links use `/app/casos/<caseId>`.
5. Relevant changes exclude internal/technical execution noise.
6. Missing destinations fall back safely to `/app/inicio`.
7. Auth return context remains preserved.
8. Progress acknowledgements require successful persisted mutations.
9. No new copy promotes unsupported compliance/evidence/provider claims.
10. Existing Bloque 16 and UI Golden Path guardrails remain intact.

Before merge, for the exact HEAD: Release Gate, Application Validation/typecheck, production build, Foundation/qualification, smoke, and Vercel previews must be green.

## 14. Explicit non-goals

This phase does not redesign the full expediente flow (C), complete Personas/Alertas/Actividad/Configuración, enable self-service beta, resolve external provider assurance, activate leaked-password protection, or change external-evidence states.

## 15. Success condition

An authenticated user can open `/app/inicio`, understand their current state, see one clear next action and at most three priorities, reopen active work, act on a canonical surface, observe truthful persisted progress, and return to Inicio with the next recommendation recomputed from real state.