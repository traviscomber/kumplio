# KUMPLIO — Master Product Roadmap

> **Documento canónico de producto, arquitectura y ejecución**  
> Estado: activo  
> Última actualización: 2026-08-02  
> Horizonte principal: KUMPLIO v2.0  
> Responsable de producto: equipo KUMPLIO  
> Responsable técnico interno: Travis — Arquitecto IA full-stack  
> Repositorio: `traviscomber/kumplio`

---

## 0. Propósito de este documento

Este archivo define el camino completo para convertir KUMPLIO en una plataforma chilena de cumplimiento continuo, verificable y orientada a operaciones reales.

Es la fuente maestra para:

- visión y posicionamiento;
- prioridades de producto;
- arquitectura funcional y técnica;
- fases, hitos y dependencias;
- criterios de aceptación;
- métricas de valor y confianza;
- riesgos y decisiones;
- trazabilidad desde una idea hasta producción;
- definición del estado final del proyecto.

Los issues y pull requests de GitHub ejecutan este roadmap. Ningún issue reemplaza este documento; cada issue debe apuntar a uno o más identificadores definidos aquí.

---

# 1. Visión

## VISION-001 — Sistema operativo chileno de cumplimiento verificable

KUMPLIO será una plataforma SaaS y operacional que permita a una organización:

1. identificar obligaciones desde fuentes oficiales y documentos internos;
2. determinar su aplicabilidad con supuestos explícitos;
3. relacionarlas con controles, evidencia, riesgos y acciones;
4. ejecutar análisis mediante agentes especializados;
5. verificar cada afirmación con fuentes y evidencia;
6. exigir revisión humana para decisiones sensibles;
7. mantener trazabilidad completa de cambios y aprobaciones;
8. operar desde oficina y terreno;
9. generar informes y paquetes auditables;
10. adaptarse a industrias chilenas mediante aplicaciones verticales.

## Propuesta de valor

> **Cumplimiento continuo respaldado por evidencia.**

KUMPLIO debe llevar a una empresa desde:

> “Creemos que cumplimos”

hasta:

> “Podemos demostrar qué obligación aplica, qué control la cubre, qué evidencia existe, qué brecha permanece, qué fuente utilizamos y quién aprobó la conclusión.”

## Posicionamiento

KUMPLIO no será únicamente:

- un checklist;
- un repositorio documental;
- un chatbot jurídico;
- un generador de políticas;
- un sistema de tareas;
- una copia localizada de una plataforma europea.

KUMPLIO será:

> **Una plataforma agentic de cumplimiento, evidencia y operaciones diseñada para Chile.**

---

# 2. Principios intransables

## PRINCIPLE-001 — Sin fuente no hay afirmación regulatoria

Toda afirmación normativa debe conservar:

- autoridad;
- URL canónica;
- documento;
- versión;
- artículo o sección;
- cita exacta;
- fecha de publicación;
- fecha de vigencia cuando corresponda;
- fecha de recuperación;
- hash de la captura.

## PRINCIPLE-002 — Sin evidencia no hay conclusión de cumplimiento

La ausencia de hallazgos no significa cumplimiento. Los estados admitidos deben distinguir, como mínimo:

- evidencia suficiente;
- evidencia parcialmente suficiente;
- evidencia insuficiente;
- evidencia ausente;
- no evaluado;
- requiere revisión.

## PRINCIPLE-003 — Human-in-the-loop

Las decisiones jurídicas, regulatorias, financieras, de auditoría o de alto impacto requieren aprobación humana.

## PRINCIPLE-004 — Multiempresa segura

Toda entidad privada debe estar aislada por organización mediante RLS, autorización del servidor y filtros explícitos.

## PRINCIPLE-005 — Versionado e inmutabilidad

No se sobrescriben silenciosamente:

- fuentes regulatorias;
- documentos originales;
- resultados de agentes;
- artefactos aprobados;
- revisiones;
- decisiones;
- informes emitidos.

## PRINCIPLE-006 — Chile primero, expansión después

La primera ventaja competitiva se construirá con:

- regulación chilena;
- autoridades chilenas;
- lenguaje local;
- operación sectorial chilena;
- evidencia y reportes útiles para empresas locales.

## PRINCIPLE-007 — Core común, verticales modulares

Transporte, agro y minería comparten el mismo núcleo. No se construirán tres productos independientes.

---

# 3. Contexto regulatorio y oportunidad

