# Revisión de base y ciclo de vida — N3uralia 3/3

> Estado: **VALIDATED INICIAL / CAMBIOS REQUERIDOS**  
> Fecha: **8 de agosto de 2026**  
> Organización: **N3uralia**  
> Bloque canónico: **16, tarea 2**  
> PR: **#235**  
> Migraciones aplicadas: `20260808043810_processing_activity_lifecycle_review_v1` y `20260808044018_seed_n3uralia_processing_lifecycle_reviews_v1`

---

## 1. Objetivo

Separar y revisar cinco decisiones que no deben confundirse dentro de una actividad de tratamiento:

1. base jurídica;
2. retención;
3. destinatarios;
4. subencargados;
5. transferencias internacionales.

La revisión no sobrescribe el inventario inicial. Cada nueva conclusión tiene versión, fuente, evidencia, SHA-256, unknowns y relación con la versión anterior.

---

## 2. Resultado general

Las tres actividades reales de N3uralia tienen una revisión lifecycle `v1`.

| Actividad | Decisión | Base | Retención | Destinatarios | Subencargados | Transferencias | Unknowns |
|---|---|---|---|---|---|---|---:|
| Contactos comerciales y demos | `changes_requested` | `pending_evidence` | `needs_changes` | `pending_evidence` | `pending_evidence` | `pending_evidence` | 8 |
| Cuentas, autenticación y workspace | `changes_requested` | `pending_evidence` | `needs_changes` | `pending_evidence` | `pending_evidence` | `pending_evidence` | 8 |
| Expedientes y especialistas IA | `changes_requested` | `pending_evidence` | `needs_changes` | `pending_evidence` | `pending_evidence` | `pending_evidence` | 8 |

Ninguna revisión fue marcada `approved`. La existencia de un sistema, un proveedor o un flujo técnico no se interpretó como validación jurídica, contractual ni de eliminación.

---

## 3. Contactos comerciales y solicitudes de demostración

| Recurso | Identificador |
|---|---|
| Actividad | `26233189-3335-43e6-b382-99fcf2cc4090` |
| Lifecycle review | `9398bf66-c18e-45ad-b316-074bb17b11f9` |
| Evidencia | `253732d1-aa5b-45f2-8f38-53a8a06df20d` |
| Request key | `eef5efea-3a42-0010-8ce2-a5989c692b40` |

Hash del snapshot:

```text
8e591aee2a2ce198f5fbf27ed6a3d5d89625f59bc98449eb6c77c24c5d2ff582
```

Evidencia observada:

- el endpoint guarda solicitudes en `public.commercial_leads`;
- existe un registro operacional;
- `PIPEDRIVE_WEBHOOK_URL` está previsto por el código;
- el envío a Pipedrive no está configurado;
- el lead observado conserva `sync_status = not_configured`;
- Supabase y la región `us-east-1` están identificados.

Conclusión:

> La finalidad de responder una solicitud es observable, pero faltan base aprobada por finalidad, plazos diferenciados, matriz de accesos, decisión contractual sobre Pipedrive, DPA/subencargados de Supabase, salvaguardas, aviso relacionado y eliminación demostrada.

---

## 4. Cuentas, autenticación y acceso al workspace

| Recurso | Identificador |
|---|---|
| Actividad | `a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1` |
| Lifecycle review | `fa97a7a4-3c9f-4d57-a09d-7297940e0a38` |
| Evidencia | `140f6248-3b3a-48ec-b344-10b4e124ea55` |
| Request key | `569a8561-d00b-57dd-007b-365ba3e6438c` |

Hash del snapshot:

```text
7fff1299c674218531341f3e071abf2fcf94959d609aa2e6e6f55ab8a3e63b5b
```

Evidencia observada:

- cuenta confirmada e identidad existentes;
- sesiones y refresh tokens presentes;
- perfil y membresía tenant-scoped;
- política de contraseña centralizada;
- Supabase identificado como proveedor;
- el advisor de producción mantiene Leaked Password Protection desactivada.

Conclusión:

> La autenticación es necesaria para el servicio, pero no se aprueba todavía la base por finalidad, retención posterior al cierre, aceptación histórica, matriz de accesos, DPA/subencargados, transferencia, MFA ni procedimiento de exportación y eliminación.

