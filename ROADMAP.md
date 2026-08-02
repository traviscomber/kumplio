# KUMPLIO — Roadmap Maestro de Producto y Arquitectura

> **Documento canónico de producto, arquitectura y ejecución**  
> Estado: activo  
> Revisión: 2 de agosto de 2026  
> Mercado principal: Chile  
> Idioma visible obligatorio: español  
> Horizonte: KUMPLIO v2.0  
> Responsable técnico interno: Travis — Arquitecto IA full-stack  
> Repositorio: `traviscomber/kumplio`

---

## 1. Propósito

Kumplio construye el sistema de conocimiento regulatorio y cumplimiento verificable más confiable para las organizaciones chilenas.

La plataforma debe:

1. capturar fuentes oficiales con integridad demostrable;
2. transformar documentos en conocimiento estructurado;
3. relacionar obligaciones públicas con la realidad privada de cada organización;
4. operar expedientes, controles, evidencias, riesgos y acciones;
5. ejecutar agentes especializados con citas y revisión humana;
6. mantener memoria organizacional privada y aislada;
7. entregar resultados auditables para gerencia, operaciones y asesoría jurídica;
8. extenderse a transporte, agro, minería y otras industrias chilenas.

> **Propuesta de valor:** Cumplimiento continuo respaldado por conocimiento y evidencia verificables.

---

## 2. Documentos maestros

Son vinculantes para producto, arquitectura, interfaz y agentes:

- `ROADMAP.md`
- `MODELO_CANONICO.md`
- `LENGUAJE_CANONICO.md`
- `PRINCIPIOS.md`
- `ARQUITECTURA_PLATAFORMA_CONOCIMIENTO.md`
- `AGENTS.md`
- `.agents/skills/travis-kumplio-architect/SKILL.md`

**Regla:** ningún módulo nuevo puede crear una estructura paralela de conocimiento.

---

## 3. Estados oficiales

| Estado | Significado |
|---|---|
| `PLANNED` | Definido, sin implementación activa. |
| `DISCOVERY` | Investigación de requisitos, fuentes o arquitectura. |
| `ACTIVE` | Desarrollo en issue, rama y PR. |
| `DEPLOYED` | Código y migraciones en producción; falta validación real. |
| `VALIDATED` | Flujo probado con datos y usuario real. |
| `DONE` | Gate cerrado con métricas y evidencia. |
| `BLOCKED` | Dependencia externa o decisión pendiente. |

`DEPLOYED` no equivale a `DONE`.

---

## 4. Principios estratégicos

1. Chile primero.
2. Todo contenido visible en español.
3. Sin fuente no hay afirmación regulatoria.
4. Sin evidencia no hay conclusión de cumplimiento.
5. La IA propone; las personas validan.
6. Conocimiento público y memoria privada están físicamente separados.
7. La memoria de una organización nunca se comparte con otra.
8. Versionado antes que sobrescritura.
9. Citas exactas antes que similitud semántica.
10. Confianza explicable, no porcentajes opacos.
11. Scrapers auditables y operables.
12. Núcleo común y verticales modulares.

---

## 5. Arquitectura objetivo

```text
Experiencia
├── Panel de control
├── Expedientes
├── Controles y evidencias
├── Inteligencia regulatoria
└── Explorador del conocimiento

Flujos de trabajo
├── Agentes especializados
├── Revisión humana
├── Acciones y seguimiento
└── Artefactos versionados

Plataforma de Conocimiento
├── Grafo Nacional de Conocimiento
├── Memoria Organizacional
├── Capa de Mapeo
├── Procedencia y eventos
├── Motor de confianza
└── Consulta para agentes

Plataforma de Evidencia
├── Documentos y versiones
├── Capturas regulatorias
├── Evidencias organizacionales
└── Hashes e integridad

Infraestructura
├── Supabase/Postgres
├── Plataforma de conectores
├── Next.js/Vercel
├── Modelos de IA
└── Workers y tareas programadas
```

---

## 6. Estado real

### Desplegado

- Next.js, Vercel y Supabase;
- organizaciones, perfiles, membresías y onboarding transaccional;
- expedientes y línea de tiempo;
- documentos, obligaciones, riesgos, acciones y vínculos;
- controles, evidencias, evaluaciones y solicitudes;
- agentes, herramientas y flujos con aprobación humana;
- versionado de artefactos;
- Motor de Evidencia Regulatoria;
- conector LeyChile mediante JSON oficial;
- plataforma común de conectores con cola, lease, reintentos, circuit breaker y ejecuciones agotadas;
- modelo canónico del Grafo Nacional y Memoria Organizacional;
- servicios internos, RLS, procedencia y eventos.