## REG-001 — Ley N.º 21.719

La Ley N.º 21.719 moderniza el régimen chileno de protección de datos personales y entra en vigencia el **1 de diciembre de 2026**.

Fuente oficial de referencia:

- Biblioteca del Congreso Nacional / LeyChile: `https://www.bcn.cl/leychile/Navegar?idNorma=1209272&idVersion=2026-12-01`

La oportunidad de KUMPLIO consiste en operacionalizar obligaciones y evidencia, no solo explicar la ley.

## REG-002 — Transporte

El Ministerio de Transportes publicó en enero de 2026 un checklist consolidado para documentación de transporte de carga en ruta y pasos fronterizos, reflejando un problema real de documentación dispersa, observaciones y demoras.

Fuente oficial:

- `https://www.mtt.gob.cl/mtt-lanza-inedito-documento-para-facilitar-la-tramitacion-del-transporte-de-carga-en-pasos-fronterizos/`

## REG-003 — Agro

El SAG mantiene sistemas de control oficial, trazabilidad, registros, inspecciones y formularios asociados a inocuidad agrícola, proveedores y lotes.

Fuentes oficiales:

- `https://www.sag.gob.cl/ambitos-de-accion/sistema-de-control-oficial-de-inocuidad-agricola`
- `https://www.sag.gob.cl/ambitos-de-accion/programa-oficial-de-trazabilidad-animal`

## REG-004 — Minería

SIMIN centraliza trámites asociados a seguridad minera, cierre de faenas, relaves, fiscalizaciones, accidentabilidad, producción e inicio o reinicio de actividades.

Fuente oficial:

- `https://www.sernageomin.cl/simin/`

---

# 4. Arquitectura de producto

## PRODUCT-CORE — KUMPLIO Core

Capacidades comunes:

- organizaciones, usuarios, roles y permisos;
- proyectos o ámbitos;
- casos de cumplimiento;
- documentos y fuentes;
- obligaciones;
- controles;
- evidencia;
- hallazgos;
- riesgos;
- acciones;
- proveedores;
- incidentes;
- agentes y workflows;
- revisión humana;
- informes;
- alertas;
- auditoría;
- trazabilidad.

## PRODUCT-DATA — KUMPLIO Data & Privacy

Módulos transversales para Ley 21.719:

- inventario y mapa de tratamientos;
- bases de licitud y finalidades;
- titulares y categorías de datos;
- encargados y subencargados;
- portal de derechos;
- EIPD;
- incidentes de privacidad;
- transferencias internacionales;
- privacidad desde el diseño;
- decisiones automatizadas;
- modelo de prevención;
- evidencias e informes.

## PRODUCT-INTEL — Regulatory Evidence Engine

Motor de fuentes oficiales y evidencia regulatoria:

- registro de autoridades y fuentes;
- conectores y capturas;
- almacenamiento inmutable;
- hashes y metadatos;
- parsing estructurado;
- versionado;
- diff determinístico;
- grafo normativo;
- afirmaciones y citas;
- evaluación de aplicabilidad;
- revisión humana;
- alertas validadas.

## PRODUCT-VERTICALS — Industry Packs

### KUMPLIO Transporte

- vehículos;
- conductores;
- cargas;
- rutas y viajes;
- documentos operacionales;
- vencimientos;
- checklist previaje;
- incidentes;
- contratistas;
- aplicación de terreno.

### KUMPLIO Agro

- predios;
- cuarteles;
- cultivos y temporadas;
- lotes;
- insumos y aplicaciones;
- trazabilidad;
- proveedores;
- inspecciones;
- inocuidad;
- exportación;
- aplicación de terreno.

### KUMPLIO Minería

- faenas e instalaciones;
- contratistas;
- permisos;
- controles críticos;
- fiscalizaciones;
- hallazgos;
- RCA y compromisos;
- incidentes;
- cierre de faena;
- aplicación de terreno offline.

---

# 5. Arquitectura agentic

## AGENT-001 — Agentes especializados actuales

- **Isidora:** obligaciones y evidencia documental.
- **Rodrigo:** riesgo regulatorio.
- **Verónica:** controles y evidencia.
- **Javier:** planes de cumplimiento.
- **Beatriz:** cambio regulatorio.
- **Andrés:** desempeño del sistema.
- **Catalina:** revisión jurídica y de calidad.

## AGENT-002 — Flujo regulatorio objetivo

