# Final Authenticated App Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close Kumplio's authenticated information architecture with bounded Personas and Configuración surfaces, reconcile the roadmap, and enter functional freeze without creating new product subsystems.

**Architecture:** Reuse the existing `/app/*` shell, organization context, membership/identity reads, UI primitives and authorization boundaries. Personas is a workspace-membership projection; Configuración is a workspace/account projection. No new permissions, CRM, billing, provider configuration or speculative settings are introduced.

**Tech Stack:** Next.js App Router, React/TypeScript, existing Supabase/auth organization context, existing UI components, Node-based repository contract checks and GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-25-final-app-closure-design.md`

## Global Constraints

- Final authenticated IA: `Inicio · Casos · Documentos · Evidencia · Alertas · Actividad · Personas · Configuración`.
- Reuse canonical identity, workspace and membership capabilities.
- Do not create a CRM/contact subsystem, new team hierarchy, new role/permission architecture, billing administration or speculative preferences.
- Do not weaken organization isolation, authorization or RLS.
- Do not use service-role bypass for user-facing reads.
- Expose invitation/member-management actions only if an existing canonical authorized capability is verified.
- After validation, functional development freezes; Block 16 external P0 gates remain open and unchanged.

---

### Task 1: Lock the final authenticated navigation contract

**Files:**
- Modify: existing authenticated navigation component discovered from `app/app/layout.tsx`
- Create/Modify: repository contract test under `scripts/` following existing `check-*.mjs` conventions
- Modify: `package.json` only if the new contract check must be added to an existing validation aggregate

**Interfaces:**
- Consumes: existing authenticated navigation item shape and route conventions.
- Produces: `/app/personas` and `/app/configuracion` navigation entries without changing existing route semantics.

- [ ] **Step 1: Inspect `app/app/layout.tsx` and the navigation component it imports**

Record the exact component/file and existing navigation item type. Do not refactor navigation while discovering it.

- [ ] **Step 2: Write the failing navigation contract**

Add assertions that the authenticated navigation contains the exact destinations `/app/personas` and `/app/configuracion`, while retaining `/app/inicio`, `/app/casos`, `/app/documentos`, `/app/evidencia`, `/app/alertas` and `/app/actividad`.

- [ ] **Step 3: Run the focused contract check and verify RED**

Run the new script directly with Node. Expected: failure because Personas/Configuración are not yet present.

- [ ] **Step 4: Add the two secondary navigation entries using the existing item shape and icons**

Preserve current responsive behavior and visual hierarchy. Do not redesign the shell.

- [ ] **Step 5: Run the focused contract check and verify GREEN**

Expected: all eight authenticated destinations are present.

- [ ] **Step 6: Commit**

```bash
git add <navigation-file> scripts/<final-app-contract>.mjs package.json
git commit -m "feat: close authenticated app navigation"
```

### Task 2: Build Personas as a canonical membership projection

**Files:**
- Create: `app/app/personas/page.tsx`
- Create: focused server/helper component only if existing page patterns require it
- Modify: `scripts/<final-app-contract>.mjs`
- Reuse: existing organization/membership query helpers discovered in repository

**Interfaces:**
- Consumes: current authenticated user, current organization/workspace identifier, existing membership rows and role/status fields.
- Produces: a tenant-scoped Personas page; no new persisted people model.

- [ ] **Step 1: Locate the canonical organization-context and membership read used by existing authenticated/admin flows**

Choose the existing path that already enforces authenticated organization scope. If multiple exist, prefer the one used by production `/app/*` pages rather than legacy dashboard code.

- [ ] **Step 2: Extend the contract test to require Personas tenant scoping and forbid service-role shortcuts**

The test must assert that the new route imports/uses the canonical organization context and must reject a user-facing implementation that instantiates a service-role client.

- [ ] **Step 3: Run the focused test and verify RED**

Expected: route missing.

- [ ] **Step 4: Implement the minimal Personas page**

Render only safely available member identity, role and meaningful state. Include an empty state that explains that this surface reflects workspace participation. Do not add invitations or mutations unless an existing authorized production capability was found in Step 1.

- [ ] **Step 5: Add a tenant-isolation regression test at the lowest existing repository layer that can prove it**

Use the repository's current Supabase/RLS or API test conventions. The assertion must demonstrate that organization A cannot read organization B membership through the path used by Personas.

- [ ] **Step 6: Run focused Personas + tenancy tests and verify GREEN**

Expected: page contract passes and cross-organization read is denied/absent.

- [ ] **Step 7: Commit**

```bash
git add app/app/personas scripts/<final-app-contract>.mjs <tenant-test-files>
git commit -m "feat: add workspace personas surface"
```

### Task 3: Build Configuración as a bounded workspace/account projection

**Files:**
- Create: `app/app/configuracion/page.tsx`
- Create: focused helper component only if required by established `/app/*` patterns
- Modify: `scripts/<final-app-contract>.mjs`
- Reuse: existing authenticated user/workspace helpers and canonical account actions/links

**Interfaces:**
- Consumes: current organization/workspace identity and signed-in user identity already available to the app.
- Produces: read-oriented configuration surface with only supported actions.

- [ ] **Step 1: Locate canonical user/workspace identity and any existing account-management links/actions**

Explicitly inventory whether password, session, profile or organization-name management already exists. Anything not already supported remains absent.

- [ ] **Step 2: Extend the contract test with configuration guardrails**

Require the route and canonical organization/user context. Add forbidden-string assertions for unsupported placeholder controls such as provider configuration, billing administration and invented preference toggles if they are not backed by existing flows.

- [ ] **Step 3: Run the focused test and verify RED**

Expected: configuration route missing.

- [ ] **Step 4: Implement the minimal Configuración page**

Show current workspace identity and visible signed-in account identity. Link only to existing proven account/security actions discovered in Step 1. If none exist, keep the relevant section informational rather than creating a fake control.

- [ ] **Step 5: Run focused tests and verify GREEN**

Expected: route passes contract and no unsupported administration is exposed.

- [ ] **Step 6: Commit**

```bash
git add app/app/configuracion scripts/<final-app-contract>.mjs
git commit -m "feat: add bounded workspace configuration"
```

### Task 4: Reconcile ROADMAP.md with repository reality

**Files:**
- Modify: `ROADMAP.md`
- Modify: `scripts/<final-app-contract>.mjs`

**Interfaces:**
- Consumes: validated implementation state on this branch and already-merged `main` work.
- Produces: roadmap status that distinguishes completed functional product work from unresolved external P0 gates.

- [ ] **Step 1: Write failing roadmap assertions**

Require ROADMAP.md to record Alertas and Actividad as implemented, the public Analyze → Resolve → Review marketing consolidation as completed, Personas + Configuración as the final bounded functional block, and a functional-freeze statement after validation.

- [ ] **Step 2: Add negative assertions protecting Block 16**

The contract must continue to reject claims that PITR is observed, OpenAI Standard/MAM is confirmed, final operational deletion is 3/3, tenant configuration is verified 3/3, an external pilot has happened, or self-service beta is ready unless separate evidence has actually closed those gates.

- [ ] **Step 3: Run the focused contract and verify RED**

Expected: roadmap still reflects the pre-reconciliation state.

- [ ] **Step 4: Update ROADMAP.md**

Reconcile statuses and wording only from evidence in the repository. Preserve Block 16 as `ACTIVE / EXTERNAL GATES` (or its existing equivalent) and preserve every P0 requirement.

- [ ] **Step 5: Run the focused contract and verify GREEN**

Expected: product completion and external-gate status are both represented accurately.

- [ ] **Step 6: Commit**

```bash
git add ROADMAP.md scripts/<final-app-contract>.mjs
git commit -m "docs: reconcile final product roadmap"
```

### Task 5: Full regression and release qualification

**Files:**
- Modify only if a regression exposes a defect directly caused by Tasks 1-4.

**Interfaces:**
- Consumes: completed navigation, Personas, Configuración and reconciled roadmap.
- Produces: evidence that the final functional block does not regress the current release foundation.

- [ ] **Step 1: Run the focused final-app contract**

Expected: PASS.

- [ ] **Step 2: Run the repository's existing application validation command from `package.json`**

Expected: PASS with no TypeScript/build/test regression.

- [ ] **Step 3: Run existing release-gate / release-qualification scripts that are runnable without external secrets**

Expected: PASS for the same foundation that was green before this block.

- [ ] **Step 4: Review the diff for scope creep**

Reject any new database model, permission architecture, billing UI, provider configuration, speculative settings, unrelated marketing edits or weakened tenancy boundary.

- [ ] **Step 5: Commit any test-only integration adjustment if required**

```bash
git add <only-files-needed-for-validation>
git commit -m "test: qualify final authenticated app closure"
```

- [ ] **Step 6: Push branch and open PR**

PR title: `feat: close authenticated Kumplio app architecture`

PR body must state that functional development freezes after merge and list Block 16 external P0 gates as explicitly unresolved rather than silently treating them as complete.
