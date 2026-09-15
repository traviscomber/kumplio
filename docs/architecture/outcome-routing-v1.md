# Outcome routing v1

## Objetivo

Kumplio debe sentirse como una sola experiencia aunque internamente coordine múltiples especialistas. El usuario pide un resultado; Kumplio decide cuánta arquitectura necesita para producirlo con evidencia y control humano.

## Patrón

```text
Solicitud
  ↓
Router
  ├─ FastTrack
  │    └─ respuesta acotada sin activar una cadena agentic innecesaria
  │
  └─ FullAgentic
       ├─ Entender — Isidora
       ├─ especialistas opcionales — Beatriz / Rodrigo / Javier / Andrés
       ├─ Resolver — Verónica
       ├─ Demostrar y revisar — Julieta (id histórico: catalina)
       └─ ComplianceOutcome
```

La referencia conceptual es “Compliance Brain Assistant: Conversational Agentic AI for Assisting Compliance Tasks in Enterprise Environments”, arXiv:2507.17289. Kumplio adapta el patrón; no importa resultados experimentales del paper como evidencia propia.

## Router

El router v1 es determinístico y auditable. Usa señales explícitas:

- dependencia de documentos, evidencia u otros artefactos internos;
- necesidad de herramientas o acciones;
- intención del caso;
- lenguaje multi-etapa;
- complejidad contextual.

`fast_track` se reserva para solicitudes simples que no dependen de artefactos internos ni requieren una cadena de acciones. `full_agentic` se usa cuando la respuesta debe integrar contexto tenant, evidencia, herramientas, varias etapas o un resultado operativo trazable.

La selección del workflow concreto dentro de FullAgentic deriva de la intención salvo que un caller autorizado entregue un tipo explícito.

## Contrato de outcome

Todos los especialistas pueden conservar sus schemas especializados, pero la experiencia no debe exponerlos como siete productos distintos. La salida consolidada es `ComplianceOutcome`:

- `status`;
- `headline` y `summary`;
- `decision` cuando exista;
- `nextAction`;
- `actions` con responsable, prioridad, dependencias y criterios de cierre;
- `missing`;
- `blockers`;
- `evidence` y `evidenceCount`;
- `humanReviewRequired` y razones;
- especialistas utilizados para trazabilidad secundaria.

Un outcome nunca se marca como listo si conserva faltantes o bloqueos conocidos.

## Experiencia

La superficie principal muestra primero:

1. resultado;
2. próxima acción;
3. qué falta;
4. bloqueos o reservas;
5. evidencia disponible;
6. revisión humana requerida.

El pipeline, los agentes y los artefactos técnicos se mantienen disponibles como trazabilidad, pero no son la interfaz primaria.

## Evaluación

La calidad del outcome se mide separadamente de la validez estructural de cada agente. V1 evalúa:

- resumen ejecutivo presente;
- acción siguiente o bloqueo explícito;
- estado de evidencia explícito;
- criterio de cierre verificable;
- control humano explícito;
- ausencia de un falso estado `ready` con gaps abiertos.

Las dimensiones internas iniciales son `actionability`, `evidenceClarity`, `closureClarity` y `humanControl`. Estas métricas son de calidad del producto; no son scores de cumplimiento ni claims comerciales.

## Guardrails

- Sin fuente no hay afirmación regulatoria.
- Sin evidencia no hay conclusión de cumplimiento.
- La revisión humana permanece para decisiones legales, de auditoría y de cierre.
- El router no amplía permisos ni acceso tenant.
- La capa de outcome no modifica evidencia ni estados de cumplimiento; consolida resultados existentes.
- FastTrack no se declarará completo hasta estar conectado a las entradas conversacionales correspondientes y evaluado con casos propios de Kumplio.
