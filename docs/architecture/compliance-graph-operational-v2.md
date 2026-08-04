# Compliance Graph V2 — Relaciones operativas

## Objetivo

Conectar el grafo regulatorio con la operación real de cada organización sin crear entidades ficticias.

## Sincronización

La función `public.sync_compliance_graph_operational_v2(p_organization_id uuid default null)` sincroniza:

- regla de aplicabilidad → obligación canónica (`implements`)
- regla → asignación organizacional (`applies_to`)
- obligación canónica → asignación (`instantiates`)
- asignación → responsable (`assigned_to`)
- control → asignación (`implements`)
- control → propietario (`owned_by`)
- asignación → evidencia (`evidenced_by`)
- control → evidencia (`evidenced_by`)

La función es idempotente y reutiliza `upsert_compliance_graph_node_v2` y `upsert_compliance_graph_edge_v2`. Solo crea nodos y aristas cuando existe un registro fuente real.

Los atributos de cada relación conservan estados como:

- aprobación del vínculo jurídico
- aplicabilidad
- cumplimiento
- prioridad
- suficiencia de evidencia
- eficacia del control
- versión del catálogo

## Traversal

La función `public.traverse_compliance_graph_v2(...)` permite recorridos recursivos:

- `outbound`
- `inbound`
- `both`

El recorrido limita la profundidad máxima a 12 niveles, evita ciclos mediante el arreglo `path` y respeta el aislamiento por organización.

## Estado inicial verificado

- 225 nodos
- 24 aristas activas
- 12 relaciones `derived_from`
- 12 relaciones `implements` entre reglas y catálogo

No existen aún asignaciones, controles o evidencias productivas suficientes para formar la cadena operacional completa. El sincronizador queda preparado para incorporarlas automáticamente cuando aparezcan.

## Seguridad

- `SECURITY INVOKER`
- `search_path` vacío
- ejecución exclusiva de `service_role`
- sin permisos para `PUBLIC`, `anon` o `authenticated`
