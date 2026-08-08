# Inventario real de tratamientos de N3uralia — Assurance 3 actividades

> Estado: **VALIDATED INICIAL / BLOQUE 16 TAREA 1 COMPLETADA**  
> Fecha: **8 de agosto de 2026**  
> Organización: **N3uralia**  
> Repositorio: `traviscomber/kumplio`  
> PR de implementación y reconciliación: **#232**  
> Commit de merge: `14a67f2a15423362ed1ed403182fb8b80d5348ba`  
> Migración registrada en producción: `20260808020905_seed_n3uralia_core_processing_activities_v1`

---

## 1. Objetivo

Cerrar la primera tarea del Bloque 16 mediante la ampliación del inventario real de N3uralia desde una a tres actividades observadas, conectando cada una con:

```text
actividad
→ finalidad y base propuesta
→ titulares y categorías
→ dataset
→ sistema o repositorio
→ tercero
→ fuente verificable
→ evidencia con SHA-256
→ revisión explícita
→ desconocidos pendientes
```

La validación no convierte bases propuestas, retención pendiente, riesgo provisional ni evidencia parcial en conclusiones jurídicas.

---

## 2. Actividades registradas

| Actividad | Estado | Completitud | Evidencia |
|---|---|---|---|
| Gestión de contactos comerciales y solicitudes de demostración | `approved` | `partial` | `accepted · verified` |
| Gestión de cuentas, autenticación y acceso al workspace | `approved` | `partial` | `accepted · verified` |
| Gestión de expedientes y análisis asistido por especialistas IA | `approved` | `partial` | `accepted · verified` |

Los registros sintéticos del UI Golden Path no forman parte de este conteo.

---

## 3. Gestión de cuentas, autenticación y acceso al workspace

### Alcance observado

- registro y confirmación de cuenta;
- identidad de autenticación;
- sesiones y refresh tokens;
- perfil de usuario;
- membresía, rol y acceso al workspace;
- metadatos de aceptación legal cuando existen.

### Fuente y relaciones

- sistema: `Supabase Auth, profiles y organization_members`;
- tipo: `identity_access_management_database`;
- proveedor: `Supabase`;
- región observada: `Estados Unidos (us-east-1)`;
- transferencia transfronteriza: registrada como `true`;
- sensibilidad del dataset: `restricted`.

### Identificadores

| Recurso | ID |
|---|---|
| Actividad | `a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1` |
| Dataset | `76a6fd4f-4a6c-499d-85e0-8e92353d09e7` |
| Sistema | `2a93c31a-9cd3-48d2-ac5b-ae652c115855` |
| Tercero | `427522d0-2ca8-4c10-a101-28959fcb1049` |
| Evidencia | `44799217-6fc4-4df7-8e6f-0d092f7481dc` |
| Revisión | `3f856c57-cbb3-4a94-9ff6-6d02f6446d43` |
| Request key | `24200b1d-ec5e-5639-0c81-43e04ac8cb08` |

Hash del snapshot:

```text
da019451c8bfd7672a262914cc3c0860e6f03c214637b60ca104ea44e7c3cac1
```

### Desconocidos conservados

1. plazo de retención y eliminación de cuenta, sesiones, refresh tokens y perfil;
2. base de licitud por finalidad y rol de responsable o encargado;
3. trazabilidad histórica de términos, privacidad y aceptación de la cuenta piloto;
4. activación de Supabase Auth Leaked Password Protection;
5. MFA y respuesta ante compromiso o recuperación de cuenta;
6. subencargados y garantías de transferencia;
7. procedimiento de cierre, exportación y eliminación de cuenta.

---

## 4. Gestión de expedientes y análisis asistido por especialistas IA

### Alcance observado

- creación de expedientes;
- workflows por etapas;
- contexto recuperado;
- ejecución de modelos;
- resultados estructurados;
- artefactos y referencias;
- revisiones explícitas;
- tool calls autorizados;
- tokens, tiempos, estados y errores.

### Fuente y relaciones

- sistema: `Motor de especialistas IA y OpenAI Responses API`;
- tipo: `ai_reasoning_service`;
- proveedor: `OpenAI`;
- región contractual: pendiente de confirmar;
- transferencia transfronteriza: registrada como `true`;
- sensibilidad del dataset: `restricted`;
- riesgo del tercero: `high`, expresamente provisional.

### Identificadores

