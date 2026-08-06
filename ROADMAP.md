# KUMPLIO — Roadmap Maestro de Producto y Ejecución

> **Documento canónico de producto, arquitectura y prioridades**  
> Estado: activo  
> Revisión: 6 de agosto de 2026  
> Mercado principal: Chile  
> Idioma visible obligatorio: español  
> Baseline técnico validado: `eac65ae8ca60018ce8637ab0dd5b69514bfce747`  
> Repositorio: `traviscomber/kumplio`

---

## 1. Regla de este roadmap

Este archivo representa el **estado real del producto**, no el estado histórico de issues o PRs.

Prioridad de evidencia para marcar algo como hecho:

1. código presente en `main`;
2. migración presente y aplicada en producción cuando corresponda;
3. prueba técnica o transaccional verificable;
4. despliegue verde;
5. uso real por un usuario o piloto.

Los issues y PRs antiguos son evidencia histórica. Si contradicen `main` o producción, prevalece este roadmap.

### Estados oficiales

| Estado | Significado |
|---|---|
| `PLANNED` | Definido, sin implementación activa. |
| `ACTIVE` | Desarrollo o cierre en curso. |
| `DEPLOYED` | Código y/o migración ya están en producción. |
| `VALIDATED` | Flujo probado de extremo a extremo con datos reales. |
| `DONE` | Validado, medido y sin gate pendiente. |
| `BLOCKED` | Requiere acción externa o decisión explícita. |
| `DEFERRED` | Existe valor, pero no debe competir con la ruta crítica actual. |

`DEPLOYED` no equivale a `VALIDATED` ni a `DONE`.

---

## 2. Tesis de producto vigente

Kumplio no debe presentarse como un dashboard genérico de compliance ni como un conjunto de agentes.

La experiencia central es:

```text
Persona u organización describe una situación
→ Kumplio crea un expediente vivo
→ reúne contexto, fuentes y evidencia
→ ejecuta especialistas cuando corresponde
→ una persona revisa decisiones sensibles
→ quedan acciones, responsables, plazos y respaldo
→ el caso se cierra de forma auditable
```

### Propuesta de valor

**Resolver situaciones regulatorias y de cumplimiento con contexto, evidencia, especialistas y revisión humana, dejando cada decisión trazable.**

### Principios no negociables

1. Chile primero.
2. Sin fuente no hay afirmación regulatoria.
3. Sin evidencia no hay conclusión de cumplimiento.
4. IA genera o propone; una persona valida decisiones sensibles.
5. Generado no significa aprobado.
6. Toda mutación crítica debe dejar auditoría en la misma transacción.
7. Cada organización debe permanecer aislada.
8. Versionar antes que sobrescribir.
9. La UI debe hablar de resultados y decisiones, no de infraestructura.
10. No se agregan módulos nuevos mientras el golden path principal no esté validado.

---

## 3. Estado ejecutivo al 6 de agosto de 2026

### Baseline verde

`main` está restaurado al último commit verificado en verde:

`eac65ae8ca60018ce8637ab0dd5b69514bfce747`

Los dos despliegues Vercel asociados estaban aprobados en este baseline.

### Preparación actual

| Nivel | Estado |
|---|---|
| Desarrollo técnico | sólido |
| Demo comercial acompañada | apta con control |
| Piloto supervisado | apto |
| Beta privada | cerca, con gates pendientes |
| Registro público autoservicio | no habilitar todavía |
| Escalamiento multiempresa | no todavía |

### Realidad de producción

La arquitectura es mucho más avanzada que su uso real.

| Activo operacional | Volumen actual |
|---|---:|
| Casos | 2 |
| Workflows | 4 |
| Ejecuciones de agentes | 9 |
| Artefactos | 3 |
| Revisiones humanas | 2 |
| Misiones | 0 |
| Evidencias operacionales | 0 |
| Controles operacionales | 0 |
| Claims regulatorios | 186 |
| Secciones regulatorias | 2.104 |

**Conclusión:** el cuello de botella ya no es construir infraestructura; es demostrar repetidamente que un caso real puede entrar, resolverse, revisarse, ejecutarse y cerrarse sin intervención manual en la base.

---

## 4. Qué ya tenemos

### A. Experiencia y expediente — `DEPLOYED`