### En desarrollo

- proyección de la Ley N.º 21.719 al Grafo Nacional — issue #67, PR #68;
- conector Diario Oficial — issue #63, PR #64 pendiente de actualización;
- corpus verificado de obligaciones y citas de la Ley N.º 21.719.

### Pendiente de validación real

- primer workspace productivo creado por un usuario real;
- prueba multiempresa completa;
- expediente real con control, evidencia y flujo agentic;
- configuración final de Auth;
- primeros pilotos.

---

# 7. Programas maestros

## M0 — Fundación técnica y plataforma agentic

**Estado:** `DEPLOYED`

Infraestructura, agentes, herramientas, flujos, revisión humana, RLS, cuotas y trazabilidad.

**Gate pendiente:** baseline completo de migraciones y prueba real de extremo a extremo.

---

## M1 — Plataforma Operacional

**Estado:** `DEPLOYED / ACTIVE`  
**Issue maestro:** #38

Objetivos:

- expediente como unidad central;
- onboarding real;
- controles y evidencias;
- aseguramiento de controles;
- solicitudes de evidencia;
- flujos agentic desde el expediente.

**Gate M1:** un usuario real completa onboarding, expediente, control, evidencia, solicitud, flujo agentic y aprobación humana sin entrar a Supabase.

---

## M2 — Plataforma Regulatoria

**Estado:** `ACTIVE / DEPLOYED PARCIAL`

Objetivos:

- registro de autoridades y fuentes;
- capturas inmutables y hashes;
- comparación determinística;
- afirmaciones, citas y revisión;
- aplicabilidad por organización y expediente;
- operación de conectores y scrapers.

Conectores prioritarios:

1. LeyChile/BCN — operativo.
2. Diario Oficial — en desarrollo.
3. Consejo para la Transparencia y futura autoridad de datos.
4. CMF.
5. Dirección del Trabajo.
6. MTT y Aduanas.
7. SAG.
8. Sernageomin, SEA y SMA.

**Gate M2:** Kumplio captura una fuente oficial, demuestra integridad, detecta cambios, conserva citas y vincula resultados revisados con una organización o expediente.

---

## M3 — Plataforma de Conocimiento

**Estado:** `ACTIVE`  
**Prioridad:** P0

### OBJ-KP-001 — Documentos maestros

**Estado:** `DONE`

### OBJ-KP-002 — Modelo físico del Grafo Nacional

**Estado:** `DEPLOYED`

Tablas:

- `public_knowledge_nodes`
- `public_knowledge_node_versions`
- `public_knowledge_edges`
- `public_knowledge_edge_versions`

### OBJ-KP-003 — Modelo físico de Memoria Organizacional

**Estado:** `DEPLOYED`

Tablas:

- `organization_memory_nodes`
- `organization_memory_node_versions`
- `organization_memory_edges`
- `organization_memory_edge_versions`

### OBJ-KP-004 — Capa de Mapeo

**Estado:** `DEPLOYED / SIN USO REAL`

Tabla: `knowledge_mappings`.

### OBJ-KP-005 — Procedencia y eventos

**Estado:** `DEPLOYED`

Tablas:

- `knowledge_provenance`
- `knowledge_events`

### OBJ-KP-006 — Integración regulatoria

**Estado:** `ACTIVE / VALIDACIÓN TÉCNICA COMPLETA`

Ley N.º 21.719 proyectada desde el Motor de Evidencia Regulatoria:

- 1 nodo de norma;
- 741 nodos de artículos e incisos;
- 741 relaciones `CONTIENE`;
- 742 procedencias verificables;
- 742 versiones de nodo;
- 741 versiones de relación;
- segunda ejecución sin cambios ni versiones duplicadas;
- historial independiente de ejecuciones;
- escritura exclusiva por `service_role`.

Pendiente para `DONE`:

- fusionar PR #68;
- integrar Diario Oficial sobre el mismo contrato;
- incorporar revisión humana de conocimiento derivado.

### OBJ-KP-007 — Integración de Memoria Organizacional

**Estado:** `PLANNED`

Documentos, controles, evidencias, riesgos, proveedores y expedientes deben generar nodos privados sin reemplazar sus tablas operacionales.

### OBJ-KP-008 — Consulta para agentes

**Estado:** `PLANNED`

