# Compliance Graph V2

## Propósito

Materializar una capa de grafo auditable sobre el modelo relacional existente sin reemplazar las tablas canónicas. Las tablas de origen siguen siendo la fuente de verdad; el grafo permite traversal, propagación de impacto, copiloto explicable y timeline.

## Tablas

### `compliance_graph_nodes`

Representa organizaciones, documentos regulatorios, secciones, claims, reglas, obligaciones, asignaciones, controles, evidencias, procesos, activos, datasets, proveedores, roles, usuarios, riesgos, tareas, incidentes, auditorías y hallazgos.

Claves importantes:

- `source_table + source_id`: identidad estable con la entidad relacional.
- `canonical_key + version`: identidad semántica versionada.
- `organization_id`: aislamiento de nodos privados; `NULL` para conocimiento regulatorio compartido.
- `attributes`: metadatos específicos del tipo de nodo.
- `effective_from/effective_to`: vigencia temporal.

### `compliance_graph_edges`

Relaciones dirigidas y versionadas entre nodos. Tipos iniciales: `contains`, `derived_from`, `applies_to`, `implements`, `evidenced_by`, `owned_by`, `uses`, `processes`, `stores`, `mitigates`, `creates`, `assigned_to`, `affected_by`, `verified_by` y `related_to`.

Cada arista conserva fuente, confianza, atributos y ventana de vigencia.

### `compliance_graph_events`

Timeline append-only para creación y cambios reales de nodos/aristas. Un bootstrap repetido sin cambios no crea eventos nuevos.

## Funciones

- `upsert_compliance_graph_node_v2(...)`: upsert idempotente y evento solo cuando el estado cambia.
- `upsert_compliance_graph_edge_v2(...)`: evita aristas activas duplicadas.
- `bootstrap_compliance_graph_v2()`: sincroniza entidades relacionales existentes y crea relaciones base.

## Seguridad

- RLS habilitado.
- Sin permisos para `PUBLIC`, `anon` o `authenticated`.
- Acceso exclusivo de `service_role`.
- Funciones `SECURITY INVOKER` con `search_path` vacío.

## Bootstrap inicial verificado

- 225 nodos.
- 12 aristas activas.
- 186 claims regulatorios.
- 12 reglas de aplicabilidad.
- 11 obligaciones del catálogo.
- 16 documentos regulatorios.

La segunda ejecución mantuvo 225 nodos y 12 aristas y no añadió eventos, confirmando idempotencia.

## Próximas relaciones

1. Regla → obligación de catálogo (`implements`).
2. Obligación de catálogo → asignación empresarial (`creates`).
3. Asignación → control (`implemented_by`).
4. Control → evidencia (`evidenced_by`).
5. Asignación/control → responsable (`owned_by`).
6. Procesos, activos y datasets organizacionales.
7. Riesgo y propagación de impacto.
