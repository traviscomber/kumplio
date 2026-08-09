# KUMPLIO — Roadmap Maestro de Producto y Ejecución

> **Documento canónico de producto, arquitectura, evidencia y prioridades**  
> Estado: activo  
> Revisión: 9 de agosto de 2026  
> Mercado principal: Chile  
> Idioma visible obligatorio: español  
> Última migración aplicada: `20260809141500_agent_run_provider_trace_v1`  
> Assurance UI 3/3: `docs/assurance/ui-golden-path-production-3x-2026-08-07.md`  
> Assurance inventario 3/3: `docs/assurance/n3uralia-processing-inventory-3x-2026-08-08.md`  
> Assurance lifecycle 3/3: `docs/assurance/n3uralia-processing-lifecycle-3x-2026-08-08.md`  
> Assurance aviso y eliminación 3/3: `docs/assurance/n3uralia-processing-privacy-remediation-3x-2026-08-08.md`  
> Assurance mapeo del aviso 3/3: `docs/assurance/n3uralia-processing-notice-mapping-3x-2026-08-08.md`  
> Assurance eliminación primaria 3/3: `docs/assurance/n3uralia-primary-deletion-3x-2026-08-08.md`  
> Assurance proveedor 3/3: `docs/assurance/n3uralia-provider-retention-assurance-3x-2026-08-08.md`  
> Solicitudes tenant-specific 3/3: `docs/assurance/n3uralia-provider-configuration-requests-3x-2026-08-08.md`  
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

`DEPLOYED` no equivale a `VALIDATED`. `VALIDATED` internamente no equivale a piloto externo. Trabajo creado, una matriz aceptada, una prueba sintética o una política pública del proveedor no equivalen por sí solas a cumplimiento demostrado.

---

## 2. Tesis de producto vigente

Kumplio es un **sistema operativo de cumplimiento** para centralizar información sensible, coordinar especialistas, convertir análisis en trabajo y demostrar qué hizo una organización.

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

### Lo que Kumplio no debe afirmar

- cumplimiento global por un score alto;
- inexistencia porque Kumplio no tiene un dato;
- operación efectiva por un documento aislado;
- sustitución de abogado, auditor, DPO o autoridad;
- base jurídica validada cuando solo fue propuesta;
- inventario completo por registrar tres actividades;
- aviso suficiente porque el mapeo fue aceptado;
- eliminación final demostrada por una prueba primaria sintética;
- purga de backups por conocer la política pública de un proveedor;
- ZDR/MAM porque una llamada use `store:false`;
- tenant OpenAI verificado sólo por capturar un response header;
- piloto externo a partir de un tenant sintético.

### Principios no negociables

1. Chile primero.
2. Sin fuente no hay afirmación regulatoria.
3. Sin evidencia no hay conclusión de cumplimiento.
4. IA propone; una persona valida decisiones sensibles.
5. Toda mutación crítica deja auditoría.
6. Cada organización permanece aislada.
7. Versionar antes que sobrescribir.
8. Los unknowns se conservan hasta resolverse.
9. No se agregan módulos atractivos mientras un gate P0 siga abierto.

---

## 3. Estado ejecutivo al 9 de agosto de 2026

### Release funcional vigente

Las PR #238, #241, #244, #245 y #246 están fusionadas a `main`. Los cambios críticos pasaron Release Gate, Application validation, Release qualification, typecheck, build, smoke y los proyectos Vercel aplicables en `success`.

Bloque 16 comprobado:

| Capa | Estado |
|---|---:|
| Actividades reales | 3/3 |
| Lifecycle | `changes_requested` 3/3 |
| Mapeo del aviso | `accepted_with_gaps` 3/3 |
| Mecanismo controlado | 3/3 |
| Eliminación primaria operativa | 3/3 |
| Assurance de proveedor | 3/3 |
| Solicitudes tenant-specific | 3/3 |
| Supabase plan | Pro verificado |
| OpenAI provider runtime trace | capturado en ejecución real |
| OpenAI provider identity `/v1/me` | implementado/desplegado; ejecución pendiente |
| Configuración tenant proveedor | 0/3 |
| Eliminación operacional final | 0/3 |

**3/3 mapeos aceptados con brechas** sigue siendo un resultado válido. **0/3 eliminaciones demostradas** se refiere exclusivamente a eliminación operacional final, no al subgate de eliminación primaria, que ya está 3/3.

La ejecución real de provider trace acreditó una llamada exitosa a `gpt-5.6-sol`, un `x-request-id` real y un valor `openai-organization` devuelto por OpenAI. Ese header demuestra trazabilidad de la request, pero no equivale todavía a Data Retention tenant-specific verificada ni a ZDR/MAM.