Los agentes deben consultar grafo, memoria, evidencia, citas y confianza antes de responder.

### OBJ-KP-009 — Explorador del conocimiento

**Estado:** `PLANNED`

Interfaz en español para navegar nodos, relaciones, versiones, fuentes y aplicabilidad.

**Gate M3:**

- documentos maestros fusionados;
- esquema reproducible y seguro;
- Ley N.º 21.719 proyectada;
- una organización real con memoria privada;
- primer mapeo revisado entre obligación y control/evidencia;
- agentes consultando el modelo;
- explorador mínimo operativo.

---

## M4 — Plataforma Agentic de Conocimiento

**Estado:** `PLANNED / BASE DESPLEGADA`

- API unificada de consulta;
- recuperación de subgrafo relevante;
- uso de memoria privada por organización;
- respuestas con afirmaciones y citas;
- aprobación y versionado;
- observabilidad y evaluaciones.

---

## M5 — Datos Personales y Ley N.º 21.719

**Estado:** `DISCOVERY / PLANNED`  
**Fecha crítica:** 1 de diciembre de 2026.

- registro de actividades de tratamiento;
- bases de licitud y finalidades;
- titulares y categorías de datos;
- encargados y subencargados;
- portal de derechos;
- EIPD;
- incidentes;
- transferencias internacionales;
- protección de datos desde el diseño y por defecto;
- decisiones automatizadas;
- modelo de prevención.

---

## M6 — Artefactos e informes auditables

**Estado:** `DEPLOYED PARCIAL / ACTIVE`

- versiones y comparación;
- bloqueo de aprobados;
- firma lógica;
- PDF ejecutivo y técnico;
- matrices Excel;
- paquete auditable;
- enlace privado con vencimiento.

---

## M7 — Pilotos y KUMPLIO v1.0 Chile

**Estado:** `PLANNED`

- 3 a 5 organizaciones piloto;
- corpus de 50 a 100 afirmaciones verificadas;
- métricas de precisión, tiempo, costo y aprobación;
- seguridad, backups, monitoreo, soporte y pricing;
- primeros clientes.

---

## M8 — Plataforma vertical y aplicación de terreno

**Estado:** `PLANNED`

- arquitectura modular;
- permisos por sitio, faena, predio o flota;
- PWA instalable;
- cámara, firma y QR;
- geolocalización opcional;
- operación sin conexión.

---

## M9 — KUMPLIO Transporte

**Estado:** `PLANNED`

Flotas, vehículos, conductores, cargas, rutas, viajes, documentos, previaje, incidentes, contratistas, telemetría y evidencia de terreno.

---

## M10 — KUMPLIO Agro

**Estado:** `PLANNED`

Predios, cuarteles, cultivos, temporadas, lotes, insumos, aplicaciones, trazabilidad, inspecciones, inocuidad y exportación.

---

## M11 — KUMPLIO Minería

**Estado:** `PLANNED`, condicionado a una empresa asociada de diseño.

Faenas, instalaciones, contratistas, permisos, RCA, controles críticos, fiscalizaciones, incidentes y compromisos.

---

## M12 — KUMPLIO v2.0

**Estado:** objetivo final.

Requiere plataforma SaaS estable, Grafo Nacional maduro, Memoria Organizacional operativa, Ley N.º 21.719 completa, agentes consultando conocimiento, al menos una vertical validada y controles de seguridad enterprise.

---

# 8. Activos estratégicos

No se usan porcentajes subjetivos. Cada índice se calcula con entregables verificables.

| Activo | Entregables del índice | Estado actual |
|---|---|---|
| Modelo Canónico | documentos, esquema, verificadores, lenguaje | `4/4 — COMPLETO` |
| Grafo Nacional | modelo, primera fuente, jerarquía, versionado, procedencia, revisión | `5/6` |
| Memoria Organizacional | modelo, aislamiento, proyección operativa, relaciones, consulta, piloto | `2/6` |
| Capa de Mapeo | modelo, validación, propuesta, revisión, primer mapeo real | `2/5` |
| Motor de Evidencia | documentos, versiones, hashes, citas, controles, solicitudes | `6/6 — DESPLEGADO` |
| Plataforma de Conectores | registro, cola, lease, reintentos, circuit breaker, panel, conectores reales | `6/7` |
| Corpus Ley N.º 21.719 | captura, secciones, grafo, afirmaciones, citas revisadas, aplicabilidad | `3/6` |
| Plataforma Agentic | agentes, herramientas, flujos, aprobación, versiones, conocimiento, evaluaciones | `5/7` |
| Diario Oficial | parser, modelo, conector, operación, captura real, grafo | `3/6` |

