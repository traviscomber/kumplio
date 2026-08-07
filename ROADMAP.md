# KUMPLIO — Roadmap Maestro de Producto y Ejecución

> **Documento canónico de producto, arquitectura, evidencia y prioridades**  
> Estado: activo  
> Revisión: 7 de agosto de 2026  
> Mercado principal: Chile  
> Idioma visible obligatorio: español  
> Baseline técnico y documental: `0dd11fb69e83a25908e776c0ffae910191771fcc`  
> Última migración aplicada: `20260807194153_seed_n3uralia_commercial_processing_activity`  
> Repositorio: `traviscomber/kumplio`

---

## 1. Regla de este roadmap

Este archivo representa el **estado comprobable del producto**, no el historial de ideas, conversaciones, issues o PRs.

Prioridad de evidencia para marcar algo como hecho:

1. código presente en `main`;
2. migración versionada y aplicada en producción cuando corresponda;
3. prueba técnica, transaccional o de seguridad verificable;
4. Release Gate y despliegues verdes;
5. uso real por una persona o piloto;
6. métrica de resultado cuando el bloque lo requiera.

Si una conversación, una pantalla o una PR contradice `main`, Supabase o una prueba real, prevalece la evidencia técnica.

### Estados oficiales

| Estado | Significado |
|---|---|
| `PLANNED` | Definido, sin implementación activa. |
| `ACTIVE` | Desarrollo, prueba o cierre en curso. |
| `DEPLOYED` | Código y/o migración ya están en producción. |
| `VALIDATED` | Flujo probado con datos reales o una prueba transaccional representativa. |
| `VALIDATED INICIAL` | Primer caso real comprobado; falta repetibilidad o cobertura. |
| `DONE` | Validado, medido y sin gate relevante pendiente. |
| `BLOCKED` | Requiere acción externa, permiso o decisión explícita. |
| `DEFERRED` | Tiene valor, pero no debe competir con la ruta crítica. |

`DEPLOYED` no equivale a `VALIDATED`. Un único caso exitoso tampoco equivale a cobertura organizacional completa.

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

### Lo que Kumplio no debe afirmar

- que una empresa cumple globalmente por tener un score alto;
- que la ausencia de datos en Kumplio demuestra que algo no existe;
- que un documento aislado acredita la operación completa de un control;
- que una recomendación de IA sustituye revisión legal, auditoría o decisión humana;
- que una línea base o una actividad inicial equivale a inventario completo;
- que una clasificación de riesgo es definitiva si la metodología y la aprobación siguen pendientes.

### Principios no negociables

1. Chile primero.
2. Seguridad y centralización de información desde el inicio.
3. Sin fuente no hay afirmación regulatoria.
4. Sin evidencia no hay conclusión de cumplimiento.
5. IA propone; una persona valida decisiones sensibles.
6. Generado no significa aprobado.
7. Toda mutación crítica deja auditoría en la misma transacción.
8. Cada organización permanece aislada.
9. Versionar antes que sobrescribir.
10. La UI habla de resultados, decisiones y trabajo; no de infraestructura.
11. La confianza siempre declara su alcance y sus límites.
12. Los desconocidos se conservan hasta ser resueltos con evidencia.
13. No se agregan módulos atractivos si un gate P0 continúa abierto.

---

## 3. Estado ejecutivo al 7 de agosto de 2026

### Baseline verde

`main` está en:

`0dd11fb69e83a25908e776c0ffae910191771fcc`

Sobre este baseline quedaron en `SUCCESS`:

- Release Gate;
- Application Validation;
- Release Qualification Foundation;
- typecheck;
- build de producción;
- smoke test;
- ambos despliegues Vercel;
- IndexNow production.

La PR de referencia es **#217 — Inventario mínimo real de tratamientos**.

### Migraciones vigentes más recientes

| Versión | Migración |
|---|---|
| `20260807192320` | `processing_activity_inventory_v1` |
| `20260807192428` | `processing_inventory_explicit_browser_deny` |
| `20260807194153` | `seed_n3uralia_commercial_processing_activity` |

### Preparación actual

