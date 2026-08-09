# N3uralia — mecanismo de eliminación controlado 3/3

Fecha de evidencia: 2026-08-08

## Resultado

Las tres actividades reales de tratamiento de N3uralia tienen un drill controlado de anonimización ejecutado sobre infraestructura productiva de base primaria y revisado humanamente.

| Actividad | Drill | Evidencia | Mecanismo | Solicitud final | Eliminación operacional |
|---|---|---|---|---|---|
| Gestión de contactos comerciales y solicitudes de demostración | `361d5acd-30f9-4ca4-a4d4-cacf8226ce50` | `65f998c7-ce0c-441b-b40d-72f43933c89e` | `validated_controlled` | `changes_requested` | **no demostrada** |
| Gestión de cuentas, autenticación y acceso al workspace | `1cde275c-ee48-4f58-9586-3fc405a525b3` | `21183226-3d4c-4487-8a82-b5e4902c56c9` | `validated_controlled` | `changes_requested` | **no demostrada** |
| Gestión de expedientes y análisis asistido por especialistas IA | `19fa6fc9-1e6a-4141-af05-5132c1564b48` | `694fb9fc-1014-4a38-a7e7-29618293cb0b` | `validated_controlled` | `changes_requested` | **no demostrada** |

## Qué demuestra

- se crea un probe sintético aislado por actividad;
- el mecanismo de anonimización modifica realmente el registro en Postgres;
- los identificadores sintéticos originales dejan de estar presentes;
- se conservan hashes SHA-256 before/after distintos;
- la evidencia queda con integridad `verified` y validación humana `accepted`;
- la suficiencia del control permanece `partial`;
- las tres solicitudes de eliminación vuelven a `changes_requested`, no a `accepted`.

## Qué NO demuestra

Este subgate no debe presentarse como eliminación real de datos personales de titulares.

No demuestra:

1. eliminación o anonimización de un titular productivo real;
2. purga de backups administrados por proveedor;
3. propagación de eliminación a proveedores, subencargados o procesadores externos;
4. resolución de retención o base jurídica;
5. cierre del lifecycle, que permanece `changes_requested`.

## Estado canónico después de la revisión

```text
mapeo del aviso                         3/3
mecanismo de anonimización controlado   3/3
eliminación operacional demostrada      0/3
lifecycle                               changes_requested 3/3
```

## Controles técnicos

La revisión productiva usa `review_processing_controlled_deletion_drill_v1` con:

- actor `owner/admin/compliance`;
- scope estricto por organización y actividad;
- drill `passed_controlled_test`;
- evidencia con integridad SHA-256 verificada;
- `syntheticIdentifiersRemoved=true`;
- `productionSubjectDataTouched=false`;
- `externalProcessorPropagation=not_tested`;
- limitación explícita no vacía;
- evidencia aceptada pero suficiencia `partial`;
- solicitud final en `changes_requested`.

Verificador read-only: `scripts/65-verify-n3uralia-controlled-deletion-mechanism-3x.sql`.