---

# 9. Próximas dos olas de tres sprints

## Ola siguiente

### Sprint A — Cerrar Ley N.º 21.719 en el Grafo Nacional

- fusionar PR #68;
- confirmar producción;
- registrar revisión técnica;
- crear vista de salud del grafo.

### Sprint B — Primera Memoria Organizacional

- proyectar documentos, controles y evidencias;
- mantener aislamiento por organización;
- crear relaciones privadas;
- validar con un workspace real.

### Sprint C — Primer Motor de Mapeo

- obligación pública → control privado;
- control privado → evidencia;
- propuesta automática;
- aprobación humana;
- historial de decisiones.

## Ola posterior

### Sprint D — Corpus verificado Ley N.º 21.719

### Sprint E — API de conocimiento para agentes

### Sprint F — Explorador mínimo del conocimiento

---

# 10. Riesgos activos

| ID | Riesgo | Impacto | Mitigación | Estado |
|---|---|---|---|---|
| R-001 | Fuente oficial cambia formato o servicio | Alto | fixtures, health checks, circuit breaker y revisión | Activo |
| R-002 | Conocimiento sin revisión se presenta como obligación | Crítico | estados, citas, aprobación humana | Mitigado técnicamente |
| R-003 | Cruce de memoria entre organizaciones | Crítico | separación física, RLS y validadores Postgres | Mitigado técnicamente |
| R-004 | Grafo duplica el texto regulatorio | Medio | identidad y procedencia; texto permanece en Evidence Engine | Mitigado |
| R-005 | Roadmap avanza sin usuario real | Alto | gate de validación productiva | Activo |
| R-006 | Scraper Diario Oficial queda desactualizado frente a `main` | Medio | rebase y cierre antes del siguiente conector | Activo |
| R-007 | Dependencia excesiva de un modelo de IA | Alto | reglas determinísticas, evaluaciones y revisión | Activo |

---

# 11. Deuda técnica

| ID | Deuda | Prioridad | Estado |
|---|---|---|---|
| DT-001 | Consolidar baseline histórico de migraciones | Alta | Pendiente |
| DT-002 | Corregir índice faltante preexistente de aplicabilidad regulatoria | Media | Pendiente |
| DT-003 | Optimizar políticas duplicadas de `organization_members` | Media | Pendiente |
| DT-004 | Activar protección de contraseñas filtradas en Supabase Auth | Alta | Manual pendiente |
| DT-005 | Actualizar o reemplazar PR #64 de Diario Oficial | Alta | Pendiente |
| DT-006 | Añadir worker programado para proyecciones regulatorias | Media | Pendiente |

---

# 12. Investigación

| ID | Investigación | Resultado esperado | Estado |
|---|---|---|---|
| I-001 | Modelo canónico de conocimiento | documentos y esquema | Completado |
| I-002 | LeyChile oficial | método estructurado y estable | Completado |
| I-003 | Diario Oficial | ediciones, CVE y PDFs | En curso |
| I-004 | Agencia de Protección de Datos Personales | fuentes e instrucciones oficiales | Continuo |
| I-005 | Graph + memoria para agentes | contrato de consulta y evaluación | Próximo |
| I-006 | Vertical Transporte | design partner y fuentes | Planificado |

---

# 13. Trazabilidad obligatoria

```text
VISIÓN
→ OBJETIVO
→ PROGRAMA
→ ISSUE
→ RAMA
→ PR
→ CÓDIGO / MIGRACIÓN
→ PREVIEW
→ PRUEBA
→ MERGE
→ PRODUCCIÓN
→ MÉTRICA
→ EVIDENCIA DE CIERRE
```

Todo objetivo debe enlazar issue, PR, commit, migración, prueba y métrica.

---

# 14. Definición de terminado

KUMPLIO v2.0 estará terminado cuando:

1. opere de forma estable como SaaS multiempresa;
2. el Grafo Nacional contenga fuentes regulatorias relevantes para Chile;
3. la Memoria Organizacional funcione con aislamiento demostrado;
4. los agentes consulten conocimiento y devuelvan citas;
5. la Ley N.º 21.719 pueda gestionarse de extremo a extremo;
6. al menos una vertical esté validada comercialmente;
7. existan pilotos, métricas, seguridad, soporte y continuidad operacional;
8. ninguna conclusión crítica dependa exclusivamente de IA sin revisión humana.
