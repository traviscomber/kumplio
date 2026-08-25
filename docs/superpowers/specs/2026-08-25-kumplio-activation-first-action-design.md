# Kumplio — Activation to First Useful Action

Date: 2026-08-25
Status: APPROVED DESIGN
Scope: Bloque 17 — Experiencia autenticada canónica / A — Activación

## 1. Objective

Minimize the time from registration to the user's first useful, contextual action in Kumplio without weakening evidence, human review, tenant isolation, auditability, or the external gates governed by Bloque 16.

Primary product metric: **time to first useful action**.

A useful action changes meaningful work state. Merely visiting a page, dismissing onboarding, or viewing a dashboard does not count.

## 2. Target journey

```text
Registration
→ minimal contextual onboarding
→ deterministic initial diagnosis
→ brief diagnosis explanation
→ one dominant contextual CTA
→ direct destination for the recommended action
→ first useful action
→ explicit progress confirmation
→ /app/inicio with the next recommendation
```

`/app/inicio` remains the canonical home and continuity surface, but it is not an obligatory intermediate stop between diagnosis and the first recommended action.

## 3. Design principles

1. One obvious next action beats a dashboard full of options.
2. Preserve the context the user already supplied; never force them to reconstruct it on the destination screen.
3. Explain why Kumplio recommends the action before navigation.
4. The destination must match the action semantics.
5. Completing the first action must produce visible progress and a clear continuation.
6. Do not claim compliance, sufficiency, or verified evidence from onboarding inputs alone.
7. Do not add tours, gamification, educational modal chains, or new product modules.

## 4. Diagnosis handoff

After onboarding persistence succeeds, show a compact diagnosis handoff containing:

- the initial situation/case title;
- the bounded diagnosis status already produced by the deterministic diagnosis model;
- a short explanation of why the recommended action is first;
- one dominant CTA using `diagnosis.nextAction.title`;
- an optional secondary route to `/app/inicio` for users who intentionally want to inspect the workspace first.

The primary CTA navigates directly to `diagnosis.nextAction.href`.

Current routing contract remains:

- `upload_document` → `/app/documentos`;
- `review_context` → `/app/casos`;
- `confirm_scope` → `/app/casos`.

No additional destination taxonomy is introduced in this phase.

## 5. Context continuity

The direct destination must retain enough identity to reconnect the action with the onboarding-created work context. Prefer existing persisted workspace/project/case identifiers and existing authenticated routing patterns rather than a second client-only draft format.

If the relevant context cannot be resolved safely, the fallback is `/app/inicio`, not a legacy route or an unscoped mutation.

Authentication redirects must continue preserving the full authenticated return path, including query parameters where present.

## 6. First useful action

For this phase, first-useful-action completion is bounded to existing capabilities:

### Context / scope action

The user reaches the relevant case surface and performs an existing persisted action that advances or completes the requested context/scope step.

### Document action

The user reaches the existing document surface and completes an existing persisted document/evidence contribution associated with the relevant work context.

This design does not invent a new evidence state or promote an uploaded document to verified evidence.

## 7. Progress confirmation

After a qualifying first action succeeds, provide explicit acknowledgement in the authenticated experience. The confirmation should communicate:

- what changed;
- that the initial action was completed/advanced;
- where the user is going next.

Examples of product language:

- `Contexto inicial actualizado`;
- `Primer antecedente agregado`.

Avoid language such as `cumplimiento confirmado`, `evidencia verificada`, or any statement that exceeds the persisted/reviewed state.

The continuation should naturally return or link to `/app/inicio`, where the home model recomputes the next action/priorities from persisted state.

## 8. State and data boundaries

Reuse the existing atomic/idempotent onboarding persistence and existing case/document mutation paths.

Do not add:

- a second onboarding database model;
- duplicate workspace/case creation;
- a parallel evidence store;
- new compliance scoring;
- new RLS exceptions;
- billing/payment changes.

If implementation reveals that completion cannot be inferred from existing persisted state, stop and upgrade the design before introducing a new activation-event persistence model.

## 9. Error handling

- Onboarding persistence failure: remain in onboarding and show the existing recoverable error behavior; never navigate as if setup succeeded.
- Missing/invalid recommended destination: fall back to `/app/inicio`.
- Missing contextual identifier: use the canonical authenticated fallback and do not perform an unscoped mutation.
- Action mutation failure: preserve entered data where existing components support it and do not show progress confirmation.
- Auth interruption: preserve the exact intended `/app/*` return path through the existing authenticated return-context contract.

## 10. Measurement

The primary metric is elapsed time from successful account registration/authenticated onboarding entry to the first persisted useful action.

Implementation should prefer existing audit/event primitives if they already expose sufficient timestamps. Do not create a new analytics subsystem in this phase.

Secondary diagnostic metrics may include:

- onboarding completion rate;
- diagnosis → primary CTA click-through;
- primary CTA → useful-action completion;
- abandonment before first useful action.

These are observability measures, not compliance claims.

## 11. Testing and release gates

Implementation follows TDD.

Minimum behavioral coverage:

1. diagnosis handoff exposes one primary CTA matching `nextAction`;
2. context/scope diagnosis routes to `/app/casos`;
3. document diagnosis routes to `/app/documentos`;
4. invalid destination falls back to `/app/inicio`;
5. authenticated return context remains preserved;
6. progress confirmation is shown only after a successful persisted action;
7. no progress confirmation on failed mutation;
8. no new wording implies verified evidence or compliance.

Before merge: Release Gate, application validation/typecheck, production build, foundation/qualification where applicable, smoke, and Vercel previews must be green for the exact HEAD.

## 12. Explicit non-goals

This phase does not implement B — Operación diaria or C — Expediente redesign.

It also does not complete Personas, Requisitos, Alertas, Actividad, Configuración, beta autoservicio, provider assurance, leaked-password configuration, or external evidence gates.

## 13. Success condition

A new user can register, provide the minimum relevant context, understand the bounded diagnosis, follow one obvious recommendation directly into the correct existing work surface, complete a persisted useful action, see truthful progress, and continue from `/app/inicio` without losing context or encountering legacy navigation.