### Migraciones aplicadas más recientes

| Versión | Migración |
|---|---|
| `20260808151723` | `processing_activity_privacy_remediation_v1` |
| `20260808152005` | `seed_n3uralia_privacy_remediation_v1` |
| `20260808174718` | `processing_notice_mapping_review_v1` |
| `20260808175012` | `seed_n3uralia_notice_mapping_reviews_v1` |
| `20260808235300` | `processing_deletion_evidence_review_v1` |
| `20260809011800` | `processing_controlled_deletion_drill_review_v1` |
| `20260809013200` | `processing_primary_deletion_exercise_v1` |
| `20260809014500` | `processing_primary_deletion_exercises_remaining_v1` |
| `20260809024500` | `processing_provider_retention_assurance_v1` |
| `20260809030500` | `processing_provider_configuration_requests_v1` |
| `20260809141500` | `agent_run_provider_trace_v1` |

### Preparación actual

| Nivel | Estado real |
|---|---|
| Desarrollo técnico | sólido |
| Demo comercial acompañada | apta |
| Golden Path productivo por UI | `VALIDATED x3` |
| Assurance multiempresa interno | `VALIDATED` |
| Inventario real de N3uralia | 3 actividades revisadas |
| Eliminación primaria | 3/3 `demonstrated_controlled_primary` |
| Assurance proveedor | 3/3 `partial_policy_verified` |
| Supabase plan | Pro verificado; PITR pendiente |
| OpenAI runtime tenant trace | request real capturada; `/v1/me` pendiente de ejecutar |
| Tenant proveedor | 0/3 `verified` |
| Eliminación final | 0/3 `demonstrated` |
| Piloto supervisado externo | pendiente |
| Beta privada autoservicio | no habilitar todavía |

---

## 4. Hitos validados

### Hito A — Golden Path y baseline assurance — `VALIDATED`

Caso → misión → evidencia → control → revisión → cierre auditable. La confianza no se presenta como certificación.

### Hito B — Inventario real de N3uralia — `VALIDATED INICIAL / ACTIVE`

Tres actividades reales tienen propósito, owner, titulares, categorías, dataset, sistema, tercero, fuente, evidencia, hash y unknowns.

### Hito C — Revisión jurídica y lifecycle — `VALIDATED INICIAL / CAMBIOS REQUERIDOS`

Las tres actividades permanecen `changes_requested`; base, retención, destinatarios, subencargados y transferencias no se marcan como resueltos sin evidencia independiente.

### Hito D — Tenant Assurance — `VALIDATED`

Aislamiento multiempresa, especialistas, revisiones, cola durable, baseline e inventario sin fuga cross-tenant.

### Hito E — UI Golden Path — `VALIDATED x3`

Tres recorridos productivos completos, 51/51 aserciones persistidas y 15/15 jobs succeeded.

### Hito F — Aviso y eliminación convertidos en trabajo — `VALIDATED INICIAL`

Un aviso versionado, tres enlaces, tres misiones, tres solicitudes de mapeo y tres solicitudes de eliminación. Trabajo creado no equivale a cumplimiento demostrado.

### Hito G — Mapeo del aviso — `VALIDATED INICIAL / ACEPTADO CON BRECHAS`

- mapeos con evidencia: 3/3;
- estado `accepted_with_gaps`: 3/3;
- SHA-256 válido: 3/3;
- suficiencia de control: `partial` 3/3;
- lifecycle: `changes_requested` 3/3.

### Hito H — Eliminación primaria — `VALIDATED CONTROLADO 3/3`

Se probó el mecanismo contra el data plane real con registros sintéticos controlados:

1. `public.commercial_leads`;
2. Supabase Auth + perfiles/membresías;
3. `public.compliance_cases` + workflow/run.

En 3/3: evidencia `accepted · verified`, SHA-256, `productionSubjectDataTouched = false` y `primaryStoreRemainingMatches = 0`.

Esto no demuestra purga física de backups ni propagación a procesadores externos.

### Hito I — Assurance de proveedor — `VALIDATED PARCIAL 3/3`

- Supabase: política oficial de backups revisada y plan Pro del tenant confirmado;
- OpenAI: `store:false` verificado en runtime y política oficial de Data Controls revisada;
- provider trace OpenAI real: `x-request-id` + `openai-organization` capturados mediante el worker normal;
- assurance de identidad OpenAI mediante `/v1/me`: implementado y desplegado, ejecución productiva pendiente;
- PITR Supabase: no verificado;
- Data Retention OpenAI (`None`, MAM o ZDR): no verificada;
- tenant-specific: 0/3.

---

## 5. Capacidades actuales

