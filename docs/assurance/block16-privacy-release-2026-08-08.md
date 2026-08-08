# Release — Bloque 16: aviso, mapeo y eliminación

**Fecha:** 8 de agosto de 2026  
**Release funcional:** PR #236  
**Commit funcional en `main`:** `96d7f00effe8bcde307682df5cff9355f9375b42`

## Alcance publicado

La release incorpora el cierre técnico-operacional de la tarea 3 del Bloque 16:

- aviso público versionado `2026-08-03`;
- una evidencia general `accepted · verified` con SHA-256;
- tres enlaces específicos del aviso a las actividades reales de N3uralia;
- tres misiones con owner, prioridad y vencimiento;
- tres solicitudes de mapeo del aviso;
- tres solicitudes de eliminación o anonimización;
- visibilidad del estado en Digital Twin;
- idempotencia por request key, actividad y versión del aviso;
- rechazo cross-tenant;
- README, roadmap y assurance reconciliados.

## Migraciones productivas

```text
20260808151723_processing_activity_privacy_remediation_v1
20260808152005_seed_n3uralia_privacy_remediation_v1
```

## Resultado productivo

| Objeto | Resultado |
|---|---:|
| Actividades reales | 3 |
| Evidencias versionadas del aviso | 1 |
| Enlaces específicos al aviso | 3 |
| Misiones | 3 |
| Solicitudes de mapeo | 3 |
| Solicitudes de eliminación | 3 |
| Mapeos aceptados con evidencia | 0 |
| Eliminaciones aceptadas con evidencia | 0 |

La release demuestra que los gaps están convertidos en trabajo trazable. No demuestra todavía que el aviso cubra cada actividad ni que una eliminación haya sido ejecutada.

## Validaciones

- Application Validation: `success`;
- Release Qualification Foundation: `success`;
- Release Gate: `success`;
- TypeScript, build y smoke: `success`;
- ambos previews de Vercel de la PR funcional: `success`;
- preflight reversible: `passed`;
- rollback sin residuos: `passed`;
- seed productivo 3/3: `passed`;
- verificación productiva read-only: `passed`;
- prueba negativa cross-tenant: `passed`.

## Nota de publicación

El squash commit de la PR funcional activó una restricción de autorización del autor en uno de los proyectos de Vercel, pese a que los previews, el build y todos los gates estaban verdes. Esta nota se publica mediante un merge estándar para regenerar el commit de producción sin modificar el alcance funcional ni los datos productivos.

## Evidencia relacionada

- `docs/assurance/n3uralia-processing-privacy-remediation-3x-2026-08-08.md`;
- `README.md`;
- `ROADMAP.md`.