- narrativa pública orientada a resolución guiada;
- centro de casos;
- expediente canónico `/cases/[caseId]`;
- recursos, documentos, obligaciones, riesgos y acciones vinculables;
- timeline y eventos;
- cierre y archivo atómicos;
- navegación privada y noindex reforzado;
- seguimiento de responsable y vencimiento;
- bandeja de accountability y SLA.

### B. Controles y evidencia — `DEPLOYED / NO VALIDATED`

- catálogo de controles;
- biblioteca de evidencia;
- vínculo control-obligación;
- vínculo control-evidencia;
- evaluación de diseño y operación;
- historial de evaluaciones;
- solicitudes de evidencia;
- UI de Control Assurance;
- workspace `/evidence`.

La funcionalidad existe, pero falta cerrar un caso real usando estas piezas de extremo a extremo.

### C. Plataforma agentic — `DEPLOYED / PARTIAL VALIDATION`

- catálogo de agentes;
- Structured Outputs y Zod;
- límites, timeout, retries y sanitización;
- `store: false`;
- versionado de prompt y schema;
- herramientas autorizadas y tool-call logging;
- workflows por etapas;
- revisión humana;
- reintentos sin sobrescribir resultados anteriores;
- stale workflow recovery;
- decisiones y eventos auditables;
- aprobación con justificación y checklist;
- distinción entre resultado terminado y resultado aprobado.

Pendiente: validar repetidamente el flujo completo y desacoplar ejecución larga del request HTTP.

### D. Responsabilidad y auditoría — `DEPLOYED`

- asignación de responsables;
- fechas objetivo;
- estados SLA;
- acciones de misión alineadas con estados reales de PostgreSQL;
- mutaciones críticas de misión + evento de auditoría en una transacción;
- roles de revisión alineados entre aplicación y base.

### E. Motor regulatorio — `DEPLOYED`

- Regulatory Evidence Engine;
- fuentes y versiones;
- capturas y hashes;
- claims y citas;
- 186 claims regulatorios;
- 2.104 secciones regulatorias;
- LeyChile / BCN;
- Diario Oficial;
- Dirección del Trabajo;
- SMA / SNIFA;
- procedencia, cambios y registros de captura;
- plataforma común de scrapers/conectores.

### F. Plataforma de conocimiento — `DEPLOYED PARCIAL`

- Grafo Nacional;
- Memoria Organizacional como modelo físico;
- nodos, relaciones y versiones;
- procedencia y eventos;
- `knowledge_mappings`;
- proyección regulatoria y relaciones operacionales.

Pendiente: convertir esa infraestructura en una función visible que realmente mejore el expediente y la respuesta de los agentes.

### G. Seguridad aplicada recientemente — `DEPLOYED`

- funciones privilegiadas sensibles movidas a `private`;
- wrappers públicos `SECURITY INVOKER`;
- aprobación humana endurecida;
- mutaciones críticas atómicas;
- rutas privadas con `noindex` y `no-store`.

---

## 5. Qué falta y por qué importa

### P0 — Gates antes de autoservicio público

1. **Supabase Auth: leaked password protection** — `BLOCKED`
   - activar protección contra contraseñas filtradas;
   - alinear política real del servidor con la UI;
   - cerrar issue #115.

2. **Golden path Ley N.º 21.719** — `ACTIVE`
   - registro/login;
   - workspace;
   - situación real;
   - caso;
   - contexto y fuentes;
   - ejecución;
   - revisión humana;
   - control/evidencia/acción cuando corresponda;
   - cierre auditable.

3. **Validación multiempresa real** — `ACTIVE`
   - dos organizaciones;
   - dos usuarios;
   - pruebas negativas de acceso cruzado;
   - ningún query puede depender de elegir `.limit(1)` como workspace activo.

4. **Semántica comercial coherente** — `ACTIVE`
   - mostrar solo segmentos cuyo onboarding esté realmente implementado;
   - no prometer siete agentes actuando si el workflow usa menos;
   - revisar claims antiguos que puedan seguir indexados o cacheados.

### P1 — Operación profesional

5. **Workspace activo explícito** — `PLANNED`
   - eliminar la dependencia de “primera organización encontrada”;
   - selector de organización;
   - contexto de sesión explícito;
   - pruebas cross-tenant.

6. **Equipo humano usable** — `PLANNED`
   - nombres y correos, no UUIDs;
   - invitaciones;
   - revocación;
   - último acceso;
   - historial de roles.

