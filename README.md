<p align="center">
  <strong>KUMPLIO</strong>
</p>

<h1 align="center">Del problema de cumplimiento a la evidencia defendible.</h1>

<p align="center">
  Sistema operativo de cumplimiento para Chile: centraliza información sensible, coordina especialistas, convierte análisis en trabajo y deja cada decisión trazable.
</p>

<p align="center">
  <a href="https://www.kumplio.app"><strong>Ver Kumplio</strong></a>
  ·
  <a href="./ROADMAP.md">Roadmap canónico</a>
  ·
  <a href="./docs/assurance/ui-golden-path-production-3x-2026-08-07.md">UI 3/3</a>
  ·
  <a href="./docs/assurance/n3uralia-processing-inventory-3x-2026-08-08.md">Inventario 3/3</a>
  ·
  <a href="./docs/assurance/n3uralia-processing-lifecycle-3x-2026-08-08.md">Lifecycle 3/3</a>
  ·
  <a href="./docs/assurance/n3uralia-processing-privacy-remediation-3x-2026-08-08.md">Aviso y acciones 3/3</a>
  ·
  <a href="./docs/assurance/n3uralia-processing-notice-mapping-3x-2026-08-08.md">Mapeo 3/3</a>
</p>

---

## Resumen ejecutivo

Kumplio no es un chatbot jurídico ni un repositorio de documentos. Es una plataforma **Chile-first** que transforma una situación de cumplimiento en un expediente vivo y conecta:

```text
situación
→ fuentes y evidencia
→ especialistas
→ revisión humana
→ plan operativo
→ misión, responsable y plazo
→ controles y solicitudes de evidencia
→ confianza explicable
→ memoria organizacional
```

La promesa central es:

> **Protege tus datos. Entiende qué hacer. Avanza con una guía clara.**

### Estado real al 8 de agosto de 2026

| Área | Estado comprobado |
|---|---|
| Desarrollo técnico | sólido |
| Demo comercial acompañada | apta |
| Golden Path productivo | `VALIDATED x3` con actor E2E |
| Multiempresa y aislamiento interno | `VALIDATED` |
| Inventario real de N3uralia | 3 actividades revisadas |
| Revisión jurídica y lifecycle | 3/3 con `changes_requested` |
| Aviso y eliminación como trabajo trazable | `DEPLOYED / VALIDATED INICIAL` |
| Mapeos de aviso aceptados con evidencia | 3/3 |
| Eliminaciones demostradas con evidencia | 0/3 |
| Piloto externo con personas | pendiente |
| Beta privada autoservicio | no habilitar todavía |
| Registro público autoservicio | no habilitado |

`VALIDATED` internamente no significa certificación, cumplimiento integral ni piloto externo. **Mapeo aceptado no equivale a aviso suficiente.**

---

## Qué hace único a Kumplio

La mayoría de las herramientas separan documentos, tareas, auditorías e IA. Kumplio los conecta dentro de una misma cadena de decisión:

1. **Centraliza primero.** La información sensible vive en un expediente controlado y no en correos, carpetas y conversaciones dispersas.
2. **Separa hechos de conclusiones.** Fuentes, inferencias, reservas, unknowns y decisiones humanas no se mezclan.
3. **Convierte análisis en operación.** Cada gap puede terminar en misión, owner, vencimiento y solicitud de evidencia.
4. **Exige evidencia defendible.** Un documento no acredita por sí solo un control, un aviso ni una eliminación.
5. **Mantiene supervisión humana.** Los especialistas proponen; una persona aprueba, rechaza o solicita cambios.
6. **Versiona antes de sobrescribir.** Cada revisión conserva procedencia, hash, vigencia y supersesión.
7. **Explica la confianza.** Los scores declaran alcance, límites y topes por información parcial.
8. **Aprende sin inventar.** Solo el conocimiento aprobado puede convertirse en precedente reutilizable.

---

## Capacidades actuales

### 1. Workspace seguro y multiempresa — `VALIDATED INTERNO`

