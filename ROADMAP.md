# KUMPLIO — Roadmap Maestro de Producto y Ejecución

> **Documento canónico de producto, arquitectura, evidencia y prioridades**  
> Estado: activo  
> Revisión: 7 de agosto de 2026  
> Mercado principal: Chile  
> Idioma visible obligatorio: español  
> Baseline técnico probado: `0a81b76f0ad28b5a19921cf1f96223e6aae8046a`  
> Última migración aplicada: `20260807210713_seed_tenant_assurance_sandbox_v1`  
> Assurance 3/3: `docs/assurance/ui-golden-path-production-3x-2026-08-07.md`  
> Repositorio: `traviscomber/kumplio`

---

## 1. Regla de este roadmap

Este archivo representa el **estado comprobable del producto**, no el historial de ideas, conversaciones, issues o PRs.

Prioridad de evidencia para marcar algo como hecho:

1. código presente en `main`;
2. migración versionada y aplicada cuando corresponda;
3. prueba técnica, transaccional o de seguridad verificable;
4. Release Gate, build, smoke y despliegues verdes;
5. uso real por una persona o piloto;
6. métrica de resultado cuando el bloque la requiera.

Si una conversación, una pantalla o una PR contradice `main`, Supabase o una prueba real, prevalece la evidencia técnica.

### Estados oficiales

| Estado | Significado |
|---|---|
| `PLANNED` | Definido, sin implementación activa. |
| `ACTIVE` | Desarrollo, prueba o cierre en curso. |
| `DEPLOYED` | Código y/o migración en producción. |
| `VALIDATED` | Flujo probado con datos reales o una prueba representativa. |
| `VALIDATED INICIAL` | Primer caso comprobado; falta repetibilidad, cobertura o piloto externo. |
| `DONE` | Validado, medido y sin gate técnico relevante pendiente dentro de su alcance. |
| `BLOCKED` | Requiere acción externa, permiso o decisión explícita. |
| `DEFERRED` | Tiene valor, pero no compite con la ruta crítica. |

`DEPLOYED` no equivale a `VALIDATED`. Un tenant sintético aislado tampoco equivale a un piloto externo ni a cumplimiento legal.

---

## 2. Tesis de producto vigente

Kumplio no es un chatbot jurídico, un dashboard genérico ni una colección de agentes. Es una plataforma para **centralizar información sensible, convertir exigencias y riesgos en trabajo concreto, y demostrar qué hizo una organización**.

La experiencia central es:

```text
Una persona describe una situación
→ Kumplio abre un expediente vivo
→ centraliza contexto, fuentes y evidencia
→ especialistas analizan dentro de fronteras explícitas
→ un supervisor detecta contradicciones y reservas
→ una persona valida decisiones sensibles
→ quedan controles, acciones, responsables y plazos
→ la organización demuestra el avance con trazabilidad
→ el conocimiento aprobado mejora el siguiente caso
```

### Propuesta de valor

**Proteger y ordenar la información de cumplimiento para resolver situaciones con guía experta, evidencia y revisión humana, dejando cada decisión trazable.**

### Promesas sostenibles

1. Reunir información dispersa en un expediente controlado.
2. Separar hechos, fuentes, inferencias, reservas y decisiones humanas.
3. Convertir un análisis en misión, responsable, vencimiento y solicitud de evidencia.
4. Conservar el historial sin sobrescribir versiones previas.
5. Explicar por qué aparece una prioridad o un nivel de confianza.
6. Reutilizar controles, evidencia y precedentes cuando exista una relación defendible.
7. Coordinar especialistas sin presentar una salida generada como decisión aprobada.
8. Registrar actividades de tratamiento sin inventar datos ausentes ni presentar una base propuesta como conclusión jurídica.
9. Aislar cada organización y probar ese aislamiento en ambas direcciones.

### Lo que Kumplio no debe afirmar

- que una empresa cumple globalmente por tener un score alto;
- que la ausencia de datos en Kumplio demuestra que algo no existe;
- que un documento aislado acredita la operación completa de un control;
- que una recomendación de IA sustituye revisión legal, auditoría o decisión humana;
- que una línea base o una actividad inicial equivale a inventario completo;
- que una clasificación de riesgo es definitiva sin metodología y aprobación;
- que un tenant sintético equivale a una empresa cliente real;
- que aprobar la calidad de un artefacto equivale a aprobar el cierre del caso.

