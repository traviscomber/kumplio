# KUMPLIO — Master Product Roadmap

> **Documento canónico de producto, arquitectura y ejecución**  
> Estado: activo  
> Revisión: 2026-08-02 / ejecución posterior a PR #43  
> Horizonte principal: KUMPLIO v2.0  
> Responsable de producto: equipo KUMPLIO  
> Responsable técnico interno: Travis — Arquitecto IA full-stack  
> Repositorio: `traviscomber/kumplio`

---

## Seguimiento activo en GitHub

- **M0 / Agent Operating System:** issue #29.
- **M1 / Product Foundation:** issue #38.
- **M2 / Regulatory Evidence Engine:** crear epic al iniciar el diseño técnico.
- **M3 / Data & Privacy:** crear epic después de aprobar el modelo de fuentes y evidencia regulatoria.
- **M4 / Artefactos e informes:** crear epic cuando comience versionado y firma lógica.
- **M8 / Transporte, M9 / Agro y M10 / Minería:** crear cada epic al comenzar discovery con un piloto o design partner.

Todo issue debe incluir al menos un identificador de objetivo de este documento, por ejemplo `OBJ-PF-001`, `OBJ-RE-001` o `OBJ-DP-001`.

---

# 0. Propósito y reglas de uso

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

Los issues y pull requests ejecutan este roadmap. Ningún issue reemplaza este documento.

## 0.1 Estados oficiales

| Estado | Significado |
|---|---|
| `PLANNED` | Definido, todavía sin implementación activa. |
| `DISCOVERY` | Requerimientos, fuentes, usuarios y arquitectura en investigación. |
| `ACTIVE` | Desarrollo en curso mediante issue, rama y PR. |
| `DEPLOYED` | Código y migraciones en producción; falta validación completa del gate. |
| `VALIDATED` | Flujo probado con datos y usuario real, con evidencia registrada. |
| `DONE` | Gate del objetivo cerrado, métricas y documentación actualizadas. |
| `BLOCKED` | Existe una dependencia externa o decisión pendiente que impide avanzar. |

**Regla:** `DEPLOYED` no equivale a `DONE`.

## 0.2 Definición mínima de cierre

Un objetivo solo puede marcarse `DONE` cuando:

1. el requerimiento funcional está implementado;
2. autenticación y autorización fueron verificadas;
3. build y typecheck pasan;
4. las migraciones son reproducibles;
5. RLS y advisors fueron revisados cuando corresponde;
6. los previews están verdes;
7. producción fue confirmada después del merge;
8. el flujo fue probado con una cuenta real cuando depende de Auth;
9. existe evidencia de cierre;
10. la métrica asociada puede medirse.

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

KUMPLIO no será únicamente un checklist, repositorio documental, chatbot jurídico, generador de políticas o sistema de tareas.

KUMPLIO será:

> **Una plataforma agentic de cumplimiento, evidencia y operaciones diseñada para Chile.**

---

# 2. Principios intransables

## PRINCIPLE-001 — Sin fuente no hay afirmación regulatoria

Toda afirmación normativa debe conservar autoridad, URL canónica, documento, versión, artículo o sección, cita exacta, fechas relevantes, fecha de recuperación y hash.

## PRINCIPLE-002 — Sin evidencia no hay conclusión de cumplimiento

La ausencia de hallazgos no significa cumplimiento. Los estados mínimos son:

- suficiente;
- parcial;
- insuficiente;
- ausente;
- no evaluado;
- requiere revisión.

## PRINCIPLE-003 — Human-in-the-loop

Las decisiones jurídicas, regulatorias, financieras, de auditoría o de alto impacto requieren aprobación humana.

## PRINCIPLE-004 — Multiempresa segura

Toda entidad privada debe estar aislada por organización mediante RLS, autorización del servidor y filtros explícitos.

## PRINCIPLE-005 — Versionado e inmutabilidad

