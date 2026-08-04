# Compliance Graph Impact Propagation v2

## Purpose

Propagate a regulatory change through the Compliance Graph without mutating compliance, assignments, controls, evidence, owners, or tasks automatically.

## Database objects

- `regulatory_impact_targets`
- `propagate_compliance_graph_impact_v2(...)`

The engine reuses `regulatory_impact_runs` as the auditable run header and records every affected graph node in `regulatory_impact_targets`.

## Flow

1. Resolve the start graph node.
2. Build a deterministic idempotency key from the node, trigger, organization scope, payload, and max depth.
3. Traverse the graph in both directions with `traverse_compliance_graph_v2`.
4. Classify each affected node as regulatory context, rule review, catalog review, organization review, control review, evidence review, owner notification, or manual review.
5. Store severity, path, depth, relationship, and graph snapshots.
6. Finish the run with `mutations_applied = 0` and all targets in `review_required`.
7. Append an `impact_propagated` graph event.

## Safety invariants

- No compliance status is changed.
- No assignment, control, evidence, task, or notification is created.
- All targets require human review.
- Repeating the same propagation returns the same run.
- Organization scope includes global nodes but excludes nodes belonging to other organizations.
- Function access is restricted to `service_role`.
- Function is `SECURITY INVOKER` with an empty `search_path`.

## Initial production validation

Start node: the Ley 21.719 DPIA claim.

Result:

- run status: `succeeded`
- affected targets: 2
- affected organizations: 0
- high-severity targets: 2
- mutations applied: 0
- review required: 2

Targets:

- the DPIA applicability rule
- catalog obligation `PRIV-010 — Evaluación de impacto`

The second identical execution returned the same run id.
