# KUMPLIO — Roadmap Maestro de Producto y Arquitectura

> **Documento canónico de producto, arquitectura y ejecución**  
> Estado: activo  
> Revisión: 2 de agosto de 2026  
> Mercado principal: Chile  
> Idioma visible obligatorio: español  
> Horizonte principal: KUMPLIO v2.0  
> Responsable técnico interno: Travis — Arquitecto IA full-stack  
> Repositorio: `traviscomber/kumplio`

---

## 1. Propósito

Kumplio construye el sistema de conocimiento regulatorio y cumplimiento verificable más confiable para las organizaciones chilenas.

La plataforma debe permitir:

1. capturar fuentes oficiales con integridad demostrable;
2. transformar documentos en conocimiento estructurado;
3. relacionar obligaciones públicas con la realidad privada de cada organización;
4. operar controles, evidencias, riesgos, acciones y expedientes;
5. ejecutar agentes especializados con citas y revisión humana;
6. mantener memoria organizacional privada y aislada;
7. entregar resultados auditables y útiles para gerencia, operaciones y asesoría jurídica;
8. extenderse a transporte, agro, minería y otras industrias chilenas.

### Propuesta de valor

> **Cumplimiento continuo respaldado por conocimiento y evidencia verificables.**

### Posicionamiento

Kumplio no es un checklist, un repositorio documental ni un chatbot jurídico. Es una plataforma chilena de conocimiento regulatorio, memoria organizacional, evidencia y operación agentic.

---

## 2. Documentos maestros

Los siguientes documentos son vinculantes para producto y arquitectura:

- `ROADMAP.md`: dirección, hitos, dependencias y gates.
- `MODELO_CANONICO.md`: significado de nodos, relaciones, versiones, afirmaciones, citas, mapeos y eventos.
- `LENGUAJE_CANONICO.md`: vocabulario visible oficial en español.
- `PRINCIPIOS.md`: reglas intransables de producto, conocimiento, IA y seguridad.
- `ARQUITECTURA_PLATAFORMA_CONOCIMIENTO.md`: diseño físico y adopción progresiva.
- `AGENTS.md` y la skill de Travis: ejecución técnica.

**Regla:** ningún módulo nuevo puede crear una estructura paralela de conocimiento.

---

## 3. Estados oficiales

| Estado | Significado |
|---|---|
| `PLANNED` | Definido, todavía sin implementación activa. |
| `DISCOVERY` | Requerimientos, fuentes y arquitectura en investigación. |
| `ACTIVE` | Desarrollo en curso mediante issue, rama y PR. |
| `DEPLOYED` | Código y migraciones en producción; falta validación completa. |
| `VALIDATED` | Flujo probado con datos y usuario real. |
| `DONE` | Gate cerrado, métricas y documentación actualizadas. |
| `BLOCKED` | Dependencia externa o decisión pendiente. |

`DEPLOYED` no equivale a `DONE`.

Un objetivo solo puede marcarse `DONE` cuando pasan build, typecheck, migraciones, RLS, advisors, preview, producción, prueba real y evidencia de cierre.

---

## 4. Principios estratégicos

1. **Chile primero:** regulación, lenguaje, organismos y operación local.
2. **Todo visible en español:** sin mezcla innecesaria con inglés.
3. **Sin fuente no hay afirmación regulatoria.**
4. **Sin evidencia no hay conclusión de cumplimiento.**
5. **La IA propone; las personas validan.**
6. **Conocimiento público y memoria privada están físicamente separados.**
7. **La memoria de una organización nunca se comparte con otra.**
8. **Versionado antes que sobrescritura.**
9. **Citas exactas antes que similitud semántica.**
10. **Confianza explicable, no porcentaje opaco.**
11. **Scrapers auditables y operables.**
12. **Core común y verticales modulares.**

La versión completa está en `PRINCIPIOS.md`.

---

## 5. Arquitectura objetivo

