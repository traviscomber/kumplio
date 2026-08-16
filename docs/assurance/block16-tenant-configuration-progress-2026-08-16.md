# Bloque 16 — avance tenant-specific — 16 de agosto de 2026

Estado: **EVIDENCIA PARCIAL / CAMBIOS REQUERIDOS**

Este documento registra evidencia observada en producción para las tres solicitudes tenant-specific del Bloque 16. No acredita configuración tenant completa, Modified Abuse Monitoring, PITR ni eliminación operacional final.

## Estado resumido

| Capa | Resultado observado | Estado defendible |
|---|---|---|
| Supabase — contactos | proyecto productivo identificado; organización conectada en plan Pro; política oficial de backups diarios aplicable; PITR no observable con el conector actual | `changes_requested` |
| Supabase — cuentas/Auth | mismo proyecto productivo y misma configuración observable; PITR no observable con el conector actual | `changes_requested` |
| OpenAI — expedientes/IA | `/v1/me` reconciliado + probe productivo `store:true` creado, recuperado y eliminado 200/200/200 | `changes_requested` |
| Zero Data Retention OpenAI | contradicho para la request productiva observada | **descartado para esta request** |
| Estándar vs Modified Abuse Monitoring | no distinguible por el probe actual | **pendiente** |
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

Evidencia restringida compartida:

- scope: `supabase_project_backup_configuration_partial_assurance`;
- evidence id: `a4c65403-5969-4fff-a439-0ed116d7a899`;
- contactos: `6595082e-6140-43cb-b69f-ca65e74f34f2`;
- cuentas/Auth: `21494958-a7db-4d86-b1fa-d55549913f9d`.

Ambas solicitudes permanecen `changes_requested`. La evidencia conserva explícitamente:

- inventario de backups no observado;
- PITR `unknown`;
- ventana efectiva total de recuperabilidad no demostrada;
- ninguna afirmación de purga de una copia concreta.

## 2. OpenAI — identidad productiva reconciliada

El worker privado fue invocado mediante su token existente desde Supabase `pg_net`, sin leer ni exponer la API key de OpenAI.

El modo `provider_identity` ejecutó `/v1/me` con la misma `OPENAI_API_KEY` productiva usada por los especialistas.

Resultado:

- HTTP 200;
- identidad y organización OpenAI observables;
- `organizationHeader` exacto correlacionado con `agent_runs.provider_organization`;
- **19 ejecuciones productivas** con `provider_request_id` y el mismo provider identity;
- **5 especialistas distintos** dentro de esa correlación.

Evidencia restringida previa:

- evidence id: `1a36b153-554f-4c76-88c3-e0b815b338ab`;
- scope: `processing_provider_identity_assurance`;
- request: `b97fb811-55d5-416e-becc-b54d0d9753a0`.

La identidad por sí sola no demuestra Data Retention, ZDR o MAM.

## 3. Probe productivo OpenAI — application state observable

Después del merge de PR #266 y con ambos despliegues Vercel productivos verdes, se aplicaron en Supabase:

- `20260816162119_processing_provider_tenant_configuration_review_v1`;
- `20260816162336_provider_retention_probe_dispatch_v1`.

El dispatcher privado reutiliza el secreto `kumplio_agent_worker_token` dentro de Vault y llama al modo autenticado:

`provider_retention_probe`

Request interna `pg_net`:

`13997`

Resultado del worker:

| Señal | Resultado |
|---|---:|
| HTTP worker | 200 |
| modelo | `gpt-4.1` |
| create `/v1/responses` | 200 |
| `createStoreFlag` | `true` |
| retrieve por response id | 200 |
| `retrievable` | `true` |
| `retrievedStoreFlag` | `true` |
| DELETE response | 200 |
| `deleted` | `true` |
| `applicationStateObserved` | `true` |

Provider request id observado:

`req_40a58cd2609a4fc199857236249df03c`

La documentación oficial vigente de OpenAI establece que, cuando Zero Data Retention está habilitado, `store=true` en `/v1/responses` se trata siempre como `false`. En esta prueba `store=true` fue aceptado, persistido y recuperable. Por tanto, **Zero Data Retention queda contradicho para esta request/configuración observada**.

El mismo documento indica que Modified Abuse Monitoring excluye contenido de abuse monitoring logs, pero conserva las capacidades normales de la plataforma. Por eso este probe **no distingue configuración estándar de Modified Abuse Monitoring**.

La Response sintética fue eliminada inmediatamente después de la lectura. El DELETE 200 acredita la eliminación solicitada del objeto de application state; no acredita purga inmediata de abuse monitoring logs ni otros sistemas externos.

Nueva evidencia restringida:

- evidence id: `50e82c04-83cb-479c-8fdf-b4b83d69fe93`;
- scope: `processing_provider_retention_probe`;
- SHA-256: `9849ad22216e655f5c8f27211008ccc57650cff9175e68701b5b48ea53d9bfa6`;
- integrity: `verified`;
- request OpenAI: `changes_requested`;
- `providerTenantConfigurationStatus`: `unverified`;
- eventos de promoción a `verified`: `0`.

## 4. Contrato de promoción tenant-specific

La migración `20260816162119_processing_provider_tenant_configuration_review_v1` instala:

`promote_processing_provider_tenant_configuration_v1(...)`

La función sólo puede promover un proveedor cuando existe evidencia tenant-specific aceptada e íntegra. Para OpenAI exige project binding observado y un modo efectivo explícito entre:

- `standard`;
- `modified_abuse_monitoring`;
- `zero_data_retention`.

El probe actual no cumple esos requisitos deliberadamente, por lo que no puede promover el estado.

Privilegios verificados:

- `SECURITY INVOKER`;
- `search_path=''`;
- `anon`: sin execute;
- `authenticated`: sin execute;
- `service_role`: execute permitido.

## 5. Lo que esta evidencia NO demuestra

No demuestra:

- si PITR está habilitado o deshabilitado en Supabase;
- cuándo una copia concreta de Supabase deja de poder recuperar un registro eliminado;
- si OpenAI usa configuración estándar o Modified Abuse Monitoring;
- el project binding administrativo de la API key productiva;
- que DELETE 200 purgue abuse monitoring logs;
- eliminación operacional final 3/3;
- cumplimiento jurídico global.

## 6. Gates que permanecen abiertos

```text
solicitudes tenant-specific con evidencia parcial   3/3 changes_requested
OpenAI ZDR para request observada                    contradicho
OpenAI standard vs MAM                               pendiente
configuración tenant proveedor verified             0/3
eliminación operacional final demonstrated          0/3
lifecycle                                             changes_requested 3/3
Leaked Password Protection                            disabled
```

La siguiente acción válida es obtener evidencia administrativa del project binding y del modo de Data Retention efectivo de OpenAI, además de observar PITR/ventana efectiva en Supabase. Sólo después puede evaluarse una promoción a `verified` y el cierre operacional final.