```text
Fuente oficial
→ captura y hash
→ parser estructurado
→ diff determinístico
→ Beatriz interpreta el cambio
→ Isidora extrae obligaciones
→ motor de aplicabilidad identifica casos afectados
→ Rodrigo estima riesgo
→ Catalina verifica afirmaciones y citas
→ revisión humana
→ alerta al cliente
→ Javier genera el plan de acción
```

## AGENT-003 — Reglas de confianza

Cada resultado debe conservar:

- agente;
- modelo;
- versión de prompt;
- versión de esquema;
- entradas;
- contexto recuperado;
- herramientas usadas;
- fuentes;
- tokens y costo;
- tiempo;
- artefacto generado;
- revisión;
- decisión final.

## AGENT-004 — Validación en siete capas

1. origen;
2. integridad;
3. extracción;
4. diff determinístico;
5. análisis agentic;
6. verificación independiente;
7. revisión humana.

---

# 6. Estado base al 2026-08-02

## Completado

- [x] Plataforma Next.js desplegada en Vercel.
- [x] Supabase operativo y conectado.
- [x] Multiempresa y RLS para la plataforma de agentes.
- [x] Siete agentes especializados.
- [x] Structured Outputs.
- [x] Persistencia de ejecuciones y artefactos.
- [x] Cuotas y control de concurrencia.
- [x] Recuperación auditada de contexto.
- [x] Orquestación multiagente.
- [x] Revisión humana consolidada.
- [x] Approval gates para workflows.
- [x] Centro de Casos.
- [x] Ficha inicial del expediente.
- [x] Skill interna Travis.
- [x] Verificación de producción para Agent Platform.

## Evidencia principal

- PR #33 — Agent Control Plane, orquestación y herramientas.
- PR #36 — reparación y verificación RLS.
- PR #37 — Product Foundation / Centro de Casos.
- PR #39 — skill Travis.
- Issue #29 — Agent Operating System.
- Issue #38 — Product Foundation.

## Deuda crítica conocida

- [ ] Historial formal de migraciones incompleto respecto del esquema real.
- [ ] Casos todavía no integran todas las entidades operacionales.
- [ ] Artefactos sin firma lógica completa.
- [ ] Sin Regulatory Evidence Engine.
- [ ] Sin módulos completos de Ley 21.719.
- [ ] Sin vertical funcional de transporte.
- [ ] Sin PWA offline de terreno.
- [ ] Sin pilotos comerciales medidos.

---

# 7. Roadmap maestro

## M0 — Foundation técnica y Agent Operating System

**Estado:** completado con pendientes de consolidación  
**Ventana:** hasta agosto de 2026

### Objetivo

Establecer la infraestructura segura de agentes, Supabase, Vercel y revisión humana.

### Entregables

- control plane;
- esquemas estructurados;
- workflows;
- herramientas auditadas;
- aprobación humana;
- RLS y cuotas;
- skill Travis.

### Criterio de salida

- Agent Platform verificada en producción;
- previews verdes;
- ninguna tabla privada crítica sin RLS;
- ningún resultado sensible sin estado de revisión.

---

## M1 — Product Foundation y expediente integrado

**Estado:** en progreso  
**Ventana objetivo:** agosto–septiembre de 2026  
**Programa:** `PF`

### OBJ-PF-001 — Caso como unidad central

#### Entregables

- edición de título, alcance, estado y prioridad;
- responsable y fecha objetivo;
- filtros y búsqueda;
- timeline de actividad;
- documentos vinculados;
- obligaciones vinculadas;
- controles y evidencia;
- riesgos y acciones;
- ejecuciones, artefactos y revisiones;
- progreso verificable.

#### Criterio de aceptación

Un usuario autenticado puede completar un expediente de principio a fin sin entrar a Supabase ni usar herramientas técnicas.

### OBJ-PF-002 — Onboarding real

#### Entregables

- organización;
- perfil de empresa;
- selección de industria;
- creación de primer ámbito;
- primer caso;
- primera fuente o documento;
- datos demo opcionales.

#### Métrica

Tiempo mediano desde registro hasta primer caso útil: **menos de 10 minutos**.

### Gate M1

- [ ] prueba autenticada completa;
- [ ] experiencia móvil aceptable;
- [ ] errores y estados vacíos cubiertos;
- [ ] navegación coherente;
- [ ] Product Foundation issue actualizado.

---

## M2 — Regulatory Evidence Engine MVP