| Nivel | Estado real |
|---|---|
| Desarrollo técnico | sólido |
| Demo comercial acompañada | apta |
| Piloto supervisado | apto |
| Beta privada | cerca; faltan gates P0 |
| Registro público autoservicio | no habilitar todavía |
| Escalamiento multiempresa | no habilitar todavía |
| Enterprise | diferido hasta validar pilotos |

### Realidad de producción

| Activo operacional | Volumen actual |
|---|---:|
| Organizaciones | 1 |
| Membresías | 1 |
| Ámbitos/proyectos | 1 |
| Casos | 3 |
| Workflows agentic | 5 |
| Etapas de workflow | 25 |
| Ejecuciones de agentes | 14 |
| Artefactos agentic | 8 |
| Revisiones humanas de agentes | 7 |
| Jobs durables | 5 |
| Misiones | 1 |
| Resultados de misión | 1 |
| Decisiones de misión | 0 |
| Requerimientos internos/obligaciones del ámbito | 1 |
| Controles operacionales | 1 |
| Evidencias operacionales | 2 |
| Solicitudes de evidencia | 1 |
| Evaluaciones de control | 3 |
| Actividades de tratamiento | 1 |
| Revisiones de tratamiento | 1 |
| Sistemas/repositorios inventariados | 1 |
| Conjuntos de datos inventariados | 1 |
| Terceros inventariados | 1 |
| Memorias organizacionales persistidas | 0 |
| Claims regulatorios | 186 |
| Secciones regulatorias | 2.104 |

---

## 4. Hitos validados

### Hito A — Golden path y baseline assurance — `VALIDATED`

Caso oficial:

`91ae9174-be4c-4ddd-8980-4a671571afdc`

Cadena persistente:

```text
Caso aprobado
→ ámbito asignado
→ misión con owner y vencimiento
→ solicitud de evidencia
→ requerimiento interno claramente diferenciado de obligación legal
→ control de línea base
→ evidencia aceptada con hash SHA-256
→ evaluación de diseño: effective
→ evaluación operacional: partial
→ resultado de misión aprobado
→ misión completed
→ eventos de expediente, evidencia y misión
```

IDs principales:

- requerimiento interno: `65c1dd70-8ed1-4c0b-a74b-de8d7b3ce1eb`;
- control: `81c256bd-0a5e-4663-a96a-67bf7de2008a`;
- evidencia inicial: `d90ccc9b-dc71-4aa8-921a-a303353acac1`;
- evaluación de diseño: `8a6f9f61-494e-4e88-b115-ee6d88fcf4ba`;
- evaluación operacional inicial: `70bd4020-5811-430b-ab9f-e2949604529b`;
- resultado de misión: `c2bc1493-8403-4d05-aea8-58a26df3e860`.

La operación permanece parcial y la confianza nunca se presenta como certificación.

### Hito B — Primer tratamiento real de N3uralia — `VALIDATED INICIAL`

Actividad:

> **Gestión de contactos comerciales y solicitudes de demostración**

La fuente real combina:

- endpoint `app/api/leads/route.ts`;
- tabla operacional `public.commercial_leads`;
- al menos un registro persistido;
- región Supabase `us-east-1`.

Cadena persistente:

```text
Actividad real
→ propósito
→ base propuesta
→ titulares y categorías de datos
→ dataset
→ sistema/repositorio
→ tercero
→ evidencia estructurada con hash
→ revisión humana
→ control y evaluación operacional parcial
→ evento del expediente
```

IDs principales:

- request key: `e6956b38-25e1-3bca-9f78-9293bb26af3c`;
- actividad: `26233189-3335-43e6-b382-99fcf2cc4090`;
- dataset: `7eed3f2c-0402-466f-8b0f-6ca84d6a28cd`;
- sistema/repositorio: `aabbcc76-f48c-4aad-b251-55aa2cc9185b`;
- tercero: `1f5fa52c-7b34-47f4-9e49-bd8007dad191`;
- evidencia: `ab080fbd-c189-4059-b5c4-752e65daaac5`;
- revisión humana: `3cc95dac-0026-42de-bcac-c5ac26ae19d6`;
- evaluación operacional adicional: `59fcfa84-4587-4eb2-81a7-5b07f0beed62`.

Hash del snapshot:

`6e5c93c63295b308858baa054ffad95787cfadeeacbe2e5fda7e0f2e1da0e39d`

La evidencia quedó:

- `accepted`;
- integridad `verified`;
- vencimiento el **5 de noviembre de 2026**;
- alcance `processing_activity_inventory`;
- limitaciones preservadas explícitamente.

La revisión conserva seis desconocidos:

1. plazo de retención no aprobado;
2. base de licitud pendiente de validación jurídica;
3. destinatarios y subencargados incompletos;
4. clasificación de riesgo del proveedor pendiente de metodología y aprobación;
5. aviso de privacidad no adjuntado;
6. mecanismo de eliminación no evidenciado.

La tercera ejecución del mismo contrato devolvió:

```text
resumed: true
created.*: false
mismos IDs
unknownCount: 6
```

No se generaron duplicados.

### Confianza actual del alcance registrado

Dimensiones actuales:

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

El máximo sigue en **65%** por dos razones independientes:

- operación parcial del control;
- inventario con actividad parcial y desconocidos abiertos.

Esto demuestra progreso sin ocultar la falta de cobertura organizacional completa.

---

## 5. Capacidades actuales

### A. Narrativa, seguridad y entrada — `DEPLOYED`

- narrativa pública centrada en protección de datos, centralización y guía experta;
- separación entre información pública y workspaces privados;
- rutas privadas con `noindex` y `no-store`;
- autenticación y onboarding;
- workspace activo explícito;
- navegación simplificada: Escritorio, Casos, Seguimiento y Organización;
- equipo con nombres, correo, invitaciones, roles y revocación.

### B. Expedientes y golden path — `VALIDATED INICIAL`

- expediente canónico `/cases/[caseId]`;
- contexto, fuentes, artefactos, revisiones y timeline;
- inicio idempotente de caso y workflow;
- especialistas con revisión humana;
- cierre y archivo atómicos;
- caso convertido a plan operativo;
- misión, solicitud y baseline cerrados de extremo a extremo.

Pendiente para `DONE`: repetir el flujo en tenants limpios y con más de una organización.

### C. Consejo de Especialistas — `DEPLOYED / VALIDATED`

- Structured Outputs y Zod;
- timeouts, límites, retries y clasificación de errores;
- `store: false`;
- versionado de prompt y schema;
- herramientas autorizadas y tool-call logging;
- fronteras `DECIDE / NO DECIDE`;
- contexto de comité;
- detección de contradicciones y evidencia faltante;
- supervisor determinístico;
- revisión humana y aprobación con justificación;
- retry sin sobrescribir resultados anteriores;
- recuperación de workflows stale.

### D. Ejecución durable — `VALIDATED`

- Supabase Queues/PGMQ;
- `agent_jobs` tenant-scoped;
- enqueue idempotente;
- lease, heartbeat y visibility timeout;
- retry exponencial;
- dead-letter;
- cron de worker;
- centro de operaciones;
- health endpoint.

### E. Controles, evidencia y aseguramiento — `VALIDATED INICIAL`

- catálogo de controles;
- biblioteca y solicitudes de evidencia;
- vínculo control–requerimiento;
- vínculo control–evidencia;
- suficiencia revisada;
- evaluación separada de diseño y operación;
- evidencia con hash y vigencia;
- baseline assurance idempotente;
- operación parcial visible.

### F. Inventario de tratamientos — `VALIDATED INICIAL`

- workspace accionable en `/digital-twin`;
- actividad, propósito y base propuesta;
- titulares y categorías de datos;
- responsable y criticidad;
- sistema/repositorio y hosting;
- dataset, retención y transferencia;
- tercero, ubicación y riesgo provisional;
- fuente verificable;
- snapshot JSONB con SHA-256;
- revisión humana y desconocidos explícitos;
- vínculos del gemelo digital;
- evento del expediente;
- dimensión de confianza y tope por inventario parcial.

Pendiente: ampliar a más tratamientos y validar jurídicamente bases, retención, destinatarios y eliminación.

### G. Grafo, mapeo e impacto — `DEPLOYED`

- mapa navegable `/map`;
- obligaciones, controles, evidencia, casos, misiones, documentos y responsables;
- relaciones bidireccionales;
- búsqueda de controles similares;
- timeline organizacional;
- análisis de impacto;
- deep-links;
- confianza por dimensiones y topes explícitos.