No se sobrescriben silenciosamente fuentes, documentos originales, evaluaciones, resultados de agentes, artefactos aprobados, revisiones, decisiones ni informes emitidos.

## PRINCIPLE-006 — Chile primero, expansión después

La primera ventaja competitiva se construirá con regulación, autoridades, lenguaje, procesos y reportes útiles para empresas chilenas.

## PRINCIPLE-007 — Core común, verticales modulares

Transporte, agro y minería comparten el mismo núcleo. No se construirán tres productos independientes.

## PRINCIPLE-008 — Progreso verificable, no certeza ficticia

Los indicadores muestran presencia, revisión, vigencia y suficiencia de elementos. No se mostrará “100% de cumplimiento” sin una metodología, alcance y revisión formalmente definidos.

---

# 3. Arquitectura de producto

## PRODUCT-CORE — KUMPLIO Core

Capacidades comunes:

- organizaciones, usuarios, roles y permisos;
- proyectos o ámbitos;
- casos de cumplimiento;
- documentos y fuentes;
- obligaciones;
- controles;
- evidencia;
- evaluaciones de controles;
- solicitudes de evidencia;
- hallazgos;
- riesgos;
- acciones;
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

Flotas, vehículos, conductores, cargas, rutas, viajes, documentos operacionales, vencimientos, previaje, incidentes, contratistas y aplicación de terreno.

### KUMPLIO Agro

Predios, cuarteles, cultivos, temporadas, lotes, insumos, aplicaciones, trazabilidad, proveedores, inspecciones, inocuidad, exportación y terreno.

### KUMPLIO Minería

Faenas, instalaciones, contratistas, permisos, controles críticos, fiscalizaciones, RCA, compromisos, incidentes, cierre y operación offline.

---

# 4. Arquitectura agentic

## AGENT-001 — Agentes especializados

- **Isidora:** obligaciones y evidencia documental.
- **Rodrigo:** riesgo regulatorio.
- **Verónica:** controles y evidencia.
- **Javier:** planes de cumplimiento.
- **Beatriz:** cambio regulatorio.
- **Andrés:** desempeño del sistema.
- **Catalina:** revisión jurídica y de calidad.

Travis es el subagente interno de ingeniería y no forma parte del catálogo visible para clientes.

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

## AGENT-003 — Contrato de trazabilidad

Cada resultado debe conservar agente, modelo, versión de prompt, esquema, entradas, contexto recuperado, herramientas, fuentes, tokens, costo, tiempo, artefacto, revisión y decisión final.

## AGENT-004 — Validación en siete capas

1. origen;
2. integridad;
3. extracción;
4. diff determinístico;
5. análisis agentic;
6. verificación independiente;
7. revisión humana.

---

# 5. Estado real al 2026-08-02

## 5.1 Capacidades desplegadas

- [x] Next.js y Vercel operativos.
- [x] Supabase conectado y saludable.
- [x] Agent Control Plane con RLS, cuotas y concurrencia.
- [x] Siete agentes especializados y salidas estructuradas.
- [x] Ejecuciones, artefactos, herramientas y workflows persistentes.
- [x] Revisión humana y approval gates.
- [x] Centro de Casos y ficha de expediente.
- [x] Gestión auditable de estado, prioridad, responsable y fecha objetivo.
- [x] Timeline inmutable de cambios del caso.
- [x] Onboarding transaccional para organización, membresía, proyecto y caso.
- [x] Vínculos auditables entre casos y recursos del mismo ámbito.
- [x] Controles persistentes con objetivo, naturaleza, ejecución, responsable y frecuencia.
- [x] Evidencias persistentes con origen, vigencia, integridad y confidencialidad.
- [x] Relaciones control–obligación y control–evidencia.
- [x] Evaluaciones inmutables de diseño y operación.
- [x] Solicitudes de evidencia persistentes.
- [x] Controles y evidencias vinculables al expediente.
- [x] Progreso verificable sin claims absolutos.
- [x] Skill interna Travis.

