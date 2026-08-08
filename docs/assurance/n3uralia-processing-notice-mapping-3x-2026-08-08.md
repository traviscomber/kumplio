# Assurance — Mapeo del aviso de privacidad de N3uralia 3/3

**Fecha de verificación:** 8 de agosto de 2026  
**Organización:** N3uralia  
**Bloque:** 16 — cierre de evidencia de mapeo  
**Estado:** `VALIDATED INICIAL / ACEPTADO CON BRECHAS`

## Resultado defendible

Las tres solicitudes de mapeo del aviso público fueron entregadas, revisadas y aceptadas mediante evidencia estructurada y verificable.

La aceptación demuestra que:

- cada actividad fue comparada con el aviso público versión `2026-08-03`;
- existe una correspondencia explícita con un scope principal;
- finalidad, titulares, categorías, destinatarios, derechos, transferencias y retención fueron revisados por separado;
- las fuentes y limitaciones quedaron dentro del snapshot aceptado;
- cada evidencia tiene integridad SHA-256 verificada;
- la solicitud de evidencia correspondiente quedó `accepted`;
- el control conserva suficiencia `partial`;
- cada actividad y misión conservan el estado `accepted_with_gaps`;
- la operación es idempotente y rechaza actores de otro tenant.

**Mapeo aceptado no equivale a aviso suficiente.**

No demuestra todavía:

- base jurídica validada;
- plazos de retención aprobados;
- destinatarios y accesos completos;
- contratos y lista vigente de subencargados;
- transferencias y salvaguardas validadas;
- atención operacional de derechos;
- eliminación o anonimización ejecutada;
- cumplimiento integral de la Ley N.º 21.719.

## Migraciones productivas

| Versión | Migración |
|---|---|
| `20260808174718` | `processing_notice_mapping_review_v1` |
| `20260808175012` | `seed_n3uralia_notice_mapping_reviews_v1` |

## Conteo productivo

| Objeto | Resultado |
|---|---:|
| Actividades evaluadas | 3 |
| Mapeos `accepted_with_gaps` | 3 |
| Solicitudes aceptadas con evidencia | 3 |
| Evidencias `accepted · verified` | 3 |
| Enlaces de suficiencia `partial` | 3 |
| Misiones actualizadas | 3 |
| Eventos de aceptación | 3 |
| Lifecycle aún `changes_requested` | 3 |
| Solicitudes de eliminación abiertas | 3 |
| Eliminaciones demostradas | 0 |

## Evidencia por actividad

### 1. Gestión de contactos comerciales y solicitudes de demostración

| Campo | Resultado |
|---|---|
| Código | `TRT-E6956B3825E1` |
| Actividad | `26233189-3335-43e6-b382-99fcf2cc4090` |
| Solicitud | `4fde8ee3-5060-4510-97ee-d0f78cef4618` |
| Evidencia | `ddc24f61-1bc0-4208-8731-a4b65905d58f` |
| SHA-256 | `fe757082960f49315fbef9c70634a0aeffbf6e6df1d498e705f6d174583ccaaf` |
| Estado | `accepted_with_gaps` |
| Suficiencia del control | `partial` |

Brechas conservadas:

- el aviso no enumera específicamente todas las categorías y titulares de contactos comerciales;
- destinatarios internos, Supabase y un eventual CRM requieren configuración y contratos vigentes;
- no están aprobados plazos diferenciados para leads convertidos, descartados e inactivos;
- derechos, eliminación y propagación a terceros no están demostrados.

### 2. Gestión de cuentas, autenticación y acceso al workspace

| Campo | Resultado |
|---|---|
| Código | `TRT-24200B1DEC5E` |
| Actividad | `a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1` |
| Solicitud | `e4ea239c-9e92-41cd-8cab-d85aba06d609` |
| Evidencia | `3f6f2009-f3af-49cd-acef-ec81b5d9f17b` |
| SHA-256 | `a6972788418d7e25b90c277e9adb1d562e256cee262ab098f66aa680d756df71` |
| Estado | `accepted_with_gaps` |
| Suficiencia del control | `partial` |

Brechas conservadas:

- el aviso no detalla credenciales, sesiones, refresh tokens, perfiles y membresías por separado;
- las aceptaciones legales históricas de la cuenta piloto no están disponibles;
- retención y propagación de eliminación de cuentas, sesiones, tokens y perfiles no están aprobadas;
- subencargados, transferencias, MFA y recuperación de cuenta requieren evidencia adicional.

### 3. Gestión de expedientes y análisis asistido por especialistas IA

| Campo | Resultado |
|---|---|
| Código | `TRT-EBDC661160F2` |
| Actividad | `f3cd212a-3e27-4f27-a722-545e4c44c8b1` |
| Solicitud | `9fcb51ad-5005-497e-b11b-0e23887c971d` |
| Evidencia | `0df628db-b8aa-45f9-8a67-ea13ee1b027d` |
| SHA-256 | `db16476ddad524b710648cdfb89cae8573fdfa0099f572e4a1d473274da8e971` |
| Estado | `accepted_with_gaps` |
| Suficiencia del control | `partial` |

Brechas conservadas:

- el aviso no clasifica por expediente datos personales, sensibles y de terceros;
- minimización y redacción del contexto antes de enviarlo a especialistas no están aprobadas;
- DPA, residencia, subencargados y salvaguardas del proveedor de IA requieren validación;
- retención, derechos y eliminación de casos, prompts, artefactos, logs y respaldos no están demostradas.

## Frontera humana

La revisión exige dos confirmaciones explícitas:

1. la persona revisó scopes, dimensiones y fuentes;
2. la persona entiende que aceptar la matriz no valida suficiencia jurídica ni operacional.

La evidencia aceptada mantiene:

```text
activitySpecificMapping = true
noticeSufficiencyValidated = false
legalBasisValidated = false
retentionValidated = false
deletionEvidence = false
limitationsPreserved = true
```

## Seguridad e idempotencia

El RPC `accept_processing_notice_mapping_v1` quedó con:

- `SECURITY INVOKER`;
- `search_path=''`;
- sin `EXECUTE` para `public`, `anon` y `authenticated`;
- `EXECUTE` solo para `service_role` y `postgres`;
- validación de organización, rol, actividad, owner, inventario, lifecycle, aviso y solicitud;
- advisory lock por actividad y versión del aviso;
- rechazo de contenido conflictivo;
- retry exacto con los mismos IDs y `resumed=true`;
- rechazo de actor perteneciente a otro tenant.

## Pruebas ejecutadas

- preflight reversible: `passed`;
- rollback limpio: 0 evidencias, 0 solicitudes aceptadas y 0 eventos residuales;
- seed supervisado 3/3: `passed`;
- verificación productiva read-only: `passed`;
- integridad del snapshot 3/3: `passed`;
- idempotencia después del seed: `passed`;
- prueba negativa cross-tenant: `passed`;
- advisor de seguridad: sin alerta nueva atribuible al RPC.

La deuda conocida de Supabase Auth **Leaked Password Protection** continúa abierta.

## Próximo cierre canónico

La continuidad autorizada no es ampliar el producto. Es resolver las tres solicitudes de eliminación o anonimización con evidencia real, revisada y aceptada, conservando `0/3` hasta que exista prueba auditable.