**Estado:** planificado  
**Ventana objetivo:** agosto–octubre de 2026  
**Programa:** `RE`

### OBJ-RE-001 — Registro y captura de fuentes

#### Entidades

- `regulatory_sources`;
- `source_fetches`;
- `regulatory_documents`;
- `document_versions`;
- `document_sections`;
- `regulatory_changes`;
- `regulatory_claims`;
- `claim_citations`;
- `applicability_assessments`;
- `source_review_decisions`.

#### Conectores iniciales

1. BCN / LeyChile;
2. Diario Oficial;
3. fuentes oficiales Ley 21.719;
4. MTT;
5. SAG;
6. Sernageomin.

### OBJ-RE-002 — Captura inmutable

Cada captura debe almacenar:

- contenido original;
- URL;
- fecha;
- headers relevantes;
- MIME;
- tamaño;
- hash SHA-256;
- versión del conector;
- estado de validación.

### OBJ-RE-003 — Diff y grafo normativo

- comparación por artículo y sección;
- relaciones de modifica, reemplaza, deroga, reglamenta e interpreta;
- vigencia explícita;
- estados pendiente, borrador, oficial y no verificado.

### OBJ-RE-004 — Validación agentic

- Beatriz analiza cambios;
- Isidora extrae obligaciones;
- Catalina verifica;
- humano aprueba.

### Gate M2

KUMPLIO puede:

1. capturar una fuente oficial;
2. demostrar integridad;
3. detectar un cambio;
4. extraer obligaciones;
5. mostrar citas exactas;
6. rechazar afirmaciones sin respaldo;
7. registrar revisión humana;
8. vincular el cambio con un caso.

---

## M3 — KUMPLIO Data & Privacy / Ley 21.719

**Estado:** planificado  
**Ventana objetivo:** septiembre–noviembre de 2026  
**Programa:** `DP`

### OBJ-DP-001 — Mapa de tratamientos

- actividades de tratamiento;
- titulares;
- categorías de datos;
- finalidades;
- base jurídica;
- sistemas;
- responsables;
- encargados;
- destinatarios;
- conservación;
- transferencias;
- medidas de seguridad.

### OBJ-DP-002 — Portal de derechos

Flujos de:

- acceso;
- rectificación;
- supresión;
- oposición;
- portabilidad;
- bloqueo.

Debe conservar identidad, plazos, búsquedas, respuestas, evidencia y aprobación.

### OBJ-DP-003 — EIPD asistida

- screening inicial;
- descripción del tratamiento;
- necesidad y proporcionalidad;
- amenazas;
- medidas;
- riesgo residual;
- revisión jurídica;
- aprobación;
- reevaluación.

### OBJ-DP-004 — Incidentes

- registro y cronología;
- datos comprometidos;
- titulares;
- impacto;
- medidas;
- evaluación de notificación;
- comunicaciones;
- cierre;
- lecciones aprendidas.

### OBJ-DP-005 — Proveedores, transferencias y privacidad por diseño

- encargados y subencargados;
- contratos;
- transferencias internacionales;
- privacy gates en proyectos;
- decisiones automatizadas;
- modelo de prevención.

### Gate M3

Antes del 1 de diciembre de 2026, el piloto debe poder gestionar un ciclo completo de preparación Ley 21.719 con evidencia y revisión humana.

---

## M4 — Artefactos, firma e informes auditables

**Estado:** planificado  
**Ventana objetivo:** octubre–noviembre de 2026  
**Programa:** `AR`

### OBJ-AR-001 — Versionado

- versiones de artefactos;
- comparación;
- solicitud de cambios;
- historial;
- prohibición de sobrescritura de aprobados.

### OBJ-AR-002 — Firma lógica

Cada decisión aprobada debe registrar:

- hash del contenido;
- autor;
- fecha;
- rol;
- comentario;
- fuentes;
- artefacto;
- versión;
- estado.

### OBJ-AR-003 — Informes

- PDF ejecutivo;
- PDF técnico;
- matrices Excel;
- paquete auditable ZIP;
- enlace privado con vencimiento.

### Gate M4

Un caso puede entregarse a gerencia, auditoría o asesoría jurídica sin copiar datos manualmente.

---

## M5 — Beta Ley 21.719 y pilotos

**Estado:** planificado  
**Ventana objetivo:** noviembre–diciembre de 2026  
**Programa:** `PILOT`