```text
Experiencia
├── Panel de control
├── Expedientes
├── Controles y evidencias
├── Inteligencia regulatoria
└── Explorador de conocimiento

Flujos de trabajo
├── Agentes especializados
├── Revisión humana
├── Acciones y seguimiento
└── Artefactos versionados

Plataforma de Conocimiento
├── Grafo Nacional de Conocimiento
├── Memoria Organizacional
├── Capa de Mapeo
├── Afirmaciones y citas
├── Procedencia y eventos
└── Nivel de confianza

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

- infraestructura Next.js, Vercel y Supabase;
- organizaciones, perfiles, membresías y onboarding transaccional;
- expedientes de cumplimiento y línea de tiempo;
- documentos, obligaciones, riesgos, acciones y vínculos de caso;
- controles, evidencias, evaluaciones y solicitudes;
- plataforma de agentes, herramientas y flujos de trabajo;
- revisión humana y aprobación obligatoria;
- versionado de artefactos;
- Regulatory Evidence Engine;
- LeyChile mediante datos oficiales estructurados;
- plataforma común de conectores con cola, lease, reintentos, circuit breaker y ejecuciones agotadas;
- conector Diario Oficial en desarrollo;
- skill interna Travis.

### Pendiente de validación real

- primer workspace productivo creado por un usuario real;
- prueba completa multiempresa;
- primer expediente con control, evidencia y flujo agentic real;
- configuración final de Auth y protección de contraseñas filtradas;
- primeros pilotos.

---

# 7. Hitos maestros

## M0 — Fundación técnica y plataforma agentic

**Estado:** `DEPLOYED`  
**Issues:** #29 y relacionados.

Resultado: infraestructura, agentes, herramientas, flujos, revisión humana, RLS, cuotas y trazabilidad.

Pendiente para `DONE`: baseline completo de migraciones y prueba real end-to-end.

---

## M1 — Fundación de producto y expediente integrado

**Estado:** `DEPLOYED / ACTIVE`  
**Issue:** #38.

### Objetivos

- `OBJ-PF-001`: expediente como unidad central.
- `OBJ-PF-002`: onboarding real.
- `OBJ-PF-003`: controles y evidencias.
- `OBJ-PF-004`: aseguramiento de controles y solicitudes de evidencia.
- `OBJ-PF-005`: flujos agentic desde el expediente.

### Gate M1

- Auth productivo validado;
- onboarding real completado;
- expediente real con recursos;
- control evaluado con evidencia;
- solicitud cerrada;
- flujo agentic ejecutado;
- aprobación humana registrada;
- experiencia sin entrar a Supabase.

---

## M2 — Motor de Evidencia Regulatoria

**Estado:** `ACTIVE / DEPLOYED PARCIAL`  
**Issues:** #53, #57, #60 y #63.

### Objetivos

- `OBJ-RE-001`: registro de autoridades, fuentes y conectores.
- `OBJ-RE-002`: captura inmutable, hashes y versionado.
- `OBJ-RE-003`: comparación determinística y cambios.
- `OBJ-RE-004`: afirmaciones, citas y revisión humana.
- `OBJ-RE-005`: aplicabilidad por organización y expediente.

### Conectores prioritarios

1. LeyChile/BCN.
2. Diario Oficial.
3. Consejo para la Transparencia y futura autoridad competente.
4. CMF.
5. Dirección del Trabajo.
6. MTT y Aduanas.
7. SAG.
8. Sernageomin, SEA y SMA.

### Gate M2

Kumplio captura una fuente oficial, demuestra integridad, detecta cambios, conserva citas exactas, rechaza afirmaciones sin respaldo y vincula el cambio con una organización o expediente después de revisión humana.

---

## M3 — Plataforma de Conocimiento

**Estado:** `ACTIVE`  
**Issue:** #65.  
**Prioridad:** P0.

### OBJ-KP-001 — Documentos maestros

Entregables:

- `MODELO_CANONICO.md`;
- `LENGUAJE_CANONICO.md`;
- `PRINCIPIOS.md`;
- `ARQUITECTURA_PLATAFORMA_CONOCIMIENTO.md`;
- actualización de este roadmap.

### OBJ-KP-002 — Grafo Nacional de Conocimiento

Conocimiento público, compartido, versionado y revisado:

- normas;
- artículos e incisos;
- organismos;
- publicaciones oficiales;
- conceptos;
- obligaciones;
- derechos;
- sanciones;
- controles y riesgos de referencia;
- relaciones regulatorias.

Tablas iniciales:

- `public_knowledge_nodes`;
- `public_knowledge_node_versions`;
- `public_knowledge_edges`;
- `public_knowledge_edge_versions`.

### OBJ-KP-003 — Memoria Organizacional

Conocimiento privado por organización:

- procesos;
- sistemas;
- proveedores;
- contratos;
- políticas;
- tratamientos de datos;
- activos;
- controles;
- evidencias;
- riesgos;
- incidentes;
- decisiones;
- entidades sectoriales.

Tablas iniciales:

- `organization_memory_nodes`;
- `organization_memory_node_versions`;
- `organization_memory_edges`;
- `organization_memory_edge_versions`.

### OBJ-KP-004 — Capa de Mapeo

Relaciona conocimiento público y privado sin mezclarlos físicamente:

- obligación → aplica a → proceso o tratamiento;
- control de referencia → implementado por → control organizacional;
- artículo → evidenciado por → evidencia;
- sanción → exposición de → riesgo.

Tabla inicial: `knowledge_mappings`.

### OBJ-KP-005 — Procedencia y eventos

- `knowledge_provenance`;
- `knowledge_events`;
- hashes;
- origen;
- proceso;
- actor;
- versión;
- revisión.

### OBJ-KP-006 — Integración regulatoria

LeyChile y Diario Oficial alimentan nodos públicos y relaciones revisables. Los textos oficiales permanecen en el Motor de Evidencia Regulatoria y el grafo mantiene identidad, relaciones y procedencia.

### OBJ-KP-007 — Integración de memoria

Documentos, controles, evidencias, riesgos y casos generan nodos privados sin reemplazar las entidades operacionales actuales.

### OBJ-KP-008 — Consulta para agentes

Los agentes consultan grafo, memoria, evidencia, citas y confianza antes de responder.

### OBJ-KP-009 — Explorador de conocimiento

Interfaz en español para navegar nodos, relaciones, versiones, fuentes y aplicabilidad.

### Gate M3

- documentos maestros fusionados;
- esquema reproducible;
- RLS validado;
- ninguna relación privada cruza organizaciones;
- servicios internos no expuestos;
- Ley 21.719 proyectada al grafo;
- una organización real con memoria privada;
- primer mapeo revisado entre obligación y control/evidencia;
- agentes consultando el modelo;
- explorador mínimo operativo.

---

## M4 — Datos Personales y Ley N.º 21.719

**Estado:** `PLANNED / DISCOVERY`  
**Ventana:** antes del 1 de diciembre de 2026.

### Objetivos

- mapa y registro de actividades de tratamiento;
- bases de licitud y finalidades;
- titulares y categorías de datos;
- encargados y subencargados;
- portal de derechos;
- EIPD;
- incidentes;
- transferencias internacionales;
- protección de datos desde el diseño y por defecto;
- decisiones automatizadas;
- modelo de prevención;
- informes y evidencia.

### Gate M4

Un piloto gestiona un ciclo completo de preparación para la Ley N.º 21.719 con conocimiento, evidencia y revisión humana.

---

## M5 — Artefactos, firma e informes auditables

**Estado:** `DEPLOYED PARCIAL / ACTIVE`.

### Objetivos

- versiones y comparación de artefactos;
- bloqueo de aprobados;
- firma lógica;
- PDF ejecutivo y técnico;
- matrices Excel;
- paquete auditable;
- enlace privado con vencimiento.

Gate: un expediente puede presentarse a gerencia, auditoría o asesoría jurídica sin copiar información manualmente.

---

## M6 — Pilotos y validación de mercado

**Estado:** `PLANNED`.

- 3 a 5 organizaciones piloto;
- corpus de al menos 50 a 100 afirmaciones verificadas;
- medición de precisión, tiempo, costo, falsos positivos y aprobación humana;
- cero alertas externas sin revisión;
- claims comerciales respaldados.

---

## M7 — KUMPLIO v1.0 Chile

**Estado:** `PLANNED`.

Incluye M1 a M6 utilizables, seguridad, backups, monitoreo, soporte, términos, privacidad, pricing, onboarding y primeros clientes.

---

## M8 — Plataforma vertical y aplicación de terreno

**Estado:** `PLANNED`.

- arquitectura modular;
- permisos por sitio, faena, predio o flota;
- PWA instalable;
- cámara, firma y QR;
- geolocalización opcional;
- trabajo sin conexión;
- sincronización segura.

---

## M9 — KUMPLIO Transporte

**Estado:** `PLANNED`.

Flotas, vehículos, conductores, cargas, rutas, viajes, documentos, previaje, incidentes, contratistas, telemetría y evidencia de terreno.

---

## M10 — KUMPLIO Agro

**Estado:** `PLANNED`.

Predios, cuarteles, cultivos, temporadas, lotes, insumos, aplicaciones, trazabilidad, inspecciones, inocuidad, exportación y evidencia de terreno.

---

## M11 — KUMPLIO Minería

**Estado:** `PLANNED`, condicionado a una empresa asociada de diseño.

Faenas, instalaciones, contratistas, permisos, RCA, controles críticos, fiscalizaciones, incidentes, compromisos y cierre.

---

## M12 — KUMPLIO v2.0

**Estado:** objetivo final del roadmap principal.

Requiere:

- plataforma SaaS estable;
- Grafo Nacional de Conocimiento maduro;
- Memoria Organizacional operativa;
- Ley N.º 21.719 completa;
- agentes verificables;
- informes auditables;
- PWA;
- Transporte y Agro en producción;
- Minería validada;
- métricas reales y operación comercial repetible.

---

# 8. Plan inmediato

## Bloque actual — Fundación de M3

1. documentos maestros;
2. diseño físico;
3. migraciones y RLS;
4. verificador y pruebas transaccionales;
5. proyección inicial de Ley 21.719;
6. proyección inicial de controles y evidencias;
7. API de consulta;
8. integración de agentes;
9. explorador mínimo.

## Próximas olas de tres sprints

### Ola 4

1. Modelo canónico y migraciones.
2. Proyección regulatoria de Ley 21.719.
3. Memoria Organizacional desde documentos, controles y evidencias.

### Ola 5

4. Motor de Mapeo.
5. API de conocimiento para agentes.
6. Explorador de conocimiento.

### Ola 6

7. Nivel de confianza descompuesto.
8. Memoria y recuperación semántica.
9. Integración completa de agentes.

---

# 9. Ruta crítica

```text
Auth y primer workspace real
→ Fundación M3
→ Ley 21.719 en el Grafo Nacional
→ Memoria Organizacional real
→ Primer mapeo validado
→ Agentes consultando conocimiento
→ Operación completa Ley N.º 21.719
→ Pilotos
→ KUMPLIO v1.0
→ Verticales
→ KUMPLIO v2.0
```

M2 y M3 avanzan en paralelo, pero los conectores alimentan el grafo solo después de pasar integridad y revisión.

---

# 10. Trazabilidad obligatoria

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

Todo issue debe indicar objetivo, problema, resultado, alcance, dependencias, riesgos, criterios de aceptación y evidencia requerida.

Todo PR debe indicar seguridad, migraciones, pruebas, reversión y estado de producción.

---

# 11. Indicadores

## Conocimiento

- nodos y relaciones publicados;
- nodos privados por organización;
- relaciones con procedencia;
- afirmaciones con cita exacta;
- mapeos propuestos, aprobados y rechazados;
- versiones vigentes y reemplazadas;
- tiempo desde fuente hasta conocimiento revisado.

## Calidad y confianza

- precisión de artículo y versión;
- citas correctas;
- afirmaciones rechazadas;
- divergencia entre agentes;
- evidencia suficiente, parcial o insuficiente;
- tasa de aprobación humana;
- fallas de parser;
- fuentes desactualizadas.

## Producto

- tiempo a primer valor;
- expedientes activos;
- controles evaluados;
- solicitudes de evidencia cerradas;
- flujos agentic completados;
- retención y adopción por organización.

## Operación

- disponibilidad de conectores;
- ejecuciones exitosas, sin cambios, fallidas y agotadas;
- uptime;
- errores P0/P1;
- incidentes de seguridad;
- cobertura de backups.

---

# 12. Riesgos principales

| Riesgo | Mitigación |
|---|---|
| Falsa certeza jurídica | Citas, estados de confianza y revisión humana. |
| Mezcla de datos entre empresas | Separación física, RLS y pruebas cruzadas. |
| Grafo paralelo por módulo | Modelo Canónico obligatorio. |
| Scrapers frágiles | Fixtures, versionado, circuit breaker y salud visible. |
| Sobredesarrollo | Olas, gates y pilotos. |
| Memoria basada solo en embeddings | Nodos, relaciones, procedencia y citas exactas. |
| Migración destructiva | Adopción progresiva y esquema aditivo. |
| Lenguaje inconsistente | `LENGUAJE_CANONICO.md`. |

---

# 13. Gobernanza

Revisión semanal:

- objetivos activos;
- ruta crítica;
- bloqueos;
- PRs y migraciones;
- métricas;
- seguridad;
- siguiente ola.

Revisión mensual:

- avance de hitos;
- costo de infraestructura e IA;
- feedback de pilotos;
- deuda técnica;
- estrategia comercial y verticales.

Este archivo se actualiza mediante PR cuando cambia un hito, gate, prioridad, riesgo o arquitectura.

---

# 14. Referencias internas

- `MODELO_CANONICO.md`
- `LENGUAJE_CANONICO.md`
- `PRINCIPIOS.md`
- `ARQUITECTURA_PLATAFORMA_CONOCIMIENTO.md`
- `AGENTS.md`
- `.agents/skills/travis-kumplio-architect/SKILL.md`
- scripts de plataforma agentic, casos, controles, evidencia y motor regulatorio;
- `scripts/44-knowledge-platform-core.sql`;
- `scripts/45-knowledge-platform-services.sql`;
- `scripts/46-verify-knowledge-platform.sql`;
- issues #29, #38, #53, #57, #60, #63 y #65.

---

> **Regla final:** Kumplio no aprende porque almacena documentos. Aprende cuando puede representar una entidad, relacionarla, demostrar su procedencia, versionarla, revisarla y explicar cómo afecta a una organización chilena.