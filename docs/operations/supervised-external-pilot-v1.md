# Piloto externo supervisado v1

> Estado: **PREPARADO / NO EJECUTADO**  
> Fecha de revisión: 16 de agosto de 2026  
> Mercado: Chile  
> Alcance: una organización externa, acompañamiento humano obligatorio  
> Este documento no constituye evidencia de cliente, certificación ni conclusión de cumplimiento.

## 1. Objetivo

Observar el recorrido real de una organización externa dentro de Kumplio y obtener evidencia de producto sobre:

1. comprensión del problema inicial;
2. tiempo hasta el primer valor útil;
3. continuidad entre registro, onboarding y expediente;
4. utilidad de especialistas, fuentes, evidencia y reservas;
5. calidad de la revisión humana;
6. capacidad de convertir un hallazgo en una acción verificable;
7. fricciones, abandonos y preguntas que el producto todavía no resuelve bien.

El objetivo del piloto es **aprender y verificar el producto**, no demostrar que la organización está en cumplimiento.

## 2. Dos fases, sin saltarse los gates

### Fase A — dry-run supervisado

Puede ejecutarse con datos ficticios, sintéticos o desidentificados y sin información sensible de una organización real.

Condiciones mínimas:

- PR y release gates verdes;
- flujo registro → onboarding → expediente validado;
- revisión humana obligatoria;
- ninguna automatización irreversible;
- ninguna salida presentada como certificación o asesoría jurídica;
- datos de prueba inequívocamente identificados como tales.

La Fase A permite validar experiencia y operación sin convertir un pendiente de privacidad en un riesgo para terceros.

### Fase B — organización externa con contexto real limitado

No debe comenzar hasta que los gates de seguridad y privacidad aplicables al tratamiento real estén cerrados o exista una decisión explícita y documentada del owner que delimite un alcance menor y seguro.

Como mínimo debe revisarse el estado vigente de:

- Leaked Password Protection;
- configuración tenant-specific de proveedores;
- retención y eliminación operacional aplicable;
- dimensiones lifecycle críticas del Bloque 16;
- permisos, aislamiento tenant y revisión humana;
- política de datos permitidos durante el piloto.

Si cualquiera de estos puntos permanece abierto, el piloto debe volver a Fase A o excluir los datos afectados.

## 3. Organización candidata

La primera organización debe ser fácil de acompañar y tener un caso acotado. Preferir:

- 10–200 personas;
- un responsable disponible para 2–3 sesiones breves;
- un problema concreto de protección de datos o Ley 21.719;
- disposición a trabajar inicialmente con información minimizada;
- sin necesidad de migraciones masivas o integraciones críticas para obtener valor.

Evitar como primer piloto:

- datos de salud a gran escala;
- datos de menores;
- categorías especialmente sensibles innecesarias;
- incidentes activos de alta severidad;
- decisiones que requieran automatización irreversible;
- organizaciones que esperen una certificación de cumplimiento.

## 4. Caso inicial recomendado

Usar un solo objetivo que pueda convertirse en expediente, por ejemplo:

> “Necesitamos entender qué tratamientos de datos personales debemos ordenar primero para prepararnos para la Ley 21.719 y qué evidencia nos falta.”

El caso debe tener suficiente contexto para activar el flujo, pero no debe mezclarse con cinco problemas regulatorios distintos.

## 5. Protocolo de sesión

### Sesión 0 — preparación interna

Antes de invitar a la organización:

- revisar estado de gates;
- crear lista de datos permitidos/prohibidos;
- confirmar quién acompaña el piloto;
- preparar rollback y contacto de soporte;
- definir el caso inicial y los criterios de éxito;
- registrar versión/commit desplegado.

### Sesión 1 — primer valor

La persona participante debe recorrer sin instrucciones técnicas:

1. llegar a la home;
2. describir su situación;
3. registrarse;
4. completar onboarding;
5. volver a la situación escrita;
6. crear el expediente;
7. entender qué está haciendo Kumplio;
8. llegar al primer resultado revisable.

El acompañante observa y solo interviene cuando la persona queda bloqueada.

### Sesión 2 — evidencia y decisión

Validar que la persona pueda:

1. reconocer la fuente o respaldo de una conclusión;
2. distinguir evidencia, reservas y hallazgos;
3. entender qué falta confirmar;
4. aprobar o pedir cambios con fundamento;
5. identificar la siguiente acción concreta.

