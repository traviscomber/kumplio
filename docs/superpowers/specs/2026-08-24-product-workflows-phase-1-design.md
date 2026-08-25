# KUMPLIO Product Workflows — Phase 1 Design

## Decision

The owner explicitly ended the technical scope freeze on 24 August 2026 for the attached authenticated product workflow brief. The existing technical close remains valid evidence; it is not discarded or rewritten.

## Goal

Introduce the canonical `/app/*` authenticated experience without duplicating Kumplio's existing cases, documents, evidence, organizations, authentication, agent workflows, or compliance graph.

## Scope

Phase 1 delivers:

- an authenticated `/app` shell protected by the existing Supabase session and organization membership checks;
- canonical Spanish routes for Inicio, Casos, Documentos and Evidencia;
- context-aware primary and secondary navigation;
- compatibility redirects from the existing English authenticated entry routes;
- a roadmap entry that authorizes subsequent product-workflow phases;
- regression checks for route protection, canonical navigation and build integrity.

Phase 1 does not change database schema, RLS, agent orchestration, regulatory connectors, public claims, billing, production infrastructure, or the existing public landing.

## Architecture

The new route group reuses existing server components and domain workspaces. Canonical pages live below `app/app/`; legacy entry routes redirect into them while internal domain APIs and deep routes remain stable. A shared authenticated layout owns session, membership, robots metadata and the product navigation so protection cannot drift between pages.

## User flow

1. An unauthenticated visitor opening `/app/*` returns to `/sign-in` with a safe `next` value.
2. An authenticated user without an organization is sent to `/onboarding`.
3. A ready user opening `/app` is sent to `/app/inicio`.
4. Inicio answers what needs attention and what to do next using the existing daily compliance content.
5. Primary navigation exposes Inicio, Casos and Documentos in Phase 1; Evidencia is secondary.

## Error and empty states

Existing domain workspaces retain their current loading, empty, migration-pending and error states. The shell adds no client-side data dependency. Missing authentication and organization context are resolved with server redirects before private UI renders.

## Security

Authentication continues through `supabase.auth.getUser()`. Organization readiness continues through `organization_members`; route aliases do not bypass existing data filters or RLS. No service-role credentials or privileged client queries are introduced.

## Verification

- canonical product workflow contract check;
- canonical roadmap contract check;
- authenticated guided-resolution contract check;
- TypeScript typecheck;
- production build.

## Rollback

Revert the phase commit. Because Phase 1 is additive and has no database migration, rollback restores legacy entry routes without data changes.