### H. Memoria organizacional — `DEPLOYED / SIN DATOS REALES`

- lectura de `organization_memory`;
- fallback a decisiones humanas;
- búsqueda de casos similares;
- precedentes inyectados al contexto de agentes;
- separación entre contexto operativo y autoridad normativa.

Pendiente: capturar, versionar y aprobar aprendizajes reales. Producción aún tiene 0 memorias persistidas.

### I. Escritorio y responsabilidad — `VALIDATED INICIAL`

- prioridades por riesgo, vencimiento y accionabilidad;
- “¿Por qué aparece esto?”;
- briefing de 24 horas;
- cierre diario y próximo foco;
- Mi trabajo;
- delegación asistida;
- carga por integrante;
- SLA y escalamiento visible;
- seguimiento y bitácora.

### J. Motor regulatorio — `DEPLOYED`

- Regulatory Evidence Engine;
- fuentes, capturas, versiones y hashes;
- claims con citas;
- LeyChile / BCN;
- Diario Oficial;
- Dirección del Trabajo;
- SMA / SNIFA;
- procedencia y cambios;
- plataforma común de scrapers.

### K. Release y seguridad — `DONE / DEUDA EXTERNA CONOCIDA`

- `npm ci` reproducible;
- Release Gate único;
- typecheck, build y smoke obligatorios;
- checks de dominio;
- dependency audit crítico;
- previews Vercel antes de merge;
- funciones nuevas `SECURITY INVOKER`;
- `search_path=''`;
- RPC críticas solo para `service_role`;
- RLS y denegación explícita para tablas internas del inventario;
- corrección del contrato CI de SMA SNIFA detail.

Deuda externa conocida: **Supabase Auth Leaked Password Protection está desactivada**.

---

## 6. Estado de los bloques 1–14

| Bloque | Resultado | Estado |
|---:|---|---|
| 1 | Auth, workspace activo y tenant | `DEPLOYED / BLOCKED` por leaked passwords y segunda organización |
| 2 | Golden path Ley N.º 21.719 | `VALIDATED` una vez; falta repetibilidad multi-tenant |
| 3 | UX operacional | `DEPLOYED` |
| 4 | Ejecución durable | `VALIDATED` |
| 5 | Evidencia y controles | `VALIDATED INICIAL` |
| 6 | Release Gate | `DONE` |
| 7 | Grafo y reutilización | `DEPLOYED` |
| 8 | Timeline, confianza e impacto | `DEPLOYED / VALIDATED INICIAL` |
| 9 | Memoria y casos similares | `DEPLOYED / SIN DATOS REALES` |
| 10 | Especialización, comité y supervisor | `DEPLOYED / VALIDATED` |
| 11 | Escritorio, explicabilidad, SLA y delegación | `DEPLOYED / VALIDATED INICIAL` |
| 12 | Expediente → plan operativo | `VALIDATED` |
| 13 | Baseline assurance honesto | `VALIDATED` |
| 14 | Inventario mínimo real de tratamientos | `VALIDATED INICIAL` |

---

## 7. Gates P0 antes de beta privada autoservicio

### 1. Leaked Password Protection — `BLOCKED`

- activar en Supabase Auth;
- verificar política real del servidor;
- cerrar issue asociado.

### 2. Multiempresa real — `ACTIVE`

- segunda organización;
- segundo usuario;
- pruebas positivas y negativas de acceso cruzado;
- selector de workspace y sesión explícita;
- ningún query crítico puede depender de `.limit(1)`.

### 3. Inventario mínimo Ley N.º 21.719 — `VALIDATED INICIAL / ACTIVE`

Ya existe un tratamiento real con sistema, dataset, tercero, evidencia y revisión.

Falta:

- registrar al menos dos actividades adicionales;
- validar bases de licitud;
- aprobar retención;
- completar destinatarios y subencargados;
- adjuntar aviso de privacidad;
- demostrar eliminación;
- revisar riesgo de terceros con metodología aprobada.

### 4. Repetibilidad del golden path — `ACTIVE`

- ejecutar el flujo completo al menos 3 veces en tenants limpios;
- cero duplicados;
- cero registros huérfanos;
- cero intervención SQL manual;
- tiempos y costos registrados.

### 5. Piloto supervisado externo — `PLANNED`