### Sesión 3 — cierre y recurrencia

Revisar:

- qué acción se completó;
- qué evidencia quedó asociada;
- qué sigue abierto;
- si la persona volvería a Kumplio sin acompañamiento;
- qué parte del producto eliminaría, simplificaría o explicaría mejor.

## 6. Métricas obligatorias

Registrar, como mínimo:

| Métrica | Definición |
|---|---|
| `signup_started_at` | inicio del registro desde una situación pública |
| `workspace_ready_at` | workspace disponible |
| `case_started_at` | expediente guiado creado |
| `first_reviewable_result_at` | primer resultado persistido que puede revisarse |
| `first_human_decision_at` | primera aprobación o solicitud de cambios |
| `first_evidence_backed_action_at` | primera acción vinculada a respaldo verificable |
| `case_resolved_at` | cierre del expediente, cuando corresponda |
| `manual_interventions` | veces que el acompañante tuvo que destrabar al usuario |
| `blocking_questions` | preguntas que impidieron avanzar sin ayuda |
| `rework_count` | resultados que requirieron nueva ejecución |

Derivados prioritarios:

- tiempo registro → workspace;
- tiempo situación → expediente;
- **time to first reviewable value**;
- tiempo primer resultado → primera decisión humana;
- porcentaje de etapas aprobadas sin rework;
- cantidad de intervenciones humanas de soporte;
- retorno voluntario a una segunda sesión.

No convertir una muestra de una organización en una tasa de mercado.

## 7. Evidencia del piloto

Separar cuatro tipos de evidencia:

1. **telemetría de producto** — timestamps, eventos, estados y errores;
2. **evidencia del expediente** — fuentes, artefactos, reservas, revisiones y acciones;
3. **observación UX** — bloqueos, dudas y navegación;
4. **feedback declarado** — comentarios de la persona participante.

Nunca mezclar feedback subjetivo con evidencia regulatoria.

## 8. Guardrails de datos

- minimización por defecto;
- no solicitar datos personales que no sean necesarios para el objetivo del piloto;
- excluir secretos, credenciales y datasets completos si bastan ejemplos reducidos;
- no reutilizar información del piloto como demo pública;
- no publicar nombre, logo, métricas o resultados de la organización sin autorización específica;
- eliminar o anonimizar material de prueba conforme al alcance autorizado y a los mecanismos realmente verificados;
- si el mecanismo de eliminación aplicable no puede demostrarse, no prometer que la eliminación fue final o propagada a terceros.

## 9. Stop conditions

Detener o degradar a dry-run si ocurre cualquiera de estos eventos:

- aislamiento tenant dudoso;
- exposición de datos entre organizaciones;
- acción irreversible sin aprobación humana;
- resultado importante sin procedencia suficiente presentado como certeza;
- error de autenticación que permita acceso indebido;
- necesidad de cargar información que excede la política del piloto;
- el participante interpreta Kumplio como certificador y la interfaz no corrige esa expectativa.

## 10. Criterios de salida

El piloto solo puede marcarse **OBSERVED** cuando exista evidencia suficiente de una organización externa completando el alcance definido.

No equivale a `VALIDATED` comercialmente.

Para considerar el piloto exitoso deben cumplirse todos:

- continuidad registro → onboarding → expediente sin reescribir la situación;
- primer resultado revisable alcanzado;
- al menos una decisión humana registrada;
- fuente/evidencia y reservas comprendidas por la persona participante;
- ninguna violación de aislamiento o seguridad;
- lista de fricciones priorizada;
- métricas y notas conservadas en un artefacto interno;
- cierre explícito de qué se probó y qué no se probó.

## 11. Resultado esperado

El entregable final del piloto debe ser un informe corto con:

- versión desplegada;
- organización identificada internamente;
- alcance y tipo de datos utilizados;
- funnel observado;
- tiempos clave;
- fricciones;
- fallas y reintentos;
- valor percibido;
- cambios P0/P1/P2 derivados;
- decisión: `repeat_pilot`, `expand_scope`, `hold` o `prepare_self_service`.

`prepare_self_service` solo significa que el piloto no bloquea ese trabajo. La habilitación de beta autoservicio sigue sujeta a todos los gates canónicos del `ROADMAP.md`.