### A. Identidad y multiempresa — `VALIDATED INTERNO`

Auth, onboarding, workspace, roles, RLS y RPC tenant-scoped. Deuda: **Supabase Auth Leaked Password Protection desactivada**.

### B. Expedientes — `VALIDATED x3`

Situación, prioridad, owner, timeline, fuentes, documentos, evidencia y controles.

### C. Consejo de Especialistas — `VALIDATED x3`

Especialistas con contratos estructurados y revisión explícita.

### D. Ejecución durable — `VALIDATED x3`

PGMQ, lease, heartbeat, retry, recuperación, dead-letter y telemetría persistida.

### E. Plan operativo — `VALIDATED x3`

Misión, owner, prioridad, vencimiento, solicitudes, SLA y seguimiento.

### F. Controles y evidencia — `VALIDATED x3`

Procedencia, vigencia, SHA-256, suficiencia, diseño y operación separados.

### G. Inventario, lifecycle y aviso — `VALIDATED INICIAL / ACTIVE`

Tres actividades; mapeo 3/3; eliminación primaria 3/3; assurance proveedor 3/3; provider trace OpenAI capturado; tenant 0/3; final 0/3.

### H. Release y assurance — `DONE EN SU ALCANCE TÉCNICO`

Release Gate, typecheck, build, smoke, previews y producción Vercel verdes.

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

Activar en Supabase Auth, verificar advisor y probar registro/recuperación.

### 2. Multiempresa — `VALIDATED INTERNO / ACTIVE EXTERNO`

Falta organización externa y observación humana.

### 3. Inventario y lifecycle — `3/3 REAL / ACTIVE`

Completado: tres actividades, lifecycle versionado, mapeo 3/3, eliminación primaria 3/3, assurance proveedor 3/3 y trazabilidad runtime OpenAI verificada en una request real.

Falta: PITR Supabase, identidad/configuración OpenAI tenant-specific, tenant-specific 0/3, eliminación operacional final 0/3 y resolución de dimensiones lifecycle.

### 4. Golden Path — `3/3 / VALIDATED`

Repetibilidad técnica cerrada. Falta tiempo humano, costo, retrabajo y experiencia externa.

### 5. Aviso y eliminación — `ACTIVE`

- 3/3 mapeos aceptados con brechas;
- 3/3 mecanismos controlados;
- 3/3 eliminaciones primarias;
- 3/3 assurance de proveedor;
- 3/3 solicitudes tenant-specific;
- provider trace OpenAI real capturado;
- `/v1/me` assurance implementado, ejecución pendiente;
- 0/3 configuraciones tenant verificadas;
- **0/3 eliminaciones demostradas** como cierre operacional final.

Aceptar una matriz, una prueba sintética, un response header o una política pública no completa lifecycle ni purga de backups/proveedores.

### 6. Piloto externo — `PLANNED`

1–3 organizaciones, tareas y evidencia reales, feedback UX y métricas de valor.

---

## 8. Backlog ordenado

### P1 — Cierre de evidencia real

1. Ejecutar `provider_identity` (`/v1/me`) con la configuración productiva de Kumplio y reconciliar el `user-*`/organizaciones asociados sin exponer credenciales.
2. Verificar configuración tenant Supabase de backups/PITR.
3. Verificar Data Retention efectiva de OpenAI (`None`, MAM o ZDR) para la identidad/proyecto realmente usado por Kumplio.
4. **Ejecutar y acreditar tres pruebas de eliminación o anonimización** sólo después de que la evidencia tenant-specific aplicable sea suficiente.
5. Resolver lifecycle mediante evidencia independiente aprobada.
6. Activar Leaked Password Protection.
7. Preparar piloto externo supervisado.

### P2 — Valor acumulativo

Aprendizaje organizacional, biblioteca viva, reutilización de evidencia, terceros críticos y preparación continua de auditoría.

### P3 — Operación avanzada y Enterprise

Modo incidente, cadena de custodia, Data Room, holdings, multi-framework, SSO, API, marketplace y verticales.

---

## 9. Próximos bloques de 3

### Bloque 16 — Ampliación y calidad del inventario real — `NEXT`

1. **Completado:** tres actividades reales registradas y revisadas.
2. **Completado en su alcance de revisión:** lifecycle separado; resultado `changes_requested` en 3/3.
3. **Completado en subgates técnicos:** 3/3 mapeos aceptados con brechas, 3/3 eliminación primaria, 3/3 assurance proveedor, 3/3 requests tenant-specific y provider trace OpenAI real capturado.

Pendiente canónico:

- ejecutar/reconciliar OpenAI `/v1/me` assurance;
- confirmar PITR/backups efectivos de Supabase;
- confirmar Data Retention OpenAI efectiva;
- configuración tenant proveedor 0/3;
- eliminación operacional final 0/3;
- lifecycle sin resolver.

Siguiente secuencia obligatoria:

1. ejecutar el assurance OpenAI `/v1/me` ya desplegado y reconciliar la identidad runtime;
2. confirmar Supabase plan/configuración efectiva de backups/PITR para `qhhybqfuenxojboymrsd`;
3. confirmar Data Retention OpenAI del tenant/proyecto realmente usado por `OPENAI_API_KEY`;
4. **Ejecutar y acreditar tres pruebas de eliminación o anonimización.** Sólo la capa final puede promocionarse cuando la evidencia tenant-specific sea suficiente;
5. adjuntar cada evidencia a su solicitud y someterla a revisión humana;
6. aceptar sólo pruebas con timestamp, proveedor, dataset/activo, alcance, responsable, resultado y referencias de backup/propagación aplicables.

**Salida:** tres actividades con mapeo aceptado y cierre final demostrado, o un estado abierto honesto con brecha, owner y vencimiento.

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
| Fugas cross-tenant | 0 | 0 en assurance interno |
| Actividades reales revisadas | ≥ 3 | 3/3 |
| Lifecycle versionado | 100% | 3/3 |
| Mapeo del aviso aceptado | 100% | 3/3 con brechas |
| Eliminación primaria | 100% | 3/3 controlado |
| Assurance proveedor | 100% | 3/3 parcial |
| OpenAI runtime trace | ≥ 1 request real | 1 request real capturada |
| OpenAI provider identity | 1 ejecución `/v1/me` | implementado, pendiente de ejecutar |
| Supabase PITR/config backup | 100% | pendiente |
| Configuración tenant proveedor | 100% | 0/3 |
| Base jurídicamente validada | 100% | 0/3 |
| Retención aprobada | 100% | 0/3 |
| Destinatarios/subencargados completos | 100% | 0/3 |
| Eliminación demostrada | 100% | 0/3 |
| Organización externa observada | ≥ 1 | 0 |
| Tiempo humano y costo | medir | pendiente |

---

## 11. Política de datos E2E y limpieza

Los tenants y probes sintéticos son evidencia técnica, no activos comerciales. No eliminar evidencia auditada sólo para “limpiar” el sistema; cualquier limpieza destructiva debe ser tenant-scoped, auditable y explícitamente aprobada.

---

## 12. Congelamiento de alcance

Hasta cerrar P0:

- no crear módulos nuevos solo porque son atractivos;
- no construir Enterprise antes de pilotos externos;
- no presentar tres actividades como inventario completo;
- no aumentar scores ocultando parcialidad;
- no convertir bases propuestas o riesgos provisionales en conclusiones;
- no presentar mapeo aceptado como aviso suficiente;
- no presentar eliminación primaria como purga final;
- no presentar política de proveedor como configuración tenant verificada;
- no presentar provider trace o `/v1/me` como prueba de ZDR/MAM;
- no automatizar decisiones irreversibles sin aprobación;
- no marcar `DONE` fuera del alcance probado;
- no pasar al Bloque 17 mientras tenant-specific, eliminación final y lifecycle sigan abiertos.

---

## 13. Decisión vigente

El Bloque 15 permanece `DONE` dentro del assurance técnico interno.

Dentro del Bloque 16:

1. tres actividades reales están `VALIDATED`;
2. lifecycle está `VALIDATED INICIAL / CAMBIOS REQUERIDOS` 3/3;
3. mapeo está `accepted_with_gaps` 3/3;
4. mecanismo controlado está validado 3/3;
5. eliminación primaria está demostrada de forma controlada 3/3;
6. assurance de proveedor está revisado 3/3;
7. solicitudes tenant-specific están abiertas 3/3;
8. Supabase plan Pro está verificado y PITR sigue pendiente;
9. OpenAI provider trace de una ejecución real está capturado;
10. OpenAI `/v1/me` assurance está implementado/desplegado, pero aún no ejecutado;
11. configuración tenant proveedor está verificada 0/3;
12. eliminación operacional final demostrada está 0/3.

La única continuidad funcional autorizada es:

> **Ejecutar/reconciliar la identidad runtime OpenAI, obtener la configuración tenant-specific efectiva de Supabase/OpenAI y, sólo cuando sea suficiente, ejecutar o aceptar la prueba operacional final de eliminación/anonimización sin sobreafirmar backups, retención ni propagación externa.**

No se habilitará beta autoservicio hasta cerrar Leaked Password Protection, la evidencia tenant-specific/final, las dimensiones lifecycle críticas y observar al menos una organización externa supervisada.