### Principios no negociables

1. Chile primero.
2. Seguridad y centralización desde el inicio.
3. Sin fuente no hay afirmación regulatoria.
4. Sin evidencia no hay conclusión de cumplimiento.
5. IA propone; una persona valida decisiones sensibles.
6. Generado no significa aprobado.
7. Toda mutación crítica deja auditoría en la misma transacción.
8. Cada organización permanece aislada.
9. Versionar antes que sobrescribir.
10. La UI habla de resultados, decisiones y trabajo; no de infraestructura.
11. La confianza siempre declara alcance y límites.
12. Los desconocidos se conservan hasta resolverse con evidencia.
13. No se agregan módulos atractivos si un gate P0 continúa abierto.

---

## 3. Estado ejecutivo al 7 de agosto de 2026

### Baseline productivo verde

El baseline técnico validado es:

`0a81b76f0ad28b5a19921cf1f96223e6aae8046a`

Sobre este baseline quedaron en `SUCCESS`:

- Release Gate;
- Application Validation;
- Release Qualification Foundation;
- typecheck;
- build de producción;
- smoke test;
- ambos despliegues Vercel;
- IndexNow production;
- UI Golden Path productivo;
- aserción persistida server-side.

PRs de referencia del cierre:

- **#217** — inventario mínimo real de tratamientos;
- **#219** — segundo tenant, aislamiento y repetibilidad;
- **#220** — corrección de joins del refresh de tenant assurance;
- **#223–#225** — selectores accesibles y revisión canónica;
- **#226** — navegación determinista después del onboarding;
- **#227** — perfiles de equipo sin embed PostgREST inexistente;
- **#228** — código de salida explícito de Playwright;
- **#229** — aserción durable de la actividad de tratamiento.

### Migraciones vigentes más recientes

| Versión aplicada | Migración |
|---|---|
| `20260807192320` | `processing_activity_inventory_v1` |
| `20260807192428` | `processing_inventory_explicit_browser_deny` |
| `20260807194153` | `seed_n3uralia_commercial_processing_activity` |
| `20260807203148` | `tenant_assurance_foundation_v1` |
| `20260807210440` | `fix_tenant_assurance_refresh_joins_v1` |
| `20260807210713` | `seed_tenant_assurance_sandbox_v1` |

### Preparación actual

| Nivel | Estado real |
|---|---|
| Desarrollo técnico | sólido |
| Demo comercial acompañada | apta |
| Golden path productivo por UI | validado 3/3 con actor E2E automatizado |
| Assurance multiempresa interno | validado |
| Piloto supervisado | apto para iniciar |
| Beta privada autoservicio | cerca; faltan gates P0 externos y de seguridad |
| Registro público autoservicio | no habilitar todavía |
| Escalamiento Enterprise | diferido hasta pilotos externos |

### Separación de datos comerciales y E2E

La base contiene tenants sintéticos creados para construir y repetir el gate. Al cierre se observaron:

| Categoría | Volumen |
|---|---:|
| Organizaciones no E2E | 2 |
| Organizaciones E2E | 9 |
| Usuarios E2E | 10 |
| Organizaciones oficiales del assurance 3/3 | 3 |
| Workflows E2E históricos | 7 |
| Actividades de tratamiento E2E | 5 |
| Actividades de tratamiento no E2E | 2 |

Los datos E2E no cuentan como clientes, pilotos externos ni cobertura real del inventario. Se conservarán únicamente mientras sean necesarios para evidencia y luego se limpiarán con un procedimiento tenant-scoped y auditable.

---

## 4. Hitos validados

### Hito A — Golden path y baseline assurance de N3uralia — `VALIDATED`

Caso oficial:

`91ae9174-be4c-4ddd-8980-4a671571afdc`

Cadena persistente:

```text
Caso aprobado
→ ámbito asignado
→ misión con owner y vencimiento
→ solicitud de evidencia
→ requerimiento interno diferenciado de obligación legal
→ control de línea base
→ evidencia aceptada con SHA-256
→ evaluación de diseño: effective
→ evaluación operacional: partial
→ resultado aprobado
→ misión completed
→ eventos de expediente, evidencia y misión
```

La operación permanece parcial y la confianza nunca se presenta como certificación.

### Hito B — Primer tratamiento real de N3uralia — `VALIDATED INICIAL`