- autenticación y confirmación de cuenta;
- onboarding guiado;
- workspace activo explícito;
- organizaciones, miembros, roles, invitaciones y revocación;
- operaciones tenant-scoped;
- aislamiento positivo y negativo mediante RLS y RPC;
- mutaciones privilegiadas limitadas al servidor;
- auditoría de cambios sensibles.

La deuda externa más importante sigue siendo **Supabase Auth Leaked Password Protection desactivada**.

### 2. Expedientes de cumplimiento — `VALIDATED x3`

- situación inicial, contexto, prioridad, owner y estado;
- timeline de eventos;
- documentos, fuentes, controles y evidencia;
- relaciones navegables;
- recorrido guiado desde el problema hasta el trabajo operacional;
- cierre conservador cuando faltan antecedentes.

### 3. Consejo de Especialistas — `VALIDATED x3`

| Especialista | Función |
|---|---|
| **Isidora** | obligaciones, fuentes y evidencia documental |
| **Beatriz** | cambios regulatorios y vigencia |
| **Rodrigo** | riesgo, urgencia, escenarios e incertidumbre |
| **Verónica** | controles, evidencia, hallazgos y readiness |
| **Javier** | planes, dependencias, responsables y criterios de cierre |
| **Andrés** | desempeño, recurrencias y aprendizaje |
| **Julieta** | revisión jurídica, calidad, consistencia y comunicación |

Los especialistas usan salidas estructuradas, herramientas autorizadas y fronteras `DECIDE / NO DECIDE`. Generar una salida no equivale a aprobarla.

### 4. Ejecución durable — `VALIDATED x3`

- cola PGMQ;
- enqueue idempotente;
- lease y heartbeat;
- retry controlado;
- recuperación de ejecuciones detenidas;
- dead-letter visible;
- procesamiento desacoplado de la solicitud web;
- runs, artefactos, herramientas, errores, modelos, tokens y tiempos persistidos.

### 5. Plan operativo, misiones y responsabilidad — `VALIDATED x3`

- expediente → plan operativo;
- misión con owner, prioridad y vencimiento;
- solicitudes de evidencia;
- delegación asistida;
- SLA, carga, bloqueos y escalamiento;
- briefing y continuidad diaria;
- idempotencia para impedir duplicados.

### 6. Controles, evidencia y assurance — `VALIDATED x3`

- controles conectados con obligaciones, casos y evidencia;
- procedencia, período, vigencia y confidencialidad;
- integridad mediante SHA-256;
- suficiencia revisada;
- diseño y operación evaluados por separado;
- baseline con unknowns explícitos;
- confianza limitada cuando la operación es parcial.

### 7. Inventario real de actividades de tratamiento — `VALIDATED INICIAL / ACTIVE`

N3uralia tiene tres actividades reales observadas:

1. **Gestión de contactos comerciales y solicitudes de demostración**.
2. **Gestión de cuentas, autenticación y acceso al workspace**.
3. **Gestión de expedientes y análisis asistido por especialistas IA**.

Cada actividad contiene propósito, base propuesta, owner, titulares, categorías, dataset, sistema, tercero, fuente, revisión humana, evidencia `accepted · verified`, snapshot SHA-256 y unknowns visibles.

La cantidad mínima está cubierta. Eso no convierte tres actividades en un inventario organizacional completo.

### 8. Revisión jurídica y de ciclo de vida — `VALIDATED INICIAL / CAMBIOS REQUERIDOS`

Kumplio separa cinco decisiones:

```text
base jurídica
retención
destinatarios
subencargados
transferencias internacionales
```

Resultado de las tres actividades:

| Actividad | Decisión | Base | Retención | Destinatarios | Subencargados | Transferencias | Unknowns |
|---|---|---|---|---|---|---|---:|
| Contactos comerciales y demos | `changes_requested` | pendiente | requiere cambios | pendiente | pendiente | pendiente | 8 |
| Cuentas, autenticación y workspace | `changes_requested` | pendiente | requiere cambios | pendiente | pendiente | pendiente | 8 |
| Expedientes y especialistas IA | `changes_requested` | pendiente | requiere cambios | pendiente | pendiente | pendiente | 8 |

