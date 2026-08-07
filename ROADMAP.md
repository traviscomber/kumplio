# KUMPLIO — Roadmap Maestro de Producto y Ejecución

> **Documento canónico de producto, arquitectura, evidencia y prioridades**  
> Estado: activo  
> Revisión: 7 de agosto de 2026  
> Mercado principal: Chile  
> Idioma visible obligatorio: español  
> Baseline técnico y documental: `9b031cbbc8bc96488c6d97b48a78fd263ec25511`  
> Última migración aplicada y versionada: `20260807141858_close_official_case_baseline_assurance`  
> Repositorio: `traviscomber/kumplio`

---

## 1. Regla de este roadmap

Este archivo representa el **estado comprobable del producto**, no una lista de ideas ni el historial de issues.

Prioridad de evidencia para marcar algo como hecho:

1. código presente en `main`;
2. migración versionada y aplicada en producción cuando corresponda;
3. prueba técnica, transaccional o de seguridad verificable;
4. Release Gate y despliegues verdes;
5. uso real por una persona o piloto;
6. métrica de resultado cuando el bloque lo requiera.

Si una PR, una conversación o una pantalla contradice `main`, Supabase o una prueba real, prevalece la evidencia técnica. `DEPLOYED` no equivale a `VALIDATED`, y `VALIDATED` no equivale necesariamente a `DONE`.

### Estados oficiales

