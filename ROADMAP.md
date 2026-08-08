# KUMPLIO — Roadmap Maestro de Producto y Ejecución

> **Documento canónico de producto, arquitectura, evidencia y prioridades**  
> Estado: activo  
> Revisión: 8 de agosto de 2026  
> Mercado principal: Chile  
> Idioma visible obligatorio: español  
> Baseline funcional probado: `14a67f2a15423362ed1ed403182fb8b80d5348ba`  
> Última migración aplicada: `20260808020905_seed_n3uralia_core_processing_activities_v1`  
> Assurance UI 3/3: `docs/assurance/ui-golden-path-production-3x-2026-08-07.md`  
> Assurance inventario real: `docs/assurance/n3uralia-processing-inventory-3x-2026-08-08.md`  
> Repositorio: `traviscomber/kumplio`

---

## 1. Regla de este roadmap

Este archivo representa el **estado comprobable del producto**, no el historial de ideas, conversaciones, issues o PRs.

Prioridad de evidencia para cambiar un estado:

1. código presente en `main`;
2. migración versionada y reconciliada con producción cuando corresponda;
3. prueba técnica, transaccional, funcional o de seguridad verificable;
4. Release Gate, build, smoke y despliegues verdes;
5. uso real por una persona o piloto;
6. métrica de resultado cuando el bloque la requiera.

Si una conversación, una pantalla, una PR o un documento secundario contradice `main`, Supabase o una prueba real, prevalece la evidencia técnica.

### Estados oficiales

| Estado | Significado |
|---|---|
| `PLANNED` | Definido, sin implementación activa. |
| `ACTIVE` | Desarrollo, prueba o cierre en curso. |
| `DEPLOYED` | Código y/o migración en producción. |
| `VALIDATED` | Flujo probado con datos reales o una prueba representativa. |
| `VALIDATED INICIAL` | Primer alcance comprobado; falta cobertura, calidad o piloto externo. |
| `DONE` | Validado y sin gate técnico relevante pendiente dentro de su alcance. |
| `BLOCKED` | Requiere acción externa, permiso o decisión explícita. |
| `DEFERRED` | Tiene valor, pero no compite con la ruta crítica. |

`DEPLOYED` no equivale a `VALIDATED`. `VALIDATED` internamente no equivale a piloto externo. Un score alto no equivale a cumplimiento global.

---

## 2. Tesis de producto vigente

Kumplio no es un chatbot jurídico, un dashboard genérico ni una colección de checklists. Es un **sistema operativo de cumplimiento** para centralizar información sensible, coordinar especialistas, convertir análisis en trabajo y demostrar qué hizo una organización.

La experiencia central es:

```text
Una persona describe una situación
→ Kumplio abre un expediente vivo
→ centraliza contexto, fuentes y evidencia
→ especialistas analizan dentro de fronteras explícitas
→ un supervisor detecta contradicciones y reservas
→ una persona valida decisiones sensibles
→ quedan acciones, responsables y plazos
→ controles y evidencia demuestran el avance
→ el conocimiento aprobado mejora el siguiente caso
```

### Propuesta de valor

**Proteger y ordenar la información de cumplimiento para resolver situaciones con guía experta, evidencia y revisión humana, dejando cada decisión trazable.**

### Promesas sostenibles

1. Reunir información dispersa en un expediente controlado.
2. Separar hechos, fuentes, inferencias, reservas y decisiones humanas.
3. Convertir análisis en misión, responsable, vencimiento y solicitud de evidencia.
4. Conservar historia y versiones sin sobrescribir el pasado.
5. Explicar por qué aparece una prioridad o nivel de confianza.
6. Reutilizar controles, evidencia y precedentes cuando exista relación defendible.
7. Coordinar especialistas sin presentar una salida generada como decisión aprobada.
8. Registrar actividades de tratamiento sin inventar datos ausentes.
9. Aislar cada organización y probar ese aislamiento en ambas direcciones.
10. Mantener visibles los desconocidos hasta resolverlos con evidencia aprobada.

