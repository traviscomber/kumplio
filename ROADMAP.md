# KUMPLIO — Roadmap Maestro de Producto y Ejecución

> **Documento canónico de producto, arquitectura, evidencia y prioridades**  
> Estado: activo  
> Revisión: 8 de agosto de 2026  
> Mercado principal: Chile  
> Idioma visible obligatorio: español  
> Última migración aplicada: `20260808175012_seed_n3uralia_notice_mapping_reviews_v1`  
> Assurance UI 3/3: `docs/assurance/ui-golden-path-production-3x-2026-08-07.md`  
> Assurance inventario 3/3: `docs/assurance/n3uralia-processing-inventory-3x-2026-08-08.md`  
> Assurance lifecycle 3/3: `docs/assurance/n3uralia-processing-lifecycle-3x-2026-08-08.md`  
> Assurance aviso y eliminación 3/3: `docs/assurance/n3uralia-processing-privacy-remediation-3x-2026-08-08.md`  
> Assurance mapeo del aviso 3/3: `docs/assurance/n3uralia-processing-notice-mapping-3x-2026-08-08.md`  
> Repositorio: `traviscomber/kumplio`

---

## 1. Regla de este roadmap

Este archivo representa el **estado comprobable del producto**, no el historial de ideas, conversaciones, issues o PRs.

Prioridad de evidencia para cambiar un estado:

1. código presente en `main`;
2. migración versionada y reconciliada con producción;
3. prueba técnica, transaccional, funcional o de seguridad;
4. Release Gate, build, smoke y despliegues;
5. uso real por una persona o piloto;
6. métrica de resultado cuando el bloque la requiera.

Si una conversación, pantalla o documento secundario contradice `main`, Supabase o una prueba real, prevalece la evidencia técnica.

### Estados oficiales

| Estado | Significado |
|---|---|
| `PLANNED` | Definido, sin implementación activa. |
| `ACTIVE` | Desarrollo, prueba o cierre en curso. |
| `DEPLOYED` | Código o migración en producción. |
| `VALIDATED` | Flujo probado con datos reales o prueba representativa. |
| `VALIDATED INICIAL` | Primer alcance comprobado; falta cobertura o piloto externo. |
| `DONE` | Validado y sin gate técnico relevante dentro de su alcance. |
| `BLOCKED` | Requiere acción externa, permiso o decisión explícita. |
| `DEFERRED` | Tiene valor, pero no compite con la ruta crítica. |

`DEPLOYED` no equivale a `VALIDATED`. `VALIDATED` internamente no equivale a piloto externo. Trabajo creado o una matriz aceptada no equivale a cumplimiento demostrado.

---

## 2. Tesis de producto vigente

Kumplio no es un chatbot jurídico, un dashboard genérico ni una colección de checklists. Es un **sistema operativo de cumplimiento** para centralizar información sensible, coordinar especialistas, convertir análisis en trabajo y demostrar qué hizo una organización.

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
5. Explicar prioridades y confianza con alcance y límites.
6. Reutilizar controles, evidencia y precedentes defendibles.
7. Coordinar especialistas sin presentar una salida generada como decisión aprobada.
8. Registrar actividades de tratamiento sin inventar datos ausentes.
9. Aislar cada organización y probar ese aislamiento.
10. Mantener visibles los unknowns hasta resolverlos con evidencia aprobada.

### Lo que Kumplio no debe afirmar

- cumplimiento global por un score alto;
- inexistencia porque Kumplio no tiene un dato;
- operación efectiva por un documento aislado;
- sustitución de abogado, auditor, DPO o autoridad;
- base jurídica validada cuando solo fue propuesta;
- inventario completo por registrar tres actividades;
- aviso suficiente porque el mapeo fue aceptado;
- eliminación demostrada por crear una solicitud;
- piloto externo a partir de un tenant sintético;
- cierre de expediente por aprobar un artefacto.

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
10. La UI habla de resultados, decisiones y trabajo.
11. La confianza siempre declara alcance y límites.
12. Los unknowns se conservan hasta resolverse.
13. No se agregan módulos atractivos mientras un gate P0 siga abierto.

