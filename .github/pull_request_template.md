## Resumen

Describe qué cambia y qué problema del usuario resuelve.

## Alineación con el roadmap canónico

**Bloque, gate o defecto autorizado:**

> Ej.: Bloque 16, Gate P0 de seguridad o regresión productiva.

**Resultado canónico que cierra:**

> Describe la tarea o salida de `ROADMAP.md` que esta PR completa.

**Trabajo excluido para evitar desviación:**

> Explica qué idea, módulo o refactor se dejó fuera deliberadamente.

- [ ] El trabajo corresponde a `NEXT`, `ACTIVE`, `P0` o una corrección permitida
- [ ] No adelanta trabajo `PLANNED` o `DEFERRED`
- [ ] Si cambia prioridad o estado, `ROADMAP.md` se actualiza en esta misma PR
- [ ] La PR no introduce una segunda fuente de verdad paralela al roadmap
- [ ] Si es una excepción de emergencia, explica la emergencia y cómo se retoma el bloque interrumpido

## Evidencia y estado

**Estado anterior:**

> `PLANNED`, `ACTIVE`, `DEPLOYED`, `VALIDATED INICIAL`, `VALIDATED`, `DONE`, `BLOCKED` o `DEFERRED`.

**Estado que la evidencia permite declarar:**

> No elevar el estado por intención; solo por pruebas observables.

**Evidencia principal:**

> Código, migración, consulta, test, run, preview, métrica o documento de assurance.

## Validación técnica

- [ ] `npm run check:canonical-roadmap` en verde
- [ ] TypeScript / typecheck en verde
- [ ] Lint en verde
- [ ] Build en verde
- [ ] Validación funcional relevante en verde
- [ ] Migraciones aditivas y reversibles cuando corresponde
- [ ] Sin exposición de secretos ni debilitamiento de RLS
- [ ] Preview de Vercel revisado cuando corresponde

## The Kumplio Way

### Experiencia

- [ ] La experiencia es más simple o elimina complejidad visible
- [ ] La pantalla o flujo responde una pregunta principal
- [ ] La acción principal se entiende en menos de diez segundos
- [ ] No se añadió jerga interna, técnica o legal innecesaria
- [ ] Se prioriza lo importante en vez de mostrar volumen

### Conversación

- [ ] Explica qué ocurrió y por qué importa antes de pedir una decisión
- [ ] Presenta una recomendación responsable y una acción clara
- [ ] Reconoce incertidumbre cuando la evidencia no es suficiente
- [ ] El tono es profesional, sereno, transparente y sin marketing

### Decisión

- [ ] La IA propone; la persona decide en acciones críticas
- [ ] Toda recomendación importante conserva fundamento y evidencia
- [ ] Publicar, aprobar, firmar, eliminar o enviar requiere autorización explícita
- [ ] Las transiciones inválidas se previenen antes de mostrar un error

## Prueba de eliminación

¿Qué elemento, campo, clic o decisión se eliminó, infirió o automatizó para evitar trasladar complejidad al usuario?

> Respuesta:

## Riesgos y reversión

**Riesgos conocidos:**

> Describe impacto posible, alcance tenant, datos o dependencia externa.

**Cómo revertir:**

> Explica la reversión técnica o por qué el cambio es aditivo y seguro.
