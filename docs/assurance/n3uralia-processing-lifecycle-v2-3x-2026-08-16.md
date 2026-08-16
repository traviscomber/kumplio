# Bloque 16 — Lifecycle V2 de las tres actividades reales — 16 de agosto de 2026

Estado: **VERSIONADO 3/3 · CAMBIOS REQUERIDOS 3/3**

Este assurance registra una segunda revisión versionada de base jurídica, retención, destinatarios, subencargados y transferencias para las tres actividades reales observadas de N3uralia. El objetivo de V2 no es subir un score ni declarar cumplimiento: es retirar afirmaciones ya obsoletas de V1, incorporar evidencia acumulada después del 8 de agosto y conservar explícitamente las brechas que todavía no tienen prueba suficiente.

## Resultado resumido

| Actividad | V2 | Decisión | Base | Retención | Destinatarios | Subencargados | Transferencias | Unknowns |
|---|---:|---|---|---|---|---|---|---:|
| Contactos comerciales y demo | 2 | `changes_requested` | `pending_evidence` | `needs_changes` | `pending_evidence` | `pending_evidence` | `pending_evidence` | 7 |
| Cuentas, Auth y workspace | 2 | `changes_requested` | `pending_evidence` | `needs_changes` | `pending_evidence` | `pending_evidence` | `pending_evidence` | 7 |
| Expedientes y especialistas IA | 2 | `changes_requested` | `pending_evidence` | `needs_changes` | `pending_evidence` | `pending_evidence` | `pending_evidence` | 9 |

**Ninguna dimensión fue promovida a `validated`. Ninguna revisión fue aprobada.**

## Integridad y versionado

### Contactos comerciales

- process: `26233189-3335-43e6-b382-99fcf2cc4090`;
- review V2: `19ecfa22-5b23-4917-a4d1-0daac5212e0f`;
- supersede V1: `9398bf66-c18e-45ad-b316-074bb17b11f9`;
- evidence V2: `eb5d3b2f-5f8d-4eb4-8a12-73722702f67b`;
- snapshot SHA-256: `14ad70fee27448d69b130f6166f812cf30e83777fe2a9aedf6fd9f4ad534620b`;
- request key: `4a683fed-f811-4b46-a7bb-5c69fb0743ba`.

### Cuentas, Auth y workspace

- process: `a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1`;
- review V2: `b120bf27-d284-4f0e-9958-e3ed0e3d80cd`;
- supersede V1: `fa97a7a4-3c9f-4d57-a09d-7297940e0a38`;
- evidence V2: `f0c0fbc2-e825-449d-a7c9-7d7bc26dd7fe`;
- snapshot SHA-256: `34b56f56d8c079681ae943ce1fd79c4e31b4528df61bfc0178f78d75fafe1716`;
- request key: `13dd9ad3-8c88-4067-8499-3fbb90adad62`.

### Expedientes y especialistas IA

- process: `f3cd212a-3e27-4f27-a722-545e4c44c8b1`;
- review V2: `7d3157ef-37a0-4256-833a-696941fe05af`;
- supersede V1: `96b004dd-155e-4268-9062-c1302d9ef9e0`;
- evidence V2: `9756e905-5ade-4fbf-a551-e973e47ce7b7`;
- snapshot SHA-256: `3a939433961281b7977d2ea625c4d1c2f541c8bc54c1ce8728a89e942f319ec2`;
- request key: `9290978e-673e-49bf-856a-a23527a6ce6b`.

En 3/3, el hash del snapshot coincide exactamente con `evidence.integrity_hash`, la evidencia quedó `accepted · verified`, `supersedes_id` apunta a V1 y `organization_processes.attributes.latestLifecycleReviewId` apunta a V2.

## 1. Contactos comerciales — qué cambió respecto de V1

V1 todavía mantenía como brecha una formulación que no reflejaba el trabajo posterior sobre el aviso y decía que la eliminación de leads no estaba demostrada.

V2 incorpora como fuentes revisadas:

- lifecycle V1: `253732d1-aa5b-45f2-8f38-53a8a06df20d`;
- mapeo del aviso `accepted_with_gaps`: `ddc24f61-1bc0-4208-8731-a4b65905d58f`;
- eliminación primaria sobre `public.commercial_leads`: `758ab468-6d66-4176-bc85-c99741914a92`;
- assurance de proveedor Supabase: `f2610518-85f7-414e-b28f-eb330dda24bf`;
- evidencia tenant parcial de plan Pro/backups: `a4c65403-5969-4fff-a439-0ed116d7a899`.

La revisión ahora distingue correctamente:

- **sí demostrado:** eliminación primaria controlada del registro sintético;
- **no demostrado:** purga de backups/PITR, configuración tenant completa y cierre operacional final;
- **todavía pendiente:** base jurídica por finalidad, plazos diferenciados de retención, matriz de accesos, DPA/subencargados, rol/contrato de Pipedrive y salvaguardas de transferencia.

## 2. Cuentas/Auth — qué cambió respecto de V1

V1 agrupaba cierre, MFA, exportación y eliminación de cuenta como si ninguna capa de eliminación hubiese sido probada.

V2 incorpora:

- lifecycle V1: `140f6248-3b3a-48ec-b344-10b4e124ea55`;
- mapeo del aviso: `3f6f2009-f3af-49cd-acef-ec81b5d9f17b`;
- eliminación primaria de cuenta/identidad/sesión/perfil/membresía: `4cfa8548-e176-44cd-b313-25888738652b`;
- assurance de proveedor Supabase: `0892194d-0d63-4394-9095-c7efb0842290`;
- evidencia tenant parcial de plan Pro/backups: `a4c65403-5969-4fff-a439-0ed116d7a899`;
- Security Advisor vigente, que continúa mostrando **Leaked Password Protection disabled**.

La eliminación primaria deja de figurar como desconocida. Siguen abiertos la política de retención por categoría, PITR/ventana recuperable, DPA/subencargados, matriz de accesos, transferencias y controles del ciclo de credenciales/cuenta.

## 3. Expedientes/IA — qué cambió respecto de V1

V1 decía que todavía no existía un piloto humano y trataba la identidad/retención del proveedor como completamente desconocidas.

Desde entonces existe evidencia nueva:

- lifecycle V1: `9e91be02-16a3-4017-9269-79c1881416e2`;
- mapeo del aviso: `0df628db-b8aa-45f9-8a67-ea13ee1b027d`;
- eliminación primaria de expediente + workflow/run: `ba78ed80-85e8-4f36-abea-aed3b1692a6f`;
- assurance de proveedor OpenAI: `9261efec-c156-44a5-a6fd-632a1c514ca0`;
- identidad productiva `/v1/me` correlacionada con 19 runs / 5 especialistas: `1a36b153-554f-4c76-88c3-e0b815b338ab`;
- retention probe productivo: `50e82c04-83cb-479c-8fdf-b4b83d69fe93`;
- E2E agentic controlado 5/5 con cinco revisiones humanas: `docs/assurance/agent-flow-production-e2e-5x-2026-08-14.md`.

V2 refleja ahora que:

- existe revisión humana interna 5/5; falta una **organización externa supervisada**, que es una frontera distinta;
- la eliminación primaria del expediente está demostrada de forma controlada;
- el retention probe observó `store=true`, recuperación y DELETE del objeto de application state, contradiciendo ZDR para la request observada;
- Standard vs Modified Abuse Monitoring sigue sin poder distinguirse por runtime y requiere evidencia administrativa;
- el project binding de la API key no está demostrado administrativamente;
- DPA, residencia, subencargados, transferencias, minimización, base y plazos de retención siguen abiertos;
- DELETE 200 del probe no equivale a purga de abuse-monitoring logs ni a eliminación operacional final.

## Lo que V2 NO permite declarar

V2 no permite afirmar:

- base jurídica validada 3/3;
- retención aprobada 3/3;
- destinatarios/subencargados completos;
- transferencias internacionales validadas;
- configuración tenant proveedor verificada;
- PITR observado;
- MAM o Standard confirmado en OpenAI;
- eliminación operacional final;
- cumplimiento global;
- piloto externo.

## Estado posterior a V2

```text
lifecycle versionado V2                         3/3
lifecycle decision                              changes_requested 3/3
base validated                                  0/3
retención validated                             0/3
destinatarios validated                         0/3
subencargados validated                         0/3
transferencias validated                        0/3
mapeo del aviso                                 accepted_with_gaps 3/3
eliminación primaria                            3/3
assurance proveedor                             3/3 parcial
solicitudes tenant-specific                     3/3 changes_requested
configuración tenant proveedor verified         0/3
eliminación operacional final                   0/3
Leaked Password Protection                      disabled
organización externa observada                  0
```

## Verificación

El verificador read-only asociado es:

`scripts/69-verify-n3uralia-processing-lifecycle-v2-3x.sql`

Comprueba V2 3/3, supersesión de V1, decisiones, estados de las cinco dimensiones, integridad SHA-256, evidencia aceptada/verificada y puntero del proceso a la revisión más reciente.
