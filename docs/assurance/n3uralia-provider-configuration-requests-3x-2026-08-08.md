# N3uralia — solicitudes tenant-specific de configuración de proveedor 3/3

Fecha: 8 de agosto de 2026

## Objetivo

Convertir el último bloqueo externo del Bloque 16 en solicitudes de evidencia trazables dentro de Kumplio, sin tratar documentación pública como prueba tenant-specific.

## Resultado productivo

Se prepararon tres solicitudes de evidencia reales, una por actividad:

1. **Gestión de contactos comerciales y solicitudes de demostración**
   - Proveedor: Supabase.
   - Request: `6595082e-6140-43cb-b69f-ca65e74f34f2`.
   - Evidencia requerida: configuración efectiva de backups/PITR del proyecto, ventana de recuperación/retención, identificación del proyecto y fecha/fuente de captura.

2. **Gestión de cuentas, autenticación y acceso al workspace**
   - Proveedor: Supabase.
   - Request: `21494958-a7db-4d86-b1fa-d55549913f9d`.
   - Evidencia requerida: configuración efectiva de backups/PITR del proyecto, ventana de recuperación/retención, identificación del proyecto y fecha/fuente de captura.

3. **Gestión de expedientes y análisis asistido por especialistas IA**
   - Proveedor: OpenAI.
   - Request: `b97fb811-55d5-416e-becc-b54d0d9753a0`.
   - Evidencia requerida: modo efectivo de Data Retention del tenant/proyecto (estándar, MAM o ZDR), alcance aplicable al proyecto/API, fecha y fuente administrable o contractual.

Las tres solicitudes vencen el **22 de agosto de 2026 a las 22:56 hora de Chile** y están asignadas al owner de las actividades.

## Criterio de aceptación

### Supabase

La evidencia sólo puede aceptarse como tenant-specific si identifica inequívocamente el proyecto usado por Kumplio y permite determinar:

- si existen backups diarios y/o PITR;
- la ventana efectiva de recuperación o retención;
- qué capacidad corresponde al plan/configuración actual;
- la fecha de la captura;
- una fuente administrable o contractual.

Una página pública genérica de Supabase no basta.

### OpenAI

La evidencia sólo puede aceptarse como tenant-specific si identifica la organización/proyecto utilizado por Kumplio y muestra el modo efectivo de retención aplicable al tráfico de API:

- estándar;
- Modified Abuse Monitoring (MAM); o
- Zero Data Retention (ZDR).

`store:false` sigue siendo un hecho local válido, pero no sustituye la acreditación de MAM/ZDR.

## Verificación

Consulta productiva:

- total requests: 3;
- requests activas: 3;
- Supabase: 2;
- OpenAI: 1;
- owner mismatch: 0;
- due date inválida: 0.

Verificador reproducible:

`scripts/68-verify-n3uralia-provider-configuration-requests-3x.sql`

## Guardrail

Estas solicitudes no cambian el estado de cumplimiento. Mientras la evidencia tenant-specific no sea entregada y revisada:

- `providerTenantConfigurationStatus = unverified`;
- `backupPurgeDemonstrated = false` cuando aplique;
- `externalProcessorPropagationDemonstrated = false` cuando aplique;
- `deletionEvidenceStatus` no puede promocionarse a `demonstrated`.

## Estado canónico

```text
mapeo del aviso                         3/3
mecanismo controlado validado           3/3
eliminación primaria operativa          3/3
assurance de proveedor revisado         3/3
solicitudes tenant-specific creadas     3/3
configuración tenant proveedor          0/3
eliminación operacional final           0/3
lifecycle                               changes_requested 3/3
```