### Lo que Kumplio no debe afirmar

- que una organización cumple globalmente por tener un score alto;
- que la ausencia de datos en Kumplio demuestra que algo no existe;
- que un documento aislado acredita la operación completa de un control;
- que una recomendación de IA sustituye revisión legal, auditoría o decisión humana;
- que una base propuesta ya fue validada jurídicamente;
- que una línea base o tres actividades equivalen a inventario organizacional completo;
- que una clasificación de riesgo es definitiva sin metodología y aprobación;
- que un tenant sintético equivale a una empresa cliente real;
- que aprobar un artefacto equivale a cerrar un expediente.

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

## 3. Estado ejecutivo al 8 de agosto de 2026

### Baseline funcional verde

El baseline funcional validado es:

```text
14a67f2a15423362ed1ed403182fb8b80d5348ba
```

Sobre el cambio funcional de inventario quedaron en `SUCCESS`:

- Canonical Roadmap Guardrail;
- Processing Inventory Guardrail;
- Release Gate;
- Application Validation;
- Release Qualification Foundation;
- typecheck;
- build de producción;
- smoke test;
- ambos previews de Vercel;
- verificaciones de producción de solo lectura.

PRs de referencia recientes:

- **#217** — inventario mínimo real de tratamientos;
- **#219–#220** — segundo tenant, aislamiento y tenant assurance;
- **#223–#229** — Golden Path productivo por UI y correcciones derivadas;
- **#230** — evidencia técnica 3/3;
- **#231** — ciclo de vida seguro de tenants E2E;
- **#232** — ampliación a tres actividades reales de N3uralia;
- **#233** — README único y contrato de roadmap canónico.

### Migraciones vigentes más recientes

| Versión aplicada | Migración |
|---|---|
| `20260807192320` | `processing_activity_inventory_v1` |
| `20260807192428` | `processing_inventory_explicit_browser_deny` |
| `20260807194153` | `seed_n3uralia_commercial_processing_activity` |
| `20260807203148` | `tenant_assurance_foundation_v1` |
| `20260807210440` | `fix_tenant_assurance_refresh_joins_v1` |
| `20260807210713` | `seed_tenant_assurance_sandbox_v1` |
| `20260808020905` | `seed_n3uralia_core_processing_activities_v1` |

La versión `20260808020905` fue reconciliada entre el historial real de producción y el repositorio. No existe una segunda migración duplicada con otro timestamp.

### Preparación actual

| Nivel | Estado real |
|---|---|
| Desarrollo técnico | sólido |
| Demo comercial acompañada | apta |
| Golden Path productivo por UI | validado 3/3 con actor E2E automatizado |
| Assurance multiempresa interno | validado |
| Inventario real de N3uralia | 3 actividades revisadas; legal y lifecycle pendientes |
| Piloto supervisado | apto para iniciar después de cerrar los gaps P0 seleccionados |
| Beta privada autoservicio | no habilitar todavía |
| Registro público autoservicio | no habilitar |
| Escalamiento Enterprise | diferido hasta pilotos externos |

### Separación de datos reales y sintéticos

| Categoría | Volumen observado |
|---|---:|
| Organizaciones totales | 11 |
| Organizaciones no E2E | 2 |
| Organizaciones E2E | 9 |
| Actividades de tratamiento totales | 9 |
| Actividades reales de N3uralia | 3 |
| Actividad sintética del Tenant Assurance Sandbox | 1 |
| Actividades E2E del UI Golden Path | 5 |

Los registros E2E y de assurance no cuentan como clientes, pilotos externos ni cobertura real del inventario de N3uralia.

---

## 4. Hitos validados

### Hito A — Golden Path y baseline assurance de N3uralia — `VALIDATED`

Caso oficial:

```text
91ae9174-be4c-4ddd-8980-4a671571afdc
```

