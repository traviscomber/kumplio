# Landing Clarity + Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Kumplio public landing understandable in 10–15 seconds by leading with the user outcome and a simple guided journey while preserving the closed product architecture and verified claims.

**Architecture:** Keep the existing Next.js public home route, `ResolutionEntry`, bilingual copy module, visual system and product behavior. Re-sequence and simplify the landing presentation so acquisition language explains the outcome first, then the canonical `Analiza → Resuelve → Revisa` model, then the specialist team, scenarios, security/evidence and final CTA.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, lucide-react, existing Kumplio i18n/public routing.

**Spec:** `docs/superpowers/specs/2026-08-25-landing-clarity-conversion-design.md`

## Global Constraints

- Do not change authenticated `/app/*` behavior.
- Do not change database, migrations, Supabase/Auth, agent runtime or pricing logic.
- Preserve `ResolutionEntry` as the primary first-step interaction.
- Preserve `Analiza → Resuelve → Revisa` as the canonical product model.
- Keep Isidora, Verónica and Julieta as the visible core team; additional specialists stay secondary.
- Maintain Spanish-first and structurally aligned English copy.
- Do not introduce claims of total compliance, certification, legal advice or autonomous decision-making.
- Release Gate, Application Validation, Release Qualification/Foundation, typecheck, build and smoke must remain green.

---

### Task 1: Lock the new acquisition narrative with tests

**Files:**
- Modify: `lib/i18n/home-public-copy.ts`
- Test: existing public-copy / landing validation tests discovered in the repository; if no focused copy test exists, create the smallest landing copy contract test beside the existing public copy validation pattern.

**Interfaces:**
- Consumes: `HOME_PUBLIC_COPY` and `PublicLocale`.
- Produces: bilingual landing copy with hero, simple journey, concrete example, canonical workflow, scenarios, security and CTA language.

- [ ] **Step 1: Find the existing landing/public-copy test contract**

Run repository search for `HOME_PUBLIC_COPY`, hero title assertions and public landing release checks. Select the narrowest existing test surface that guards marketing copy.

- [ ] **Step 2: Write failing assertions for the Spanish comprehension contract**

Assert that rendered/public copy includes the exact concepts:

```text
Protege los datos de tu empresa sin perderte en la regulación.
Analizar mi situación
Cuéntanos qué está pasando
Kumplio analiza
Recibes un plan claro
Ejecutas las acciones
Dejas evidencia del cierre
Analiza
Resuelve
Revisa
```

Also assert that the core team remains `Isidora`, `Verónica`, `Julieta` and that prohibited acquisition terms such as `tenant-specific` and `provider assurance` do not appear in the home copy.

- [ ] **Step 3: Run the focused test and verify RED**

Expected: FAIL because the new hero and five-step acquisition journey are not yet present.

- [ ] **Step 4: Update `HOME_PUBLIC_COPY.es` minimally**

Use the approved spec copy. Keep the type explicit and add only the fields needed by the landing. Do not move business logic into the copy module.

- [ ] **Step 5: Mirror the same information architecture in English**

Use natural English equivalents while keeping field structure and semantic order identical to Spanish.

- [ ] **Step 6: Run the focused test and verify GREEN**

Expected: PASS for copy-contract assertions.

- [ ] **Step 7: Commit**

```bash
git add lib/i18n/home-public-copy.ts <focused-test-path>
git commit -m "test: lock clearer landing narrative"
```

---

### Task 2: Rebuild the first two viewports around comprehension

**Files:**
- Modify: `app/page.tsx`
- Test: landing/public route focused test from Task 1

**Interfaces:**
- Consumes: new `HOME_PUBLIC_COPY` hero and journey fields; existing `ResolutionEntry`.
- Produces: hero + five-step journey with one dominant conversion action.

- [ ] **Step 1: Add failing structure assertions**

Assert ordering: hero promise → `ResolutionEntry` → five-step journey → later product detail. Assert there is one primary hero action concept and that `ResolutionEntry` remains present.

- [ ] **Step 2: Run focused test and verify RED**

Expected: FAIL because the current page goes from hero directly into protection/solution sections.

- [ ] **Step 3: Simplify the hero**

Render:

```text
Eyebrow: Protección de datos para Chile
H1: Protege los datos de tu empresa sin perderte en la regulación.
Body: Cuéntale a Kumplio tu situación. Te ayuda a entender qué debes hacer, convertirlo en acciones y reunir la evidencia para demostrarlo.
Primary intent: Analizar mi situación
Secondary intent: Ver cómo funciona
```

Keep `ResolutionEntry` alongside/below the explanation according to the existing responsive grid. Preserve the current dark/lime design system.

- [ ] **Step 4: Add the five-step journey directly after the hero**

Render five concise steps in this exact semantic order:

```text
Cuéntanos qué está pasando
Kumplio analiza
Recibes un plan claro
Ejecutas las acciones
Dejas evidencia del cierre
```

On mobile, preserve reading order vertically. On desktop, allow a five-column or connected horizontal presentation if it remains legible.

- [ ] **Step 5: Remove duplicate early abstractions**

Where the existing protection/solution blocks repeat the same promise before the visitor sees a concrete outcome, consolidate rather than adding another full section. Do not remove security/evidence content required later in the page.