## 5.2 Evidencia principal

- PR #33 — Agent Control Plane, orquestación y herramientas.
- PR #36 — reparación y verificación RLS.
- PR #37 — Centro de Casos.
- PR #39 — skill Travis.
- PR #40 — gestión auditable y timeline.
- PR #41 — onboarding seguro y atómico.
- PR #42 — recursos integrados del expediente.
- PR #43 — Controls & Evidence Foundation.
- Issue #29 — Agent Operating System.
- Issue #38 — Product Foundation.

## 5.3 Estado pendiente de validación real

- [ ] Confirmar redirect URL productiva de Supabase Auth.
- [ ] Confirmar verificación de correo habilitada.
- [ ] Completar onboarding con una cuenta real.
- [ ] Crear el primer workspace, caso, control y evidencia reales.
- [ ] Probar vinculación y aislamiento multiempresa end-to-end.
- [ ] Confirmar en runtime la clave secreta de servidor usada por las transacciones privadas.
- [ ] Validar experiencia responsive con usuario real.

## 5.4 Deuda crítica conocida

- [ ] Consolidar historial y baseline reproducible de migraciones antiguas.
- [ ] Resolver políticas SELECT duplicadas en `organization_members`.
- [ ] Evaluar traslado de `initialize_workspace` fuera del esquema expuesto.
- [ ] Activar protección contra contraseñas filtradas.
- [ ] Completar filtros de casos.
- [ ] Completar interfaz de evaluaciones y solicitudes de evidencia.
- [ ] Versionar y firmar artefactos aprobados.
- [ ] Construir Regulatory Evidence Engine.
- [ ] Construir módulos completos de Ley 21.719.
- [ ] Validar pilotos y métricas comerciales.

---

# 6. Ruta crítica actual

```text
CP-01 Configuración Auth productiva
→ CP-02 Primer workspace real y prueba E2E
→ CP-03 Control Assurance & Evidence Requests
→ CP-04 Workflows agentic desde el caso
→ CP-05 Gate M1
→ CP-06 Regulatory Evidence Engine
→ CP-07 Operación Ley 21.719
→ CP-08 Pilotos
→ CP-09 KUMPLIO v1.0
```

## CP-01 — Configuración Auth productiva

**Estado:** `BLOCKED` por comprobación manual en Supabase Dashboard.

Cierre:

- redirect URL autorizada;
- confirmación de correo habilitada;
- plantilla y callback probados;
- acceso y logout correctos.

## CP-02 — Primer workspace real

**Estado:** `ACTIVE` cuando CP-01 quede resuelto.

Flujo obligatorio:

```text
registro
→ confirmación
→ onboarding
→ organización
→ proyecto
→ caso
→ documento
→ obligación
→ control
→ evidencia
→ vínculo al caso
→ ejecución IA
→ revisión humana
```

No se cierra con datos fabricados directamente en producción.

---

# 7. Roadmap maestro

## M0 — Foundation técnica y Agent Operating System

**Estado:** `DEPLOYED` con consolidación pendiente.  
**Programa:** `AOS`

### Objetivo

Establecer infraestructura segura de agentes, Supabase, Vercel y revisión humana.

### Entregables desplegados

Control plane, esquemas estructurados, workflows, herramientas auditadas, aprobación humana, RLS, cuotas y skill Travis.

### Pendiente para `DONE`

- baseline reproducible del esquema completo;
- prueba integrada con datos reales;
- cierre de deuda de migraciones históricas.

---

## M1 — Product Foundation y expediente integrado

**Estado:** `DEPLOYED / ACTIVE`.  
**Ventana objetivo:** agosto–septiembre de 2026.  
**Programa:** `PF`  
**Epic:** issue #38.

### OBJ-PF-001 — Caso como unidad central

**Estado:** `DEPLOYED`.

Implementado:

- creación y ficha del caso;
- edición operativa;
- responsable y fecha;
- timeline;
- documentos, obligaciones, controles, evidencias, hallazgos, riesgos y acciones vinculables;
- artefactos y revisiones considerados;
- progreso verificable.

Pendiente:

- filtros y búsqueda;
- prueba completa con datos reales;
- refinamiento responsive.

### OBJ-PF-002 — Onboarding real

**Estado:** `DEPLOYED`, validación Auth pendiente.

Implementado:

- perfil;
- organización;
- membresía owner;
- industria y tamaño;
- primer ámbito;
- primer caso;
- transacción atómica e idempotente;
- callback SSR y proxy de sesión.

Pendiente:

- configuración Auth;
- primer uso real;
- datos demo opcionales;
- medición de tiempo a primer valor.

### OBJ-PF-003 — Controls & Evidence Foundation

**Estado:** `DEPLOYED`.

Implementado:

- controles;
- evidencia;
- control–obligación;
- control–evidencia;
- evaluaciones inmutables;
- solicitudes de evidencia;
- workspaces `/controls` y `/evidence`;
- transacciones privadas de creación;
- integración con expedientes.

### OBJ-PF-004 — Control Assurance & Evidence Requests

**Estado:** `PLANNED`, siguiente incremento.

Entregables:

1. evaluar diseño y operación desde un control;
2. registrar período, muestra, conclusión y revisor;
3. calificar suficiencia de evidencia;
4. crear solicitudes desde control o expediente;
5. entregar evidencia;
6. aceptar, rechazar o pedir cambios;
7. detectar vencimientos;
8. reflejar resultados en el expediente;
9. mantener historial inmutable.

Criterio de aceptación:

Un usuario puede demostrar por qué un control fue evaluado como efectivo, parcial o inefectivo y qué evidencia sostuvo la conclusión.

### OBJ-PF-005 — Workflows agentic desde el caso

**Estado:** `PLANNED`.

Entregables:

- evaluación integral;
- revisión contractual;
- evaluación de controles;
- dependencias y etapas;
- reintentos con instrucciones adicionales;
- aprobación humana;
- fuentes y artefactos visibles en el expediente.

### Gate M1

- [ ] Auth productivo validado.
- [ ] Onboarding real completado.
- [ ] Caso real con recursos vinculados.
- [ ] Control evaluado con evidencia real.
- [ ] Solicitud de evidencia cerrada.
- [ ] Workflow agentic ejecutado desde el caso.
- [ ] Revisión humana registrada.
- [ ] Flujo completo sin entrar a Supabase.
- [ ] Responsive básico validado.
- [ ] Sin bloqueos P0/P1 conocidos.
- [x] Issue #38 actualizado.

---

## M2 — Regulatory Evidence Engine MVP

**Estado:** `PLANNED`; discovery puede comenzar en paralelo después de CP-02.  
**Ventana objetivo:** agosto–octubre de 2026.  
**Programa:** `RE`

### OBJ-RE-001 — Registro y captura de fuentes

Entidades previstas:

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

Conectores iniciales:

1. BCN / LeyChile;
2. Diario Oficial;
3. fuentes oficiales Ley 21.719;
4. MTT;
5. SAG;
6. Sernageomin.

### OBJ-RE-002 — Captura inmutable

Cada captura debe conservar contenido original, URL, fecha, headers relevantes, MIME, tamaño, SHA-256, versión del conector y validación.

### OBJ-RE-003 — Diff y grafo normativo

- comparación por artículo y sección;
- relaciones de modificación, reemplazo, derogación, reglamentación e interpretación;
- vigencia explícita;
- estados oficial, pendiente, borrador y no verificado.

### OBJ-RE-004 — Validación agentic

- Beatriz analiza cambios;
- Isidora extrae obligaciones;
- Catalina verifica;
- humano aprueba;
- Javier propone acciones después de la aprobación.