### OBJ-PILOT-001 — Pilotos

Seleccionar entre 3 y 5 organizaciones con diversidad de tamaño e industria.

### OBJ-PILOT-002 — Corpus de validación

Crear un corpus manual de, al menos:

- 50–100 afirmaciones normativas;
- artículos y citas;
- obligaciones;
- condiciones;
- fechas;
- inferencias prohibidas.

### OBJ-PILOT-003 — Métricas

- precisión de citas;
- afirmaciones rechazadas;
- falsos positivos;
- tiempo de análisis;
- costo por caso;
- tasa de aprobación humana;
- ahorro frente a proceso manual;
- satisfacción del usuario.

### Gate M5

- [ ] cero alertas regulatorias externas sin revisión humana;
- [ ] 100% de afirmaciones normativas con cita;
- [ ] 100% de artefactos finales con trazabilidad;
- [ ] resultados de pilotos documentados;
- [ ] claims comerciales respaldados.

---

## M6 — KUMPLIO v1.0 Chile

**Estado:** planificado  
**Ventana objetivo:** diciembre de 2026–enero de 2027

### Alcance v1.0

- Product Foundation completa;
- Regulatory Evidence Engine básico;
- Ley 21.719;
- agentes verificables;
- informes;
- seguimiento;
- seguridad y auditoría;
- sitio comercial;
- onboarding;
- pricing inicial;
- soporte de pilotos y primeros clientes.

### Criterio de lanzamiento

- disponibilidad estable;
- backups y recuperación verificados;
- monitoreo y logs;
- política de incidentes;
- privacidad y términos;
- flujo de compra o contratación;
- soporte definido;
- no existen bloqueos P0 conocidos.

---

## M7 — Plataforma vertical y PWA de terreno

**Estado:** planificado  
**Ventana objetivo:** enero–marzo de 2027  
**Programa:** `VP`

### OBJ-VP-001 — Arquitectura modular

- feature flags por vertical;
- catálogo de módulos;
- entidades comunes;
- extensiones sectoriales;
- permisos por sitio/faena/predio/flota;
- configuración por organización.

### OBJ-VP-002 — PWA

- instalable;
- responsive;
- formularios de terreno;
- cámara;
- firma;
- QR;
- geolocalización opcional;
- offline;
- sincronización;
- cola segura;
- resolución de conflictos.

### Gate M7

Una vertical puede activarse sin duplicar el producto ni comprometer el Core.

---

## M8 — KUMPLIO Transporte

**Estado:** planificado  
**Ventana objetivo:** febrero–junio de 2027  
**Programa:** `TR`

### OBJ-TR-001 — Modelo operacional

- flotas;
- vehículos;
- conductores;
- cargas;
- rutas;
- viajes;
- documentos;
- clientes;
- subcontratistas;
- incidentes;
- mantenimiento.

### OBJ-TR-002 — Previaje inteligente

```text
Conductor + vehículo + carga + ruta
→ documentos requeridos
→ vigencia
→ observaciones
→ aprobación o bloqueo
→ evidencia de salida
```

Estados:

- listo;
- listo con observaciones;
- bloqueado;
- requiere revisión.

### OBJ-TR-003 — Aplicación del conductor

- checklist;
- fotos;
- firma;
- evidencia;
- incidentes;
- entrega;
- cierre.

### OBJ-TR-004 — Fuentes

- MTT;
- Aduanas;
- SII;
- Dirección del Trabajo;
- Vialidad;
- normativa fronteriza;
- cargas peligrosas.

### Gate M8

Un piloto de transporte puede ejecutar viajes, validar documentación y demostrar reducción de errores u observaciones.

---

## M9 — KUMPLIO Agro

**Estado:** planificado  
**Ventana objetivo:** mayo–septiembre de 2027  
**Programa:** `AGRO`

### OBJ-AGRO-001 — Modelo operacional

- predios;
- cuarteles;
- cultivos;
- temporadas;
- lotes;
- insumos;
- aplicaciones;
- bodegas;
- proveedores;
- inspecciones;
- certificaciones;
- exportaciones.

### OBJ-AGRO-002 — Trazabilidad

```text
Insumo → predio → cuartel → cosecha → lote
→ procesamiento → almacenamiento → transporte → cliente
```

### OBJ-AGRO-003 — Workflows

- aplicación de plaguicidas;
- inspección SAG;
- inocuidad;
- recall;
- certificación;
- exportación.

### Gate M9

