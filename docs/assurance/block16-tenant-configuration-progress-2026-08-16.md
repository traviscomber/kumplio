# Bloque 16 — avance tenant-specific — 16 de agosto de 2026

Estado: **EVIDENCIA PARCIAL / CAMBIOS REQUERIDOS**

Este documento registra evidencia observada en producción para las tres solicitudes tenant-specific del Bloque 16. No acredita configuración tenant completa, ZDR/MAM, PITR ni eliminación operacional final.

## Estado resumido

| Capa | Resultado observado | Estado defendible |
|---|---|---|
| Supabase — contactos | proyecto productivo identificado; organización conectada en plan Pro; política oficial de backups diarios aplicable; PITR no observable con el conector actual | `changes_requested` |
| Supabase — cuentas/Auth | mismo proyecto productivo y misma configuración observable; PITR no observable con el conector actual | `changes_requested` |
| OpenAI — expedientes/IA | `/v1/me` ejecutado con la `OPENAI_API_KEY` productiva y correlacionado con provider traces persistidos | `changes_requested` |
| Configuración tenant proveedor | ninguna de las tres capas tiene evidencia suficiente para `verified` | **0/3** |
| Eliminación operacional final | no se ha promovido ninguna prueba a cierre final | **0/3** |

## 1. Supabase — evidencia tenant-specific parcial

Proyecto conectado:

- ref: `qhhybqfuenxojboymrsd`;
- nombre: `kumplio`;
- región: `us-east-1`;
- estado observado: `ACTIVE_HEALTHY`;
- organización conectada: `DespegaTuCarrera`;
- plan observado mediante Management API: **Pro**.

La documentación oficial de Supabase establece backups diarios para proyectos Pro y una retención de siete días para esas copias diarias. PITR es una capacidad separada y el conector disponible no expone si está habilitada para este proyecto ni su ventana efectiva.

Por lo anterior, se creó una evidencia restringida compartida con scope:

`supabase_project_backup_configuration_partial_assurance`

Evidencia:

`a4c65403-5969-4fff-a439-0ed116d7a899`

Fue sometida a las solicitudes:

- contactos: `6595082e-6140-43cb-b69f-ca65e74f34f2`;
- cuentas/Auth: `21494958-a7db-4d86-b1fa-d55549913f9d`.

Ambas quedaron revisadas como `changes_requested`. La evidencia tiene integridad SHA-256 verificada, pero conserva explícitamente:

- inventario de backups no observado;
- PITR `unknown`;
- ventana efectiva total de recuperabilidad no demostrada;
- ninguna afirmación de purga de una copia concreta.

## 2. OpenAI — identidad productiva reconciliada

El worker privado ya desplegado fue invocado mediante su token existente desde Supabase `pg_net`, sin leer ni exponer la API key de OpenAI.

El modo `provider_identity` ejecutó `/v1/me` con la misma `OPENAI_API_KEY` productiva usada por los especialistas.

Resultado acotado:

- respuesta HTTP 200;
- identidad y organización OpenAI observables;
- `organizationHeader` exacto correlacionado con `agent_runs.provider_organization`;
- **19 ejecuciones productivas** con `provider_request_id` y el mismo provider identity;
- **5 especialistas distintos** dentro de esa correlación.

Además, la conexión OpenAI Platform disponible muestra la misma organización y un único proyecto visible en la cuenta conectada. Esto ayuda a orientar la revisión, pero no se presenta como prueba directa del project binding de la key.

Se creó evidencia restringida:

`1a36b153-554f-4c76-88c3-e0b815b338ab`

Scope:

`processing_provider_identity_assurance`

La solicitud OpenAI:

`b97fb811-55d5-416e-becc-b54d0d9753a0`

quedó `changes_requested` porque aún no existe evidencia administrativa/contractual suficiente de la configuración efectiva de Data Retention, Zero Data Retention o Modified Abuse Monitoring.

## 3. Lo que esta evidencia NO demuestra

No demuestra:

- que PITR esté habilitado o deshabilitado en Supabase;
- que una copia concreta de Supabase ya no pueda recuperar un registro eliminado;
- que OpenAI tenga ZDR o MAM habilitado;
- que `store:false` equivalga a ZDR;
- que `/v1/me` o `openai-organization` demuestren una política de retención;
- que la eliminación primaria 3/3 equivalga a purga de backups o de procesadores externos;
- cumplimiento jurídico global.

## 4. Probe OpenAI de almacenamiento observable

Esta rama incorpora un probe adicional, server-only y protegido por el mismo token del worker:

`provider_retention_probe`

Objetivo: observar únicamente el comportamiento de **application state** del Responses API con la key productiva.

Secuencia:

1. crear una Response con un input fijo sintético y `store:true`;
2. no devolver ni persistir el contenido generado;
3. recuperar la Response por ID;
4. registrar únicamente status, flags de storage y trazabilidad acotada;
5. eliminar inmediatamente la Response en un `finally`;
6. registrar si la limpieza fue exitosa.

Interpretación deliberadamente conservadora:

- si `store:true` produce un objeto recuperable, existe application state observable para esa request y el resultado contradice un comportamiento de ZDR que fuerce `store:false` en Responses;
- si no existe objeto recuperable o `store` vuelve `false`, el resultado es solamente consistente con non-storage y **no prueba ZDR**;
- este probe **no distingue** configuración estándar de Modified Abuse Monitoring;
- no se promueve `providerTenantConfigurationStatus` a `verified` por este probe por sí solo.

## 5. Gates que permanecen abiertos

```text
solicitudes tenant-specific con evidencia parcial   3/3 changes_requested
configuración tenant proveedor verified             0/3
eliminación operacional final demonstrated          0/3
lifecycle                                             changes_requested 3/3
Leaked Password Protection                            disabled
```

La siguiente acción válida es ejecutar el probe en un despliegue que use la configuración productiva aplicable, registrar el resultado como evidencia adicional y continuar buscando la configuración administrativa efectiva de PITR y Data Retention. Hasta entonces, los gates permanecen abiertos.
