# Assurance — Aviso y eliminación de N3uralia 3/3

**Fecha de verificación:** 8 de agosto de 2026  
**Organización:** N3uralia  
**Bloque:** 16, tarea 3  
**Estado:** `VALIDATED INICIAL / TRABAJO ABIERTO`

## Resultado

Kumplio convirtió los gaps de aviso y eliminación de las tres actividades reales de N3uralia en trabajo operacional trazable.

La validación demuestra:

- un snapshot versionado del aviso público;
- una evidencia general `accepted · verified` con SHA-256;
- tres vínculos `supporting`, uno por actividad;
- tres misiones con owner, prioridad y vencimiento;
- tres solicitudes de mapeo del aviso;
- tres solicitudes de prueba de eliminación o anonimización;
- seis eventos de creación de solicitudes;
- tres eventos de creación de misión;
- tres eventos de expediente;
- idempotencia y aislamiento cross-tenant.

No demuestra todavía:

- que el aviso general cubra adecuadamente cada actividad;
- que las tres solicitudes de mapeo hayan sido aceptadas;
- que una eliminación o anonimización haya sido ejecutada;
- que exista evidencia aceptada de purga, respaldo o propagación a proveedores;
- cumplimiento integral de la Ley N.º 21.719.

## Migraciones productivas

| Versión | Migración |
|---|---|
| `20260808151723` | `processing_activity_privacy_remediation_v1` |
| `20260808152005` | `seed_n3uralia_privacy_remediation_v1` |

Los archivos del repositorio usan exactamente las versiones registradas en Supabase.

## Aviso público versionado

| Campo | Resultado |
|---|---|
| Versión | `2026-08-03` |
| Ruta | `/privacy` |
| Contacto | `info@kumplio.app` |
| Evidencia | `90aab873-d3fd-4177-a9cb-08b79e57054f` |
| SHA-256 | `5112b219a1279f44e394d22f0f851bb0f5844ea3f15c3d165ee27eb6ab2372a8` |
| Validación | `accepted` |
| Integridad | `verified` |
| Mapeo específico | `false` |
| Evidencia de eliminación | `false` |

La evidencia acredita la versión pública capturada. No acredita por sí sola una actividad específica ni una eliminación operacional.

## Trabajo creado por actividad

### 1. Gestión de contactos comerciales y solicitudes de demostración

- actividad: `26233189-3335-43e6-b382-99fcf2cc4090`;
- misión: `f5527187-21e0-491c-81cf-f009bfbb15ec`;
- estado de misión: `ready`;
- solicitud de mapeo: `4fde8ee3-5060-4510-97ee-d0f78cef4618`;
- solicitud de eliminación: `1bc319f6-a2df-4b47-9c27-048a51f96548`;
- mapeo del aviso: `needs_changes`;
- eliminación: `pending_evidence`.

### 2. Gestión de cuentas, autenticación y acceso al workspace

- actividad: `a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1`;
- misión: `ad5090f6-194c-4d99-ba30-420e1f9528b5`;
- estado de misión: `ready`;
- solicitud de mapeo: `e4ea239c-9e92-41cd-8cab-d85aba06d609`;
- solicitud de eliminación: `9bae2c78-cddd-4b62-8149-bf85c054a587`;
- mapeo del aviso: `needs_changes`;
- eliminación: `pending_evidence`.

### 3. Gestión de expedientes y análisis asistido por especialistas IA

- actividad: `f3cd212a-3e27-4f27-a722-545e4c44c8b1`;
- misión: `0dd77fd2-d705-41a1-ac3a-7012e40e64c9`;
- estado de misión: `ready`;
- solicitud de mapeo: `9fcb51ad-5005-497e-b11b-0e23887c971d`;
- solicitud de eliminación: `3105b82a-fbc1-4826-a896-41490ed46280`;
- mapeo del aviso: `needs_changes`;
- eliminación: `pending_evidence`.

## Vencimientos persistidos

| Trabajo | Fecha productiva |
|---|---|
| Mapeo o corrección del aviso | 22 de agosto de 2026 |
| Prueba de eliminación o anonimización | 7 de septiembre de 2026 |
| Cierre de misión | 12 de septiembre de 2026 |

Las fechas se conservan al reintentar el RPC, incluso si una segunda llamada propone fechas distintas.

## Criterio de evidencia de eliminación

Cada solicitud exige una prueba auditable con:

- timestamp;
- proveedor;
- activo o dataset;
- alcance;
- responsable persona o sistema;
- resultado;
- `backup_purga_programada`;
- `backup_purga_confirmada`.

Una solicitud `accepted` solo cuenta como eliminación demostrada cuando tiene `submitted_evidence_id`.

## Pruebas ejecutadas

### Release

- TypeScript: `success`;
- Canonical Roadmap Guardrail: `success`;
- Processing Inventory Guardrail: `success`;
- Processing Lifecycle Review Guardrail: `success`;
- Processing Privacy Remediation Guardrail: `success`;
- Application Validation: `success`;
- Release Qualification Foundation: `success`;
- Release Gate: `success`;
- build productivo: `success`;
- ambos previews Vercel: `success`.

### Base de datos

- prueba reversible antes del seed: `passed`;
- retry exacto: mismos IDs y `resumed=true`;
- retry con otra request key para la misma actividad: reutiliza el plan y conserva fechas;
- reutilización de una request key en otra actividad: rechazada;
- rollback preflight: 0 misiones, 0 solicitudes, 0 aviso y 0 eventos residuales;
- seed supervisado 3/3: `passed`;
- verificación productiva read-only: `passed`;
- identidad de otro tenant: rechazada;
- advisory locks: request key, actividad y versión compartida del aviso.

### Seguridad del RPC

- `SECURITY INVOKER`;
- `search_path=''`;
- `public`: sin `EXECUTE`;
- `anon`: sin `EXECUTE`;
- `authenticated`: sin `EXECUTE`;
- `service_role`: con `EXECUTE`;
- `postgres`: con `EXECUTE`.

## Conteo productivo al cierre

| Objeto | Resultado |
|---|---:|
| Actividades | 3 |
| Evidencias del aviso | 1 |
| Enlaces específicos al aviso | 3 |
| Misiones | 3 |
| Solicitudes de mapeo | 3 |
| Solicitudes de eliminación | 3 |
| Eventos de expediente | 3 |
| Mapeos aceptados con evidencia | 0 |
| Eliminaciones aceptadas con evidencia | 0 |

## Conclusión defendible

La tarea 3 está desplegada y validada en su alcance técnico-operacional: los gaps ya no son texto suelto, sino trabajo con owner, fechas, evidencia requerida y trazabilidad.

El resultado de cumplimiento continúa abierto. Las tres actividades permanecen con mapeo `needs_changes` y eliminación `pending_evidence` hasta que una persona entregue y apruebe evidencia suficiente.
