# Legal Workbench, catálogo e infraestructura de evidencia v1

## Objetivo

Conectar revisión jurídica, catálogo reutilizable, instanciación organizacional y evidencia sin activar automáticamente interpretaciones legales.

## Workbench jurídico

Tablas:

- `regulatory_review_cases`
- `regulatory_review_decisions`

Estados del caso: `new`, `pending`, `in_review`, `approved`, `rejected`, `superseded`.

Cada caso conserva el claim, la regla candidata, la cita, la sección, el hash, el payload propuesto y el historial de decisiones. La función `record_regulatory_review_decision_v1` es la única puerta de aprobación. La decisión `request_changes` incrementa la revisión y mantiene el caso abierto.

## Catálogo universal

Tablas:

- `obligation_catalog`
- `obligation_catalog_versions`
- `obligation_rule_links`

La cohorte inicial contiene once obligaciones `PRIV-001` a `PRIV-011`. Todas las versiones permanecen en `draft` y los doce enlaces con reglas de Ley 21.719 permanecen en `pending` hasta revisión humana.

## Motor de instanciación

Tabla:

- `organization_assignment_catalog_links`

La función `instantiate_approved_catalog_links_v1` solo materializa enlaces cuando la asignación es aplicable, el vínculo regla-catálogo está aprobado y la versión del catálogo está aprobada.

## Evidencia

Tabla:

- `organization_assignment_evidence`

Reutiliza `evidence`, `controls` y `control_evidence` existentes. Permite marcar evidencia como primaria, de soporte o contextual, y evaluar suficiencia como no evaluada, insuficiente, parcial, suficiente o vencida.

La función `assignment_evidence_summary_v1` entrega el resumen por asignación.

## Seguridad

- RLS habilitado en todas las tablas nuevas.
- Escritura y ejecución reservadas a `service_role`.
- Funciones `SECURITY INVOKER` con `search_path` vacío.
- Sin grants a `PUBLIC`, `anon` o `authenticated`.
- Ningún claim, regla, versión de catálogo o enlace queda aprobado automáticamente.

## Cohorte inicial verificada

- 12 casos jurídicos de Ley 21.719.
- 11 obligaciones de catálogo.
- 11 versiones en borrador.
- 12 vínculos regla-catálogo pendientes.
