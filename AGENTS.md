# KUMPLIO — instrucciones para agentes de ingeniería

## Contrato canónico de ejecución

`ROADMAP.md` es la **única fuente canónica de prioridad, secuencia y estado del producto**.

Antes de proponer, diseñar o programar cualquier cambio:

1. leer `ROADMAP.md` completo;
2. identificar el único bloque marcado `NEXT`;
3. revisar los gates `P0`, tareas `ACTIVE`, congelamiento de alcance y decisión vigente;
4. declarar qué bloque, gate o defecto autoriza el trabajo;
5. comprobar que el cambio no adelanta silenciosamente un bloque `PLANNED` o `DEFERRED`.

### Trabajo autorizado

Un cambio puede iniciarse únicamente cuando cumple al menos una condición:

- corresponde al bloque `NEXT`;
- cierra un gate `P0` o una tarea `ACTIVE`;
- corrige un bug, regresión, vulnerabilidad, fuga tenant, pérdida de datos o fallo de producción;
- responde a una decisión explícita del owner y actualiza `ROADMAP.md` dentro de la misma PR.

### No desviarse

- No iniciar módulos, integraciones, rediseños o experimentos fuera del roadmap por novedad, preferencia técnica o entusiasmo del agente.
- No reinterpretar “sigamos”, “vamos” o “continúa” como autorización para cambiar de bloque.
- No usar conversaciones, issues, comentarios, documentos secundarios o una PR como sustituto de `ROADMAP.md`.
- No marcar `DONE`, `VALIDATED` o `DEPLOYED` sin la evidencia exigida por el propio roadmap.
- No mover prioridades silenciosamente. Si cambia la secuencia, el roadmap debe cambiar primero o dentro de la misma PR.
- No mantener dos roadmaps maestros ni duplicar el estado canónico en otro archivo.

### Interpretación de continuidad

Cuando el owner diga “vamos”, “sigamos”, “continúa”, “go”, “siguiente bloque” o una instrucción equivalente, significa:

> **Tomar la siguiente tarea incompleta del bloque canónico vigente, sin cambiar de prioridad ni abrir un frente nuevo.**

Si el bloque está cerrado con evidencia suficiente, se continúa con el siguiente bloque definido en `ROADMAP.md`.

### Excepciones de emergencia

Solo se permite interrumpir la secuencia por:

- incidente de seguridad;
- caída de producción;
- riesgo de pérdida o corrupción de datos;
- fuga cross-tenant;
- fallo crítico de autenticación, autorización, facturación o release.

La PR de emergencia debe:

1. explicar la condición de emergencia;
2. limitar el cambio a restaurar seguridad o servicio;
3. incluir pruebas de no regresión;
4. actualizar `ROADMAP.md` si cambia estado, deuda o prioridad;
5. retornar después al bloque canónico interrumpido.

El contrato completo está en `docs/governance/canonical-roadmap-contract.md` y se valida con:

```bash
npm run check:canonical-roadmap
```

## Contexto del proyecto

KUMPLIO es una plataforma SaaS de cumplimiento continuo. El producto combina un workspace multiempresa, expedientes de cumplimiento, documentos, obligaciones, controles, evidencias, hallazgos, riesgos, acciones y agentes especializados con revisión humana.

Stack principal:

- Next.js App Router, React y TypeScript.
- Supabase Auth, Postgres, Storage y Row Level Security.
- Vercel para previews y producción.
- OpenAI Responses API para agentes con salidas estructuradas.
- Tailwind CSS y componentes UI reutilizables.

## Subagente de arquitectura

Para cualquier cambio no trivial de arquitectura, frontend, backend, Supabase, agentes IA, seguridad, rendimiento, despliegue o integración, lee y aplica primero:

`.agents/skills/travis-kumplio-architect/SKILL.md`

Este subagente se llama **Travis**. Es un agente interno de ingeniería y no forma parte de los agentes de cumplimiento visibles para clientes.

## Fuentes de verdad

La jerarquía obligatoria es:

1. `ROADMAP.md` para prioridad, alcance y estado;
2. código presente en `main`;
3. esquema y datos observables en Supabase;
4. Release Gate, pruebas, Vercel y evidencia técnica;
5. documentos de assurance y decisiones versionadas;
6. issues, PRs y conversaciones como contexto, nunca como autoridad superior.

Antes de modificar código:

1. inspeccionar el estado real de `main`;
2. leer los archivos afectados completos;
3. revisar migraciones, políticas RLS y contratos de API relacionados;
4. comprobar issues y PR recientes cuando afecten el alcance;
5. considerar Supabase y Vercel como estados desplegados que deben verificarse, no asumirse;
6. confirmar la alineación con el bloque canónico vigente.

## Reglas obligatorias

- No modificar `main` directamente. Trabajar en una rama y publicar mediante PR.
- No exponer claves, tokens, secretos ni credenciales en código, logs o documentación.
- No usar `service_role` o claves secretas en componentes cliente.
- No deshabilitar RLS ni ampliar permisos para resolver errores sin justificar el modelo de autorización.
- No ejecutar SQL destructivo en producción sin plan de reversión y aprobación explícita.
- No afirmar que una función está lista sin build, typecheck y validación del flujo relevante.
- No inventar métricas, clientes, fuentes legales, capacidades o estados del producto.
- Mantener revisión humana para conclusiones jurídicas, auditoría y decisiones sensibles.
- Preferir cambios pequeños, reversibles y verificables.
- Mantener estados vacío, carga, error y éxito cuando el cambio afecta interfaz.
- Conservar límites, incertidumbre y desconocidos en vez de mejorar artificialmente la confianza.
- Actualizar `ROADMAP.md` en la misma PR cuando cambie un estado, gate, prioridad o decisión.

## Protocolo de cada tarea

1. **Alineación:** nombrar bloque, gate o defecto autorizado.
2. **Evidencia previa:** comprobar el estado actual antes de cambiarlo.
3. **Implementación:** aplicar el cambio mínimo que cierra el resultado.
4. **Validación:** ejecutar checks relevantes, no solo typecheck.
5. **Publicación:** PR con alcance, riesgo, evidencia y alineación al roadmap.
6. **Cierre:** actualizar el estado canónico únicamente cuando las pruebas lo sostengan.
7. **Continuidad:** seleccionar la siguiente tarea incompleta del mismo bloque.

## Definición mínima de terminado

Un cambio está terminado solo cuando:

- el alcance está implementado;
- los estados vacío, carga, error y éxito están resueltos;
- autenticación y autorización están verificadas;
- build y typecheck pasan;
- los guardrails de producto y roadmap pasan;
- la migración es reproducible cuando hay cambios de base de datos;
- el preview de Vercel está aprobado;
- el PR explica qué cambió, por qué, riesgos y validaciones;
- el roadmap refleja el estado real si el cambio cerró o movió un gate;
- no queda una desviación silenciosa respecto del bloque canónico.