7. **Workers durables** — `PLANNED`
   - sacar ejecuciones largas del request HTTP;
   - cola persistente;
   - lease;
   - heartbeat;
   - idempotencia;
   - retry exponencial;
   - dead-letter;
   - alertas de jobs estancados.

8. **Aceptaciones legales auditables** — `PLANNED`
   - registro append-only de términos y privacidad;
   - versión, fecha, usuario, organización y documento aceptado.

9. **Data minimization para IA** — `ACTIVE`
   - reemplazar selecciones amplias por allowlists de columnas;
   - contexto por propósito;
   - revisión de PII enviada a modelos.

### P2 — Deuda técnica que debe aislarse

10. **Dependencias y `xlsx`** — `DEFERRED / SECURITY DEBT`
    - no volver a mezclar ExcelJS + Next + Axios + lockfile + CI en un solo cambio;
    - resolver en una rama exclusiva;
    - mantener `main` verde como requisito absoluto.

11. **Release qualification real** — `ACTIVE`
    - `npm ci` reproducible;
    - lint;
    - typecheck;
    - checks de dominio;
    - build;
    - dependency audit;
    - smoke test;
    - preview verde antes de merge.

12. **Schema/types drift** — `ACTIVE`
    - regenerar tipos desde producción;
    - eliminar `as any` de nuevas tablas;
    - tests de contrato para queries críticas.

13. **Inventario de tablas y módulos** — `PLANNED`
    - clasificar: producto activo / interno / catálogo / futuro / deprecated;
    - mover capacidades puramente internas fuera del esquema expuesto cuando sea conveniente;
    - no crear nuevas tablas sin owner funcional.

### P3 — Producto de privacidad Ley N.º 21.719

14. **Mapa de tratamientos** — `PLANNED`
15. **Bases de licitud, finalidades y categorías de datos** — `PLANNED`
16. **Encargados/subencargados y transferencias** — `PLANNED`
17. **Derechos de titulares** — `PLANNED`
18. **EIPD / alto riesgo** — `PLANNED`
19. **Incidentes** — `PLANNED`
20. **Privacidad desde el diseño** — `PLANNED`

No se debe construir todo a la vez. Primero debe validarse qué parte del flujo Ley N.º 21.719 vende y genera valor real.

---

## 6. Plan de ejecución — bloques de 3

### OLA 1 — Cerrar el producto que ya existe

#### Bloque 1 — Auth + workspace + tenant

1. cerrar configuración de Supabase Auth y issue #115;
2. implementar workspace activo explícito;
3. ejecutar prueba multiempresa negativa y positiva.

**Salida:** dos organizaciones operan sin depender de “primera membresía” y sin fuga cross-tenant.

#### Bloque 2 — Golden path Ley N.º 21.719

1. crear un caso real desde la UI;
2. ejecutarlo hasta revisión humana y acciones;
3. cerrarlo con expediente auditable.

**Salida:** mismo caso ejecutado 10 veces desde tenants limpios sin duplicados, huérfanos ni intervención SQL.

#### Bloque 3 — UX operacional

1. equipo con nombres, invitaciones y roles;
2. consolidar seguimiento, decisiones, accountability y revisión;
3. pulir móvil del workspace y resultado de agentes.

**Salida:** una persona externa entiende qué debe hacer sin conocer la arquitectura de Kumplio.

---

### OLA 2 — Hacerlo confiable para pilotos

#### Bloque 4 — Ejecución durable

1. cola persistente de jobs agentic;
2. lease/heartbeat/retry/dead-letter;
3. monitoreo y recuperación automática.

**Salida:** ningún workflow depende de mantener vivo un request HTTP.

#### Bloque 5 — Evidencia y controles reales

1. completar un control de diseño y operación;
2. completar una solicitud de evidencia de extremo a extremo;
3. cerrar una brecha con evidencia aceptada y responsable.

**Salida:** al menos un caso real demuestra obligación → control → evidencia → revisión → acción → cierre.

#### Bloque 6 — Release gate

1. lockfile reproducible y dependency audit;
2. suite única de release qualification;
3. smoke test automático de preview y producción.

**Salida:** ningún merge crítico depende solo de “Vercel compiló”.

---

### OLA 3 — Convertir conocimiento en ventaja de producto

#### Bloque 7 — Mapeo

1. obligación pública → control privado;
2. control → evidencia;
3. revisión humana del mapeo y su historial.

**Salida:** primer mapeo real aprobado sin cálculo automático de “cumplimiento”.

