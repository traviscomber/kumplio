# KUMPLIO — Roadmap Maestro de Producto y Ejecución

> **Documento canónico de producto, arquitectura, evidencia y prioridades**  
> Estado: **cierre funcional / external gates**  
> Revisión: 25 de agosto de 2026  
> Mercado principal: Chile  
> Repositorio: `traviscomber/kumplio`

## 1. Regla de este roadmap

Este archivo representa el estado comprobable del producto y la secuencia autorizada de trabajo. `DEPLOYED` no equivale a `VALIDATED`; una prueba sintética no equivale a evidencia de cliente; una política pública de proveedor no equivale a configuración tenant observada; un score no equivale a cumplimiento.

Prioridad de evidencia: código en `main`, migración reconciliada, prueba técnica/funcional/seguridad, Release Gate/build/smoke, uso real y métricas cuando correspondan.

## 2. Tesis de producto vigente

Kumplio es un sistema operativo de cumplimiento para Chile que transforma una situación en un expediente vivo con contexto, fuentes, evidencia, análisis, resolución, revisión humana, acciones, responsables y trazabilidad.

Flujo público y operativo consolidado:

`Situación → expediente → Analiza → Resuelve → Revisa → acciones y controles → evidencia → cierre`

Principios no negociables: Chile primero; sin fuente no hay afirmación regulatoria; sin evidencia no hay conclusión de cumplimiento; IA propone y una persona valida decisiones sensibles; toda mutación crítica deja auditoría; cada organización permanece aislada; los unknowns se conservan hasta resolverse.

## 3. Estado funcional al 25 de agosto de 2026

La arquitectura autenticada canónica queda cerrada como:

`Inicio · Casos · Documentos · Evidencia · Alertas · Actividad · Personas · Configuración`

Inicio, Casos, Documentos, Evidencia, Alertas y Actividad están implementados. Personas y Configuración quedan implementados como superficies acotadas que reutilizan identidad, workspace y membresías existentes, sin crear CRM, permisos paralelos, billing ni configuración de proveedores.

La superficie pública quedó consolidada alrededor de **Analiza → Resuelve → Revisa**, con Isidora, Verónica y Julieta como capacidades principales y especialistas adicionales activables cuando el caso lo requiere. Marketing Alignment, demo, FAQ, seguridad, términos y pricing fueron reconciliados con esa narrativa sin alterar el runtime agentic ni fabricar claims.

## 4. Capacidades comprobadas

- autenticación, onboarding, workspace y roles;
- expedientes/casos y entrada guiada;
- documentos, evidencia y trazabilidad;
- Alertas y Actividad implementadas como superficies operativas;
- Personas y Configuración implementadas como proyecciones acotadas del workspace;
- especialistas digitales con revisión humana;
- ejecución durable, retry y recovery;
- artifacts, lineage, revisiones y decisiones humanas;
- fuentes oficiales y procedencia;
- controles, evidence requests y planes operativos;
- Digital Twin e inventario de tratamientos;
- lifecycle versionado y mapeo de avisos;
- mecanismos controlados de eliminación;
- provider assurance parcial y workflows tenant-specific;
- release gates y assurance reproducible.

## 5. Estado de bloques

| Bloque | Resultado | Estado |
|---:|---|---|
| 1 | Auth, workspace y tenant | `VALIDATED INICIAL / BLOCKED` solo por leaked passwords |
| 2 | Golden Path Ley N.º 21.719 | `VALIDATED x3` |
| 3 | UX operacional | `DEPLOYED` |
| 4 | Ejecución durable | `VALIDATED x3` |
| 5 | Evidencia y controles | `VALIDATED x3` |
| 6 | Release Gate | `DONE` |
| 7 | Grafo y reutilización | `DEPLOYED` |
| 8 | Timeline, confianza e impacto | `VALIDATED INICIAL` |
| 9 | Memoria y casos similares | `DEPLOYED / SIN PILOTO EXTERNO` |
| 10 | Especialización y supervisor | `VALIDATED x3` |
| 11 | Escritorio, SLA y delegación | `VALIDATED INICIAL` |
| 12 | Expediente → plan operativo | `VALIDATED x3` |
| 13 | Baseline assurance | `VALIDATED x3` |
| 14 | Inventario real | `VALIDATED INICIAL` |
| 15 | Tenant assurance | `DONE EN ALCANCE INTERNO` |
| 16 | Cierre técnico y evidencia real | `ACTIVE / EXTERNAL GATES` |
| 17 | Experiencia autenticada canónica | `DONE` |
| 18 | Beta autoservicio / expansión | `DEFERRED` |

