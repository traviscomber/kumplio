# Kumplio Landing Clarity + Conversion Design

Date: 2026-08-25
Status: Approved direction
Branch: `agent/landing-clarity-conversion`

## Objective

Make the public Kumplio landing understandable in 10–15 seconds without changing the product model, authenticated application, evidence model, security model, or release claims.

The landing should explain the product in everyday language first and reveal the underlying compliance sophistication only after the visitor understands the outcome.

## Product truth that must remain intact

Kumplio remains a Chile-first privacy and data-protection operating system focused on Law 21.719. The core product model remains:

`Describe tu situación → Analiza → Resuelve → Revisa → Evidencia y cierre`

The three core capabilities remain:

- Isidora — Analiza
- Verónica — Resuelve
- Julieta — Revisa

Additional specialists remain secondary and only appear when a case requires them.

Human review, evidence, traceability, tenant isolation and explicit unknowns remain non-negotiable.

## Primary communication decision

The landing should lead with the user outcome rather than the product architecture.

Primary framing:

> Kumplio is the software that tells an organization what to do next to protect personal data and prepare for privacy obligations, while preserving evidence and human review.

Secondary framing:

> Kumplio includes a digital specialist team that analyzes, resolves and independently reviews each case.

The user should understand the first sentence before seeing agent names, assurance language or technical terminology.

## Visitor comprehension target

Within the first viewport and first scroll, a new visitor should be able to answer:

1. What is Kumplio?
2. What problem does it solve?
3. What do I do first?
4. What will I receive?
5. Who remains responsible for the final decision?

## Recommended page hierarchy

### 1. Hero — plain-language outcome

Eyebrow:

`Protección de datos para Chile`

Headline:

`Protege los datos de tu empresa sin perderte en la regulación.`

Supporting copy:

`Cuéntale a Kumplio tu situación. Te ayuda a entender qué debes hacer, convertirlo en acciones y reunir la evidencia para demostrarlo.`

Primary CTA:

`Analizar mi situación`

Secondary CTA:

`Ver cómo funciona`

Trust bullets:

- Preparado para Ley 21.719
- Evidencia y trazabilidad
- Revisión humana en decisiones sensibles

The current inline ResolutionEntry remains the primary conversion mechanism. The redesign should frame it more clearly as the first step, not remove or replace it.

### 2. Immediate process — five everyday steps

Present the journey before introducing product modules:

1. Cuéntanos qué está pasando
2. Kumplio analiza
3. Recibes un plan claro
4. Ejecutas las acciones
5. Dejas evidencia del cierre

This is the acquisition-language version of the canonical product flow. Internally and in product documentation, `Analiza → Resuelve → Revisa` remains canonical.

### 3. Concrete example — make the transformation tangible

Use one representative example:

> “Mi empresa usa datos de clientes y no sé si estamos preparados para la Ley 21.719.”

Show three outcome groups:

- **Kumplio encuentra** — brechas, obligaciones, información faltante y evidencia disponible.
- **Kumplio te dice qué hacer** — acciones priorizadas, responsables sugeridos, plazos y documentos necesarios.
- **Tú mantienes el control** — revisión humana antes de aceptar conclusiones sensibles.

This example should replace abstract explanation where possible, not add another large section.

### 4. Product model — Analiza, Resuelve, Revisa

Once the visitor understands the outcome, present the product's core workflow.

- **Analiza** — entiende contexto, fuentes y obligaciones.
- **Resuelve** — transforma brechas en acciones, controles y evidencia esperada.
- **Revisa** — contrasta conclusiones y mantiene decisiones sensibles bajo control humano.

This section should be compact and visually dominant enough to become the mental model of the product.

### 5. Core specialist team

Introduce the people after the workflow:

- **Isidora — Entiende**: identifica obligaciones y encuentra fuentes que respaldan el análisis.
- **Verónica — Comprueba**: revisa controles y qué evidencia falta para sostenerlos.
- **Julieta — Revisa**: detecta contradicciones, reservas y decisiones que requieren criterio humano.

Avoid introducing the larger specialist roster on the landing. Preserve the existing note that additional specialists may activate when a case requires them.

### 6. Real scenarios

Keep the existing scenario concept, but phrase scenarios as visitor intents rather than product areas:

- Prepararme para la Ley 21.719
- Ordenar proveedores y terceros
- Resolver una solicitud, incidente o auditoría

Each scenario should end in a clear action and outcome rather than a feature list.

### 7. Security + evidence

Keep this section, but simplify the language. The visitor should understand:

- cada organización mantiene su contexto separado;
- las decisiones importantes dejan trazabilidad;
- Kumplio no reemplaza la validación humana;
- evidencia no significa certificación automática.

Do not expose P0 gate vocabulary, provider-assurance terminology or internal release labels in the marketing narrative.

### 8. Final CTA

Headline:

`Empieza por la situación que necesitas resolver.`

Description:

`No necesitas aprender Kumplio antes de usarlo. Describe el problema y deja que la plataforma te guíe desde el análisis hasta el cierre con evidencia.`

CTA:

`Analizar mi situación`

## Navigation simplification

Target public navigation:

- Producto
- Cómo funciona
- Para quién
- Recursos
- Precios
- Ingresar

Persistent primary CTA:

`Probar Kumplio`

The current anchor-based navigation can remain technically, but labels should map to these plain-language concepts.

## Copy rules

1. Lead with verbs and outcomes.
2. Prefer “situación”, “qué hacer”, “acciones”, “evidencia”, “revisión” over internal nouns.
3. Do not use “agentic”, “artifact”, “tenant-specific”, “provider assurance”, “Golden Path”, “lifecycle V2” or similar internal terminology in acquisition copy.
4. Never claim total compliance, certification, legal advice or autonomous decision-making.
5. The word “IA” is secondary; the value proposition is guided resolution and evidence.
6. Keep Chile and Law 21.719 visible without making the site feel like a legal memo.
7. Maintain Spanish-first and mirrored English structure.

## Visual direction

Retain the existing dark Kumplio visual system and lime accent. The redesign is primarily hierarchy, content density and sequencing, not a brand redesign.

Reduce simultaneous messages per viewport. Prefer one dominant promise, one supporting explanation and one obvious action.

Use cards only when they communicate a meaningful contrast or step. Avoid card grids that repeat similar abstract descriptions.

## Scope

In scope:

- `app/page.tsx`
- `lib/i18n/home-public-copy.ts`
- landing-focused presentation and tests
- navigation labels and anchor hierarchy on the home page
- preserving bilingual parity

Out of scope:

- authenticated `/app/*` experience
- pricing logic
- onboarding logic
- data model or migrations
- Supabase/Auth changes
- agent runtime
- release qualification semantics
- security claims beyond existing verified language

## Success criteria

The change is successful when:

- a new visitor can understand Kumplio's purpose from the hero without domain expertise;
- the first scroll explains the end-to-end journey in everyday language;
- `Analiza → Resuelve → Revisa` remains the canonical product model;
- Isidora, Verónica and Julieta remain the visible core team;
- additional specialists stay secondary;
- all public claims stay within the existing evidence boundaries;
- ES and EN remain structurally aligned;
- Release Gate, Application Validation, Release Qualification/Foundation, typecheck, build and smoke remain green.
