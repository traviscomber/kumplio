# UI Golden Path productivo — Assurance 3/3

> Estado: **VALIDATED x3**  
> Fecha de cierre: **7 de agosto de 2026, America/Santiago**  
> Repositorio: `traviscomber/kumplio`  
> Commit probado en `main`: `0a81b76f0ad28b5a19921cf1f96223e6aae8046a`  
> Workflow: `UI Golden Path`  
> GitHub Actions run: `31229627159`  
> Aplicación probada: `https://www.kumplio.app`

---

## 1. Objetivo

Demostrar que una persona puede completar el tercer golden path de Kumplio **usando únicamente la interfaz productiva**, en un tenant limpio y aislado, sin intervención SQL administrativa para crear o avanzar registros de negocio.

La prueba debía recorrer y persistir:

```text
cuenta E2E confirmada
→ login
→ onboarding
→ organización y proyecto propios
→ caso inicial
→ expediente guiado adicional
→ workflow de cinco especialistas
→ cinco revisiones humanas explícitas
→ plan operativo
→ misión y solicitud de evidencia
→ baseline assurance
→ cierre humano de la misión
→ inventario de actividad de tratamiento
→ sistema, dataset, tercero, fuente y evidencia
→ revisión humana parcial con desconocidos abiertos
```

La prueba se consideraba válida solo si el navegador terminaba correctamente **y** una aserción server-side independiente confirmaba el estado persistido.

---

## 2. Fronteras de seguridad

El workflow cumple estas restricciones:

- usa OIDC de GitHub Actions con audiencia `kumplio-ui-golden-path`;
- no depende de secretos permanentes de Supabase en GitHub;
- crea una identidad temporal y confirmada por ejecución;
- la contraseña se genera aleatoriamente, se enmascara y no se conserva como artefacto;
- el endpoint OIDC puede preparar la identidad y observar el resultado, pero no crea ni muta registros de negocio;
- onboarding, casos, aprobaciones, misión, baseline e inventario se crean por la UI productiva;
- cada organización se identifica por `run_id` y `run_attempt`;
- la evidencia del navegador se conserva con retención limitada;
- las consultas SQL realizadas durante el assurance fueron de observación y no se usaron para avanzar el flujo.

---

## 3. Resultado de repetibilidad

| Ejecución | Job | Organización aislada | Browser | Aserción persistida | Jobs agentic | Intentos por job | Dead-letter |
|---:|---:|---|---|---|---:|---:|---:|
| 1/3 | `93030710327` | `f02634d4-8dfe-46b3-b58f-fd1c188a1230` | `success` | `17/17` | `5/5 succeeded` | `1` | `0` |
| 2/3 | `93032238652` | `855eb5b2-c35c-4130-b80c-d87576bc0140` | `success` | `17/17` | `5/5 succeeded` | `1` | `0` |
| 3/3 | `93033440994` | `68291744-3ea1-424f-88ad-c199a780c662` | `success` | `17/17` | `5/5 succeeded` | `1` | `0` |

En las tres ejecuciones:

- las cinco etapas terminaron `approved`;
- el workflow terminó `completed`;
- no hubo retry, recuperación manual ni dead-letter;
- Playwright terminó con código de salida `0`;
- la rama `Record browser failure` fue omitida;
- la aserción server-side terminó `success`;
- el estado `UI Golden Path` quedó verde.

---

## 4. Aserciones server-side

Cada ejecución aprobó las siguientes 17 condiciones:

1. `oneIndependentMembership`;
2. `activeWorkspaceMatchesMembership`;
3. `oneOrganization`;
4. `oneProject`;
5. `onboardingAndGuidedCasesCreated`;
6. `oneCompletedWorkflow`;
7. `fiveApprovedStages`;
8. `fiveApprovedRuns`;
9. `fiveApprovedArtifacts`;
10. `fiveApprovedHumanReviews`;
11. `durableQueueCompleted`;
12. `operationalMissionCompleted`;
13. `evidenceRequestAccepted`;
14. `baselineControlCreated`;
15. `baselineEvidenceAcceptedAndVerified`;
16. `designAndOperatingEvaluationsSeparated`;
17. `processingActivityReviewed`.

El contrato no confunde calidad del artefacto con cumplimiento legal: las revisiones aprueban el alcance declarado, conservan reservas y mantienen la operación parcial cuando la evidencia no respalda una conclusión más fuerte.

---

## 5. Verificación visual durable

La comprobación final del inventario dejó de depender de un toast efímero. Playwright verifica la tarjeta persistida de la actividad y exige, dentro de esa tarjeta:

- nombre único de la actividad;
- completitud `Parcial`;
- sistema `Portal Kumplio UI E2E`;
- tercero `Proveedor sintético UI E2E`;
- evidencia `accepted · verified`;
- hash `SHA-256` de 64 caracteres hexadecimales;
- desconocido `Base jurídica pendiente de validación`;
- desconocido `Retención pendiente de aprobación`.

Esta comprobación representa estado durable y vuelve a fallar si la escritura, las relaciones o la lectura server-side dejan de funcionar.

---

## 6. Consumo observado

