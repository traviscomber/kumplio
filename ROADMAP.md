# KUMPLIO — Roadmap Maestro de Producto y Ejecución

> **Documento canónico de producto, arquitectura, evidencia y prioridades**  
> Estado: activo  
> Revisión: 8 de agosto de 2026  
> Mercado principal: Chile  
> Idioma visible obligatorio: español  
> Baseline estable en `main`: `9b2ef72d9e1128671111b8e1cfec0612e4e04890`  
> Última migración aplicada: `20260808044018_seed_n3uralia_processing_lifecycle_reviews_v1`  
> Assurance UI 3/3: `docs/assurance/ui-golden-path-production-3x-2026-08-07.md`  
> Assurance inventario 3/3: `docs/assurance/n3uralia-processing-inventory-3x-2026-08-08.md`  
> Assurance lifecycle 3/3: `docs/assurance/n3uralia-processing-lifecycle-3x-2026-08-08.md`  
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
- que tres actividades equivalen a un inventario organizacional completo;
- que un aviso general acredita cada actividad específica;
- que existe eliminación demostrada sin una prueba auditable;
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

### Baseline estable

El baseline estable y desplegado en `main` es:

```text
9b2ef72d9e1128671111b8e1cfec0612e4e04890
```

Este baseline incorpora la ampliación a tres actividades reales y la revisión lifecycle de cinco dimensiones. Para su cierre quedaron verdes:

- Canonical Roadmap Guardrail;
- Processing Inventory Guardrail;
- Processing Lifecycle Review Guardrail;
- Release Gate;
- Application Validation;
- Release Qualification Foundation;
- typecheck;
- build de producción;
- smoke test;
- ambos despliegues Vercel;
- verificaciones productivas de solo lectura;
- pruebas negativas cross-tenant;
- pruebas reversibles de versionado e idempotencia.

### PRs recientes de referencia

- **#217** — inventario mínimo real de tratamientos;
- **#219–#220** — segundo tenant, aislamiento y Tenant Assurance;
- **#223–#229** — Golden Path productivo por UI y correcciones derivadas;
- **#230** — evidencia técnica UI 3/3;
- **#231** — ciclo de vida seguro de tenants E2E;
- **#232** — ampliación a tres actividades reales de N3uralia;
- **#233** — README único y contrato de roadmap canónico;
- **#234** — reconciliación documental del inventario 3/3;
- **#235** — revisión jurídica y lifecycle 3/3;
- **#236** — aviso, mapeo y eliminación convertidos en trabajo; `ACTIVE`, todavía no fusionada.

### Migraciones aplicadas más recientes

| Versión aplicada | Migración |
|---|---|
| `20260807192320` | `processing_activity_inventory_v1` |
| `20260807192428` | `processing_inventory_explicit_browser_deny` |
| `20260807194153` | `seed_n3uralia_commercial_processing_activity` |
| `20260807203148` | `tenant_assurance_foundation_v1` |
| `20260807210440` | `fix_tenant_assurance_refresh_joins_v1` |
| `20260807210713` | `seed_tenant_assurance_sandbox_v1` |
| `20260808020905` | `seed_n3uralia_core_processing_activities_v1` |
| `20260808043810` | `processing_activity_lifecycle_review_v1` |
| `20260808044018` | `seed_n3uralia_processing_lifecycle_reviews_v1` |

Las migraciones de aviso y eliminación de la PR #236 todavía no se consideran aplicadas ni productivas.

### Preparación actual

| Nivel | Estado real |
|---|---|
| Desarrollo técnico | sólido |
| Demo comercial acompañada | apta |
| Golden Path productivo por UI | `VALIDATED x3` con actor E2E |
| Assurance multiempresa interno | `VALIDATED` |
| Inventario real de N3uralia | 3 actividades revisadas |
| Lifecycle de cinco dimensiones | 3/3 con `changes_requested` |
| Aviso y eliminación | `ACTIVE` en PR #236 |
| Piloto supervisado externo | pendiente |
| Beta privada autoservicio | no habilitar todavía |
| Registro público autoservicio | no habilitado |
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
- revisión inicial `approved / partial`;
- evidencia `accepted · verified`;
- snapshot SHA-256;
- unknowns explícitos.

Evidencia detallada:

```text
docs/assurance/n3uralia-processing-inventory-3x-2026-08-08.md
```

### Hito C — Revisión jurídica y lifecycle — `VALIDATED INICIAL / CAMBIOS REQUERIDOS`

Las tres actividades tienen una revisión lifecycle `v1`, separada de la revisión inicial:

| Actividad | Decisión | Base | Retención | Destinatarios | Subencargados | Transferencias | Unknowns |
|---|---|---|---|---|---|---|---:|
| Contactos comerciales y demos | `changes_requested` | `pending_evidence` | `needs_changes` | `pending_evidence` | `pending_evidence` | `pending_evidence` | 8 |
| Cuentas, autenticación y workspace | `changes_requested` | `pending_evidence` | `needs_changes` | `pending_evidence` | `pending_evidence` | `pending_evidence` | 8 |
| Expedientes y especialistas IA | `changes_requested` | `pending_evidence` | `needs_changes` | `pending_evidence` | `pending_evidence` | `pending_evidence` | 8 |

Resultado persistido:

- 3/3 revisiones `changes_requested`;
- 3/3 evidencias `accepted · verified`;
- hash de revisión igual al hash de evidencia en 3/3;
- versiones y `supersedes_id` probados reversiblemente;
- aprobación bloqueada mientras existan dimensiones pendientes o unknowns;
- acceso cross-tenant rechazado.

Evidencia detallada:

```text
docs/assurance/n3uralia-processing-lifecycle-3x-2026-08-08.md
```

La tarea se considera revisada y operacionalizada, no jurídicamente aprobada.

### Hito D — Segundo tenant aislado y Tenant Assurance — `VALIDATED`

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

