# KUMPLIO Product Workflows Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the protected canonical `/app/*` experience by reusing Kumplio's existing authenticated product domains.

**Architecture:** Add a shared server-protected `/app` layout and thin canonical route pages over existing domain components. Preserve deep APIs, database schema, RLS and agent workflows; legacy authenticated entry routes become redirects only where their behavior is fully represented.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.7, Supabase SSR/Auth, Tailwind CSS, Node contract checks.

**Spec:** `docs/superpowers/specs/2026-08-24-product-workflows-phase-1-design.md`

## Global Constraints

- Visible product language is plain Spanish and follows `LENGUAJE_CANONICO.md`.
- Preserve organization isolation and all existing RLS boundaries.
- Do not add dependencies or database migrations in Phase 1.
- Do not expose internal agent execution or chain-of-thought.
- `npm run typecheck` and `npm run build` must exit 0 before publication.

---

### Task 1: Authorize the product workflow phase

**Files:**
- Modify: `ROADMAP.md`
- Modify: `scripts/check-canonical-roadmap-v1.mjs`

**Interfaces:**
- Consumes: the owner's 24 August 2026 decision and existing roadmap contract.
- Produces: exactly one authorized `NEXT` block for product workflow alignment.

- [ ] **Step 1: Change the roadmap contract fixture to require the new decision and run it to observe failure**

Add assertions for `Bloque 17 — Experiencia autenticada canónica — NEXT` and the 24 August owner decision, then run `npm run check:canonical-roadmap`. Expected: FAIL because `ROADMAP.md` has not yet been updated.

- [ ] **Step 2: Update the roadmap with the superseding owner decision**

Preserve technical-close evidence, move Block 16 out of `NEXT`, add Block 17 with three independently releasable subblocks, and state that the new authorization does not weaken security/evidence gates.

- [ ] **Step 3: Run the contract**

Run `npm run check:canonical-roadmap`. Expected: PASS with Block 17 as the only `NEXT` block.

### Task 2: Define the canonical authenticated route contract

**Files:**
- Create: `scripts/check-product-workflows-phase-1.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm run check:product-workflows` validating protection, canonical routes, navigation labels and compatibility redirects.

- [ ] **Step 1: Write and run the failing contract check**

The check must load the shared `/app` layout, canonical pages and navigation, assert safe authentication redirects and canonical labels, and fail while these files are absent.

- [ ] **Step 2: Register the script**

Add `"check:product-workflows": "node scripts/check-product-workflows-phase-1.mjs"` to `package.json`.

### Task 3: Implement the protected shell and canonical navigation

**Files:**
- Create: `app/app/layout.tsx`
- Create: `app/app/page.tsx`
- Create: `components/app-navigation.tsx`

**Interfaces:**
- Produces: protected shell behavior and navigation for canonical authenticated pages.

- [ ] **Step 1: Add the minimal shared server layout**

Use `createClient()`, `auth.getUser()`, `organization_members`, `redirect('/sign-in?next=...')`, `redirect('/onboarding')`, `TopNav` and `AppNavigation`.

- [ ] **Step 2: Add `/app` redirect**

Redirect `/app` to `/app/inicio`.

- [ ] **Step 3: Add context-aware navigation**

Expose Inicio, Casos and Documentos as primary routes and Evidencia, Actividad and Configuración as secondary routes. Hide unfinished links rather than sending users to demo screens.

- [ ] **Step 4: Run the contract**

Run `npm run check:product-workflows`. Expected: FAIL only for canonical content pages not yet created.

### Task 4: Add canonical pages over existing domains

**Files:**
- Create: `app/app/inicio/page.tsx`
- Create: `app/app/casos/page.tsx`
- Create: `app/app/casos/[id]/page.tsx`
- Create: `app/app/documentos/page.tsx`
- Create: `app/app/evidencia/page.tsx`

**Interfaces:**
- Consumes: existing dashboard daily content, case workspaces, document client and evidence workspace.
- Produces: canonical Spanish URLs without duplicated persistence or queries.

- [ ] **Step 1: Implement Inicio using existing daily compliance content**

Render the existing action-oriented content under a concise canonical heading and suspense skeleton.

- [ ] **Step 2: Implement Casos by reusing the existing server query/workspace**

Extract shared content only if needed; do not duplicate organization filters.

- [ ] **Step 3: Implement case-detail canonical routing**

Redirect `/app/casos/[id]` to the stable existing deep case route until the case-detail presentation phase lands.

- [ ] **Step 4: Implement Documentos and Evidencia using existing workspaces**

Reuse the current authenticated domain components; do not add schema or storage behavior.

- [ ] **Step 5: Run the product workflow contract**

Run `npm run check:product-workflows`. Expected: PASS.

### Task 5: Verify the phase and inspect the diff

**Files:**
- Modify only files already listed if verification exposes a regression.

- [ ] **Step 1: Run focused contracts**

Run `npm run check:canonical-roadmap && npm run check:authenticated-resolution && npm run check:product-workflows`.

- [ ] **Step 2: Run compiler gates**

Run `npm run typecheck && npm run build`. Expected: both exit 0.

- [ ] **Step 3: Review changes**

Run `git diff --check`, `git status --short` and inspect `git diff --stat` plus the full diff for unrelated changes, unsafe redirects and duplicated domain logic.