### Gate M2

KUMPLIO puede capturar una fuente oficial, demostrar integridad, detectar un cambio, extraer obligaciones, mostrar citas exactas, rechazar afirmaciones sin respaldo, registrar revisión humana y vincular el cambio con un caso.

---

## M3 — KUMPLIO Data & Privacy / Ley 21.719

**Estado:** `PLANNED`.  
**Ventana objetivo:** septiembre–noviembre de 2026.  
**Programa:** `DP`

### OBJ-DP-001 — Mapa de tratamientos

Actividades, titulares, categorías, finalidades, base jurídica, sistemas, responsables, encargados, destinatarios, conservación, transferencias y medidas.

### OBJ-DP-002 — Portal de derechos

Acceso, rectificación, supresión, oposición, portabilidad y bloqueo, con identidad, plazos, búsquedas, respuesta, evidencia y aprobación.

### OBJ-DP-003 — EIPD asistida

Screening, descripción, necesidad, proporcionalidad, amenazas, medidas, riesgo residual, revisión, aprobación y reevaluación.

### OBJ-DP-004 — Incidentes

Registro, cronología, datos comprometidos, titulares, impacto, medidas, evaluación de notificación, comunicaciones, cierre y aprendizaje.

### OBJ-DP-005 — Proveedores, transferencias y privacy by design

Encargados, subencargados, contratos, transferencias, privacy gates, decisiones automatizadas y modelo de prevención.

### Gate M3

Antes del 1 de diciembre de 2026, un piloto puede gestionar un ciclo completo de preparación Ley 21.719 con evidencia y revisión humana.

---

## M4 — Artefactos, firma e informes auditables

**Estado:** `PLANNED`.  
**Programa:** `AR`

### OBJ-AR-001 — Versionado

Versiones de artefactos, comparación, solicitud de cambios, historial y prohibición de sobrescribir aprobados.

### OBJ-AR-002 — Firma lógica

Cada decisión aprobada conserva hash, autor, fecha, rol, comentario, fuentes, artefacto, versión y estado.

### OBJ-AR-003 — Informes

PDF ejecutivo, PDF técnico, matrices Excel, paquete auditable ZIP y enlace privado con vencimiento.

### Gate M4

Un caso puede entregarse a gerencia, auditoría o asesoría jurídica sin copiar información manualmente.

---

## M5 — Beta Ley 21.719 y pilotos

**Estado:** `PLANNED`.  
**Programa:** `PILOT`

### OBJ-PILOT-001 — Pilotos

Seleccionar 3–5 organizaciones con diversidad de tamaño e industria.

### OBJ-PILOT-002 — Corpus de validación

Crear al menos 50–100 afirmaciones verificadas manualmente con artículos, citas, condiciones, fechas e inferencias prohibidas.

### OBJ-PILOT-003 — Métricas

Precisión de citas, falsos positivos, afirmaciones rechazadas, tiempo, costo, tasa de aprobación, ahorro frente a proceso manual y satisfacción.

### Gate M5

- [ ] cero alertas externas sin revisión humana;
- [ ] 100% de afirmaciones normativas con cita;
- [ ] 100% de artefactos finales con trazabilidad;
- [ ] resultados de pilotos documentados;
- [ ] claims comerciales respaldados.

---

## M6 — KUMPLIO v1.0 Chile

**Estado:** `PLANNED`.  
**Ventana objetivo:** diciembre de 2026–enero de 2027.

Alcance:

- Product Foundation completa;
- Regulatory Evidence Engine básico;
- operación Ley 21.719;
- agentes verificables;
- informes;
- seguimiento;
- seguridad y auditoría;
- sitio comercial;
- onboarding y pricing;
- soporte de pilotos y primeros clientes.

Gate:

Disponibilidad estable, backups, monitoreo, política de incidentes, privacidad, términos, contratación, soporte y ausencia de bloqueos P0.

---