#### Bloque 8 — Memoria organizacional

1. proyectar documentos y controles útiles;
2. relaciones privadas por organización;
3. usar memoria en una respuesta o workflow real.

**Salida:** los agentes mejoran una decisión usando conocimiento privado sin mezclar tenants.

#### Bloque 9 — Consulta agentic de conocimiento

1. recuperación de subgrafo relevante;
2. citas y procedencia obligatorias;
3. evaluación de calidad y cobertura.

**Salida:** un agente responde usando fuente pública + memoria privada + evidencia de forma trazable.

---

### OLA 4 — Ley N.º 21.719 vendible

#### Bloque 10 — Inventario mínimo de tratamientos

1. actividad de tratamiento;
2. finalidad/base/datos/titulares;
3. responsable, sistema y conservación.

#### Bloque 11 — Riesgo y evidencia de privacidad

1. EIPD inicial;
2. terceros y transferencias;
3. controles y evidencia vinculados.

#### Bloque 12 — Operación continua

1. derechos de titulares;
2. incidentes;
3. cambios regulatorios y seguimiento.

**Salida Ola 4:** un cliente piloto puede usar Kumplio para operar una parte concreta de su preparación a la Ley N.º 21.719, no solo para leer un diagnóstico.

---

## 7. Pilotos y comercialización

### KUMPLIO v1.0 Chile — `PLANNED`

Objetivos mínimos:

- 3 a 5 organizaciones piloto;
- 10 casos reales completos;
- al menos 1 caso Ley N.º 21.719 repetible;
- métricas de precisión, tiempo, costo y aprobación;
- cero fugas cross-tenant;
- backups y restore probado;
- soporte y runbooks;
- pricing validado con conversaciones reales.

### Métricas mínimas de producto

- tiempo desde registro a primer caso útil;
- porcentaje de casos que llegan a cierre;
- tiempo de revisión humana;
- porcentaje de outputs aprobados / cambios solicitados / rechazados;
- costo por caso y por etapa;
- tasa de retries;
- trabajos estancados;
- evidencia solicitada vs recibida;
- tiempo hasta cerrar una brecha;
- retención y repetición de uso por organización.

---

## 8. Qué queda fuera de la ruta crítica

Hasta validar v1.0 no deben competir con los bloques anteriores:

- marketplace amplio;
- studio genérico;
- benchmark avanzado;
- múltiples verticales simultáneas;
- PWA de terreno;
- operación offline;
- geolocalización;
- integraciones enterprise no requeridas por piloto;
- automatización total sin revisión humana.

### Verticales futuras

- KUMPLIO Transporte;
- KUMPLIO Agro;
- KUMPLIO Minería.

Primero validar el núcleo común; después una vertical a la vez.

---

## 9. Deuda de gestión del repositorio

Existen issues y PRs históricos abiertos cuyo contenido ya fue parcial o totalmente absorbido por `main`.

Ejemplos: #29, #38, #46, #47, #51, #52, #53, #57, #60, #63, #79 y PRs antiguos como #30, #31, #35 y #55.

**Plan:** no usarlos como fuente de verdad. En una ola administrativa separada se debe:

1. comparar cada issue/PR con `main` y producción;
2. cerrar como `completed` o `superseded` lo ya absorbido;
3. crear issues nuevos y pequeños solo para gaps reales del roadmap vigente.

---

## 10. Definition of Done para registro público

Kumplio puede abrir autoservicio público únicamente cuando:

- leaked password protection esté activado y verificado;
- audiencia pública y onboarding coincidan;
- exista workspace activo explícito;
- pruebas cross-tenant estén automatizadas;
- un caso Ley N.º 21.719 complete el golden path repetidamente;
- “validado” signifique aprobación humana real;
- mutaciones críticas y auditoría sean atómicas;
- jobs agentic sean idempotentes, recuperables y observables;
- release qualification sea reproducible;
- dependencias críticas no tengan vulnerabilidades conocidas aceptadas sin plan;
- rutas privadas permanezcan noindex/no-store;
- cierre de caso produzca expediente completo y auditable;
- exista backup/restore probado;
- soporte y runbooks estén documentados.

---

## 11. Próximo bloque recomendado

La próxima ejecución debe ser **OLA 1 — Bloque 1**:

1. cerrar Auth;
2. workspace activo explícito;
3. prueba multiempresa completa.

No se inicia una funcionalidad nueva hasta cerrar esos tres puntos.