---

## 3. Estado ejecutivo al 8 de agosto de 2026

### Release funcional vigente

La release del Bloque 16 incorpora:

- tres actividades reales de N3uralia;
- revisión lifecycle de cinco dimensiones;
- aviso público versionado;
- misiones y solicitudes para mapeo y eliminación;
- 3/3 mapeos aceptados con brechas;
- evidencia SHA-256 y suficiencia parcial;
- estado visible en Digital Twin;
- guardrails de seguridad, idempotencia y no-sobreafirmación.

Validaciones efectuadas:

- preflight reversible y rollback limpio;
- idempotencia después del seed;
- rechazo cross-tenant;
- verificación productiva read-only;
- integridad de snapshot 3/3;
- advisor de seguridad sin alerta nueva atribuible al RPC.

### PRs recientes de referencia

- **#217** — inventario mínimo real;
- **#219–#220** — tenant assurance;
- **#223–#230** — Golden Path UI 3/3;
- **#232–#234** — tres actividades reales;
- **#235** — lifecycle 3/3;
- **#236** — aviso y eliminación convertidos en trabajo;
- **siguiente PR** — mapeo del aviso aceptado 3/3 con brechas.

### Migraciones aplicadas más recientes

| Versión | Migración |
|---|---|
| `20260808020905` | `seed_n3uralia_core_processing_activities_v1` |
| `20260808043810` | `processing_activity_lifecycle_review_v1` |
| `20260808044018` | `seed_n3uralia_processing_lifecycle_reviews_v1` |
| `20260808151723` | `processing_activity_privacy_remediation_v1` |
| `20260808152005` | `seed_n3uralia_privacy_remediation_v1` |
| `20260808174718` | `processing_notice_mapping_review_v1` |
| `20260808175012` | `seed_n3uralia_notice_mapping_reviews_v1` |

### Preparación actual

| Nivel | Estado real |
|---|---|
| Desarrollo técnico | sólido |
| Demo comercial acompañada | apta |
| Golden Path productivo por UI | `VALIDATED x3` |
| Assurance multiempresa interno | `VALIDATED` |
| Inventario real de N3uralia | 3 actividades revisadas |
| Lifecycle | 3/3 `changes_requested` |
| Mapeo del aviso | 3/3 `accepted_with_gaps` |
| Eliminación demostrada | 0/3 |
| Piloto supervisado externo | pendiente |
| Beta privada autoservicio | no habilitar todavía |
| Escalamiento Enterprise | diferido hasta pilotos externos |

Los registros E2E y de assurance no cuentan como clientes, pilotos externos ni cobertura real de N3uralia.

---

## 4. Hitos validados

### Hito A — Golden Path y baseline assurance — `VALIDATED`

```text
caso aprobado
→ misión y owner
→ solicitud de evidencia
→ control de línea base
→ evidencia aceptada con SHA-256
→ diseño effective
→ operación partial
→ cierre auditable
```

La operación permanece parcial y la confianza no se presenta como certificación.

### Hito B — Inventario real de N3uralia — `VALIDATED INICIAL / ACTIVE`

Tres actividades reales tienen propósito, owner, titulares, categorías, dataset, sistema, tercero, fuente, evidencia, hash y unknowns.

### Hito C — Revisión jurídica y lifecycle — `VALIDATED INICIAL / CAMBIOS REQUERIDOS`

| Actividad | Decisión | Base | Retención | Destinatarios | Subencargados | Transferencias | Unknowns |
|---|---|---|---|---|---|---|---:|
| Contactos y demos | `changes_requested` | pendiente | requiere cambios | pendiente | pendiente | pendiente | 8 |
| Cuentas y workspace | `changes_requested` | pendiente | requiere cambios | pendiente | pendiente | pendiente | 8 |
| Expedientes e IA | `changes_requested` | pendiente | requiere cambios | pendiente | pendiente | pendiente | 8 |

### Hito D — Tenant Assurance — `VALIDATED`

Segundo usuario y organización independientes, aislamiento bidireccional, cinco especialistas, cinco revisiones, cola durable, baseline e inventario sin fuga cross-tenant.