Actividad:

> **Gestión de contactos comerciales y solicitudes de demostración**

Fuentes verificadas:

- endpoint `app/api/leads/route.ts`;
- tabla operacional `public.commercial_leads`;
- al menos un registro persistido;
- región Supabase `us-east-1`.

IDs principales:

- request key: `e6956b38-25e1-3bca-9f78-9293bb26af3c`;
- actividad: `26233189-3335-43e6-b382-99fcf2cc4090`;
- dataset: `7eed3f2c-0402-466f-8b0f-6ca84d6a28cd`;
- sistema/repositorio: `aabbcc76-f48c-4aad-b251-55aa2cc9185b`;
- tercero: `1f5fa52c-7b34-47f4-9e49-bd8007dad191`;
- evidencia: `ab080fbd-c189-4059-b5c4-752e65daaac5`;
- revisión: `3cc95dac-0026-42de-bcac-c5ac26ae19d6`.

Hash del snapshot:

`6e5c93c63295b308858baa054ffad95787cfadeeacbe2e5fda7e0f2e1da0e39d`

La revisión conserva seis desconocidos:

1. plazo de retención no aprobado;
2. base de licitud pendiente de validación jurídica;
3. destinatarios y subencargados incompletos;
4. riesgo del proveedor pendiente de metodología y aprobación;
5. aviso de privacidad no adjuntado;
6. mecanismo de eliminación no evidenciado.

Confianza actual del alcance de N3uralia:

| Dimensión | Resultado |
|---|---:|
| Requerimientos con control | 100% |
| Responsables definidos | 100% |
| Evidencia suficiente | 100% |
| Efectividad de diseño | 100% |
| Efectividad operacional | 50% |
| Inventario de tratamientos | 70% |
| Evidencia validada | 100% |
| **Resultado bruto ponderado** | **85%** |
| **Resultado mostrado** | **65%** |

El máximo sigue en 65% por operación parcial y por inventario parcial con desconocidos abiertos.

### Hito C — Segundo tenant aislado y tenant assurance — `VALIDATED`

Sandbox interno:

- organización: `5efbcdd0-a309-4bf9-bf44-18ba72b4cb83`;
- usuario independiente: `044c7969-d8e3-47a6-bb5a-ab25a7fc74e3`;
- proyecto: `273de103-2d26-4c4f-a08b-f05dfc4e2b6f`;
- caso guiado: `b354573c-02ed-4ffc-ad8b-37fd5972e5a6`;
- workflow: `8af2ce3b-d9ab-4fc8-be32-2d759f18b91e`;
- misión: `ca17e9ca-16ab-451e-a436-f23234cf393a`;
- solicitud: `1892855b-39b3-4c22-b780-2896a77ec234`;
- assurance run: `b061afbe-22c4-4351-b29d-94c680c5d095`.

Cadena validada:

```text
Cuenta E2E independiente
→ onboarding autenticado
→ organización y proyecto propios
→ expediente guiado
→ workflow de cinco especialistas
→ plan operativo
→ baseline assurance
→ inventario sintético
→ evidencia y revisión
→ cinco jobs durables
→ cinco aprobaciones bajo el contrato de revisión
→ tenant assurance passed
```

Controles de aislamiento aprobados:

- onboarding idempotente;
- caso guiado idempotente;
- plan operativo idempotente;
- baseline idempotente;
- inventario idempotente;
- enqueue idempotente;
- el sandbox lee sus propios datos;
- el sandbox no lee N3uralia;
- N3uralia no lee el sandbox;
- cambio de workspace ajeno denegado en ambas direcciones;
- tablas internas denegadas al navegador;
- RPC internas denegadas al navegador;
- mutación server-side con actor del tenant equivocado rechazada.

Resultado dinámico del segundo tenant:

| Métrica | Resultado |
|---|---:|
| Etapas | 5/5 |
| Jobs succeeded | 5/5 |
| Dead-letter | 0 |
| Runs aprobados | 5/5 |
| Artefactos aprobados | 5/5 |
| Revisiones registradas | 5/5 |
| Input tokens | 50.592 |
| Output tokens | 22.499 |
| Total tokens | 73.091 |
| Tiempo de modelo acumulado | 364.091 ms |
| Assurance final | `passed` |