Un piloto puede reconstruir trazabilidad de un lote, demostrar registros y preparar una inspección desde KUMPLIO.

---

## M10 — KUMPLIO Minería

**Estado:** planificado  
**Ventana objetivo:** agosto de 2027–marzo de 2028  
**Programa:** `MIN`

### OBJ-MIN-001 — Design partner

No construir toda la vertical sin una empresa minera o contratista que participe en diseño y validación.

### OBJ-MIN-002 — Modelo operacional

- faenas;
- instalaciones;
- contratistas;
- permisos;
- RCA;
- controles críticos;
- fiscalizaciones;
- hallazgos;
- incidentes;
- compromisos;
- cierre de faena.

### OBJ-MIN-003 — Workflows

- respuesta a fiscalización;
- gestión de hallazgos;
- compromisos ambientales;
- controles críticos;
- acreditación de contratistas;
- evidencia offline.

### Gate M10

El design partner opera al menos un proceso crítico con evidencia, responsables y trazabilidad end-to-end.

---

## M11 — KUMPLIO v2.0

**Estado:** objetivo final del roadmap principal  
**Ventana objetivo:** 2028

### Definición de KUMPLIO v2.0

KUMPLIO v2.0 estará alcanzado cuando exista:

- Core SaaS estable;
- Ley 21.719 operativa;
- Regulatory Evidence Engine maduro;
- workflows agentic verificables;
- artefactos firmados y auditables;
- PWA de terreno;
- Transporte en producción;
- Agro en producción;
- Minería validada con design partner;
- métricas reales de precisión y valor;
- operación comercial repetible;
- seguridad, backups y continuidad verificadas;
- documentación técnica y de usuario;
- modelo de soporte y releases.

El producto continuará evolucionando después de v2.0, pero este hito representa el cierre del proyecto de construcción inicial.

---

# 8. Matriz de trazabilidad

Todo trabajo debe usar esta cadena:

```text
VISIÓN
→ OBJETIVO
→ PROGRAMA
→ EPIC / ISSUE
→ RAMA
→ PR
→ MIGRACIÓN / CÓDIGO
→ PREVIEW
→ PRUEBA
→ MERGE
→ PRODUCCIÓN
→ MÉTRICA
→ EVIDENCIA DE CIERRE
```

## Campos obligatorios por issue

- ID de objetivo, por ejemplo `OBJ-RE-001`;
- problema;
- resultado esperado;
- alcance;
- fuera de alcance;
- dependencias;
- riesgo;
- criterios de aceptación;
- pruebas;
- evidencia requerida.

## Campos obligatorios por PR

- objetivo enlazado;
- issue enlazado;
- qué cambia;
- por qué;
- impacto;
- seguridad;
- migraciones;
- validación;
- riesgos;
- reversión;
- estado de Vercel;
- estado de Supabase;
- evidencia de producción.

## Evidencia de cierre admisible

- commit fusionado;
- preview verde;
- prueba autenticada;
- captura o log sanitizado;
- resultado de verificación SQL;
- advisor de seguridad;
- métrica de producto;
- validación de piloto;
- aprobación humana registrada.

---

# 9. Indicadores del proyecto

## Producto

- tiempo a primer valor;
- casos creados;
- casos cerrados;
- tiempo de ciclo;
- acciones vencidas;
- evidencia faltante;
- adopción por módulo;
- retención por organización.

## IA y confianza

- afirmaciones con cita exacta;
- precisión de artículo y versión;
- divergencias entre agentes;
- afirmaciones rechazadas por Catalina;
- tasa de aprobación humana;
- falsos positivos;
- costo por ejecución;
- tiempo por workflow;
- fallas de herramienta;
- fuentes desactualizadas.

## Fuentes regulatorias

- disponibilidad de conectores;
- capturas exitosas;
- tiempo desde publicación hasta captura;
- cambios detectados;
- parsers fallidos;
- fuentes pendientes de revisión.

## Comercial

- pilotos activos;
- conversión de piloto a cliente;
- ingreso recurrente;
- costo de implementación;
- tiempo de onboarding;
- expansión por módulos;
- expansión por vertical.

## Operación

- uptime;
- errores P0/P1;
- tiempo de recuperación;
- despliegues fallidos;
- migraciones revertidas;
- incidentes de seguridad;
- cobertura de backups.

---

# 10. Riesgos estratégicos

## RISK-001 — Scraping frágil

