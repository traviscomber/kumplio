# Contrato canónico de ejecución del roadmap

> Estado: **OBLIGATORIO**  
> Autoridad: owner de Kumplio  
> Fuente canónica: [`ROADMAP.md`](../../ROADMAP.md)  
> Alcance: agentes, personas, PRs, issues, automatizaciones y decisiones de producto

---

## 1. Propósito

Este contrato evita que Kumplio se convierta en una suma de ideas atractivas sin una secuencia común.

`ROADMAP.md` define:

- qué problema se está cerrando;
- qué bloque se ejecuta ahora;
- qué gates impiden avanzar;
- qué capacidades están desplegadas, validadas o pendientes;
- qué trabajo se pospone deliberadamente;
- qué evidencia permite cambiar un estado.

La regla principal es:

> **No existe trabajo de producto autorizado fuera del roadmap canónico, salvo una excepción de emergencia o una decisión explícita del owner registrada en el propio roadmap.**

---

## 2. Jerarquía de autoridad

Cuando dos fuentes se contradicen, prevalece este orden:

1. **`ROADMAP.md`** — prioridad, secuencia, alcance y estado.
2. **Evidencia observable** — código en `main`, Supabase, CI, Vercel, pruebas y artefactos.
3. **Documentos de assurance y decisiones versionadas** — detalle de cómo se validó un resultado.
4. **PRs e issues** — unidad de ejecución y discusión.
5. **Conversaciones, ideas y propuestas** — contexto no vinculante hasta incorporarse al roadmap.

Una conversación no cambia la prioridad por sí sola. Un issue abierto tampoco autoriza trabajo si no se relaciona con `NEXT`, `ACTIVE`, `P0` o una excepción permitida.

---

## 3. Trabajo permitido

Una tarea está autorizada cuando cumple al menos una condición:

### A. Bloque canónico vigente

Pertenece al único bloque marcado `NEXT` y cierra una de sus tareas o su salida esperada.

### B. Gate activo

Cierra una deuda `P0`, una tarea `ACTIVE` o una condición necesaria para pasar de `DEPLOYED` a `VALIDATED`.

### C. Corrección necesaria

Resuelve:

- bug funcional;
- regresión;
- vulnerabilidad;
- fuga cross-tenant;
- pérdida, corrupción o inconsistencia de datos;
- error de release, build o despliegue;
- contradicción entre el estado declarado y la evidencia real.

La corrección debe retornar después al bloque interrumpido.

### D. Cambio explícito de dirección

El owner decide cambiar alcance o prioridad y `ROADMAP.md` se actualiza antes o dentro de la misma PR.

---

## 4. Trabajo no permitido

No se debe iniciar:

- un bloque `PLANNED` o `DEFERRED` antes de cerrar el vigente;
- un módulo nuevo porque resulte atractivo o fácil de demostrar;
- una integración sin un caso de uso priorizado;
- una refactorización amplia sin un resultado del roadmap;
- una migración destructiva para “limpiar” datos sin política y aprobación;
- trabajo Enterprise antes de los gates de piloto definidos;
- automatización irreversible sin revisión humana;
- cambios que eleven scores ocultando desconocidos;
- una segunda fuente de verdad paralela al roadmap.

Tampoco se permite declarar un estado superior al comprobable:

```text
código escrito ≠ desplegado
desplegado ≠ validado
validado internamente ≠ piloto externo
artefacto aprobado ≠ caso resuelto
score alto ≠ cumplimiento global
```

---

## 5. Interpretación de instrucciones breves

En este proyecto, expresiones como:

- “vamos”;
- “sigamos”;
- “continúa”;
- “siguiente bloque”;
- “go”;

significan:

> **Tomar la siguiente tarea incompleta del bloque canónico vigente, sin cambiar de prioridad ni inventar un nuevo frente.**

Si el bloque está cerrado, se pasa al siguiente definido en `ROADMAP.md`.

---

## 6. Excepciones de emergencia

Se puede interrumpir la secuencia únicamente por:

1. incidente de seguridad;
2. caída o degradación grave de producción;
3. fuga cross-tenant;
4. riesgo de pérdida o corrupción de datos;
5. fallo crítico de autenticación o autorización;
6. bloqueo del release principal;
7. obligación legal o contractual con plazo inmediato y evidencia identificada.