La etapa final recomendó **`request_changes`** y mantuvo reservas abiertas. Se aprobó la calidad del artefacto, no el cierre del caso ni una conclusión de cumplimiento.

El assurance fundacional detectó que `refresh_tenant_assurance_run_v1` intentaba leer `workflow_id` directamente desde `agent_runs` y `agent_artifacts`, columnas que no existen. La PR #220 corrigió el recorrido canónico:

```text
agent_workflows
→ agent_workflow_stages
→ agent_runs
→ agent_artifacts / agent_reviews
```

El Release Gate impide reintroducir esos joins inválidos. La verificación reversible `scripts/59-verify-tenant-assurance.sql` pasó dentro de `BEGIN ... ROLLBACK` sin alterar producción.

### Hito D — UI Golden Path productivo y repetible — `VALIDATED x3`

Commit probado:

`0a81b76f0ad28b5a19921cf1f96223e6aae8046a`

GitHub Actions run:

`31229627159`

El recorrido se ejecutó tres veces consecutivas contra producción. Cada intento creó una cuenta, organización y workspace independientes, y completó por interfaz:

```text
login
→ onboarding
→ caso inicial
→ expediente guiado
→ cinco especialistas
→ cinco aprobaciones explícitas bajo el contrato de revisión
→ plan operativo
→ misión y solicitud
→ baseline
→ aceptación explícita de la línea base
→ actividad de tratamiento
→ sistema, dataset, tercero y evidencia
→ revisión parcial con desconocidos abiertos
```

El actor de las tres ejecuciones fue Playwright con una cuenta E2E. Esto valida el contrato técnico de revisión y aceptación; no demuestra que una persona real haya completado el recorrido.

Resultado agregado:

| Métrica | Resultado 3/3 |
|---|---:|
| Ejecuciones Playwright exitosas | 3/3 |
| Aserciones server-side | 51/51 |
| Etapas aprobadas | 15/15 |
| Jobs succeeded | 15/15 |
| Intentos por job | 1 |
| Retry | 0 |
| Dead-letter | 0 |
| Input tokens | 126.011 |
| Output tokens | 59.080 |
| Total tokens | 185.091 |
| Tiempo de modelo acumulado | 791.441 ms |
| Duración total del navegador | 1.330.038 ms |
| Promedio de tokens por ejecución | 61.697 |
| Promedio de navegador por ejecución | 443.346 ms |

Organizaciones oficiales del cierre:

- `f02634d4-8dfe-46b3-b58f-fd1c188a1230`;
- `855eb5b2-c35c-4130-b80c-d87576bc0140`;
- `68291744-3ea1-424f-88ad-c199a780c662`.

El documento de assurance conserva jobs, artefactos, digests, métricas, fronteras y las 17 aserciones exigidas en cada intento.

---

## 5. Capacidades actuales

### A. Narrativa, seguridad y entrada — `DEPLOYED`

- narrativa centrada en protección de datos, centralización y guía experta;
- separación entre superficie pública y workspaces privados;
- autenticación, onboarding y workspace activo;
- navegación simplificada;
- equipo, roles, invitaciones y revocación.

### B. Expedientes y golden path — `VALIDATED x3`

- expediente canónico;
- inicio idempotente;
- especialistas y contrato de revisión;
- plan operativo;
- baseline, evidencia y misión;
- ejecución productiva por UI en tres tenants limpios consecutivos con actor E2E.

Pendiente fuera del alcance técnico: observación con una organización externa real.

### C. Consejo de Especialistas — `VALIDATED x3`

- Structured Outputs y Zod;
- fronteras `DECIDE / NO DECIDE`;
- herramientas autorizadas y trazabilidad;
- contexto de comité;
- contradicciones y reservas;
- supervisor determinístico;
- aprobación con justificación y aceptación explícita;
- retry sin sobrescribir versiones.

### D. Ejecución durable — `VALIDATED x3`

- PGMQ;
- jobs tenant-scoped;
- enqueue idempotente;
- lease y heartbeat;
- retry y dead-letter;
- cron de worker;
- 15 etapas consecutivas procesadas en las tres ejecuciones oficiales;
- 15/15 jobs exitosos en un solo intento.

### E. Controles, evidencia y aseguramiento — `VALIDATED x3`

- controles y solicitudes;
- evidencia con procedencia, hash y vigencia;
- suficiencia revisada;
- diseño y operación separados;
- baseline assurance idempotente;
- operación parcial visible;
- cierre con aceptación explícita.

