# Marketing Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Kumplio's public narrative with the canonical v2 product workflow: describe a situation, analyze it, resolve it, independently review it, and close it with evidence.

**Architecture:** Keep the product/runtime architecture and visual system unchanged. Treat `WORKFLOW_DEFINITIONS_V2` as the source of truth for public workflow positioning, expose Isidora, Verónica and Julieta as the three core public capabilities, and describe Rodrigo, Javier, Beatriz and Andrés as specialists activated only when the case requires them. Update public copy and its contract test together so future changes cannot drift back to the legacy seven-agent/mission narrative.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Node assertion-based contract checks.

**Spec:** Approved conversation design, 2026-08-25: public narrative becomes `Describe tu situación → Analiza → Resuelve → Revisa → Evidencia y cierre`; preserve product internals, design system, pricing structure and human-review boundaries.

## Global Constraints

- Do not change the runtime `AGENT_CATALOG`, agent IDs, persisted data, orchestration semantics, database schema, authentication, billing, or plan prices.
- Do not redesign colors, typography, component system, or overall visual identity.
- Public core must be three capabilities: Isidora = Analyze, Verónica = Resolve, Julieta (`catalina` historical ID) = Review.
- Rodrigo, Javier, Beatriz and Andrés remain available internally and may be described publicly only as additional specialists activated when useful.
- Preserve human review and uncertainty language; do not imply legal advice, certification, guaranteed compliance, exact exposure, or guaranteed timing.
- Preserve Spanish/English positioning parity.
- Keep existing forbidden marketing claims in the guided-resolution contract.

---

### Task 1: Lock the new positioning contract

**Files:**
- Modify: `scripts/check-guided-resolution-positioning-v1.mjs`
- Test: `scripts/check-guided-resolution-positioning-v1.mjs`

**Interfaces:**
- Consumes: public source files already read by the contract.
- Produces: assertions requiring the three-core-capability narrative and preventing legacy public terminology.

- [ ] **Step 1: Write the failing contract assertions**

Add assertions requiring Spanish and English public copy to contain the concepts `Analiza`, `Resuelve`, `Revisa`, `Analyze`, `Resolve`, and `Review`, plus explicit references to Isidora, Verónica and Julieta in the public home source. Add forbidden public-copy patterns for `misiones`/`missions` when used as a product work-unit label and for copy that presents all seven agents as the default workflow.

- [ ] **Step 2: Run the contract and verify RED**

Run: `npm run check:guided-resolution`

Expected: FAIL because the home currently renders `AGENT_CATALOG.map(...)` as the public specialist surface and supporting public/legal copy still contains legacy mission terminology.

- [ ] **Step 3: Commit the failing contract**

```bash
git add scripts/check-guided-resolution-positioning-v1.mjs
git commit -m "test: lock canonical public workflow narrative"
```

### Task 2: Align the home page to three core capabilities

**Files:**
- Modify: `app/page.tsx`
- Modify: `lib/i18n/home-public-copy.ts`
- Modify: `lib/i18n/agent-public-copy.ts` only if English public labels need a focused reusable mapping.
- Test: `scripts/check-guided-resolution-positioning-v1.mjs`

**Interfaces:**
- Consumes: `HOME_PUBLIC_COPY`, existing visual components, and agent names/roles where useful.
- Produces: public home flow `Describe → Analyze → Resolve → Review → Evidence/closure`, with optional-specialist explanation.

- [ ] **Step 1: Replace the public seven-agent grid with three core cards**

Render exactly three primary cards on the public home: Isidora/Analyze, Verónica/Resolve, Julieta/Review. Do not mutate `AGENT_CATALOG`; stop mapping the full catalog into the primary public workflow surface.

- [ ] **Step 2: Add optional-specialist copy**

Add one concise note explaining that quantitative risk, regulatory change, detailed planning and historical/performance analysis can activate additional specialists when the case requires them. Do not turn these specialists into another large catalog.

- [ ] **Step 3: Simplify the guided journey copy**

Keep the existing entry form and case-first framing. Rewrite the public journey so its semantic sequence is: describe the situation; analyze context/obligations; resolve with controls/actions/evidence; independent review; evidence-backed closure. Existing UI cards may remain if they describe user moments rather than internal agents, but headings must reinforce the canonical sequence.

- [ ] **Step 4: Maintain Spanish/English parity**

Ensure the English home expresses the same boundaries and does not strengthen claims beyond Spanish.

- [ ] **Step 5: Run the focused contract**

Run: `npm run check:guided-resolution`