Cada revisión conserva versión, evidencia, hash, fuentes, unknowns y supersesión. Ninguna dimensión pendiente puede presentarse como aprobada.

### 9. Aviso, mapeo y eliminación — `DEPLOYED / VALIDATED INICIAL`

La infraestructura operativa utiliza:

```text
20260808151723_processing_activity_privacy_remediation_v1
20260808152005_seed_n3uralia_privacy_remediation_v1
20260808174718_processing_notice_mapping_review_v1
20260808175012_seed_n3uralia_notice_mapping_reviews_v1
```

#### Aviso y eliminación como trabajo trazable

- un aviso público versionado y verificado;
- un enlace del aviso por actividad;
- una misión con owner por actividad;
- una solicitud de mapeo por actividad;
- una solicitud de eliminación o anonimización por actividad;
- fechas persistidas y eventos auditables.

#### Mapeos aceptados con brechas

Las tres solicitudes de mapeo están `accepted` y tienen evidencia `accepted · verified`. El estado canónico es `accepted_with_gaps`.

| Resultado | Estado |
|---|---:|
| Mapeos aceptados | 3/3 |
| Evidencias de mapeo con SHA-256 | 3/3 |
| Unknowns conservados | 12 |
| Lifecycle todavía `changes_requested` | 3/3 |
| Eliminaciones demostradas | 0/3 |

El control conserva suficiencia `partial`; aceptar la matriz no valida base jurídica, retención, destinatarios, subencargados, transferencias ni eliminación.

Cada solicitud de eliminación exige:

- timestamp;
- proveedor;
- activo o dataset;
- alcance;
- responsable persona o sistema;
- resultado;
- `backup_purga_programada`;
- `backup_purga_confirmada`.

Una eliminación solo cuenta cuando la solicitud está `accepted` y tiene evidencia adjunta.

### 10. Escritorio, Insights, grafo e impacto — `DEPLOYED / VALIDATED INICIAL`

- prioridades y explicación “¿Por qué aparece esto?”;
- briefing de las últimas 24 horas;
- trabajo asignado, delegado y bloqueado;
- confianza por dimensiones;
- grafo de casos, controles, evidencia, activos y decisiones;
- análisis de impacto;
- reutilización defendible de controles y evidencia.

### 11. Motor regulatorio Chile — `DEPLOYED`

- BCN y LeyChile;
- Diario Oficial;
- Dirección del Trabajo;
- SMA y SNIFA;
- capturas controladas;
- versiones, hashes y comparación de cambios;
- claims con citas;
- separación entre publicación, vigencia, aplicabilidad y revisión.

### 12. Memoria organizacional — `DEPLOYED / SIN APRENDIZAJES REALES`

La infraestructura de nodos, relaciones, versiones, vigencia y supersesión existe. Falta capturar, aprobar y reutilizar el primer aprendizaje real antes de considerarla una ventaja medida.

### 13. Release y assurance — `DONE EN SU ALCANCE TÉCNICO`

- `npm ci` reproducible;
- typecheck, build y smoke;
- Release Gate único;
- guardrails de producto, seguridad y roadmap;
- previews antes de merge;
- UI Golden Path productivo;
- aserciones server-side independientes;
- assurance multiempresa;
- procedimientos documentados para datos E2E.

---

## Evidencia productiva

### Golden Path por UI — 3/3

| Métrica | Resultado |
|---|---:|
| Ejecuciones Playwright | 3/3 |
| Aserciones persistidas | 51/51 |
| Etapas aprobadas | 15/15 |
| Jobs exitosos | 15/15 |
| Intentos por job | 1 |
| Retry / recovery / dead-letter | 0 / 0 / 0 |
| Tokens observados | 185.091 |

### Assurance disponibles