| Recurso | ID |
|---|---|
| Actividad | `f3cd212a-3e27-4f27-a722-545e4c44c8b1` |
| Dataset | `83b250d2-dc1b-45f9-83b7-6021584de015` |
| Sistema | `5eaac7d5-6251-4813-a54d-5d7196599d01` |
| Tercero | `e8701b2d-468e-44fb-ad6b-c346fdaadf26` |
| Evidencia | `b5528550-3f45-48b1-a150-ae89696acdf7` |
| Revisión | `ed7094d1-80e4-4d88-a7ec-0ed17c934b63` |
| Request key | `ebdc6611-60f2-c608-2e20-c4d2ec302e44` |

Hash del snapshot:

```text
1c37ef4f674aaa80d438c585e9cc387bfe08e1eab799b9f304ad1eebc8807b16
```

### Desconocidos conservados

1. clasificación completa de datos personales y sensibles por expediente;
2. región, retención operativa, monitoreo y subencargados del proveedor;
3. base jurídica y roles para datos de terceros;
4. política aprobada de minimización, redacción y exclusión de secretos;
5. retención y eliminación de casos, prompts, artefactos, logs y respaldos;
6. derechos del titular y propagación de eliminación al proveedor;
7. metodología aprobada para el riesgo del tercero;
8. validación con personas reales de que la revisión evita exposición o aprobación indebida.

---

## 5. Evidencia operacional observada

La verificación de producción confirmó:

| Métrica | Resultado |
|---|---:|
| Cuenta confirmada | 1 |
| Identidades | 1 |
| Sesiones presentes | sí |
| Refresh tokens presentes | sí |
| Runs aprobados | 8 |
| Runs con contexto, output, modelo y uso | 9 |
| Artefactos | 8 |
| Revisiones de agentes | 7 |
| Tool calls | 19 |
| Tokens acumulados | 171.727 |

Estas métricas respaldan la existencia y operación observada de los procesos. No demuestran que todos los casos futuros tengan el mismo contenido, que la minimización sea suficiente ni que exista cumplimiento integral.

---

## 6. Integridad, idempotencia y reconciliación

La migración:

- descubre organización, actor, proyecto, expediente y control dinámicamente;
- no contiene UUIDs productivos hardcodeados;
- usa `create_processing_activity_inventory_v1`;
- ejecuta dos veces cada actividad;
- exige que el segundo intento retorne `resumed=true` y conserve IDs;
- mantiene las actividades como `partial`;
- genera evidencia `accepted · verified` con snapshot SHA-256.

Durante el cierre se corrigieron dos riesgos:

### A. Drift de migraciones

Producción había registrado la migración como:

```text
20260808020905_seed_n3uralia_core_processing_activities_v1
```

La rama conservaba el mismo seed con `20260808023000`. El repositorio fue reconciliado con el historial productivo y se eliminó el timestamp duplicado.

### B. Tipo de `unknowns`

`processing_activity_reviews.unknowns` es `text[]`. El verificador original lo trataba como JSON. Se corrigió a:

```sql
cardinality(review.unknowns)
'valor' = any(review.unknowns)
```

El guardrail de inventario impide reintroducir las operaciones JSON incompatibles.

---

## 7. Método de verificación

El verificador versionado es:

```text
scripts/60-verify-n3uralia-core-processing-activities.sql
```

Está diseñado como `READ ONLY` y termina en `ROLLBACK`.

La herramienta de ejecución bloqueó el envío monolítico por tamaño y acceso combinado a tablas sensibles de Auth. No se deshabilitó ni evitó esa barrera. La cobertura se dividió en consultas de solo lectura:

1. integridad de actividades, revisiones, desconocidos, hashes y evidencia;
2. cadenas proceso → dataset → sistema → tercero y evidencia operacional agregada.

Ambas verificaciones pasaron.

---

## 8. Límites de esta validación

Este assurance **sí demuestra**:

- tres actividades reales observadas en N3uralia;
- fuentes y relaciones persistidas;
- evidencia con integridad verificada;
- owner y control relacionados;
- bases claramente marcadas como propuestas;
- revisiones parciales y desconocidos explícitos;
- idempotencia y reconciliación del historial de migraciones.

Este assurance **no demuestra**:

- base de licitud validada;
- retención aprobada;
- destinatarios y subencargados completos;
- garantías contractuales de transferencia;
- aviso de privacidad suficiente;
- eliminación operativa demostrada;
- riesgo de terceros validado con metodología;
- cobertura completa del universo de tratamientos;
- cumplimiento integral de la Ley N.º 21.719.

---

## 9. Decisión canónica

La tarea 1 del Bloque 16 queda completada:

> **Registrar dos actividades reales adicionales representativas.**

El bloque permanece `NEXT`. La siguiente tarea autorizada es:

> **Validar base, retención, destinatarios, subencargados y transferencias para las tres actividades reales, sin eliminar desconocidos sin evidencia aprobada.**