## M7 — Plataforma vertical y PWA de terreno

**Estado:** `PLANNED`.  
**Programa:** `VP`

### OBJ-VP-001 — Arquitectura modular

Feature flags, catálogo de módulos, entidades comunes, extensiones sectoriales, permisos por sitio/faena/predio/flota y configuración por organización.

### OBJ-VP-002 — PWA

Instalable, responsive, cámara, firma, QR, geolocalización opcional, offline, sincronización segura y resolución de conflictos.

Gate: una vertical puede activarse sin duplicar el producto ni comprometer el Core.

---

## M8 — KUMPLIO Transporte

**Estado:** `PLANNED`.  
**Programa:** `TR`

### OBJ-TR-001 — Modelo operacional

Flotas, vehículos, conductores, cargas, rutas, viajes, documentos, clientes, subcontratistas, incidentes y mantenimiento.

### OBJ-TR-002 — Previaje inteligente

```text
Conductor + vehículo + carga + ruta
→ documentos requeridos
→ vigencia
→ observaciones
→ aprobación o bloqueo
→ evidencia de salida
```

### OBJ-TR-003 — Aplicación del conductor

Checklist, fotos, firma, evidencia, incidentes, entrega y cierre.

Gate: un piloto ejecuta viajes, valida documentación y demuestra reducción de errores u observaciones.

---

## M9 — KUMPLIO Agro

**Estado:** `PLANNED`.  
**Programa:** `AGRO`

Modelo operacional de predios, cuarteles, cultivos, temporadas, lotes, insumos, aplicaciones, bodegas, proveedores, inspecciones, certificaciones y exportaciones.

Flujo de trazabilidad:

```text
Insumo → predio → cuartel → cosecha → lote
→ procesamiento → almacenamiento → transporte → cliente
```

Gate: un piloto reconstruye la trazabilidad de un lote, demuestra registros y prepara una inspección.

---

## M10 — KUMPLIO Minería

**Estado:** `PLANNED`, condicionado a design partner.  
**Programa:** `MIN`

No se construye la vertical completa sin una empresa minera o contratista que participe en diseño y validación.

Modelo operacional: faenas, instalaciones, contratistas, permisos, RCA, controles críticos, fiscalizaciones, hallazgos, incidentes, compromisos y cierre.

Gate: el design partner opera al menos un proceso crítico con evidencia, responsables y trazabilidad end-to-end.

---

## M11 — KUMPLIO v2.0

**Estado:** objetivo final del roadmap principal.  
**Horizonte:** 2028.

KUMPLIO v2.0 requiere:

- Core SaaS estable;
- Ley 21.719 operativa;
- Regulatory Evidence Engine maduro;
- workflows agentic verificables;
- artefactos firmados;
- PWA de terreno;
- Transporte en producción;
- Agro en producción;
- Minería validada con design partner;
- métricas reales de precisión y valor;
- operación comercial repetible;
- seguridad, backups y continuidad verificadas;
- documentación y soporte.

Este hito representa el cierre del proyecto de construcción inicial, no el fin de la evolución del producto.

---

# 8. Plan de ejecución inmediato

La duración exacta se ajusta por evidencia y bloqueos. Cada sprint debe terminar en un incremento fusionable y verificable.

## Sprint 1 — Production Validation

Objetivos:

- cerrar CP-01;
- completar el primer onboarding real;
- verificar secreto de servidor en runtime;
- probar creación de caso, control y evidencia;
- registrar errores y correcciones;
- cerrar deuda P0 de Auth.

Salida: `OBJ-PF-002` pasa de `DEPLOYED` a `VALIDATED`.

## Sprint 2 — Control Assurance

Objetivos:

- interfaz de evaluación de diseño;
- interfaz de evaluación operacional;
- período, muestra, conclusión y revisor;
- historial inmutable;
- reflejo en control y expediente.

Salida: un control real puede demostrar su conclusión.