Cadena persistida:

```text
caso aprobado
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
→ timeline auditable
```

La operación permanece parcial y la confianza nunca se presenta como certificación.

### Hito B — Inventario real de N3uralia — `VALIDATED INICIAL / ACTIVE`

N3uralia tiene tres actividades reales observadas y revisadas:

1. **Gestión de contactos comerciales y solicitudes de demostración**.
2. **Gestión de cuentas, autenticación y acceso al workspace**.
3. **Gestión de expedientes y análisis asistido por especialistas IA**.

Cada actividad contiene:

- propósito y base expresamente propuesta;
- owner;
- titulares y categorías;
- dataset;
- sistema o repositorio;
- tercero;
- fuente verificable;
- revisión `approved / partial`;
- evidencia `accepted · verified`;
- snapshot SHA-256;
- desconocidos explícitos.

Evidencia detallada:

```text
docs/assurance/n3uralia-processing-inventory-3x-2026-08-08.md
```

La validación productiva confirmó para las dos actividades nuevas:

| Control | Resultado |
|---|---:|
| Actividades nuevas | 2 |
| Revisiones `approved / partial` | 2/2 |
| Evidencia `accepted · verified` | 2/2 |
| Hash revisión = hash evidencia | 2/2 |
| Desconocidos de cuentas | 7 |
| Desconocidos de IA | 8 |
| Cadenas proceso → dataset → sistema → tercero | 2/2 |
| Runs aprobados observados | 8 |
| Runs completos con modelo y uso | 9 |
| Artefactos | 8 |
| Revisiones de agentes | 7 |
| Tool calls | 19 |
| Tokens acumulados | 171.727 |

El estado sigue siendo `VALIDATED INICIAL / ACTIVE` porque todavía faltan validaciones jurídicas, reglas de retención, destinatarios, subencargados, transferencias, avisos y eliminación demostrada.

### Hito C — Segundo tenant aislado y Tenant Assurance — `VALIDATED`

El sandbox interno demostró:

- segundo usuario y organización independientes;
- onboarding, proyecto, expediente, workflow y plan propios;
- cinco especialistas y cinco revisiones;
- misión, solicitud, baseline e inventario;
- cola durable sin dead-letter;
- aislamiento bidireccional;
- RLS y RPC negativas;
- idempotencia de onboarding, caso, plan, baseline, inventario y queue;
- `tenant assurance = passed`.

La conclusión final mantuvo `request_changes`; se aprobó la calidad del artefacto, no una conclusión de cumplimiento.

### Hito D — UI Golden Path productivo — `VALIDATED x3`

Tres ejecuciones consecutivas contra producción completaron por interfaz:

```text
login
→ onboarding
→ expediente guiado
→ cinco especialistas
→ cinco aceptaciones explícitas
→ plan operativo
→ misión y solicitud
→ baseline
→ cierre humano simulado por actor E2E
→ actividad de tratamiento
→ sistema, dataset, tercero y evidencia
→ revisión parcial
```

Resultado agregado:

| Métrica | Resultado 3/3 |
|---|---:|
| Ejecuciones Playwright | 3/3 |
| Aserciones server-side | 51/51 |
| Etapas aprobadas | 15/15 |
| Jobs succeeded | 15/15 |
| Intentos por job | 1 |
| Retry / recovery / dead-letter | 0 / 0 / 0 |
| Tokens totales | 185.091 |
| Duración total del navegador | 1.330.038 ms |

Este hito valida repetibilidad técnica, no experiencia de una persona externa.

---

## 5. Capacidades actuales

### A. Identidad, workspace y multiempresa — `VALIDATED INTERNO`

- autenticación y confirmación;
- política de contraseña centralizada;
- onboarding guiado;
- workspace activo explícito;
- organizaciones, miembros, roles e invitaciones;
- RLS y operaciones tenant-scoped;
- aislamiento positivo y negativo;
- fronteras privilegiadas limitadas al servidor.

