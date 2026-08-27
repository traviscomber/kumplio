# Documentación canónica del sistema Kumplio

**Estado de referencia:** producción validada  
**Commit base:** `e04427cc0132f60fb258af46ccd5254abd3b3f6e`  
**Fecha de corte:** 2026-08-27

Esta carpeta explica el sistema que existe en `main`. No reemplaza `ROADMAP.md`: el roadmap sigue siendo la única fuente de prioridad, secuencia y estado futuro. Estos documentos describen producto, arquitectura y operación vigente.

## Orden recomendado

1. [Producto y recorridos](01-producto-y-recorridos.md)
2. [Arquitectura técnica](02-arquitectura.md)
3. [Datos y Supabase](03-datos-y-supabase.md)
4. [API e integraciones](04-api-e-integraciones.md)
5. [Seguridad y privacidad](05-seguridad-y-privacidad.md)
6. [Agentes y workflows](06-agentes-y-workflows.md)
7. [Operación y despliegue](07-operacion-y-despliegue.md)
8. [Pruebas y assurance](08-pruebas-y-assurance.md)
9. [Mapa del repositorio](09-mapa-del-repositorio.md)
10. [Mantenimiento documental](10-mantenimiento-documental.md)

## Fuentes de verdad

| Prioridad | Fuente | Uso |
|---|---|---|
| 1 | `ROADMAP.md` | Prioridad, alcance y siguiente bloque |
| 2 | Código en `main` | Comportamiento implementado |
| 3 | Supabase observable | Esquema, políticas y datos desplegados |
| 4 | GitHub Actions y Vercel | Evidencia de build, release y producción |
| 5 | `docs/assurance/` y ADR | Evidencia versionada y decisiones |
| 6 | Esta carpeta | Explicación integrada del estado vigente |

## Estado verificado del corte

- Release Gate #526: verde.
- Release qualification #625: verde.
- UI Golden Path #20: verde.
- Vercel `kumplio` y `v0-normative-compliance-analysis`: verdes.
- Recorrido productivo persistido: 3 etapas, 3 runs, 3 artefactos y 3 revisiones.
- Cola durable al cierre: 0 jobs activos y 0 dead letters.
- Veredicto: **GO**.

## Regla de lectura

Los documentos históricos, auditorías y planes conservan valor como antecedente, pero no deben utilizarse para contradecir el código actual, el esquema desplegado o el roadmap canónico.