---

## 5. Expedientes y análisis asistido por especialistas IA

| Recurso | Identificador |
|---|---|
| Actividad | `f3cd212a-3e27-4f27-a722-545e4c44c8b1` |
| Lifecycle review | `96b004dd-155e-4268-9062-c1302d9ef9e0` |
| Evidencia | `9e91be02-16a3-4017-9269-79c1881416e2` |
| Request key | `e4e4eb97-6a33-8b6d-5116-3003871da9ba` |

Hash del snapshot:

```text
ce951233565ae83e6de4d9dd792e60dabb931b64ec1c52c863d5ef42adc8811b
```

Evidencia observada:

- workflows, runs, contexto y outputs persistidos;
- Structured Outputs y validación de esquema;
- `safety_identifier` derivado por hash;
- `store=false` en Responses API;
- artefactos, revisiones y tool calls;
- modelo, tokens, tiempos, estados y errores registrados;
- OpenAI identificado como receptor técnico del contexto de inferencia.

Conclusión:

> Los controles técnicos no validan por sí solos base, roles sobre datos de terceros, minimización, plazos, permisos de revisores, DPA, residencia, subencargados, salvaguardas, derechos, eliminación ni experiencia humana segura.

---

## 6. Contrato técnico implementado

La tabla `processing_activity_lifecycle_reviews` conserva:

- organización, proyecto, caso, actividad, control y evidencia;
- request key idempotente;
- versión y `supersedes_id`;
- conclusión humana;
- cinco estados separados;
- destinatarios, subencargados y transferencias estructurados;
- fuentes revisadas;
- unknowns;
- snapshot y SHA-256;
- revisor y fecha.

La RPC `review_processing_activity_lifecycle_v1`:

- es `SECURITY INVOKER`;
- usa `search_path=''`;
- exige membresía y actividad tenant-scoped;
- requiere inventario inicial revisado;
- usa advisory lock;
- no permite `approved` con dimensiones o unknowns abiertos;
- crea evidencia `accepted · verified`;
- registra un evento en el expediente;
- actualiza proyecciones de proceso, dataset y tercero;
- reanuda un mismo request key sin duplicar.

La tabla y la RPC están denegadas a `public`, `anon` y `authenticated`; la escritura ocurre únicamente en servidor después de validar sesión, workspace y permiso.

---

## 7. Pruebas realizadas

### Producción persistida

- 3 lifecycle reviews;
- 3 evidencias lifecycle;
- 3 enlaces actividad-evidencia;
- 3 eventos de expediente;
- evidencia `accepted · verified`;
- hash de evidencia igual al snapshot;
- 24 unknowns conservados;
- todas las conclusiones `changes_requested`.

### Versionado reversible

Dentro de `BEGIN … ROLLBACK`:

1. se creó una versión 2 de la actividad comercial;
2. `version = 2`;
3. `supersedes_id` apuntó a la versión 1;
4. el segundo llamado con el mismo request key devolvió `resumed = true`;
5. review, evidence y snapshot hash permanecieron iguales;
6. solo existió un evento;
7. el rollback restauró tres revisiones y cero versiones temporales.

### Pruebas negativas

Dentro de una transacción reversible:

- una identidad de otro tenant fue rechazada;
- una aprobación con unknowns y estados pendientes fue rechazada;
- el navegador no tiene privilegios de tabla ni RPC;
- RLS y la política explícita de denegación permanecen activas.

---

## 8. Límites y continuidad

Esta revisión **sí demuestra** que las cinco dimensiones se identificaron, separaron, versionaron y revisaron con fuentes reales.

No demuestra que estén resueltas. Al cierre:

| Dimensión | Aprobadas |
|---|---:|
| Base jurídica | 0/3 |
| Retención | 0/3 |
| Destinatarios | 0/3 |
| Subencargados | 0/3 |
| Transferencias | 0/3 |

La tarea 2 del Bloque 16 queda completada como **revisión realizada con cambios requeridos**, no como aprobación jurídica.

La única continuidad canónica es la tarea 3:

> **Adjuntar aviso de privacidad y evidencia de eliminación, o convertir cada ausencia en una acción explícita con owner y vencimiento.**
