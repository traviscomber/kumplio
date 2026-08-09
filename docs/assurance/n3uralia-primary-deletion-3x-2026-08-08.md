# N3uralia — eliminación primaria operativa 3/3

Fecha de evidencia: 2026-08-08

## Resultado

Las tres actividades reales de tratamiento ejecutaron una prueba controlada de eliminación sobre su **data plane primario productivo**, utilizando exclusivamente registros sintéticos y sin tocar datos personales reales.

| Actividad | Target real | Resultado |
|---|---|---|
| Contactos comerciales y demos | `public.commercial_leads` | `demonstrated_controlled_primary` |
| Cuentas, autenticación y workspace | `auth.users`, `auth.identities`, `auth.sessions`, `public.profiles`, `public.organization_members` | `demonstrated_controlled_primary` |
| Expedientes y especialistas IA | `public.compliance_cases`, `public.agent_workflows`, `public.agent_runs` | `demonstrated_controlled_primary` |

## Contrato de la prueba

Cada ejercicio exige y conserva:

- registro o cadena 100% sintética creada dentro del almacén productivo real;
- observación del estado previo;
- hash SHA-256 previo;
- ejecución de eliminación real en el almacén primario;
- verificación posterior de ausencia;
- `primaryStoreRemainingMatches = 0`;
- evidencia `accepted · verified`;
- snapshot SHA-256;
- `productionSubjectDataTouched = false`;
- `backupPurgeDemonstrated = false`;
- `externalProcessorPropagationDemonstrated = false`.

## Evidencia por actividad

### 1. Contactos comerciales y solicitudes de demostración

- Evidence ID: `758ab468-6d66-4176-bc85-c99741914a92`
- Snapshot SHA-256: `953a0919b910cd0198081f41f17f4fd9b8875706786c0376c21a97687305a1be`
- Target: `public.commercial_leads`
- Verificación posterior: `remainingMatches = 0`

### 2. Cuentas, autenticación y acceso al workspace

- Evidence ID: `4cfa8548-e176-44cd-b313-25888738652b`
- Snapshot SHA-256: `7c5ed2caeebe7d53e4525183be3afacc02ed61c584dbbc87c944c253528d321d`
- Target: `auth.users + auth.identities + auth.sessions + public.profiles + public.organization_members`
- La creación del usuario sintético atravesó el trigger real que crea `public.profiles`.
- Se creó además identidad, sesión y membresía sintéticas.
- La eliminación dejó `0` filas remanentes en los cinco scopes verificados.

### 3. Expedientes y análisis asistido por especialistas IA

- Evidence ID: `ba78ed80-85e8-4f36-abea-aed3b1692a6f`
- Snapshot SHA-256: `fd74ab3c9e0b492628cb3fce409caffdf4a3e421ab8ed677318e0e58b572353f`
- Target: `public.compliance_cases + public.agent_workflows + public.agent_runs`
- Se creó un caso sintético, un workflow sintético y un run sintético.
- El `DELETE` del caso ejerció la cascada real del esquema.
- Verificación posterior: `remainingMatches = 0`.

## Qué demuestra

Este gate demuestra que Kumplio puede eliminar datos controlados dentro de los almacenes primarios reales utilizados por las tres actividades observadas, respetando sus relaciones y cascadas actuales.

## Qué NO demuestra

No demuestra:

- eliminación de datos personales de un titular real;
- purga física o expiración de copias de backup administradas por proveedores;
- propagación de eliminación a OpenAI u otros procesadores externos;
- suficiencia jurídica de los plazos de retención;
- cierre del lifecycle.

Por estas razones, `deletionEvidenceStatus` permanece `controlled_test_passed` y no se promueve todavía a `demonstrated`.

## Estado canónico después de este gate

```text
mapeo del aviso                         3/3
mecanismo controlado validado           3/3
eliminación primaria operativa          3/3
eliminación operacional final           0/3
lifecycle                               changes_requested 3/3
```

## Verificación repetible

Ejecutar en modo read-only:

`scripts/66-verify-n3uralia-primary-deletion-3x.sql`