### Requisitos de la excepción

La PR debe incluir:

- condición de emergencia;
- alcance mínimo de restauración;
- riesgo de no actuar;
- prueba de no regresión;
- efecto en el roadmap;
- decisión explícita sobre cuándo se retoma el bloque interrumpido.

Una excepción no autoriza rediseños oportunistas ni backlog adicional.

---

## 7. Protocolo para cambiar el roadmap

Toda modificación de prioridad, estado o secuencia debe:

1. señalar la evidencia nueva;
2. identificar qué supuesto anterior cambió;
3. actualizar la sección afectada;
4. mantener un único bloque `NEXT`;
5. mover trabajo desplazado a `PLANNED`, `DEFERRED` o backlog con razón explícita;
6. actualizar métricas y decisión vigente cuando corresponda;
7. pasar `npm run check:canonical-roadmap`;
8. quedar en la misma PR que materializa el cambio, salvo una decisión puramente documental del owner.

No se reescribe el roadmap para justificar trabajo ya hecho fuera de secuencia sin reconocer la desviación.

---

## 8. Transiciones de estado

| Transición | Evidencia mínima |
|---|---|
| `PLANNED → ACTIVE` | alcance definido y trabajo iniciado |
| `ACTIVE → DEPLOYED` | código/migración en producción |
| `DEPLOYED → VALIDATED INICIAL` | primer caso representativo comprobado |
| `VALIDATED INICIAL → VALIDATED` | repetibilidad o cobertura exigida por el bloque |
| `VALIDATED → DONE` | resultado medido y sin gate técnico pendiente dentro de su alcance |
| cualquier estado → `BLOCKED` | dependencia externa concreta y documentada |
| cualquier estado → `DEFERRED` | decisión explícita de no competir con la ruta crítica |

La evidencia debe estar disponible en código, base de datos, CI, Vercel, documentos de assurance o métricas observables.

---

## 9. Obligaciones de cada PR

Toda PR debe responder:

1. ¿Qué bloque, gate o defecto del roadmap autoriza este cambio?
2. ¿Qué resultado del usuario cierra?
3. ¿Qué no se incluyó para evitar desviación?
4. ¿Qué pruebas sostienen el estado declarado?
5. ¿Debe cambiar `ROADMAP.md` en esta misma PR?

Si la PR no puede responder la primera pregunta, no debe fusionarse.

La plantilla de PR contiene una sección obligatoria de alineación.

---

## 10. Obligaciones de los agentes

Cada agente debe:

- leer `ROADMAP.md` antes de actuar;
- mantener el alcance del bloque vigente;
- preferir ejecución a nuevas propuestas cuando el trabajo ya está definido;
- informar inmediatamente un hallazgo que cambie el plan;
- no esconder deuda ni pruebas faltantes;
- no confundir capacidad técnica con valor validado;
- actualizar documentación canónica cuando cierre un estado;
- dejar la siguiente tarea claramente identificada.

Un agente no tiene autoridad para cambiar la prioridad de producto por iniciativa propia.

---

## 11. Guardrail automático

El contrato se valida mediante:

```bash
npm run check:canonical-roadmap
```

El check verifica, entre otros puntos:

- existencia del roadmap maestro;
- declaración canónica;
- secciones de gates, próximos bloques, congelamiento y decisión vigente;
- existencia de exactamente un bloque `NEXT`;
- instrucciones vinculantes en `AGENTS.md`;
- enlace y explicación en `README.md`;
- alineación obligatoria en la plantilla de PR;
- inclusión del check dentro del Release Gate;
- ausencia de otra declaración maestra paralela en archivos raíz.

El guardrail no decide estrategia. Impide que la estrategia acordada se vuelva opcional por accidente.

---

## 12. Decisión operativa

A partir de este contrato:

```text
ROADMAP.md
→ define la siguiente tarea
→ la PR ejecuta esa tarea
→ la evidencia valida el resultado
→ el roadmap cambia solo si la evidencia lo permite
→ se continúa con la siguiente tarea canónica
```

Este ciclo se mantiene hasta que el owner cambie explícitamente la dirección del producto.