| Ejecución | Input tokens | Output tokens | Total tokens | Tiempo de modelo acumulado | Duración del navegador |
|---:|---:|---:|---:|---:|---:|
| 1/3 | 35.427 | 18.007 | 53.434 | 234.959 ms | 410.941 ms |
| 2/3 | 46.682 | 21.088 | 67.770 | 263.919 ms | 434.614 ms |
| 3/3 | 43.902 | 19.985 | 63.887 | 292.563 ms | 484.483 ms |
| **Total** | **126.011** | **59.080** | **185.091** | **791.441 ms** | **1.330.038 ms** |
| **Promedio** | **42.004** | **19.693** | **61.697** | **263.814 ms** | **443.346 ms** |

Interpretación:

- el tiempo de modelo es la suma de las cinco ejecuciones agentic de cada tenant;
- la duración del navegador incluye esperas, navegación, revisión humana sintética, render y persistencia;
- estas métricas permiten estimar costo técnico, pero todavía no equivalen a tiempo humano de un piloto ni a costo comercial completo.

---

## 7. Evidencia de GitHub Actions

| Intento | Artefacto | Artifact ID | Digest |
|---:|---|---:|---|
| 1/3 | `ui-golden-path-31229627159-1` | `9013429726` | `sha256:b7ba25593fc3a80ec0696c8a5b04cc005ac2e336c7f6f36efa57564669e62700` |
| 2/3 | `ui-golden-path-31229627159-2` | `9013621417` | `sha256:228b743b100e8af8255c571b89df7ddfad7d1b9c62e997ae348145cb0818267f` |
| 3/3 | `ui-golden-path-31229627159-3` | `9013772660` | `sha256:89f4c65548a968621a0a13fa7c48f1d34a810f284c2794c6b15cb88aec3e6962` |

Cada paquete contiene el reporte Playwright, identidad lógica del tenant, resultado de provisioning, aserción persistida y evidencia visual. Los artefactos expiran automáticamente según la política del workflow.

---

## 8. Hallazgos corregidos durante la construcción del gate

La prueba productiva detectó fallos que los checks estáticos no mostraban:

1. selector ambiguo entre `Contraseña` y `Mostrar contraseña`;
2. selector parcial de `Empresa` que también coincidía con sugerencias;
3. controles duplicados de `Aprobar y continuar` fuera y dentro de `<main>`;
4. carrera entre `router.replace()` y `router.refresh()` al finalizar onboarding;
5. embed PostgREST inválido entre `organization_members` y `profiles`;
6. señalización incorrecta de Playwright basada en `steps.browser.outcome`;
7. aserción final dependiente de un toast efímero.

Los fixes se protegieron con Release Gate y guardrails de fuente para impedir regresiones conocidas.

PRs finales de referencia:

- `#223` — campo de contraseña no ambiguo;
- `#224` — nombres accesibles exactos;
- `#225` — revisión limitada al workspace principal;
- `#226` — navegación determinista después del onboarding;
- `#227` — perfiles de equipo sin embed PostgREST inexistente;
- `#228` — código de salida explícito de Playwright;
- `#229` — aserción durable de actividad de tratamiento.

---

## 9. Separación entre assurance y producto real

Al cierre de esta prueba, la base contiene tenants E2E históricos generados durante el desarrollo del gate. La medición operativa distinguió:

- `2` organizaciones no E2E;
- `9` organizaciones E2E;
- `10` usuarios E2E;
- `3` organizaciones oficiales del cierre 3/3;
- `7` workflows E2E en total, incluyendo intentos anteriores;
- `5` actividades de tratamiento E2E;
- `2` actividades de tratamiento no E2E.

Estos registros sintéticos:

- no cuentan como clientes;
- no cuentan como pilotos externos;
- no aumentan la cobertura real del inventario;
- no deben mezclarse con métricas comerciales;
- deben conservarse solo mientras sean necesarios para evidencia y luego limpiarse mediante un procedimiento tenant-scoped y auditable.

---

## 10. Alcance de la validación

Este assurance **sí demuestra**:

- funcionamiento productivo de extremo a extremo;
- navegación exclusivamente por UI para registros de negocio;
- persistencia durable;
- coordinación de cinco especialistas;
- revisión humana explícita;
- cola durable sin retries en tres ejecuciones consecutivas;
- baseline honesto;
- inventario parcial con desconocidos visibles;
- repetibilidad técnica 3/3 en tenants aislados.

Este assurance **no demuestra**:

- cumplimiento integral de una organización;
- validación jurídica de las bases propuestas;
- cobertura completa del inventario de tratamientos;
- ausencia de defectos fuera del recorrido probado;
- éxito de una beta autoservicio;
- usabilidad por una organización externa sin acompañamiento;
- tiempo humano, retrabajo, confianza o willingness-to-pay de un piloto real.

---

## 11. Decisión

El gate **Repetibilidad del golden path** queda cerrado como:

> **`3/3 — VALIDATED`**

La siguiente prioridad no es una cuarta repetición sintética. Es:

1. ampliar el inventario con dos actividades reales adicionales;
2. activar Supabase Auth Leaked Password Protection;
3. ejecutar un piloto externo supervisado;
4. medir tiempo humano, retrabajo, claridad, confianza y costo monetario completo.