Deuda externa conocida: **Supabase Auth Leaked Password Protection continúa desactivada**.

### B. Expedientes de cumplimiento — `VALIDATED x3`

- situación → expediente vivo;
- prioridad, estado y owner;
- timeline de eventos;
- fuentes, documentos, evidencia y controles;
- relaciones y trazabilidad;
- navegación guiada sin exponer infraestructura interna.

### C. Consejo de Especialistas — `VALIDATED x3`

- Isidora: obligaciones y fuentes;
- Beatriz: cambios regulatorios;
- Rodrigo: riesgo y escenarios;
- Verónica: controles, evidencia y hallazgos;
- Javier: planes, dependencias y criterios de cierre;
- Andrés: desempeño y aprendizaje;
- Julieta: revisión jurídica, calidad y comunicación.

Todos trabajan con contratos estructurados, fronteras `DECIDE / NO DECIDE`, herramientas autorizadas y revisión explícita.

### D. Ejecución durable — `VALIDATED x3`

- PGMQ;
- enqueue idempotente;
- lease y heartbeat;
- retry controlado;
- recuperación y dead-letter;
- cron de worker;
- runs, artefactos, errores, tokens y tiempos persistidos.

### E. Plan operativo y responsabilidad — `VALIDATED x3`

- expediente → plan operativo;
- misión con owner, prioridad y vencimiento;
- solicitud de evidencia;
- delegación asistida;
- SLA, seguimiento y escalamiento;
- briefing y continuidad diaria.

### F. Controles, evidencia y assurance — `VALIDATED x3`

- controles relacionados con obligaciones y casos;
- evidencia con fuente, período, vigencia y confidencialidad;
- SHA-256 e integridad;
- suficiencia revisada;
- diseño y operación separados;
- baseline con límites y desconocidos;
- confianza con topes por parcialidad.

### G. Inventario de tratamientos — `VALIDATED INICIAL / ACTIVE`

- tres actividades reales de N3uralia;
- actividad, finalidad y base propuesta;
- titulares, categorías y sensibilidad;
- dataset, sistema y tercero;
- retención y transferencia;
- fuente, snapshot y hash;
- revisión y unknowns;
- lectura en Digital Twin e Insights.

La cobertura de cantidad ya cumple el gate mínimo. La calidad jurídica y de ciclo de vida sigue abierta.

### H. Escritorio e Insights — `VALIDATED INICIAL`

- prioridades y explicabilidad;
- briefing de 24 horas;
- trabajo asignado y bloqueos;
- confianza por dimensiones;
- grafo e impacto;
- reutilización de controles y evidencia.

### I. Motor regulatorio Chile — `DEPLOYED`

- BCN y LeyChile;
- Diario Oficial;
- Dirección del Trabajo;
- SMA y SNIFA;
- capturas, versiones, hashes y claims con citas;
- separación entre publicación, vigencia y revisión.

### J. Memoria organizacional — `DEPLOYED / SIN APRENDIZAJES REALES`

- infraestructura de nodos, relaciones y versiones;
- casos similares;
- precedentes en contexto de agentes;
- vigencia y supersesión preparadas.

Pendiente: primer aprendizaje aprobado, versionado y reutilizado.

### K. Release y assurance — `DONE EN SU ALCANCE TÉCNICO`

- `npm ci` reproducible;
- Release Gate único;
- canonical roadmap guardrail;
- typecheck, build y smoke;
- previews antes de merge;
- OIDC para UI Golden Path;
- assurance multiempresa;
- ciclo de vida documentado para tenants E2E.

---

## 6. Estado de los bloques 1–18

