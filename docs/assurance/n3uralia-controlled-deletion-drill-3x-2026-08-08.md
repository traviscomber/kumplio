# Assurance — Drill controlado de eliminación/anominización 3/3

**Fecha:** 8 de agosto de 2026  
**Organización:** N3uralia  
**Bloque:** 16  
**Estado:** `VALIDATED CONTROLLED TEST / REAL DELETION OPEN`

## Resultado

Kumplio ejecutó tres drills controlados, uno por actividad real de tratamiento. Cada drill creó un probe exclusivamente sintético en la base primaria, registró el hash previo, anonimizó los identificadores sintéticos, verificó su ausencia y generó evidencia con integridad SHA-256.

Resultado productivo:

| Indicador | Resultado |
|---|---:|
| Drills `passed_controlled_test` | 3/3 |
| Probes anonimizados | 3/3 |
| Evidencias con integridad verificada | 3/3 |
| Solicitudes de eliminación `submitted` | 3/3 |
| Solicitudes de eliminación `accepted` | 0/3 |
| Datos reales de titulares tocados | 0 |
| Purga de backups demostrada | 0/3 |
| Propagación a procesadores externos demostrada | 0/3 |

## Frontera de evidencia

**Un drill controlado aprobado técnicamente no equivale a eliminación real de datos productivos.**

La prueba demuestra únicamente que:

1. Kumplio puede crear un registro sintético delimitado;
2. puede registrar su estado previo mediante hash;
3. puede anonimizar los identificadores sintéticos;
4. puede verificar que esos identificadores ya no aparecen en el probe;
5. puede persistir evidencia auditable y entregarla a una solicitud existente.

No demuestra:

- eliminación de datos reales de titulares;
- eliminación en backups;
- propagación de una eliminación a OpenAI, Supabase u otros proveedores;
- cumplimiento integral de una política de retención;
- cierre jurídico de la actividad de tratamiento.

## Contrato operacional

La migración `20260808234542_processing_controlled_deletion_drill_v1` incorpora:

- `processing_deletion_drills`;
- `processing_deletion_probe_records`;
- RPC `run_processing_controlled_deletion_drill_v1`;
- RLS y denegación explícita para navegador;
- `SECURITY INVOKER` y `search_path=''`;
- ejecución únicamente para `service_role` y `postgres`;
- advisory locks por actividad y request key;
- evidencia `attestation` con SHA-256;
- envío de la solicitud mediante el workflow de evidencia ya existente.

El RPC **no** llama `review_evidence_request_record`: la solicitud queda `submitted` para una revisión posterior.

## Metadata obligatoria de la evidencia

Cada evidencia conserva:

```text
scope = controlled_deletion_drill
method = anonymization
provider = Kumplio / Supabase Postgres
target = controlled_synthetic_probe
syntheticIdentifiersRemoved = true
productionSubjectDataTouched = false
backup_purga_programada = not_applicable_to_controlled_probe
backup_purga_confirmada = not_applicable_to_controlled_probe
externalProcessorPropagation = not_tested
```

## Idempotencia

Repetir el mismo drill con la misma `request_key` devuelve:

```text
resumed = true
```

sin crear un cuarto drill ni una cuarta evidencia. Después del retry persistieron exactamente tres drills y tres evidencias del alcance.

## Estado siguiente

El siguiente subgate no es crear más infraestructura. Es decidir, por cada tratamiento, cómo obtener evidencia real de eliminación o anonimización incluyendo backups y proveedores cuando corresponda. Hasta entonces:

```text
controlled test = 3/3
real deletion evidence = 0/3
```