## Sprint 3 — Evidence Requests

Objetivos:

- crear solicitud;
- asignar responsable y vencimiento;
- entregar evidencia;
- revisar suficiencia;
- aceptar, rechazar o pedir cambios;
- mostrar atrasos.

Salida: solicitud cerrada de extremo a extremo.

## Sprint 4 — Case Agentic Workflows

Objetivos:

- iniciar workflow desde el caso;
- contexto automático del expediente;
- etapas y dependencias;
- reintentos;
- revisión humana;
- artefactos visibles.

Salida: primer workflow agentic completo desde caso.

## Sprint 5 — Artefact Versioning Foundation

Objetivos:

- versionado;
- comparación;
- hash;
- estados de aprobación;
- firma lógica inicial;
- impedir sobrescritura de aprobados.

Salida: base de M4 preparada.

## Sprint 6 — Regulatory Evidence Engine Foundation

Objetivos:

- epic M2;
- modelo de fuentes;
- captura inmutable;
- health checks;
- registro de conectores;
- primer corpus Ley 21.719.

Salida: M2 pasa de `PLANNED` a `ACTIVE`.

---

# 9. Dependencias entre hitos

| Hito | Depende de | Puede avanzar en paralelo con |
|---|---|---|
| M1 | Auth y primer workspace real | Discovery M2, corpus Ley 21.719 |
| M2 | modelo de evidencia y revisión humana | cierre M1, diseño M3 |
| M3 | fuentes/citas de M2 y casos de M1 | M4 e informes |
| M4 | artefactos y revisión humana | M2/M3 |
| M5 | M1–M4 utilizables | sitio comercial y pricing |
| M6 | gates M1–M5 | discovery vertical |
| M7 | Core estable de M6 | diseño Transporte |
| M8 | M7 y piloto transporte | discovery Agro |
| M9 | M7 y piloto agro | Minería discovery |
| M10 | M7 y design partner | evolución M8/M9 |
| M11 | M6–M10 y operación repetible | mejoras continuas |

---

# 10. Matriz de trazabilidad

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

- ID de objetivo;
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

- objetivo e issue;
- qué cambia y por qué;
- impacto;
- seguridad;
- migraciones;
- validación;
- riesgos;
- reversión;
- estado de Vercel y Supabase;
- evidencia de producción.

## Evidencia de cierre admisible

- commit fusionado;
- previews verdes;
- prueba autenticada;
- log o captura sanitizada;
- verificación SQL;
- advisors;
- métrica de producto;
- validación de piloto;
- aprobación humana registrada.

---

# 11. Indicadores

## Producto

- tiempo a primer valor;
- casos creados y cerrados;
- tiempo de ciclo;
- controles evaluados;
- evidencia suficiente, parcial, insuficiente o vencida;
- solicitudes abiertas y atrasadas;
- acciones vencidas;
- adopción por módulo;
- retención por organización.

## IA y confianza

- afirmaciones con cita exacta;
- precisión de artículo y versión;
- divergencias entre agentes;
- afirmaciones rechazadas por Catalina;
- tasa de aprobación humana;
- falsos positivos;
- costo y tiempo por workflow;
- fallas de herramientas;
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
- conversión a cliente;
- ingreso recurrente;
- costo de implementación;
- tiempo de onboarding;
- expansión por módulos y verticales.

## Operación

- uptime;
- errores P0/P1;
- tiempo de recuperación;
- despliegues fallidos;
- migraciones revertidas;
- incidentes de seguridad;
- cobertura de backups.

---

# 12. Riesgos estratégicos

## RISK-001 — Scraping frágil

Mitigación: API/feed primero, captura original, hashes, alertas de parser, pruebas y revisión humana.

## RISK-002 — Falsa certeza jurídica

Mitigación: estados de evidencia, citas obligatorias, Catalina, revisión humana y lenguaje no absoluto.

## RISK-003 — Fragmentación por verticales

