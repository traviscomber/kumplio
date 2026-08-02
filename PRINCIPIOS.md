# KUMPLIO — Principios de Producto, Conocimiento e IA

> Estos principios son obligatorios para producto, arquitectura, agentes, conectores, datos e interfaz.

## P-001 — Chile primero

Kumplio se diseña para organizaciones chilenas, su regulación, instituciones, lenguaje, documentos y operación. La expansión internacional no puede diluir la utilidad local.

## P-002 — Todo visible en español

Todo texto visible para clientes debe estar en español. Los nombres técnicos internos no se exponen cuando exista un término canónico definido.

## P-003 — Sin fuente no hay afirmación regulatoria

Una afirmación regulatoria debe conservar fuente, versión, sección, cita, fecha y procedencia.

## P-004 — Sin evidencia no hay conclusión de cumplimiento

La ausencia de hallazgos no demuestra cumplimiento. Toda conclusión debe indicar la evidencia evaluada y sus limitaciones.

## P-005 — La IA propone; las personas validan

Los agentes pueden extraer, relacionar, comparar, resumir y proponer. No publican por sí solos conocimiento validado ni decisiones jurídicas de alto impacto.

## P-006 — Separación física de conocimiento público y privado

El Grafo Nacional de Conocimiento es compartido. La Memoria Organizacional está aislada por organización. La unión ocurre únicamente mediante mapeos con RLS.

## P-007 — Memoria organizacional privada por defecto

Todo dato interno se considera privado, incluso cuando parezca genérico. No se usa para entrenar, enriquecer o responder a otra organización.

## P-008 — Versionado antes que sobrescritura

Fuentes, nodos, relaciones, afirmaciones, revisiones, evidencias y decisiones relevantes se versionan o registran como eventos. No se altera el pasado silenciosamente.

## P-009 — Procedencia completa

Todo conocimiento debe poder explicar:

- quién o qué lo creó;
- desde qué fuente;
- en qué fecha;
- con qué versión de parser, regla, prompt o modelo;
- qué revisión recibió;
- qué hash conserva.

## P-010 — Citas exactas antes que similitud semántica

Los embeddings ayudan a descubrir contenido. No sustituyen la cita exacta, el artículo, la sección ni la versión normativa.

## P-011 — Confianza explicable

El nivel de confianza no es una cifra opaca. Debe mostrar sus componentes: fuente, vigencia, extracción, corroboración, evidencia, aplicabilidad y revisión.

## P-012 — Ningún módulo crea conocimiento paralelo

Todo módulo nuevo debe integrarse al Modelo Canónico. Las tablas sectoriales pueden representar operación, pero su conocimiento se proyecta mediante nodos y relaciones canónicas.

## P-013 — Seguridad multiempresa en profundidad

El aislamiento se aplica en base de datos, servicios servidor, consultas, almacenamiento y herramientas de agentes. Un filtro de interfaz nunca es un control suficiente.

## P-014 — Privacidad y minimización

Solo se almacena el dato necesario para la finalidad declarada. Los datos personales sensibles requieren controles reforzados, acceso limitado y trazabilidad.

## P-015 — Fuentes oficiales primero

La prioridad de captura es:

1. API oficial;
2. datos abiertos o formato estructurado oficial;
3. RSS o feed oficial;
4. HTML oficial estable;
5. PDF con texto;
6. PDF escaneado;
7. OCR como último recurso.

## P-016 — Scrapers operables y auditables

Todo conector debe contar con registro, allowlist, timeout, límites, versión, fixtures, cola, idempotencia, reintentos, circuit breaker, dead letter y salud visible.

## P-017 — Diferenciar hechos, interpretación y recomendación

Una respuesta debe distinguir:

- texto de fuente;
- hecho extraído;
- interpretación;
- supuesto de aplicabilidad;
- recomendación operacional;
- decisión humana.

## P-018 — Progreso verificable, no certeza ficticia

Kumplio muestra cobertura, vigencia, suficiencia y revisión. No declara porcentajes absolutos de cumplimiento sin metodología, alcance y validación formal.

## P-019 — Fallar de manera segura

Ante una fuente caída, parser degradado, conflicto de versiones o confianza insuficiente, el sistema pausa, registra y solicita revisión. No completa datos inventados.

## P-020 — Diseño para oficina y terreno

El núcleo debe admitir operaciones en transporte, agro, minería y otras industrias, incluyendo capturas móviles, trabajo intermitente y evidencia de terreno.

## P-021 — La auditoría es parte del producto

Las decisiones, transiciones, aprobaciones y cambios deben ser visibles y exportables. La auditoría no es un log técnico opcional.

## P-022 — Compatibilidad progresiva

El modelo canónico se adopta gradualmente. No se destruyen entidades productivas estables para alcanzar pureza arquitectónica.

## P-023 — Calidad medible

Cada motor debe tener métricas: exactitud, cobertura, fallas, latencia, citas correctas, revisiones rechazadas, evidencia insuficiente y costo.

## P-024 — Trazabilidad de desarrollo

Todo cambio no trivial sigue:

`ROADMAP → objetivo → issue → rama → PR → build → migración → verificación → producción → métrica → evidencia de cierre`.

## P-025 — Reversibilidad

Las migraciones aditivas, activaciones por etapas y banderas de función son preferibles a cambios irreversibles. Los registros históricos no se eliminan como mecanismo de rollback.