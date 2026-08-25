# Kumplio — Alertas + Actividad

Date: 2026-08-25
Status: APPROVED DESIGN
Scope: Bloque 17-C — operación continua

## 1. Objective

Complete the next canonical authenticated-operation slice by adding `/app/alertas` and `/app/actividad` as bounded read-oriented surfaces over data and workflow state Kumplio already persists.

The product loop becomes easier to operate continuously:

`cambio o pendiente → atención → acción → expediente → evidencia/revisión → historial`.

This block does not create a notification platform, a second audit system, new compliance scoring, or new persistence models.

## 2. Product roles

### Alertas

Answers: **¿Qué cambió o qué requiere mi atención ahora?**

It is an operational inbox, not a generic notification center.

Eligible inputs are existing persisted facts such as:

- regulatory/change signals already available to the product;
- pending human review;
- insufficient or missing evidence;
- overdue or blocked actions when the existing model exposes them;
- case/workflow states that already require a user decision.

Each alert must have a clear reason and, when actionable, a canonical `/app/*` destination.

### Actividad

Answers: **¿Qué pasó, quién actuó y en qué contexto?**

It is a human-readable chronological projection of existing audit/workflow history, not a replacement event store.

Eligible inputs are existing audit records, workflow transitions, reviews, persisted artifacts/evidence actions, and case state changes already available in tenant scope.

## 3. Relationship with Inicio

`/app/inicio` remains the executive operating surface and must stay concise: current state, one dominant next action, up to three priorities, active cases, relevant changes.

`/app/alertas` provides the fuller attention queue.

`/app/actividad` provides historical traceability.

Do not duplicate the full alert queue or timeline into Inicio.

## 4. Alert model

Build a bounded read model from existing data. A rendered alert should contain only what can be supported by persisted facts:

- stable source/reference id;
- category;
- concise title;
- reason it needs attention;
- bounded status/severity derived from existing state, not a new compliance score;
- relevant timestamp when available;
- canonical destination when an existing user action exists.

Suggested product categories:

- `Revisión pendiente`
- `Evidencia requerida`
- `Acción pendiente`
- `Cambio relevante`
- `Decisión requerida`

The exact category must be deterministic from the underlying record. Unknown or unsupported records must not be promoted into alerts merely to populate the page.

## 5. Alert ordering

Ordering should be deterministic and operational rather than engagement-driven.

Priority order:

1. blocked/decision-required work;
2. pending review/evidence that prevents progress;
3. overdue existing actions when due-date data exists;
4. relevant regulatory/change signals;
5. remaining actionable items.

Within the same priority, use the most relevant existing timestamp with a stable fallback.

No opaque AI ranking and no new risk score are introduced.

## 6. Alert interaction

The surface is primarily read/navigation oriented.

- A user follows an alert to the canonical case, document, evidence, or existing review/action context.
- Do not add mark-read/archive/snooze persistence in this block unless such state already exists.
- Do not invent a notification delivery channel.
- Empty state should explain that there is nothing requiring attention from the currently observed persisted state, not claim global compliance.

## 7. Activity model

Build a bounded chronological read model over existing tenant-scoped audit/workflow information.

Each item should expose, when available:

- human-readable action label;
- actor class/name already available to the product;
- timestamp;
- case/workspace context;
- object/result affected;
- canonical link back to the relevant `/app/*` context.

Translate technical event names into product language at the projection layer. Preserve underlying audit records unchanged.

Examples of product language:

- `Caso creado`
- `Análisis actualizado`
- `Evidencia agregada`
- `Revisión solicitada`
- `Revisión completada`
- `Acción actualizada`
- `Caso cerrado`

Do not expose queue names, retries, prompts, tokens, internal agent IDs, raw database event codes, provider mechanics, or chain-of-thought.

## 8. Activity ordering and pagination

Newest meaningful activity first.

Use existing timestamps and stable identifiers. Keep initial rendering bounded. If existing query infrastructure supports pagination/cursors, reuse it; otherwise use a conservative bounded recent window rather than adding a new persistence/indexing subsystem in this block.

## 9. Tenant and authorization boundaries

All reads must preserve existing tenant/workspace scoping and RLS assumptions.

Do not:

- introduce service-role reads into authenticated UI paths;
- broaden existing queries across organizations;
- bypass RLS;
- weaken case/document/evidence authorization;
- infer missing organization membership.

If an underlying event cannot be safely related to the authenticated workspace, it is omitted rather than exposed.

## 10. Navigation

Add canonical navigation access only when the surfaces are real and useful.

Recommended information architecture after this block:

- Inicio
- Casos
- Documentos
- Evidencia
- Alertas
- Actividad

Keep Alertas/Actividad visually secondary to the core work surfaces if needed to avoid crowding mobile navigation. Do not expose legacy destinations.

## 11. UX and states

Both surfaces follow the current Product Polish rules:

- mobile-first layout;
- one page identity and concise supporting copy;
- no unnecessary nested cards;
- visible focus states;
- status not communicated by color alone;
- long labels wrap safely;
- useful loading/empty/error states;
- canonical links only.

Alertas should optimize for scanning and action.

Actividad should optimize for chronology and comprehension.

## 12. Claims and evidence safety

An empty alert inbox means only that the current read model found no qualifying attention item. It does not mean the organization complies with all obligations.

An activity item means an event/action was persisted or derived from an existing persisted transition. It does not prove the underlying control is effective unless existing evidence/review state supports that claim.

Preserve all Bloque 16 restrictions.

## 13. No-scope list

This block does not add:

- email/push/SMS notifications;
- mark-read/archive/snooze persistence;
- notification preferences;
- a new event bus;
- a second audit table;
- analytics tracking infrastructure;
- compliance scoring;
- database migrations unless implementation proves an unavoidable bug fix and owner explicitly approves the scope change;
- Personas or Configuración surfaces;
- public marketing expansion;
- changes to payments, provider assurance, RLS, or Bloque 16 evidence states.

## 14. Release contract

Add a permanent `check:alerts-activity` contract protecting at minimum:

1. `/app/alertas` and `/app/actividad` canonical routes;
2. tenant-scoped read models;
3. deterministic alert categories/order;
4. no technical-plumbing labels in rendered canonical surfaces;
5. canonical `/app/*` destinations only;
6. claim-safe empty-state language;
7. activity chronology and bounded rendering;
8. navigation integration without reintroducing legacy routes.

Wire it into the existing application-close/release contract rather than creating an independent release path.

## 15. Testing and verification

Implementation follows TDD and small reversible commits.

Before merge, the exact HEAD must pass:

- focused `check:alerts-activity`;
- existing Product Polish and App Close contracts;
- authenticated-home/case/evidence contracts;
- auth and tenant-isolation guardrails;
- typecheck;
- production build;
- Foundation/smoke;
- Release Gate;
- Vercel preview checks.

Where authenticated browser access is available, visually inspect Alertas and Actividad at mobile and desktop widths and check console errors. If browser access is unavailable, state that limitation explicitly rather than claiming visual verification.

## 16. Success condition

A user can open Kumplio, see a concise executive view in Inicio, inspect all currently supported attention items in Alertas, follow them into canonical work context, and use Actividad to understand recent meaningful actions without seeing internal execution plumbing or leaving the `/app/*` product experience.