**Mitigación:** API/feed primero, captura original, hashes, alertas de parser, pruebas y revisión humana.

## RISK-002 — Falsa certeza jurídica

**Mitigación:** estados de evidencia, citas obligatorias, Catalina, revisión humana y lenguaje no absoluto.

## RISK-003 — Fragmentación por verticales

**Mitigación:** Core común, feature flags y extensiones sectoriales, no repositorios separados.

## RISK-004 — Sobredesarrollo antes de pilotos

**Mitigación:** gates, design partners y MVPs medibles.

## RISK-005 — Seguridad multiempresa

**Mitigación:** RLS, filtros servidor, pruebas cruzadas de organización y advisors.

## RISK-006 — Dependencia de IA

**Mitigación:** reglas determinísticas, schemas, evaluaciones, fallback y revisión humana.

## RISK-007 — Fuentes incompletas o pendientes

**Mitigación:** estados de autoridad, vigencia y verificación; no publicar como oficial lo que no lo es.

## RISK-008 — Baja adopción en terreno

**Mitigación:** PWA offline, UX simple, formularios cortos, QR, cámara y pilotos con usuarios reales.

---

# 11. Gobernanza

## Revisión semanal

- avances por objetivo;
- bloqueos;
- PRs abiertos;
- métricas;
- riesgos nuevos;
- cambios regulatorios;
- siguiente incremento.

## Revisión mensual

- avance de hitos;
- ajuste de alcance;
- costo de infraestructura e IA;
- feedback de pilotos;
- seguridad;
- deuda técnica;
- prioridades comerciales.

## Regla de actualización

Este archivo debe actualizarse cuando:

- cambia un hito;
- se completa un gate;
- aparece un riesgo material;
- se modifica una prioridad;
- nace o se cancela una vertical;
- se alcanza una versión relevante.

Cada cambio al roadmap se realiza mediante PR.

---

# 12. Próximas acciones inmediatas

## NEXT-001 — Completar Product Foundation

- editar casos;
- responsable y fecha;
- timeline;
- entidades integradas;
- workflows desde caso.

## NEXT-002 — Diseñar Regulatory Evidence Engine

- esquema;
- fuentes;
- captura;
- versionado;
- diff;
- claims y citas;
- revisión.

## NEXT-003 — Preparar corpus Ley 21.719

- artículos;
- afirmaciones verificadas;
- inferencias prohibidas;
- casos de evaluación.

## NEXT-004 — Seleccionar pilotos

- una empresa general;
- una empresa de transporte;
- una empresa agro;
- evaluar design partner minero.

## NEXT-005 — Consolidar migraciones

- inventario de esquema real;
- historial reproducible;
- instalación limpia;
- verificación automática.

---

# 13. Referencias internas

- `AGENTS.md`
- `.agents/skills/travis-kumplio-architect/SKILL.md`
- `scripts/06-agent-control-plane.sql`
- `scripts/07-agent-control-plane-rls.sql`
- `scripts/08-agent-orchestration.sql`
- `scripts/09-agent-tools.sql`
- `scripts/10-verify-agent-platform.sql`
- GitHub issue #29
- GitHub issue #38
- GitHub PR #33
- GitHub PR #36
- GitHub PR #37
- GitHub PR #39

---

# 14. Estado resumido

| Hito | Estado | Resultado esperado |
|---|---|---|
| M0 Foundation técnica | Completado / consolidación pendiente | Plataforma segura de agentes |
| M1 Product Foundation | En progreso | Expediente end-to-end |
| M2 Evidence Engine | Planificado | Fuentes oficiales verificables |
| M3 Ley 21.719 | Planificado | Privacy operations completas |
| M4 Informes y firma | Planificado | Entregables auditables |
| M5 Pilotos | Planificado | Validación real de mercado |
| M6 KUMPLIO v1.0 | Planificado | SaaS Chile comercializable |
| M7 Plataforma vertical | Planificado | Core modular + PWA |
| M8 Transporte | Planificado | Vertical operativa |
| M9 Agro | Planificado | Vertical de trazabilidad |
| M10 Minería | Planificado | Vertical enterprise validada |
| M11 KUMPLIO v2.0 | Objetivo final | Plataforma completa y repetible |

---

> **Regla final:** un hito no está terminado porque exista código. Está terminado cuando el flujo funciona en producción, tiene evidencia, métricas, seguridad validada y un usuario real puede obtener valor.
