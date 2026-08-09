# N3uralia — eliminación operativa en data plane primario 1/3

Fecha de ejecución productiva: 2026-08-08 / 2026-08-09 UTC.

## Actividad cerrada en este subgate

**Gestión de contactos comerciales y solicitudes de demostración** (`TRT-E6956B3825E1`).

Activo real: formulario comercial y tabla `public.commercial_leads`.
Proveedor primario: Supabase Postgres.

## Ejercicio ejecutado

Se creó un registro 100% sintético dentro de la tabla productiva real `public.commercial_leads`, utilizando una request key exclusiva y un correo `example.invalid`. El registro se observó antes de la eliminación, se generó un hash SHA-256 del estado previo y después se eliminó mediante `DELETE` sobre el mismo almacén primario.

La verificación posterior buscó el registro por:

- `id`;
- `request_key`;
- email sintético.

Resultado: `remainingMatches = 0`.

## Evidencia

- Evidence ID: `758ab468-6d66-4176-bc85-c99741914a92`
- Snapshot SHA-256: `953a0919b910cd0198081f41f17f4fd9b8875706786c0376c21a97687305a1be`
- Before hash: `042bbcfdb4052622e99cbd197587fdc1e0af7aec8857eeb156e5eaf9310ee58c`
- After hash: `5642abc096880a71544e80b41213461c1095679b106c29dba3ec6cd0d1b62d7d`
- Evidence validation: `accepted`
- Evidence integrity: `verified`
- `primaryStoreDeletionDemonstrated = true`
- `productionSubjectDataTouched = false`

## Claim permitido

Kumplio ha demostrado **1/3 eliminación operativa controlada en el data plane primario real**.

Esto es más fuerte que el drill sintético aislado porque el ejercicio usa la tabla productiva real asociada a la actividad y valida ausencia posterior en ese mismo almacén.

## Límites preservados

Este subgate NO acredita todavía:

- purga física de backups;
- expiración o eliminación en snapshots administrados por el proveedor;
- propagación de borrado a procesadores o subencargados externos;
- eliminación de datos de una persona real;
- cierre jurídico de retención o lifecycle.

Por lo tanto:

```text
mecanismo controlado validado             3/3
eliminación primaria operativa controlada 1/3
eliminación operacional final             0/3
lifecycle                                 changes_requested 3/3
```

El estado `deletionEvidenceStatus` permanece deliberadamente en `controlled_test_passed` y no se promueve a `demonstrated` hasta cerrar las capas restantes exigidas por el gate final.