### Hito E — UI Golden Path — `VALIDATED x3`

| Métrica | Resultado |
|---|---:|
| Ejecuciones Playwright | 3/3 |
| Aserciones server-side | 51/51 |
| Etapas aprobadas | 15/15 |
| Jobs succeeded | 15/15 |
| Retry / recovery / dead-letter | 0 / 0 / 0 |
| Tokens totales | 185.091 |

### Hito F — Aviso y eliminación convertidos en trabajo — `VALIDATED INICIAL`

- un aviso general versionado;
- tres enlaces a actividades;
- tres misiones;
- tres solicitudes de mapeo;
- tres solicitudes de eliminación;
- owner, fechas y eventos.

Trabajo creado no equivale a cumplimiento demostrado.

### Hito G — Mapeo del aviso — `VALIDATED INICIAL / ACEPTADO CON BRECHAS`

Resultado productivo:

| Indicador | Resultado |
|---|---:|
| Mapeos aceptados con evidencia | 3/3 |
| Estado | `accepted_with_gaps` en 3/3 |
| Evidencias con SHA-256 válido | 3/3 |
| Suficiencia de control | `partial` en 3/3 |
| Unknowns conservados | 12 |
| Lifecycle todavía `changes_requested` | 3/3 |
| Eliminaciones demostradas | 0/3 |

El mapeo aceptado acredita la matriz, fuentes y límites. No valida suficiencia jurídica ni operacional del aviso.

---

## 5. Capacidades actuales

### A. Identidad y multiempresa — `VALIDATED INTERNO`

Auth, onboarding, workspace activo, roles, invitaciones, RLS, RPC tenant-scoped y pruebas negativas.

Deuda: **Supabase Auth Leaked Password Protection desactivada**.

### B. Expedientes — `VALIDATED x3`

Situación, prioridad, owner, timeline, fuentes, documentos, evidencia, controles y navegación guiada.

### C. Consejo de Especialistas — `VALIDATED x3`

Isidora, Beatriz, Rodrigo, Verónica, Javier, Andrés y Julieta con contratos estructurados y revisión explícita.

### D. Ejecución durable — `VALIDATED x3`

PGMQ, enqueue idempotente, lease, heartbeat, retry, recuperación, dead-letter y telemetría persistida.

### E. Plan operativo — `VALIDATED x3`

Misión, owner, prioridad, vencimiento, solicitudes, SLA, delegación y seguimiento.

### F. Controles y evidencia — `VALIDATED x3`

Procedencia, vigencia, SHA-256, suficiencia, diseño y operación separados, baseline y topes de confianza.

### G. Inventario, lifecycle y aviso — `VALIDATED INICIAL / ACTIVE`

Tres actividades, cinco dimensiones lifecycle, aviso versionado, mapeo 3/3 con brechas y eliminación 0/3.

### H. Escritorio, Insights y grafo — `DEPLOYED / VALIDATED INICIAL`

Prioridades explicables, briefing, confianza por dimensiones, grafo e impacto.

### I. Motor regulatorio Chile — `DEPLOYED`

BCN, LeyChile, Diario Oficial, Dirección del Trabajo, SMA y SNIFA con versiones, hashes y claims citados.

### J. Memoria organizacional — `DEPLOYED / SIN APRENDIZAJES REALES`

Infraestructura preparada; falta el primer aprendizaje real aprobado y reutilizado.

### K. Release y assurance — `DONE EN SU ALCANCE TÉCNICO`

Lockfile reproducible, Release Gate, guardrails, typecheck, build, smoke, previews y assurance.

---

## 6. Estado de los bloques 1–18

