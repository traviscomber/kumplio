# Compliance Core v1

## Objetivo

Convergencia de fuentes oficiales, claims, obligaciones, perfiles organizacionales e impacto normativo en un modelo auditable y extensible.

## Principios

1. La evidencia oficial es inmutable.
2. Los claims nacen pendientes de revisión humana.
3. Una obligación no se asigna a una organización sin una regla de aplicabilidad trazable.
4. Todo impacto normativo conserva causa, versión, regla y resultado.
5. Los cálculos pueden repetirse de forma idempotente.

## Capas

- **Capa canónica:** instrumentos, versiones, secciones, claims y citas.
- **Perfil organizacional:** actividades, regiones, dotación, procesos, permisos y atributos.
- **Aplicabilidad:** reglas explícitas que comparan claims con perfiles.
- **Obligaciones:** asignaciones por organización con estado, prioridad, responsable y fechas.
- **Impacto:** ejecuciones que recalculan asignaciones cuando cambia una versión regulatoria o un perfil.

## Flujo

```text
fuente oficial
→ versión regulatoria
→ sección
→ claim citable
→ regla de aplicabilidad
→ perfil organizacional
→ obligación asignada
→ riesgo / tarea / evidencia
```

## Límites

- No se infiere aplicabilidad mediante texto libre sin una regla persistida.
- No se presenta una asignación como obligación validada mientras el claim o la regla estén pendientes.
- Un cambio normativo no sobrescribe asignaciones históricas: crea una nueva ejecución y registra altas, bajas o cambios.