## 6. Bloque 17 — Experiencia autenticada canónica — `DONE`

### A — Entrada y orientación — `DONE`

`/app/*` es la superficie autenticada canónica; onboarding contextual, Inicio y retorno al contexto de trabajo están implementados dentro del modelo existente.

### B — Ejecución trazable — `DONE`

Casos, documentos, evidencia y cierre conservan la cadena de contexto y resultados de especialistas sin exponer razonamiento interno. La experiencia principal mantiene la responsabilidad humana sobre decisiones sensibles.

### C — Operación continua y cierre de arquitectura — `DONE`

Alertas y Actividad están implementadas. Personas y Configuración están implementadas como el último bloque funcional acotado. La superficie pública profunda y el Marketing Alignment quedaron consolidados alrededor de Analiza → Resuelve → Revisa.

No se crea un CRM, directorio paralelo, nueva jerarquía de equipos, nueva arquitectura de roles/permisos, billing, provider configuration ni preferencias ficticias.

Con este cierre comienza **functional freeze**: no se abren nuevos bloques funcionales hasta resolver los gates P0 externos y completar el piloto supervisado correspondiente.

## 7. Bloque 16 — Cierre técnico y evidencia externa — `ACTIVE / EXTERNAL GATES`

### P0-A — Leaked Password Protection — `BLOCKED`

Activar protección de contraseñas filtradas en Supabase Auth, verificar Security Advisor y probar registro/recuperación/cambio de contraseña. Hasta entonces no se declara beta autoservicio lista.

### P0-B — Configuración tenant Supabase — `BLOCKED EXTERNO`

Falta evidencia administrativa válida de project reference, Daily/PITR observado, estado PITR y ventana efectiva de recuperación. No se deduce desde settings PostgreSQL.

### P0-C — Configuración tenant OpenAI — `BLOCKED EXTERNO`

Falta evidencia administrativa válida de organization/project binding y modo exacto `standard|modified_abuse_monitoring|zero_data_retention`. El retention probe contradice ZDR para la request observada, pero no distingue Standard de MAM.

### P0-D — Lifecycle — `ACTIVE / EVIDENCIA EXTERNA`

Los paquetes de cierre permanecen abiertos. Base, retención, destinatarios, subencargados y transferencias no se validan sin evidencia independiente suficiente.

### P0-E — Eliminación operacional final — `BLOCKED POR P0-B/P0-C`

No ejecutar ni acreditar eliminación operacional final 3/3 hasta que el assurance tenant-specific aplicable sea suficiente. La eliminación primaria controlada permanece separada.

### P0-F — Piloto externo — `DEFERRED HASTA GATES`

El protocolo puede prepararse, pero un piloto externo no se inventa ni se sustituye por un tenant sintético.

## 8. Claims permitidos y prohibidos

Se puede afirmar que existe Golden Path técnico validado, especialistas digitales con revisión humana, trazabilidad de decisiones/evidencia, eliminación primaria controlada 3/3, lifecycle con cambios requeridos y workflows tenant-specific.

No se puede afirmar: cumplimiento total, certificación, PITR observado, OpenAI Standard o MAM confirmado, tenant configuration verified 3/3, eliminación operacional final 3/3, piloto externo realizado ni beta autoservicio lista.

## 9. Backlog autorizado durante functional freeze

Solo se autoriza seguridad P0, evidencia administrativa tenant-specific, revisión humana de evidencia ya solicitada, eliminación operacional final cuando los prerequisitos estén cumplidos, bugs críticos/regresiones, documentación de assurance basada en hechos comprobados y preparación/ejecución controlada del piloto cuando corresponda.

Todo feature adicional queda fuera de alcance hasta decisión explícita del owner.

## 10. Decisión vigente

**Decisión del owner — 25 de agosto de 2026:** cerrar la arquitectura funcional autenticada con Personas + Configuración acotadas, reconciliar el roadmap y entrar en functional freeze. El Bloque 16 conserva autoridad completa sobre seguridad, evidencia externa y claims.

Estado objetivo:

> **Kumplio funcionalmente cerrado; cierre de seguridad/evidencia externa en curso; beta autoservicio todavía no habilitada.**