| Bloque | Resultado | Estado |
|---:|---|---|
| 1 | Auth, workspace activo y tenant | `VALIDATED INICIAL / BLOCKED` por leaked passwords |
| 2 | Golden Path Ley N.º 21.719 | `VALIDATED x3` técnico con actor E2E |
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
| 14 | Inventario mínimo real de tratamientos | `VALIDATED` |
| 15 | Tenant assurance y repetibilidad técnica | `DONE` |
| 16 | Ampliación y calidad del inventario real | `NEXT / ACTIVE` |
| 17 | Aprendizaje organizacional | `PLANNED` |
| 18 | Piloto externo y medición | `PLANNED` |

---

## 7. Gates P0 antes de beta privada autoservicio

### 1. Leaked Password Protection — `BLOCKED`

- activar en Supabase Auth;
- verificar el advisor real;
- probar registro y recuperación;
- actualizar evidencia de seguridad.

### 2. Multiempresa — `VALIDATED INTERNO / ACTIVE EXTERNO`

Completado:

- múltiples organizaciones y usuarios independientes;
- aislamiento bidireccional;
- selector protegido;
- pruebas RLS y RPC;
- tres tenants limpios operados por UI.

Falta:

- organización externa real;
- observación con personas;
- repetir pruebas al ampliar superficie tenant-scoped.

### 3. Inventario mínimo Ley N.º 21.719 — `3/3 REAL / ACTIVE`

Completado:

- tres actividades reales de N3uralia;
- owner, dataset, sistema y tercero;
- fuente y revisión;
- evidencia `accepted · verified`;
- hash SHA-256;
- unknowns explícitos;
- separación de datos E2E.

Falta:

- bases de licitud validadas por finalidad;
- retención aprobada por categoría;
- destinatarios y subencargados completos;
- transferencias y garantías contractuales;
- avisos de privacidad relacionados;
- eliminación demostrada;
- riesgo de terceros con metodología aprobada.

### 4. Repetibilidad del Golden Path — `3/3 / VALIDATED`

Completado:

- tres ejecuciones productivas consecutivas;
- 51/51 aserciones persistidas;
- 15/15 jobs exitosos;
- cero retry, recovery y dead-letter;
- evidencia visual y digests.

Pendiente fuera de este gate:

- tiempo humano real;
- costo monetario completo;
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

1. Calidad jurídica y lifecycle del inventario real.
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

### Bloque 16 — Ampliación y calidad del inventario real — `NEXT`

1. **Completado:** registrar dos actividades reales adicionales representativas y validar tres actividades reales en total.
2. **En curso:** validar base, retención, destinatarios, subencargados y transferencias para las tres actividades.
3. **Pendiente:** adjuntar aviso de privacidad y evidencia de eliminación, o crear acciones explícitas con owner y fecha.

**Salida:** tres actividades reales con lifecycle defendible, unknowns reducidos solo mediante evidencia aprobada y acciones explícitas para todo gap restante.

### Bloque 17 — Aprendizaje organizacional

1. capturar correcciones humanas clasificadas;
2. versionar vigencia, supersesión y conflictos;
3. crear biblioteca viva y reutilizar un aprendizaje en un caso equivalente.

**Salida:** un error corregido una vez no se repite silenciosamente en un caso similar.

### Bloque 18 — Piloto externo y medición

1. incorporar una organización externa supervisada;
2. observar el recorrido completo sin intervención técnica;
3. medir tiempo, costo, retrabajo, claridad, confianza y willingness-to-pay.

**Salida:** decisión informada sobre beta privada y comercialización.

---

## 10. Métricas de cierre v1.0