Expected: still FAIL only on public/legal/demo/pricing assertions not yet migrated; home-specific assertions PASS.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx lib/i18n/home-public-copy.ts lib/i18n/agent-public-copy.ts scripts/check-guided-resolution-positioning-v1.mjs
git commit -m "feat: align home with three core capabilities"
```

### Task 3: Align demo, FAQ, security and terms vocabulary

**Files:**
- Modify: `app/demo/page.tsx`
- Modify: `lib/i18n/faq-public-copy.ts`
- Modify: `lib/i18n/legal-public-copy.ts`
- Test: `scripts/check-guided-resolution-positioning-v1.mjs`

**Interfaces:**
- Consumes: canonical public workflow vocabulary established in Task 2.
- Produces: consistent case/action/evidence/review language across explanatory and legal public surfaces.

- [ ] **Step 1: Update the demo's team step**

Keep the six user-facing demo moments, but rewrite the `Equipo` step so it explains analysis → resolution → independent review, with additional specialists activated only when useful. Preserve the case-first and human-control language.

- [ ] **Step 2: Replace legacy FAQ terminology**

Where FAQ copy describes Kumplio work units as `misiones`, use `casos`, `acciones`, `resultados`, `evidencia` or `decisiones` according to the sentence's actual meaning. Do not alter unrelated uses of ordinary-language mission if any exist.

- [ ] **Step 3: Replace legacy security terminology**

Change traceability wording from `Misiones, resultados, revisiones y eventos` to `Casos, resultados, revisiones y eventos`, with equivalent English copy.

- [ ] **Step 4: Replace legacy terms-of-service terminology**

In the service description, replace the product-unit list containing `misiones` with a case-oriented formulation such as `casos, acciones y resultados verificables`, while preserving the legal limitation that features vary by plan/product/configuration/contract.

- [ ] **Step 5: Run the focused contract**

Run: `npm run check:guided-resolution`

Expected: PASS for home/demo/FAQ/security/terms narrative checks; pricing checks may remain RED until Task 4.

- [ ] **Step 6: Commit**

```bash
git add app/demo/page.tsx lib/i18n/faq-public-copy.ts lib/i18n/legal-public-copy.ts scripts/check-guided-resolution-positioning-v1.mjs
git commit -m "feat: align public case and review vocabulary"
```

### Task 4: Remove unnecessary pricing promises

**Files:**
- Modify: `lib/i18n/pricing-public-copy.ts`
- Test: `scripts/check-guided-resolution-positioning-v1.mjs`

**Interfaces:**
- Consumes: existing pricing plans and prices unchanged.
- Produces: capability-based pricing copy without automatic-prioritization or timing promises.

- [ ] **Step 1: Add pricing assertions**

Require Spanish copy equivalent to `Cambios relevantes organizados por prioridad` and `Estado ejecutivo disponible cuando lo necesitas`, with English equivalents that make no stronger automation or timing claim. Assert the old `priorizados automáticamente` and `disponible en minutos` phrases are absent.

- [ ] **Step 2: Run and verify RED**

Run: `npm run check:guided-resolution`

Expected: FAIL on the old pricing claims.

- [ ] **Step 3: Update pricing copy only**

Change those two claims while preserving plan names, prices, CTA structure, included features and commercial hierarchy.

- [ ] **Step 4: Run and verify GREEN**

Run: `npm run check:guided-resolution`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/pricing-public-copy.ts scripts/check-guided-resolution-positioning-v1.mjs
git commit -m "fix: remove unnecessary public pricing promises"
```

### Task 5: Regression verification

**Files:**
- No intended production changes unless a regression is discovered.

**Interfaces:**
- Consumes: Tasks 1-4.
- Produces: verified marketing-alignment change set ready for integration.

- [ ] **Step 1: Run positioning contract**

Run: `npm run check:guided-resolution`

Expected: PASS with `Guided resolution positioning contract: OK`.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS with exit code 0.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: PASS with exit code 0.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: Next.js production build completes successfully with exit code 0.

- [ ] **Step 5: Run relevant product regression checks**

Run: `npm run check:three-agent-core && npm run check:product-polish && npm run check:app-close`

Expected: all PASS. This confirms public simplification did not alter runtime three-agent orchestration, authenticated product polish, or closure behavior.

- [ ] **Step 6: Review the rendered public pages**

Visually verify `/`, `/demo`, `/faq`, `/security`, `/terms`, and `/pricing` in Spanish and English. Confirm no seven-agent default-workflow impression remains, the three core capabilities are visually primary, optional specialists are secondary, and responsive layout remains intact.

- [ ] **Step 7: Commit any verification-only fixes, if required**

```bash
git add app lib components scripts
git commit -m "fix: polish aligned public positioning"
```

## Self-review

- Spec coverage: home, demo, FAQ, security, terms, pricing, bilingual parity, optional specialists, forbidden claims, and regression verification are each assigned to explicit tasks.
- Placeholder scan: no deferred implementation placeholders are included.
- Type/interface consistency: no runtime agent identifiers or orchestration interfaces are changed; Julieta continues to use historical ID `catalina` internally.
