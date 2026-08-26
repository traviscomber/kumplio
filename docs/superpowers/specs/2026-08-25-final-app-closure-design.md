# Final Authenticated App Closure Design

**Date:** 2026-08-25
**Status:** Approved

## Objective
Close Kumplio's authenticated product architecture without opening new product scope. Add bounded Personas and Configuración surfaces by projecting existing identity, workspace and membership capabilities, reconcile ROADMAP.md with what is already implemented on `main`, and then freeze functional development while external P0 release gates are closed.

## Product boundary
The authenticated information architecture is:

`Inicio · Casos · Documentos · Evidencia · Alertas · Actividad · Personas · Configuración`

Personas and Configuración are secondary operational surfaces. They must not introduce a CRM, a parallel contact directory, a new permissions model, billing administration, provider settings, invented preferences, or new RLS concepts solely to populate UI.

## Personas
Personas answers: **who participates in this workspace and with what role?**

The page reuses the canonical authenticated organization and membership data already available to Kumplio. It presents member identity fields that are safely available, role and meaningful membership state. Invitation or membership-management actions are exposed only if a canonical, authorized and already-supported capability exists; otherwise the first release remains read-only.

No parallel people/contact model is created.

## Configuración
Configuración answers: **which workspace am I using and what can I manage?**

The page presents the current workspace identity, the signed-in user's visible profile/account identity, and only settings/actions backed by existing product capabilities. Password/session management, billing, provider configuration and other security-sensitive administration remain in their canonical flows unless an existing proven flow can be safely linked.

No fake preferences or placeholder toggles are added.

## Navigation
Personas and Configuración are added to the authenticated `/app/*` navigation after the primary work surfaces. Existing navigation behavior, responsive patterns and visual language are reused rather than redesigned.

## Authorization and tenancy
This block does not weaken or redesign tenancy. Every read and action must continue to resolve through the current authenticated organization context and existing authorization/RLS boundaries. No service-role bypass is introduced for convenience.

## Roadmap reconciliation
`ROADMAP.md` is updated to reflect repository reality:

- authenticated shell and core work surfaces already implemented remain marked accordingly;
- Alertas and Actividad are no longer described as missing;
- the public Marketing Alignment / Analyze → Resolve → Review consolidation is recorded as completed;
- Personas + Configuración become the final bounded functional sub-block;
- Block 16 remains active for external P0 gates and none of its evidence requirements are relaxed.

After Personas + Configuración are validated, Kumplio enters **functional freeze**. New features are deferred until the external release gates and supervised external pilot are resolved.

## Explicitly out of scope
- new CRM/contact subsystem;
- new team hierarchy;
- new role/permission architecture;
- new RLS model unless a concrete security defect is discovered;
- billing administration;
- password/session implementation that duplicates the auth provider;
- OpenAI or Supabase provider configuration UI;
- speculative preferences;
- unrelated marketing changes.

## Validation
Implementation follows TDD and existing repository validation conventions. At minimum it must prove:

1. authenticated navigation exposes Personas and Configuración;
2. both routes require and use the canonical organization/user context;
3. Personas does not leak cross-organization membership data;
4. Configuración does not expose unsupported administrative controls;
5. existing app routes and release validation continue to pass;
6. ROADMAP.md accurately separates completed product work from remaining external P0 gates.

## Exit condition
This design is complete when Personas and Configuración are production-quality bounded surfaces, the roadmap is reconciled, CI/release checks are green, and no new functional product block remains open before the external-gate closure work.