- [`UI Golden Path productivo 3/3`](./docs/assurance/ui-golden-path-production-3x-2026-08-07.md)
- [`Inventario real de N3uralia 3/3`](./docs/assurance/n3uralia-processing-inventory-3x-2026-08-08.md)
- [`Revisión lifecycle de N3uralia 3/3`](./docs/assurance/n3uralia-processing-lifecycle-3x-2026-08-08.md)
- [`Aviso y eliminación convertidos en trabajo 3/3`](./docs/assurance/n3uralia-processing-privacy-remediation-3x-2026-08-08.md)
- [`Mapeo del aviso aceptado con brechas 3/3`](./docs/assurance/n3uralia-processing-notice-mapping-3x-2026-08-08.md)
- [`Ciclo de vida de datos E2E`](./docs/operations/ui-golden-path-data-lifecycle.md)

> La evidencia demuestra arquitectura, persistencia, seguridad e idempotencia dentro del alcance probado. No sustituye revisión legal, auditoría, certificación ni observación de una organización externa.

---

## En desarrollo ahora

### Bloque 16 — siguiente cierre de evidencia — `ACTIVE`

La continuidad autorizada es:

1. ejecutar una prueba controlada de eliminación o anonimización por actividad;
2. adjuntar evidencia auditable a las tres solicitudes abiertas;
3. revisar y aceptar solo las pruebas que cumplan el contrato;
4. mantener `0/3` cuando la evidencia no exista o sea insuficiente;
5. después, resolver las dimensiones lifecycle con fuentes aprobadas.

No corresponde abrir otro módulo ni avanzar al Bloque 17 mientras estas evidencias sigan pendientes.

---

## Gates antes de beta privada autoservicio

| Gate | Estado |
|---|---|
| Leaked Password Protection | `BLOCKED` por configuración externa |
| Tres actividades reales | `VALIDATED` |
| Lifecycle de cinco dimensiones | `VALIDATED INICIAL / CAMBIOS REQUERIDOS` |
| Mapeo del aviso | `VALIDATED INICIAL 3/3 CON BRECHAS` |
| Eliminación demostrada | `0/3` |
| Multiempresa interno | `VALIDATED` |
| Golden Path repetible | `VALIDATED x3` |
| Organización externa observada | pendiente |
| Tiempo humano, retrabajo y costo real | pendiente |

No se habilitará beta autoservicio mientras permanezcan abiertos los gates críticos de seguridad, evidencia lifecycle, eliminación y validación externa.

---

## Arquitectura

```mermaid
flowchart TB
  Human[Persona responsable] --> UI[Next.js App Router]
  UI --> Server[Server Components y API routes]
  Server --> Auth[Supabase Auth]
  Server --> DB[(Postgres + RLS)]
  Server --> Queue[PGMQ / cola durable]
  Queue --> Worker[Agent worker]
  Worker --> OpenAI[OpenAI Responses API]
  Worker --> Runs[Runs, artefactos y métricas]
  Runs --> Review[Revisión humana]
  Review --> Work[Misiones, solicitudes y controles]
  Work --> Evidence[Evidencia e integridad]
  Evidence --> Memory[Grafo y memoria organizacional]
  Memory --> UI
  Vercel[Vercel previews y producción] --> UI
```

### Stack principal

- **Frontend y backend:** Next.js App Router, React y TypeScript.
- **Datos y seguridad:** Supabase Auth, Postgres, RLS y RPC transaccionales.
- **IA:** OpenAI Responses API con Structured Outputs y control de calidad.
- **Orquestación:** workflows por etapas, PGMQ, lease, heartbeat y cron.
- **Interfaz:** Tailwind CSS y componentes reutilizables accesibles.
- **Despliegue:** Vercel con previews y gates antes de merge.

---

## Mapa del repositorio