| Indicador | Gate | Estado actual |
|---|---:|---:|
| Bugs críticos abiertos | 0 | 0 conocidos en el recorrido validado |
| Release Gate en cambios críticos | 100% | 100% |
| Golden Paths productivos | ≥ 3 | 3/3 técnicos con actor E2E |
| Aserciones persistidas | 100% | 51/51 |
| Duplicados o huérfanos por retry | 0 | 0 en paths oficiales |
| Retry / recovery / dead-letter | 0 | 0 / 0 / 0 |
| Fugas cross-tenant | 0 | 0 en assurance interno |
| Actividades reales revisadas | ≥ 3 | 3/3 N3uralia |
| Actividades reales con evidencia verificada | 100% | 3/3 |
| Actividades reales con base validada | 100% | 0/3; bases propuestas visibles |
| Actividades reales con retención aprobada | 100% | 0/3 |
| Destinatarios/subencargados completos | 100% | pendiente |
| Eliminación demostrada | 100% | 0/3 |
| Controles con owner | 100% del alcance piloto | 100% del alcance actual |
| Evidencia con procedencia | 100% | 100% del alcance declarado |
| Recomendaciones con explicación | 100% | 100% del assurance |
| Recorridos completos por persona externa | ≥ 1 | 0 |
| Organizaciones externas observadas | ≥ 1 | 0 |
| Tiempo humano del piloto | medir | pendiente |
| Costo monetario completo | medir | pendiente |

---

## 11. Política de datos E2E y limpieza

Los tenants sintéticos son evidencia técnica temporal, no activos comerciales.

Reglas:

1. identificar cada tenant por email, `run_id`, `run_attempt` y organización;
2. conservar los tres intentos oficiales mientras el gate 3/3 sea evidencia activa;
3. excluirlos de métricas comerciales y de inventario real;
4. no eliminar filas aisladas que puedan dejar huérfanos;
5. usar limpieza tenant-scoped, serializable y auditable;
6. no borrar tenants con eventos inmutables sin política de archivo;
7. conservar digests y resúmenes aunque expiren artefactos pesados;
8. ejecutar cualquier limpieza destructiva solo con aprobación explícita.

Procedimiento vigente:

```text
docs/operations/ui-golden-path-data-lifecycle.md
scripts/maintenance/cleanup-ui-golden-path-pre-mission.sql
```

La limpieza destructiva todavía no fue aplicada.

---

## 12. Congelamiento de alcance

Hasta cerrar P0:

- no crear módulos nuevos solo porque son atractivos;
- no construir Enterprise antes de validar pilotos externos;
- no presentar tres actividades como inventario completo;
- no aumentar scores ocultando operación parcial;
- no convertir bases propuestas o riesgos provisionales en conclusiones aprobadas;
- no automatizar decisiones irreversibles sin aprobación;
- no confundir aprobación de artefactos con cierre del expediente;
- no mezclar modernización de dependencias con cambios funcionales grandes;
- no marcar `DONE` fuera del alcance que la evidencia cubre;
- no pasar al Bloque 17 hasta cerrar o registrar explícitamente las tareas 2 y 3 del Bloque 16.

Toda idea nueva debe demostrar que:

1. elimina una fricción real;
2. reduce tiempo o retrabajo;
3. mejora calidad o trazabilidad;
4. aumenta seguridad o aislamiento;
5. o es necesaria para un piloto concreto.

---

## 13. Decisión vigente

El Bloque 15 permanece `DONE` dentro del assurance técnico interno.

La tarea 1 del Bloque 16 quedó completada y validada:

> **N3uralia tiene tres actividades reales observadas, revisadas y respaldadas con evidencia de integridad verificable.**

Esto no acredita inventario completo ni cumplimiento integral. Las tres actividades conservan bases propuestas, retención pendiente y otros unknowns.

La única continuidad autorizada es:

> **Bloque 16, tarea 2 — validar base, retención, destinatarios, subencargados y transferencias para las tres actividades reales.**

Después corresponde la tarea 3:

> **Adjuntar aviso de privacidad y evidencia de eliminación, o convertir cada ausencia en una acción explícita con owner y vencimiento.**

En paralelo siguen abiertos, sin alterar la secuencia principal:

1. Supabase Auth Leaked Password Protection;
2. ciclo de vida seguro de tenants E2E históricos;
3. preparación del primer piloto externo supervisado.

No se habilitará beta autoservicio hasta cerrar la deuda de leaked passwords, mejorar el lifecycle del inventario real y observar al menos una organización externa supervisada.