| Bloque | Resultado | Estado |
|---:|---|---|
| 1 | Auth, workspace y tenant | `VALIDATED INICIAL / BLOCKED` por leaked passwords |
| 2 | Golden Path Ley N.º 21.719 | `VALIDATED x3` técnico |
| 3 | UX operacional | `DEPLOYED` |
| 4 | Ejecución durable | `VALIDATED x3` |
| 5 | Evidencia y controles | `VALIDATED x3` |
| 6 | Release Gate | `DONE` |
| 7 | Grafo y reutilización | `DEPLOYED` |
| 8 | Timeline, confianza e impacto | `DEPLOYED / VALIDATED INICIAL` |
| 9 | Memoria y casos similares | `DEPLOYED / SIN DATOS REALES` |
| 10 | Especialización y supervisor | `VALIDATED x3` |
| 11 | Escritorio, SLA y delegación | `DEPLOYED / VALIDATED INICIAL` |
| 12 | Expediente → plan operativo | `VALIDATED x3` |
| 13 | Baseline assurance | `VALIDATED x3` |
| 14 | Inventario real | `VALIDATED` |
| 15 | Tenant assurance | `DONE` |
| 16 | Calidad del inventario y evidencia real | `NEXT / ACTIVE` |
| 17 | Aprendizaje organizacional | `PLANNED` |
| 18 | Piloto externo y medición | `PLANNED` |

---

## 7. Gates P0 antes de beta privada autoservicio

### 1. Leaked Password Protection — `BLOCKED`

- activar en Supabase Auth;
- verificar advisor;
- probar registro y recuperación;
- actualizar assurance.

### 2. Multiempresa — `VALIDATED INTERNO / ACTIVE EXTERNO`

Completado: múltiples organizaciones, aislamiento bidireccional, RLS, RPC y tres tenants limpios por UI.

Falta: organización externa y observación humana.

### 3. Inventario y lifecycle — `3/3 REAL / ACTIVE`

Completado:

- tres actividades reales;
- evidencia verificada;
- lifecycle versionado;
- mapeo del aviso 3/3 aceptado con brechas.

Falta:

- eliminación demostrada;
- resolución de base, retención, destinatarios, subencargados y transferencias;
- metodología de terceros aprobada.

### 4. Golden Path — `3/3 / VALIDATED`

Repetibilidad técnica cerrada. Falta tiempo humano, costo, retrabajo y experiencia externa.

### 5. Aviso y eliminación — `ACTIVE`

- 3/3 mapeos aceptados con brechas;
- 0/3 eliminaciones demostradas;
- tres solicitudes de eliminación abiertas con owner y fecha;
- aceptar una matriz no completa lifecycle;
- aceptar una eliminación requiere evidencia adjunta y revisión.

### 6. Piloto externo — `PLANNED`

1–3 organizaciones, tareas y evidencia reales, feedback UX y métricas de valor.

---

## 8. Backlog ordenado

### P1 — Cierre de evidencia real

1. Ejecutar y acreditar tres pruebas de eliminación o anonimización.
2. Resolver lifecycle mediante evidencia aprobada.
3. Activar Leaked Password Protection.
4. Preparar piloto externo supervisado.

### P2 — Valor acumulativo

1. Aprender desde correcciones humanas.
2. Crear biblioteca viva por dominio.
3. Reutilizar evidencia entre controles y marcos.
4. Gestionar terceros críticos y dependencias.
5. Preparar auditoría continuamente.

### P3 — Operación avanzada y Enterprise

Modo incidente, cadena de custodia, portal de auditor, Data Room, holdings, multi-framework, SSO, API, marketplace y verticales.

---

## 9. Próximos bloques de 3

### Bloque 16 — Ampliación y calidad del inventario real — `NEXT`

1. **Completado:** tres actividades reales registradas y revisadas.
2. **Completado en su alcance de revisión:** lifecycle separado en cinco dimensiones; resultado `changes_requested` en 3/3.
3. **Completado parcialmente:** aviso versionado y 3/3 mapeos aceptados con brechas. **Pendiente canónico:** 0/3 eliminaciones demostradas y lifecycle sin resolver.

Siguiente secuencia obligatoria:

1. **Ejecutar y acreditar tres pruebas de eliminación o anonimización.**
2. Adjuntar cada evidencia a su solicitud y someterla a revisión humana.
3. Aceptar solo las pruebas que demuestren timestamp, proveedor, activo o dataset, alcance, responsable, resultado, `backup_purga_programada` y `backup_purga_confirmada`.

**Salida:** tres actividades con mapeo aceptado y eliminación demostrada o, si la prueba no existe, un estado abierto honesto con brecha y responsable.