Mitigación: Core común, feature flags y extensiones sectoriales.

## RISK-004 — Sobredesarrollo antes de pilotos

Mitigación: gates, design partners y MVPs medibles.

## RISK-005 — Seguridad multiempresa

Mitigación: RLS, filtros servidor, validación en Postgres, pruebas cruzadas y advisors.

## RISK-006 — Dependencia excesiva de IA

Mitigación: reglas determinísticas, esquemas, evaluaciones, fallback y revisión humana.

## RISK-007 — Fuentes incompletas o pendientes

Mitigación: estados de autoridad, vigencia y verificación.

## RISK-008 — Baja adopción en terreno

Mitigación: PWA offline, UX simple, formularios cortos, QR, cámara y pilotos.

## RISK-009 — Producto desplegado sin validación real

Mitigación: no cerrar gates sin cuenta real, flujo E2E y evidencia de producción.

## RISK-010 — Baseline de migraciones incompleto

Mitigación: inventario del esquema, baseline limpio, verificadores y prueba de instalación desde cero.

---

# 13. Gobernanza

## Revisión semanal

- avance por objetivo;
- ruta crítica;
- bloqueos;
- PRs;
- métricas;
- riesgos;
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

Este archivo debe actualizarse cuando cambia un hito, se cierra un gate, aparece un riesgo material, cambia una prioridad, nace o se cancela una vertical o se alcanza una versión relevante.

Cada cambio al roadmap se realiza mediante PR.

---

# 14. Referencias internas

- `AGENTS.md`
- `.agents/skills/travis-kumplio-architect/SKILL.md`
- `scripts/06-agent-control-plane.sql`
- `scripts/07-agent-control-plane-rls.sql`
- `scripts/08-agent-orchestration.sql`
- `scripts/09-agent-tools.sql`
- `scripts/10-verify-agent-platform.sql`
- `scripts/11-compliance-case-management.sql`
- `scripts/12-verify-case-management.sql`
- `scripts/13-workspace-onboarding.sql`
- `scripts/14-verify-workspace-onboarding.sql`
- `scripts/15-compliance-case-resources.sql`
- `scripts/16-verify-compliance-case-resources.sql`
- `scripts/17-controls-evidence-foundation.sql`
- `scripts/18-controls-evidence-hardening.sql`
- `scripts/19-verify-controls-evidence.sql`
- `scripts/20-controls-evidence-service-functions.sql`
- `scripts/21-verify-controls-evidence-services.sql`
- GitHub issues #29 y #38.
- GitHub PRs #33, #36, #37, #39, #40, #41, #42 y #43.

---

# 15. Estado resumido

| Hito | Estado | Resultado esperado |
|---|---|---|
| M0 Foundation técnica | `DEPLOYED` | Plataforma segura de agentes; baseline pendiente |
| M1 Product Foundation | `DEPLOYED / ACTIVE` | Expediente end-to-end validado con usuario real |
| M2 Evidence Engine | `PLANNED` | Fuentes oficiales verificables |
| M3 Ley 21.719 | `PLANNED` | Privacy operations completas |
| M4 Informes y firma | `PLANNED` | Entregables auditables |
| M5 Pilotos | `PLANNED` | Validación real de mercado |
| M6 KUMPLIO v1.0 | `PLANNED` | SaaS Chile comercializable |
| M7 Plataforma vertical | `PLANNED` | Core modular + PWA |
| M8 Transporte | `PLANNED` | Vertical operativa |
| M9 Agro | `PLANNED` | Vertical de trazabilidad |
| M10 Minería | `PLANNED` | Vertical enterprise validada |
| M11 KUMPLIO v2.0 | Objetivo final | Plataforma completa y operación repetible |

---

> **Regla final:** un hito no está terminado porque exista código. Está terminado cuando el flujo funciona en producción, tiene evidencia, métricas, seguridad validada y un usuario real puede obtener valor.