### Hito E — UI Golden Path productivo — `VALIDATED x3`

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
→ actividad de tratamiento
→ sistema, dataset, tercero y evidencia
→ revisión parcial
```

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
- solicitudes de evidencia;
- delegación asistida;
- SLA, seguimiento y escalamiento;
- briefing y continuidad diaria.

### F. Controles, evidencia y assurance — `VALIDATED x3`

- controles relacionados con obligaciones y casos;
- evidencia con fuente, período, vigencia y confidencialidad;
- SHA-256 e integridad;
- suficiencia revisada;
- diseño y operación separados;
- baseline con límites y unknowns;
- confianza con topes por parcialidad.

### G. Inventario y lifecycle de tratamientos — `VALIDATED INICIAL / ACTIVE`

- tres actividades reales;
- propósito, titulares y categorías;
- dataset, sistema y tercero;
- fuente, evidencia y hash;
- revisión inicial;
- cinco dimensiones lifecycle separadas;
- versiones y supersesión;
- aprobación bloqueada cuando faltan antecedentes;
- lectura y revisión desde Digital Twin.

La cobertura cuantitativa está validada. La resolución de los gaps sigue abierta.

### H. Escritorio, Insights, grafo e impacto — `DEPLOYED / VALIDATED INICIAL`

- prioridades y explicación “¿Por qué aparece esto?”;
- briefing de 24 horas;
- trabajo asignado y bloqueado;
- confianza por dimensiones;
- grafo de casos, controles, evidencia y activos;
- análisis de impacto;
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
- precedentes en contexto de especialistas;
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
- repetir pruebas al ampliar la superficie tenant-scoped.

### 3. Inventario mínimo Ley N.º 21.719 — `3/3 REAL / ACTIVE`

Completado:

- tres actividades reales de N3uralia;
- owner, dataset, sistema y tercero;
- fuente y revisión;
- evidencia `accepted · verified`;
- hash SHA-256;
- unknowns explícitos;
- revisión lifecycle de cinco dimensiones;
- versionado, supersesión y fronteras de aprobación.

Resultado de lifecycle:

- 3/3 con `changes_requested`;
- 0/3 bases jurídicamente validadas;
- 0/3 retenciones aprobadas;
- destinatarios, subencargados y transferencias pendientes en 3/3.

Falta:

- aviso relacionado por actividad;
- eliminación demostrada;
- resolución con evidencia de las dimensiones abiertas;
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

### 5. Aviso y eliminación — `ACTIVE`

La PR #236 prepara:

- snapshot versionado del aviso público;
- enlace como evidencia general, sin sobreafirmar cobertura;
- misión con owner y vencimiento por actividad;
- solicitud de mapeo del aviso;
- solicitud de prueba de eliminación o anonimización;
- criterios auditables de cierre;
- visibilidad en Digital Twin;
- idempotencia y fronteras cross-tenant.

No se considera desplegado hasta que CI, migraciones, verificación productiva y pruebas negativas estén verdes.

### 6. Piloto supervisado externo — `PLANNED`

- 1–3 organizaciones;
- responsable real de cumplimiento;
- tareas y evidencia reales;
- feedback de UX, confianza y retrabajo;
- alcance congelado durante la observación.

---

## 8. Backlog ordenado

### P1 — Valor acumulativo

1. Cerrar aviso y eliminación como trabajo trazable.
2. Resolver lifecycle mediante evidencia aprobada.
3. Aprender desde correcciones humanas con vigencia y aprobación.
4. Crear biblioteca viva por dominio de cumplimiento.
5. Reutilizar evidencia entre controles y marcos.
6. Gestionar terceros críticos y dependencias.
7. Preparar auditoría continuamente.

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

1. **Completado:** registrar dos actividades reales adicionales y validar tres actividades reales en total.
2. **Completado en su alcance de revisión:** separar y revisar base, retención, destinatarios, subencargados y transferencias. El resultado conservador es `changes_requested` en 3/3; los gaps no se consideran resueltos.
3. **Active en PR #236:** vincular el aviso vigente y convertir la falta de mapeo o eliminación en misiones y solicitudes de evidencia con owner, fecha y criterio auditable de cierre.

**Salida:** tres actividades reales con lifecycle versionado y todo gap restante convertido en trabajo trazable, sin confundir una acción creada con cumplimiento demostrado.

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
| Bugs críticos abiertos en baseline estable | 0 | 0 conocidos |
| Release Gate en cambios críticos | 100% | 100% |
| Golden Paths productivos | ≥ 3 | 3/3 técnicos con actor E2E |
| Aserciones persistidas | 100% | 51/51 |
| Duplicados o huérfanos por retry | 0 | 0 en paths oficiales |
| Retry / recovery / dead-letter | 0 | 0 / 0 / 0 |
| Fugas cross-tenant | 0 | 0 en assurance interno |
| Actividades reales revisadas | ≥ 3 | 3/3 N3uralia |
| Actividades reales con evidencia verificada | 100% | 3/3 |
| Actividades con lifecycle versionado | 100% | 3/3 |
| Actividades con base validada | 100% | 0/3 |
| Actividades con retención aprobada | 100% | 0/3 |
| Destinatarios/subencargados completos | 100% | 0/3 |
| Aviso mapeado por actividad | 100% | 0/3 en baseline estable |
| Eliminación demostrada | 100% | 0/3 |
| Controles con owner | 100% del alcance piloto | 100% del alcance actual |
| Evidencia con procedencia | 100% | 100% del alcance declarado |
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
- no presentar el aviso general como cobertura específica;
- no presentar una solicitud de eliminación como eliminación demostrada;
- no automatizar decisiones irreversibles sin aprobación;
- no confundir aprobación de artefactos con cierre del expediente;
- no mezclar modernización de dependencias con cambios funcionales grandes;
- no marcar `DONE` fuera del alcance que la evidencia cubre;
- no pasar al Bloque 17 hasta cerrar o registrar explícitamente la tarea 3 del Bloque 16.

Toda idea nueva debe demostrar que:

1. elimina una fricción real;
2. reduce tiempo o retrabajo;
3. mejora calidad o trazabilidad;
4. aumenta seguridad o aislamiento;
5. o es necesaria para un piloto concreto.

---

## 13. Decisión vigente

El Bloque 15 permanece `DONE` dentro del assurance técnico interno.

Dentro del Bloque 16:

1. la ampliación a tres actividades reales está `VALIDATED`;
2. la revisión lifecycle está `VALIDATED INICIAL / CAMBIOS REQUERIDOS`;
3. aviso y eliminación están `ACTIVE` en la PR #236 y todavía no forman parte del baseline estable.

La única continuidad funcional autorizada es:

> **Cerrar la tarea 3 del Bloque 16 sin sobreafirmar evidencia: aviso general versionado, mapeo por actividad y prueba de eliminación convertidos en trabajo trazable con owner, fecha y criterio de cierre.**

La tarea se considerará desplegada únicamente después de:

- CI y previews verdes;
- migraciones aplicadas y reconciliadas;
- verificación productiva de solo lectura;
- idempotencia comprobada;
- rechazo cross-tenant;
- una evidencia general del aviso;
- tres enlaces a actividades;
- tres misiones;
- tres solicitudes de mapeo;
- tres solicitudes de eliminación;
- eventos auditables.

En paralelo siguen abiertos, sin alterar la secuencia principal:

1. Supabase Auth Leaked Password Protection;
2. ciclo de vida seguro de tenants E2E históricos;
3. preparación del primer piloto externo supervisado.

No se habilitará beta autoservicio hasta cerrar la deuda de leaked passwords, completar la trazabilidad de aviso/eliminación y observar al menos una organización externa supervisada.