### F. Inventario de tratamientos — `VALIDATED INICIAL`

- actividad, finalidad y base propuesta;
- titulares y categorías;
- owner, sistema, dataset y tercero;
- transferencia y retención;
- fuente, snapshot y hash;
- revisión con justificación;
- desconocidos explícitos;
- dimensión de confianza y tope por parcialidad;
- comprobación durable de tarjeta, evidencia e integridad en producción.

Solo una actividad está validada como proceso real de N3uralia. Los registros E2E no cuentan para cobertura del piloto.

### G. Grafo, mapeo e impacto — `DEPLOYED`

- relaciones navegables;
- timeline;
- análisis de impacto;
- reutilización de controles;
- confianza por dimensiones y topes.

### H. Memoria organizacional — `DEPLOYED / SIN DATOS REALES`

- lectura de memoria;
- fallback a decisiones;
- casos similares;
- precedentes en contexto de agentes.

Pendiente: crear el primer aprendizaje aprobado, versionado y reutilizado.

### I. Escritorio y responsabilidad — `VALIDATED INICIAL`

- prioridades y explicabilidad;
- briefing y cierre diario;
- Mi trabajo;
- delegación asistida;
- SLA, carga y seguimiento.

### J. Motor regulatorio — `DEPLOYED`

- fuentes oficiales, capturas, versiones y hashes;
- claims con citas;
- LeyChile / BCN;
- Diario Oficial;
- Dirección del Trabajo;
- SMA / SNIFA.

### K. Tenant assurance — `VALIDATED`

- usuarios y organizaciones independientes;
- aislamiento bidireccional;
- pruebas RLS y RPC;
- golden path completo;
- tres ejecuciones UI aisladas;
- métricas internas;
- estado visible en Operaciones.

### L. Release y seguridad — `DONE / DEUDA EXTERNA CONOCIDA`

- `npm ci` reproducible;
- Release Gate único;
- typecheck, build y smoke;
- dependency audit crítico;
- previews antes de merge;
- `SECURITY INVOKER` y `search_path=''`;
- RPC críticas restringidas;
- RLS y denegación explícita para tablas internas;
- OIDC para el gate UI sin secretos privilegiados de larga duración.

Deuda externa conocida: **Supabase Auth Leaked Password Protection continúa desactivada**.

---

## 6. Estado de los bloques 1–18

| Bloque | Resultado | Estado |
|---:|---|---|
| 1 | Auth, workspace activo y tenant | `VALIDATED INICIAL / BLOCKED` por leaked passwords |
| 2 | Golden path Ley N.º 21.719 | `VALIDATED x3` técnico con actor E2E |
| 3 | UX operacional | `DEPLOYED` |
| 4 | Ejecución durable | `VALIDATED x3` |
| 5 | Evidencia y controles | `VALIDATED x3` |
| 6 | Release Gate | `DONE` |
| 7 | Grafo y reutilización | `DEPLOYED` |
| 8 | Timeline, confianza e impacto | `DEPLOYED / VALIDATED INICIAL` |
| 9 | Memoria y casos similares | `DEPLOYED / SIN DATOS REALES` |
| 10 | Especialización, comité y supervisor | `VALIDATED x3` |
| 11 | Escritorio, explicabilidad, SLA y delegación | `DEPLOYED / VALIDATED INICIAL` |
| 12 | Expediente → plan operativo | `VALIDATED x3` |
| 13 | Baseline assurance honesto | `VALIDATED x3` |
| 14 | Inventario mínimo real de tratamientos | `VALIDATED INICIAL` |
| 15 | Tenant assurance y repetibilidad técnica | `DONE` |
| 16 | Ampliación del inventario real | `NEXT` |
| 17 | Aprendizaje organizacional | `PLANNED` |
| 18 | Piloto externo y medición | `PLANNED` |

---

## 7. Gates P0 antes de beta privada autoservicio

### 1. Leaked Password Protection — `BLOCKED`

- activar en Supabase Auth;
- verificar la configuración real;
- cerrar la deuda de seguridad.

### 2. Multiempresa — `VALIDATED INTERNO / ACTIVE EXTERNO`

Completado:

- múltiples organizaciones y usuarios independientes;
- aislamiento positivo y negativo;
- selector de workspace protegido;
- pruebas de tablas y RPC;
- tres tenants limpios creados y operados por UI productiva mediante actor E2E.