### Bloque 17 — Aprendizaje organizacional

1. capturar correcciones humanas clasificadas;
2. versionar vigencia, supersesión y conflictos;
3. reutilizar un aprendizaje aprobado en un caso equivalente.

### Bloque 18 — Piloto externo y medición

1. incorporar organización externa supervisada;
2. observar el recorrido sin intervención técnica;
3. medir tiempo, costo, retrabajo, claridad, confianza y disposición a pagar.

---

## 10. Métricas de cierre v1.0

| Indicador | Gate | Estado actual |
|---|---:|---:|
| Bugs críticos conocidos | 0 | 0 |
| Release Gate en cambios críticos | 100% | 100% |
| Golden Paths | ≥ 3 | 3/3 |
| Aserciones persistidas | 100% | 51/51 |
| Fugas cross-tenant | 0 | 0 en assurance interno |
| Actividades reales revisadas | ≥ 3 | 3/3 |
| Evidencia verificada de inventario | 100% | 3/3 |
| Lifecycle versionado | 100% | 3/3 |
| Mapeo del aviso aceptado | 100% | 3/3 con brechas |
| Base jurídicamente validada | 100% | 0/3 |
| Retención aprobada | 100% | 0/3 |
| Destinatarios/subencargados completos | 100% | 0/3 |
| Eliminación demostrada | 100% | 0/3 |
| Organización externa observada | ≥ 1 | 0 |
| Tiempo humano y costo | medir | pendiente |

---

## 11. Política de datos E2E y limpieza

Los tenants sintéticos son evidencia técnica temporal, no activos comerciales.

Reglas:

1. identificar por email, `run_id`, `run_attempt` y organización;
2. conservar los intentos oficiales mientras sean evidencia activa;
3. excluirlos de métricas comerciales;
4. no eliminar filas aisladas;
5. usar limpieza tenant-scoped y auditable;
6. conservar digests y resúmenes;
7. ejecutar limpieza destructiva solo con aprobación explícita.

Procedimiento:

```text
docs/operations/ui-golden-path-data-lifecycle.md
scripts/maintenance/cleanup-ui-golden-path-pre-mission.sql
```

---

## 12. Congelamiento de alcance

Hasta cerrar P0:

- no crear módulos nuevos solo porque son atractivos;
- no construir Enterprise antes de pilotos externos;
- no presentar tres actividades como inventario completo;
- no aumentar scores ocultando parcialidad;
- no convertir bases propuestas o riesgos provisionales en conclusiones;
- no presentar mapeo aceptado como aviso suficiente;
- no presentar una solicitud como eliminación demostrada;
- no automatizar decisiones irreversibles sin aprobación;
- no confundir aprobación de artefactos con cierre;
- no marcar `DONE` fuera del alcance probado;
- no pasar al Bloque 17 mientras eliminación y lifecycle sigan abiertos.

Toda idea nueva debe demostrar que elimina fricción, reduce tiempo, mejora trazabilidad, aumenta seguridad o responde a un piloto concreto.

---

## 13. Decisión vigente

El Bloque 15 permanece `DONE` dentro del assurance técnico interno.

Dentro del Bloque 16:

1. tres actividades reales están `VALIDATED`;
2. lifecycle está `VALIDATED INICIAL / CAMBIOS REQUERIDOS`;
3. aviso y eliminación están `DEPLOYED / VALIDATED INICIAL`;
4. el mapeo está `VALIDATED INICIAL` en 3/3 con `accepted_with_gaps`;
5. la suficiencia del control permanece `partial`;
6. las tres solicitudes de eliminación siguen abiertas;
7. existen 0/3 eliminaciones demostradas.

La única continuidad funcional autorizada es:

> **Ejecutar, adjuntar y revisar evidencia real de eliminación o anonimización para las tres actividades, sin inventar resultados y sin alterar lifecycle hasta que fuentes independientes lo sostengan.**

No se habilitará beta autoservicio hasta cerrar Leaked Password Protection, demostrar eliminación, resolver las dimensiones lifecycle críticas y observar al menos una organización externa supervisada.