- 1–3 organizaciones;
- responsable real de cumplimiento;
- tareas reales;
- feedback de UX y confianza;
- sin ampliar alcance durante la observación.

---

## 8. Backlog ordenado

### P1 — Valor acumulativo

1. Aprendizaje desde correcciones humanas, con tipo, vigencia, versión y aprobación.
2. Biblioteca viva por dominio de cumplimiento.
3. Recomendaciones proactivas explicables.
4. Seguimiento automático y notificaciones sin spam.
5. Reutilización de evidencia entre controles y marcos.
6. Gestión de terceros críticos y dependencias.
7. Preparación continua para auditoría.

### P2 — Operación avanzada

1. Modo incidente y sala ejecutiva.
2. Cadena de custodia y preservación de evidencia.
3. Post-mortem estructurado y aprendizaje.
4. Portal de auditor y Data Room con autorización.
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

### Bloque 15 — Tenant assurance y repetibilidad — `NEXT`

1. crear segunda organización y segundo usuario;
2. ejecutar pruebas positivas y negativas cross-tenant sobre casos, evidencia, tratamientos y RPC;
3. repetir el golden path completo en un tenant limpio y medir duplicados, tiempo y costo.

**Salida:** aislamiento multiempresa defendible y segunda ejecución completa sin intervención SQL manual.

### Bloque 16 — Ampliación del inventario real

1. registrar dos actividades adicionales representativas;
2. validar bases, retención, destinatarios, subencargados y transferencias;
3. adjuntar aviso de privacidad y evidencia de eliminación o crear acciones explícitas.

**Salida:** el inventario deja de depender de un solo proceso y reduce los desconocidos con evidencia aprobada.

### Bloque 17 — Aprendizaje organizacional

1. capturar correcciones humanas clasificadas;
2. versionar vigencia, supersesión y conflictos;
3. crear biblioteca viva y reutilizar un aprendizaje en un caso equivalente.

**Salida:** un error corregido una vez no se repite silenciosamente en un caso similar.

---

## 10. Métricas de cierre v1.0

| Indicador | Gate |
|---|---:|
| Bugs críticos abiertos | 0 |
| Release Gate en cambios críticos | 100% |
| Golden paths repetidos en tenants limpios | ≥ 3 |
| Duplicados o huérfanos por retry | 0 |
| Fugas cross-tenant en pruebas | 0 |
| Actividades reales revisadas | ≥ 3 para el piloto inicial |
| Controles con owner | 100% del alcance piloto |
| Evidencia aceptada con procedencia | 100% de controles declarados como demostrados |
| Decisiones sensibles con revisión humana | 100% |
| Recomendaciones con explicación verificable | 100% |
| Bases/retención pendientes | visibles y accionables, nunca ocultas |
| Tiempo para preparar una vista de auditoría | medir en piloto |
| Tiempo para cerrar un caso supervisado | medir en piloto |
| Controles/evidencias reutilizados | medir, sin meta artificial inicial |

---

## 11. Congelamiento de alcance

Hasta cerrar P0:

- no crear módulos nuevos solo porque son atractivos;
- no construir Enterprise antes de validar un segundo tenant;
- no presentar la línea base o una actividad como inventario completo;
- no aumentar scores ocultando operación parcial;
- no convertir bases propuestas o riesgos provisionales en conclusiones aprobadas;
- no automatizar decisiones irreversibles sin aprobación;
- no mezclar modernización de dependencias con cambios funcionales grandes;
- no marcar `DONE` sin evidencia y métrica.

Toda idea nueva debe demostrar que:

1. elimina una fricción real;
2. reduce tiempo o retrabajo;
3. mejora calidad o trazabilidad;
4. aumenta seguridad o aislamiento;
5. o es necesaria para un piloto concreto.

---

## 12. Decisión vigente

Bloque 14 está cerrado como **VALIDATED INICIAL**. Kumplio ya puede registrar y recorrer un tratamiento real sin inventar información ni esconder sus desconocidos.

La prioridad inmediata es:

> **Bloque 15 — Tenant assurance y repetibilidad.**

No se habilitará beta autoservicio ni se avanzará a funciones Enterprise hasta demostrar aislamiento entre dos organizaciones y repetir el golden path en un tenant limpio.