Falta:

- piloto con una segunda organización externa real;
- observar el selector y la sesión desde UI con usuarios humanos;
- repetir pruebas después de incorporar módulos que amplíen la superficie tenant-scoped.

### 3. Inventario mínimo Ley N.º 21.719 — `VALIDATED INICIAL / ACTIVE`

Ya existe una actividad real con sistema, dataset, tercero, evidencia y revisión.

Falta:

- dos actividades reales adicionales;
- bases de licitud validadas;
- retención aprobada;
- destinatarios y subencargados completos;
- aviso de privacidad;
- eliminación demostrada;
- riesgo de terceros con metodología aprobada.

### 4. Repetibilidad del golden path — `3/3 / VALIDATED`

Completado:

- tres ejecuciones consecutivas en tenants limpios;
- creación y avance por UI productiva;
- 17/17 aserciones persistidas por ejecución;
- 15/15 jobs exitosos;
- un intento por job;
- cero retry, recovery y dead-letter;
- cero intervención SQL para crear o avanzar registros de negocio;
- evidencia visual y digests por intento.

El gate fue ejecutado por Playwright. Valida repetibilidad técnica y el contrato de aceptación; no acredita todavía operación humana real.

Pendiente fuera de este gate:

- tiempo humano de un usuario real;
- costo monetario completo por caso;
- retrabajo y claridad percibida;
- validación externa.

### 5. Piloto supervisado externo — `PLANNED`

- 1–3 organizaciones;
- responsable real de cumplimiento;
- tareas y evidencia reales;
- feedback de UX, confianza y retrabajo;
- alcance congelado durante la observación.

---

## 8. Backlog ordenado

### P1 — Valor acumulativo

1. Ampliación del inventario real.
2. Aprendizaje desde correcciones humanas con vigencia y aprobación.
3. Biblioteca viva por dominio de cumplimiento.
4. Recomendaciones proactivas explicables.
5. Seguimiento automático sin spam.
6. Reutilización de evidencia entre controles y marcos.
7. Gestión de terceros críticos y dependencias.
8. Preparación continua para auditoría.

### P2 — Operación avanzada

1. Modo incidente y sala ejecutiva.
2. Cadena de custodia y preservación.
3. Post-mortem estructurado.
4. Portal de auditor y Data Room.
5. Paquetes versionados de fiscalización.
6. Retención, eliminación y divulgaciones controladas.

### P3 — Enterprise y expansión

1. Holdings, filiales y países.
2. Multi-framework: Ley N.º 21.719, ISO 27001, NIST y SOC 2.
3. API pública, webhooks e integraciones.
4. SSO y gobierno corporativo.
5. Motor de capacidad, dependencias y simulación.
6. Verticales Transporte, Minería y Agro.
7. Marketplace e internacionalización.

---

## 9. Próximos bloques de 3

### Bloque 16 — Ampliación del inventario real — `NEXT`

1. registrar dos actividades reales adicionales representativas;
2. validar base, retención, destinatarios, subencargados y transferencias;
3. adjuntar aviso de privacidad y evidencia de eliminación, o crear acciones explícitas con owner y fecha.

**Salida:** el inventario deja de depender de un solo proceso real y reduce desconocidos con evidencia aprobada.

### Bloque 17 — Aprendizaje organizacional

1. capturar correcciones humanas clasificadas;
2. versionar vigencia, supersesión y conflictos;
3. crear biblioteca viva y reutilizar un aprendizaje en un caso equivalente.

**Salida:** un error corregido una vez no se repite silenciosamente en un caso similar.

### Bloque 18 — Piloto externo y medición

1. incorporar una organización externa supervisada;
2. observar el recorrido completo sin intervención del equipo técnico;
3. medir tiempo humano, costo, retrabajo, claridad, confianza y willingness-to-pay.

**Salida:** decisión informada sobre beta privada y comercialización.

La tercera repetición técnica ya no forma parte de este bloque: quedó cerrada por el assurance 3/3.

---

## 10. Métricas de cierre v1.0

