# Assurance — flujo agentic productivo 5/5 — 14 de agosto de 2026

## Alcance

Esta evidencia registra una corrida **sintética y controlada** del workflow `compliance_assessment` en producción. Su objetivo es verificar el flujo técnico completo de especialistas, cola durable, worker, artefactos, trazabilidad del proveedor y revisión humana.

No utiliza esta corrida como evidencia de cliente, certificación, cumplimiento jurídico ni piloto externo.

## Recorrido observado

```text
expediente sintético
→ workflow de 5 etapas
→ PGMQ / agent_jobs
→ worker productivo
→ especialista
→ tool calls y fuentes
→ run estructurado
→ artefacto
→ revisión humana
→ siguiente etapa
→ cierre del workflow
```

Especialistas recorridos:

1. Isidora — obligaciones y aplicabilidad;
2. Rodrigo — riesgos;
3. Verónica — controles y evidencia;
4. Javier — plan de acción;
5. Julieta — revisión jurídica, calidad y consistencia.

## Resultado técnico

| Indicador | Resultado |
|---|---:|
| Etapas | 5/5 |
| Etapas aprobadas | 5/5 |
| Runs | 5 |
| Runs aprobados | 5 |
| Jobs durable | 5 |
| Jobs `succeeded` | 5/5 |
| Jobs al primer intento | 5/5 |
| Jobs fallidos | 0 |
| Artefactos | 5 |
| Artefactos aprobados | 5/5 |
| Revisiones humanas | 5 |
| Revisiones aprobadas | 5/5 |
| Provider traces persistidas | 5/5 |
| Tool calls | 24 |
| Tool calls fallidos | 0 |
| Tokens observados | 129.868 |
| Tiempo de modelo acumulado | 423.650 ms |

El workflow terminó en `completed`, con `completed_at` persistido y sin retry, dead-letter ni error de ejecución.

## Cola, leases y scheduler

Durante la corrida se verificó:

- enqueue durable mediante `agent_jobs` + PGMQ;
- lease por worker Vercel;
- heartbeat renovado durante ejecuciones largas;
- liberación del lease al finalizar;
- scheduler `private.dispatch_agent_worker()` activo cada minuto;
- jobs recogidos automáticamente por el scheduler, sin depender de una invocación manual permanente.

## Grounding y aislamiento SST

La corrida usó un expediente SST sintético para verificar separación de dominios.

### Isidora

- 8 obligaciones estructuradas;
- 8/8 con contrato explícito de aplicabilidad;
- 26 referencias de fuente propagadas;
- 0 tool calls fallidos;
- sin promoción de obligaciones de privacidad al dominio SST.

### Verónica

- grounding oficial SST con 21 referencias y 9 documentos;
- parser observado: `sst-ds44-suseso-v4`;
- `read_controls` y `read_evidence` limitados a dominios `sst` y `general`;
- `read_findings` bloqueado como `skipped` cuando no existía filtro de dominio seguro;
- 0 tool calls fallidos.

### Javier

- 3 fases de plan;
- 8 riesgos de ejecución;
- lecturas potencialmente cross-domain no seguras conservadas como `skipped`;
- 0 tool calls fallidos.

### Julieta

La revisión final no emitió una aprobación material limpia. La recomendación producida fue `request_changes`, con contradicciones y reservas explícitas.

La revisión de calidad confirmó que referencias textuales a privacidad provenían de casos sintéticos usados para comprobar aislamiento y **no fueron promovidas como obligación, evidencia normativa ni conclusión aplicable al cliente**.

La aprobación humana registrada corresponde a la calidad y trazabilidad del informe final, no a una declaración de cumplimiento.

## Guardrails comprobados

- un workflow activo del mismo tipo no puede duplicarse accidentalmente sobre el mismo expediente;
- cada etapa sensible requiere revisión humana para avanzar;
- la aprobación exige checklist de evidencia, limitaciones y soporte del outcome;
- los runs conservan source refs y provider trace;
- las herramientas sin aislamiento seguro pueden ser bloqueadas antes del modelo;
- los datos sintéticos permanecen etiquetados como tales.

## Conclusión

La corrida demuestra que el **flujo agentic durable de cinco etapas funciona de extremo a extremo en producción dentro del alcance sintético controlado probado**.

Esto no demuestra por sí solo cumplimiento regulatorio, suficiencia jurídica, comportamiento sobre cualquier caso posible ni resultado de una organización externa.