- [ ] **Step 6: Run focused test and verify GREEN**

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx lib/i18n/home-public-copy.ts <focused-test-path>
git commit -m "feat: simplify landing first impression"
```

---

### Task 3: Make the value tangible with one example

**Files:**
- Modify: `app/page.tsx`
- Modify: `lib/i18n/home-public-copy.ts`
- Test: landing/public route focused test

**Interfaces:**
- Produces: one concrete Law 21.719 example and three outcome groups.

- [ ] **Step 1: Write failing assertions for the concrete example**

Require the Spanish example:

```text
Mi empresa usa datos de clientes y no sé si estamos preparados para la Ley 21.719.
```

Require the outcome labels:

```text
Kumplio encuentra
Kumplio te dice qué hacer
Tú mantienes el control
```

- [ ] **Step 2: Run focused test and verify RED**

- [ ] **Step 3: Add the example section without adding a new product concept**

Use three concise outcome blocks. Keep wording bounded to gaps/obligations/missing information/evidence; prioritized actions/owners/documents; human review.

- [ ] **Step 4: Mirror the example in English**

Preserve semantic parity rather than literal translation.

- [ ] **Step 5: Run focused test and verify GREEN**

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx lib/i18n/home-public-copy.ts <focused-test-path>
git commit -m "feat: show concrete Kumplio outcome"
```

---

### Task 4: Tighten the canonical workflow and specialist team

**Files:**
- Modify: `app/page.tsx`
- Modify: `lib/i18n/home-public-copy.ts`
- Test: landing/public route focused test

**Interfaces:**
- Consumes: existing `coreCapabilities` concept.
- Produces: compact `Analiza → Resuelve → Revisa` mental model followed by Isidora/Verónica/Julieta.

- [ ] **Step 1: Write failing ordering assertions**

Require workflow stages to appear before specialist names. Require all three specialist names and ensure no additional specialist is promoted to the same visual tier.

- [ ] **Step 2: Run focused test and verify RED if current ordering/copy does not meet the contract**

- [ ] **Step 3: Render the workflow as three concise stages**

```text
Analiza — entiende contexto, fuentes y obligaciones.
Resuelve — transforma brechas en acciones, controles y evidencia esperada.
Revisa — contrasta conclusiones y mantiene decisiones sensibles bajo control humano.
```

- [ ] **Step 4: Reframe the specialist cards in everyday language**

Use:

```text
Isidora — Entiende
Verónica — Comprueba
Julieta — Revisa
```

Keep each description to one short paragraph and preserve the note about optional additional specialists.

- [ ] **Step 5: Run focused test and verify GREEN**

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx lib/i18n/home-public-copy.ts <focused-test-path>
git commit -m "feat: clarify workflow and core team"
```

---

### Task 5: Simplify scenarios, navigation and closing conversion

**Files:**
- Modify: `app/page.tsx`
- Modify: `lib/i18n/home-public-copy.ts`
- Test: landing/public route focused test

**Interfaces:**
- Produces: plain-language navigation, intent-based scenarios and final `Analizar mi situación` CTA.

- [ ] **Step 1: Add failing assertions for navigation and final CTA**

Spanish target concepts:

```text
Producto
Cómo funciona
Para quién
Recursos
Precios
Ingresar
Probar Kumplio
Prepararme para la Ley 21.719
Ordenar proveedores y terceros
Resolver una solicitud, incidente o auditoría
Empieza por la situación que necesitas resolver.
Analizar mi situación
```

- [ ] **Step 2: Run focused test and verify RED**

- [ ] **Step 3: Map the simplified navigation onto existing anchors/routes**

Do not create new public subsystems solely to satisfy labels. Reuse existing anchors and routes where possible; only link to a destination that exists.

- [ ] **Step 4: Rewrite scenarios as visitor intents**

Each scenario should communicate a starting problem and expected outcome, not a module inventory.

- [ ] **Step 5: Tighten security/evidence copy**

Keep four truths visible: organization isolation, traceability, human review, evidence is not automatic certification. Remove internal gate/provider vocabulary from acquisition copy.

- [ ] **Step 6: Implement the final CTA**

Use the approved closing headline and `Analizar mi situación`, routing/anchoring to the existing first-step interaction rather than creating a second intake flow.

- [ ] **Step 7: Run focused test and verify GREEN**

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx lib/i18n/home-public-copy.ts <focused-test-path>
git commit -m "feat: streamline landing conversion path"
```

---

### Task 6: Full qualification and regression closure

**Files:**
- Modify only if a qualification failure exposes a landing regression.

**Interfaces:**
- Produces: release-qualified landing change with no product-model regression.

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 2: Run the canonical roadmap/discovery checks**

```bash
npm run check:discovery
npm run check:canonical-roadmap
```

Expected: PASS.

- [ ] **Step 3: Run Release Gate**

```bash
npm run release:check
```

Expected: PASS.

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Run smoke validation**

```bash
npm run smoke
```

Expected: PASS.

- [ ] **Step 6: Run any repository-specific Application Validation and Release Qualification/Foundation commands discovered from package scripts/workflows**

Expected: PASS with the same gates that qualified the current closed application.

- [ ] **Step 7: Inspect the final diff for claim drift**

Confirm no text claims total compliance, certification, legal advice, autonomous decisions, verified provider configuration, external pilot evidence or beta readiness.

- [ ] **Step 8: Commit any qualification-only fixes, if required**

```bash
git add <only-files-required-by-the-fix>
git commit -m "fix: preserve landing release qualification"
```

If no fixes are required, do not create an empty commit.