| Indicador | Gate | Estado actual |
|---|---:|---:|
| Bugs críticos abiertos | 0 | 0 conocidos en el recorrido cerrado |
| Release Gate en cambios críticos | 100% | 100% |
| Golden paths productivos en tenants independientes | ≥ 3 | 3/3 técnicos con actor E2E |
| Aserciones persistidas del gate UI | 100% | 51/51 |
| Duplicados o huérfanos por retry | 0 | 0 en los tres paths oficiales |
| Retry / recovery / dead-letter | 0 | 0 / 0 / 0 |
| Fugas cross-tenant | 0 | 0 en assurance interno |
| Actividades reales revisadas | ≥ 3 | 1 real validada; registros E2E excluidos |
| Controles con owner | 100% del alcance piloto | 100% del alcance actual |
| Evidencia demostrada con procedencia | 100% | 100% del alcance declarado |
| Contrato de revisión explícita en assurance | 100% | 100% ejercido por actor E2E |
| Recorridos completos por persona externa | ≥ 1 | 0 |
| Recomendaciones con explicación | 100% | 100% del assurance |
| Bases/retención pendientes | visibles y accionables | visibles |
| Tokens de las tres ejecuciones UI | medir | 185.091 totales; 61.697 promedio |
| Tiempo de modelo de las tres ejecuciones | medir | 791.441 ms acumulados |
| Duración del navegador | medir | 1.330.038 ms total; 443.346 ms promedio |
| Tiempo humano del piloto | medir | pendiente |
| Costo monetario completo | medir | pendiente |
| Organizaciones externas observadas | ≥ 1 | 0 |

---

## 11. Política de datos E2E y limpieza

Los tenants sintéticos son evidencia técnica temporal, no activos comerciales.

Reglas:

1. identificar cada tenant por email, `run_id`, `run_attempt` y organización;
2. conservar los tres intentos oficiales mientras el gate 3/3 sea evidencia activa;
3. no mezclar sus métricas con organizaciones no E2E;
4. no eliminar manualmente filas aisladas que puedan dejar huérfanos;
5. diseñar una limpieza tenant-scoped, transaccional y auditable;
6. eliminar primero intentos fallidos e incompletos;
7. conservar digests y resúmenes aunque expiren los artefactos pesados;
8. ejecutar la limpieza solo después de validar relaciones y políticas de retención.

---

## 12. Congelamiento de alcance

Hasta cerrar P0:

- no crear módulos nuevos solo porque son atractivos;
- no construir Enterprise antes de validar pilotos externos;
- no presentar línea base o actividad como inventario completo;
- no aumentar scores ocultando operación parcial;
- no convertir bases propuestas o riesgos provisionales en conclusiones aprobadas;
- no automatizar decisiones irreversibles sin aprobación;
- no confundir aprobación de artefactos con cierre del expediente;
- no mezclar modernización de dependencias con cambios funcionales grandes;
- no marcar `DONE` fuera del alcance que la evidencia realmente cubre.

Toda idea nueva debe demostrar que:

1. elimina una fricción real;
2. reduce tiempo o retrabajo;
3. mejora calidad o trazabilidad;
4. aumenta seguridad o aislamiento;
5. o es necesaria para un piloto concreto.

---

## 13. Decisión vigente

El bloque 15 queda cerrado como **`DONE` dentro del assurance técnico interno**.

Kumplio ya demostró internamente:

- creación aislada de tenants desde producción;
- tres recorridos completos por interfaz con actor E2E;
- ejecución durable de cinco especialistas por recorrido;
- contrato de revisión y aceptación explícita ejercido en cada etapa;
- plan operativo, misión, evidencia y baseline;
- inventario de tratamiento con hash, sistema, dataset y tercero;
- 51/51 aserciones persistidas;
- 15/15 jobs exitosos en un intento;
- cero retry, recovery y dead-letter;
- una conclusión conservadora que mantiene límites y desconocidos abiertos.

Esto valida la arquitectura y la repetibilidad técnica. No sustituye un piloto externo, no demuestra beta autoservicio, no acredita experiencia de usuario humana y no acredita cumplimiento integral.

La prioridad inmediata es:

> **Bloque 16 — Ampliación del inventario real.**

En paralelo deben cerrarse:

1. Supabase Auth Leaked Password Protection;
2. procedimiento seguro de limpieza de tenants E2E históricos;
3. diseño y ejecución del primer piloto externo supervisado.

No se habilitará beta autoservicio hasta cerrar la deuda de leaked passwords, ampliar el inventario real y observar al menos una organización externa supervisada.