| Estado | Significado |
|---|---|
| `PLANNED` | Definido, sin implementación activa. |
| `ACTIVE` | Desarrollo, prueba o cierre en curso. |
| `DEPLOYED` | Código y/o migración ya están en producción. |
| `VALIDATED` | Flujo probado con datos reales o una prueba transaccional representativa. |
| `DONE` | Validado, medido y sin gate relevante pendiente. |
| `BLOCKED` | Requiere acción externa, permiso o decisión explícita. |
| `DEFERRED` | Tiene valor, pero no debe competir con la ruta crítica. |

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
→ lo aprendido mejora el siguiente caso
```

### Propuesta de valor

**Proteger y ordenar la información de cumplimiento para resolver situaciones con guía experta, evidencia y revisión humana, dejando cada decisión trazable.**

### Promesas que sí podemos sostener

1. Reunir información dispersa en un expediente controlado.
2. Separar hechos, fuentes, inferencias, reservas y decisiones humanas.
3. Convertir un análisis en misión, responsable, vencimiento y solicitud de evidencia.
4. Conservar el historial sin sobrescribir versiones previas.
5. Explicar por qué aparece una prioridad o un nivel de confianza.
6. Reutilizar controles, evidencia y precedentes cuando exista una relación defendible.
7. Coordinar especialistas sin presentar una salida generada como decisión aprobada.

### Lo que Kumplio no debe afirmar

- que una empresa cumple globalmente por tener un score alto;
- que la ausencia de datos en la plataforma demuestra que algo no existe;
- que un documento aislado acredita la operación de un control;
- que una recomendación de IA sustituye revisión legal, auditoría o decisión humana;
- que una línea base inicial equivale a inventario completo o certificación.

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
12. No se agregan módulos nuevos si el siguiente gate real sigue abierto.

---

## 3. Estado ejecutivo al 7 de agosto de 2026

### Baseline verde

`main` está en:

`9b031cbbc8bc96488c6d97b48a78fd263ec25511`

Sobre este baseline quedaron en `SUCCESS`:

- Release Gate;
- Application Validation;
- Release Qualification Foundation;
- typecheck;
- build de producción;
- smoke test;
- ambos despliegues Vercel;
- IndexNow production.

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
| Revisiones humanas | 7 |
| Jobs durables | 5 |
| Misiones | 1 |
| Resultados de misión | 1 |
| Decisiones de misión | 0 |
| Requerimientos internos/obligaciones del ámbito | 1 |
| Controles operacionales | 1 |
| Evidencias operacionales | 1 |
| Solicitudes de evidencia | 1 |
| Evaluaciones de control | 2 |
| Memorias organizacionales persistidas | 0 |
| Claims regulatorios | 186 |
| Secciones regulatorias | 2.104 |

### Hito validado: caso oficial Ley N.º 21.719

Caso:

`91ae9174-be4c-4ddd-8980-4a671571afdc`

La cadena persistente quedó:

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
- evidencia: `d90ccc9b-dc71-4aa8-921a-a303353acac1`;
- evaluación de diseño: `8a6f9f61-494e-4e88-b115-ee6d88fcf4ba`;
- evaluación operacional: `70bd4020-5811-430b-ab9f-e2949604529b`;
- resultado de misión: `c2bc1493-8403-4d05-aea8-58a26df3e860`.

La evidencia conserva como desconocidos:

- procesos y tratamientos;
- sistemas, repositorios y activos;
- categorías y conjuntos de datos;
- terceros, proveedores y destinatarios;
- documentos fuente.

Por eso la confianza del alcance registrado se calcula en **88% bruto**, pero se limita correctamente a **65%** por operación parcial. Esto no es confianza de cumplimiento global.

Próxima revisión del control y vencimiento de la evidencia: **6 de septiembre de 2026**.

---

## 4. Capacidades actuales

### A. Narrativa, seguridad y entrada al producto — `DEPLOYED`

- narrativa pública centrada en protección de datos, centralización y guía experta;
- separación entre información pública y workspaces privados;
- rutas privadas con `noindex` y `no-store`;
- autenticación y onboarding;
- workspace activo explícito;
- navegación simplificada: Hoy, Casos, Seguimiento y Organización;
- equipo con nombres, correo, invitaciones, roles y revocación.

### B. Expedientes y golden path — `VALIDATED PARCIAL`

- caso canónico `/cases/[caseId]`;
- contexto, fuentes, artefactos, revisiones y timeline;
- inicio idempotente de caso y workflow;
- cinco especialistas principales en el caso oficial;
- cierre y archivo atómicos;
- caso convertido a plan operativo;
- misión, solicitud y baseline cerrados de extremo a extremo.

Pendiente para `DONE`: repetir el flujo en tenants limpios y con más de una organización, sin intervención administrativa.

### C. Plataforma agentic y Consejo de Especialistas — `DEPLOYED / VALIDATED`

- Structured Outputs y Zod;
- timeouts, límites, retries y clasificación de errores;
- `store: false`;
- versionado de prompt y schema;
- herramientas autorizadas y tool-call logging;
- fronteras `DECIDE / NO DECIDE` por especialista;
- contexto de comité entre especialistas;
- detección de coincidencias, contradicciones y evidencia faltante;
- supervisor determinístico antes de aceptar el resultado;
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
- biblioteca de evidencia;
- solicitudes de evidencia;
- vínculo control–requerimiento;
- vínculo control–evidencia;
- suficiencia revisada;
- evaluación separada de diseño y operación;
- evidencia con hash y vigencia;
- baseline assurance idempotente;
- cierre de misión y resultado aprobado;
- operación parcial visible, sin falsear 100%.

Pendiente: poblar el inventario real y demostrar controles recurrentes, no solo una línea base inicial.

### F. Grafo, mapeo e impacto — `DEPLOYED`

- mapa navegable `/map`;
- obligaciones, controles, evidencia, casos, misiones, documentos y responsables;
- relaciones bidireccionales;
- búsqueda de controles similares antes de crear;
- timeline organizacional;
- análisis de impacto;
- deep-links a nodos del mapa;
- confianza del alcance registrado con dimensiones y topes explícitos.

### G. Memoria y contexto organizacional — `DEPLOYED / SIN DATOS REALES`

- lectura de `organization_memory`;
- fallback a decisiones humanas;
- búsqueda de casos similares;
- precedentes inyectados al contexto de agentes;
- separación entre contexto operativo y autoridad normativa.

Pendiente: capturar, versionar y aprobar aprendizajes organizacionales reales. Producción aún tiene 0 memorias persistidas.

### H. Escritorio y responsabilidad operacional — `VALIDATED INICIAL`

- Escritorio `/advisor`;
- prioridades por riesgo, vencimiento y accionabilidad;
- “¿Por qué aparece esto?”;
- briefing de 24 horas;
- cierre diario y próximo foco;
- Mi trabajo;
- delegación asistida;
- carga por integrante;
- SLA y escalamiento visible;
- seguimiento y bitácora.

El cierre oficial dejó de aparecer como trabajo activo y quedó visible en briefing y timeline, que es el comportamiento esperado.

### I. Motor regulatorio — `DEPLOYED`

- Regulatory Evidence Engine;
- fuentes, capturas, versiones y hashes;
- claims con citas;
- LeyChile / BCN;
- Diario Oficial;
- Dirección del Trabajo;
- SMA / SNIFA;
- procedencia y cambios;
- plataforma común de scrapers.

### J. Release y seguridad — `DONE / DEUDA EXTERNA CONOCIDA`

- `npm ci` reproducible;
- Release Gate único;
- typecheck y build obligatorios;
- checks de dominio;
- dependency audit crítico;
- smoke de preview y producción;
- previews Vercel antes de merge;
- funciones nuevas `SECURITY INVOKER`;
- `search_path=''`;
- RPC críticas disponibles solo a `service_role` cuando corresponde.

Deuda externa conocida: **Supabase Auth Leaked Password Protection está desactivada**.

---

## 5. Estado de los bloques 1–13

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

---

## 6. Gates pendientes

### P0 — Antes de beta privada autoservicio

1. **Leaked Password Protection** — `BLOCKED`
   - activar en Supabase Auth;
   - verificar política real del servidor;
   - cerrar issue asociado.

2. **Multiempresa real** — `ACTIVE`
   - segunda organización;
   - segundo usuario;
   - pruebas positivas y negativas de acceso cruzado;
   - selector de workspace y sesión explícita;
   - ningún query crítico puede depender de `.limit(1)`.

3. **Inventario mínimo real Ley N.º 21.719** — `ACTIVE`
   - actividades de tratamiento;
   - finalidades y bases;
   - categorías de datos y titulares;
   - sistemas y repositorios;
   - terceros y transferencias;
   - responsables, retención y evidencia fuente.

4. **Repetibilidad del golden path** — `ACTIVE`
   - ejecutar el flujo completo al menos 3 veces en tenants limpios;
   - cero duplicados;
   - cero registros huérfanos;
   - cero intervención SQL manual;
   - tiempos y costos registrados.

5. **Piloto supervisado externo** — `PLANNED`
   - 1–3 organizaciones;
   - responsable real de cumplimiento;
   - tareas reales;
   - feedback de UX y confianza;
   - sin ampliar alcance durante la observación.

### P1 — Valor acumulativo

6. Aprendizaje desde correcciones humanas, con tipo, vigencia, versión y aprobación.
7. Biblioteca viva por dominio de cumplimiento.
8. Recomendaciones proactivas explicables, con máximo de asuntos prioritarios.
9. Seguimiento automático y notificaciones sin spam.
10. Reutilización de evidencia entre varios controles y marcos.
11. Gestión de terceros críticos y dependencias.
12. Preparación continua para auditoría.

### P2 — Operación avanzada

13. Modo incidente y sala ejecutiva.
14. Cadena de custodia y preservación de evidencia.
15. Post-mortem estructurado y aprendizaje.
16. Portal de auditor y Data Room con autorización.
17. Paquetes versionados de fiscalización.
18. Retención, eliminación y divulgaciones controladas.

### P3 — Enterprise y expansión

19. Holdings, filiales y países.
20. Multi-framework: Ley N.º 21.719, ISO 27001, NIST, SOC 2 y otros.
21. API pública, webhooks e integraciones.
22. SSO y gobierno corporativo.
23. Motor de capacidad, dependencias y simulación.
24. Verticales Transporte, Minería y Agro.
25. Marketplace, internacionalización y ecosistema.

---

## 7. Próximos bloques de 3

### Bloque 14 — Inventario mínimo real de tratamientos — `NEXT`

1. **Actividad y propósito**
   - registrar al menos una actividad de tratamiento real;
   - finalidad, base propuesta, titulares y categorías de datos;
   - owner y estado de validación.

2. **Sistemas, datos y terceros**
   - vincular sistema/repositorio;
   - conjunto de datos;
   - proveedor o destinatario;
   - ubicación, transferencia y retención cuando se conozcan.

3. **Evidencia y revisión**
   - adjuntar fuente real;
   - revisión humana;
   - actualizar control y baseline;
   - recalcular confianza sin eliminar desconocidos no resueltos.

**Salida:** un tratamiento real puede recorrerse desde requerimiento → proceso → sistema/datos/tercero → control → evidencia → revisión, sin inferir información inexistente.

### Bloque 15 — Aprendizaje organizacional

1. capturar correcciones humanas clasificadas;
2. versionar vigencia, supersesión y conflictos;
3. crear biblioteca viva y usar un aprendizaje en un caso equivalente.

**Salida:** un error corregido una vez no se repite silenciosamente en un caso similar.

### Bloque 16 — Piloto y tenant assurance

1. crear segunda organización y ejecutar pruebas cross-tenant;
2. repetir golden path completo con datos limpios;
3. ejecutar piloto supervisado y medir tiempo, retrabajo y confianza.

**Salida:** beta privada defendible y decisión informada de comercialización.

---

## 8. Métricas de cierre v1.0

| Indicador | Gate |
|---|---:|
| Bugs críticos abiertos | 0 |
| Release Gate en cambios críticos | 100% |
| Golden paths repetidos en tenants limpios | ≥ 3 |
| Duplicados o huérfanos por retry | 0 |
| Fugas cross-tenant en pruebas | 0 |
| Controles con owner | 100% del alcance piloto |
| Evidencia aceptada con procedencia | 100% de controles declarados como demostrados |
| Decisiones sensibles con revisión humana | 100% |
| Recomendaciones con explicación verificable | 100% |
| Tiempo para preparar una vista de auditoría | medir en piloto |
| Tiempo para cerrar un caso supervisado | medir en piloto |
| Controles/evidencias reutilizados | medir, sin meta artificial inicial |

---

## 9. Congelamiento de alcance

Hasta cerrar P0:

- no crear módulos nuevos solo porque son atractivos;
- no construir Enterprise antes de validar un segundo tenant;
- no presentar la línea base como inventario completo;
- no aumentar scores ocultando operación parcial;
- no automatizar una decisión irreversible sin aprobación;
- no mezclar modernización de dependencias con cambios funcionales grandes;
- no marcar `DONE` sin evidencia y métrica cuando corresponda.

Toda idea nueva debe demostrar que:

1. elimina una fricción real;
2. reduce tiempo o retrabajo;
3. mejora la calidad o trazabilidad de una decisión;
4. aumenta seguridad o aislamiento;
5. o es necesaria para un piloto concreto.

---

## 10. Decisión vigente

La prioridad inmediata no es agregar más módulos. Es **convertir la línea base parcial en conocimiento organizacional real**, probar el flujo en un segundo tenant y observar a una persona externa usando Kumplio.

El siguiente bloque ejecutable es:

> **Bloque 14 — Inventario mínimo real de tratamientos.**

Ese trabajo debe reducir los cinco desconocidos actuales sin inventar respuestas y mostrar cómo cambia, de forma explicable, la confianza del alcance registrado.