```text
app/                         rutas públicas, autenticadas y API
components/                  experiencia y componentes reutilizables
lib/agents/                  catálogo, prompts, schemas y runtime
lib/compliance/              expedientes, controles, evidencia y confianza
lib/privacy/                 aviso y contratos de mapeo
lib/supabase/                clientes de navegador, servidor y administración
supabase/migrations/         esquema y cambios reproducibles
scripts/                     guardrails, verificaciones y smoke tests
tests/e2e/                   Golden Path productivo
.github/workflows/           CI, release y assurance
ROADMAP.md                   fuente canónica de prioridad y estado
docs/assurance/              evidencia técnica de recorridos validados
docs/governance/             contrato de ejecución y prioridades
docs/operations/             procedimientos operacionales y de datos
```

---

## Roadmap canónico: trabajar sin desviaciones

[`ROADMAP.md`](./ROADMAP.md) es la **única fuente canónica de prioridad, secuencia y estado**.

Un cambio está autorizado cuando cumple al menos una condición:

1. pertenece al único bloque marcado `NEXT`;
2. cierra un gate `P0` o una tarea `ACTIVE`;
3. corrige un bug, regresión o riesgo de seguridad e integridad;
4. responde a una decisión explícita del owner que actualiza el roadmap en la misma PR.

No se inicia trabajo `PLANNED` o `DEFERRED` solo porque parezca atractivo. El contrato está en [`docs/governance/canonical-roadmap-contract.md`](./docs/governance/canonical-roadmap-contract.md) y se verifica mediante:

```bash
npm run check:canonical-roadmap
```

---

## Desarrollo local

### Requisitos

- Node.js compatible con Next.js 16;
- npm y lockfile comprometido;
- proyecto Supabase;
- credenciales de OpenAI para ejecutar especialistas;
- secretos gestionados exclusivamente en servidor.

### Variables mínimas

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Solo servidor
SUPABASE_URL=
SUPABASE_SECRET_KEY=
OPENAI_API_KEY=

# Opcionales
OPENAI_REASONING_MODEL=
OPENAI_FALLBACK_MODEL=
```

También se aceptan las claves legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`, pero nunca deben exponerse secretos en componentes cliente, logs, documentación o artefactos.

### Instalación

```bash
npm ci
npm run dev
```

### Validación antes de publicar

```bash
npm run typecheck
npm run check:canonical-roadmap
npm run check:processing-notice-mapping
npm run release:check
npm run smoke
```

---

## Flujo de contribución

1. Leer [`ROADMAP.md`](./ROADMAP.md), este README y [`AGENTS.md`](./AGENTS.md).
2. Identificar el bloque, gate o defecto autorizado.
3. Crear una rama desde `main`.
4. Implementar el cambio más pequeño, reversible y verificable.
5. Ejecutar las validaciones relevantes.
6. Abrir una PR con alineación explícita al roadmap.
7. Esperar gates y previews verdes.
8. Fusionar solo cuando la evidencia sostenga el estado declarado.

---

## Límites y no-promesas

Kumplio no debe afirmar:

- cumplimiento global por un score alto;
- aplicabilidad jurídica sin fuente y validación;
- operación efectiva por un documento aislado;
- inventario completo mientras existan unknowns relevantes;
- aviso suficiente porque un mapeo fue aceptado;
- eliminación demostrada sin una prueba auditable;
- auditoría aprobada por una salida generada;
- reemplazo de abogado, auditor, DPO o autoridad;
- éxito comercial basándose en tenants sintéticos;
- ausencia de defectos fuera del recorrido probado.

La plataforma guía, organiza y demuestra. La decisión sensible permanece en manos de una persona responsable.

---

## La visión

Kumplio busca convertirse en el lugar donde una organización puede responder, sin reconstruir todo desde cero:

```text
¿Qué cambió?
¿Qué riesgo tengo?
¿Qué debo decidir?
¿Qué falta demostrar?
¿Quién debe actuar?
¿Por qué Kumplio llegó a esta conclusión?
¿Qué aprendimos para no repetir el problema?
```

Ese es el producto: **un sistema operativo que coordina cumplimiento, personas, especialistas, evidencia y aprendizaje continuo**.
