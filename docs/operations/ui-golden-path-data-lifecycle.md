# Ciclo de vida de datos — UI Golden Path

> Estado: procedimiento diseñado; limpieza destructiva todavía no aplicada  
> Fecha de clasificación: 7 de agosto de 2026  
> Proyecto Supabase: `qhhybqfuenxojboymrsd`  
> Assurance oficial: `docs/assurance/ui-golden-path-production-3x-2026-08-07.md`

---

## 1. Objetivo

Separar los tenants sintéticos de assurance en categorías con retención explícita, impedir que inflen métricas comerciales y permitir una limpieza tenant-scoped sin desactivar auditoría, inmutabilidad ni aislamiento.

La regla principal es:

> **Nunca se elimina un tenant que ya tenga eventos inmutables solo para dejar la base “más limpia”.**

Los eventos inmutables forman parte de la evidencia del producto. Su retención o archivo debe resolverse mediante una política específica, no desactivando triggers ni realizando borrados parciales.

---

## 2. Clasificación vigente

### A. Assurance oficial 3/3 — conservar

| Intento | Usuario | Organización |
|---:|---|---|
| 1/3 | `ui-golden-path-31229627159-1@kumplio.invalid` | `f02634d4-8dfe-46b3-b58f-fd1c188a1230` |
| 2/3 | `ui-golden-path-31229627159-2@kumplio.invalid` | `855eb5b2-c35c-4130-b80c-d87576bc0140` |
| 3/3 | `ui-golden-path-31229627159-3@kumplio.invalid` | `68291744-3ea1-424f-88ad-c199a780c662` |

Motivo de retención:

- constituyen la evidencia canónica del gate 3/3;
- tienen Playwright y aserción server-side exitosos;
- sus artefactos poseen digest documentado;
- permiten reproducir y auditar las métricas del cierre.

### B. Históricos con eventos inmutables — conservar o archivar, no borrar

| Usuario | Organización | Misión | Mission events | Actividad de tratamiento | Clasificación |
|---|---|---:|---:|---:|---|
| `ui-golden-path-31226304098-1@kumplio.invalid` | `81673ed9-2e66-4599-814b-edabe72526cb` | 1 | 2 | 0 | recorrido llegó a misión |
| `ui-golden-path-31227455035-1@kumplio.invalid` | `736f3893-f2bc-4f68-848a-b89be60e3363` | 1 | 2 | 1 | recorrido completo previo |
| `ui-golden-path-31228314204-1@kumplio.invalid` | `f3255ce0-b37e-4460-85ca-184ec903c493` | 1 | 2 | 1 | recorrido completo previo |

El trigger `mission_events_immutable`, ejecutado por `prevent_mission_event_mutation()`, bloquea `DELETE` y `UPDATE`. Una simulación amplia intentó eliminar estos tenants y fue correctamente detenida con:

```text
mission_events_are_immutable
```

Decisión:

- mantener estos tenants fuera de métricas comerciales;
- conservarlos mientras no exista política de archivo de auditoría;
- no desactivar el trigger;
- no borrar organizaciones dejando eventos o telemetría huérfanos;
- evaluar más adelante exportación firmada + tombstone/archivo, sin alterar el ledger original.

### C. Pre‑misión e incompletos — candidatos a limpieza

| Usuario | Organización | Estado observado |
|---|---|---|
| `ui-golden-path-31224219777-1@kumplio.invalid` | — | identidad preparada; ningún workspace |
| `ui-golden-path-31224669239-1@kumplio.invalid` | `bbb9134c-2661-4c07-8c0a-33bab603f9a0` | onboarding y caso inicial; sin workflow |
| `ui-golden-path-31225188519-1@kumplio.invalid` | `7df3cfe5-ba8e-430c-ae9a-e164b5205bf3` | workflow parcial; una etapa ejecutada |
| `ui-golden-path-31225760803-1@kumplio.invalid` | `c19429e1-78a2-44cc-880e-dd6216ae94d3` | onboarding y caso inicial; sin workflow |

Alcance exacto de esta limpieza:

| Recurso | Cantidad |
|---|---:|
| Usuarios | 4 |
| Perfiles | 4 |
| Organizaciones | 3 |
| Membresías | 3 |
| Proyectos | 3 |
| Casos | 4 |
| Eventos de caso | 8 |
| Workflows | 1 |
| Etapas | 5 |
| Runs | 1 |
| Artefactos | 1 |
| Jobs | 1 |
| Tool calls | 3 |
| Revisiones de agentes | 0 |
| Misiones | 0 |
| Mission events | 0 |
| Knowledge events | 0 |
| Actividades de tratamiento | 0 |

---

## 3. Guardas verificadas en modo lectura

Antes de diseñar el borrado se comprobó:

- `7` usuarios históricos no oficiales identificados inicialmente;
- `6` organizaciones históricas no oficiales identificadas inicialmente;
- las tres organizaciones oficiales del 3/3 no entran en ningún target;
- ningún target está referenciado por `tenant_assurance_runs`;
- ningún usuario target tiene membresía en una organización ajena;
- ningún perfil target apunta a una organización ajena;
- los proyectos candidatos no tienen referencias `RESTRICT` o `NO ACTION`;
- todas las referencias bloqueantes de los usuarios pre‑misión están dentro de sus propias organizaciones;
- los tres candidatos de organización no tienen `mission_events` ni `knowledge_events`.

La simulación con los seis tenants históricos completos fue descartada porque encontró eventos de misión inmutables. Ese resultado se considera una validación de seguridad, no un obstáculo que deba rodearse.

---

## 4. Orden de borrado diseñado

El orden es importante por las reglas de integridad:

```text
1. adquirir advisory lock transaccional
2. construir allowlist exacta de usuarios y organizaciones
3. validar conteos, emails, ausencia de misiones y referencias externas
4. eliminar telemetría cuya FK haría SET NULL
5. eliminar perfiles para liberar profiles.organization_id (NO ACTION)
6. eliminar organizaciones y dejar actuar cascadas tenant-scoped
7. comprobar que no quedan FK RESTRICT/NO ACTION hacia usuarios target
8. eliminar auth.users
9. verificar targets en cero y recursos retenidos sin cambios
10. ROLLBACK por defecto
```

¿Por qué no se elimina primero `auth.users`?

Porque tablas como `agent_runs`, `agent_jobs`, `agent_artifacts`, `agent_reviews`, `agent_workflows`, `compliance_cases` y `processing_activity_reviews` usan `RESTRICT` o `NO ACTION` hacia el usuario. La organización debe desaparecer primero para que sus cascadas borren esos registros; la identidad se elimina al final.

¿Por qué se elimina `profiles` antes de `organizations`?

Porque `profiles.organization_id` usa `NO ACTION`, por lo que impediría borrar la organización. El perfil pertenece a la identidad E2E incluida explícitamente en el target.

¿Por qué se tratan `ai_platform_runs` y `scraper_runs` por separado?

Porque su FK hacia organización usa `SET NULL`. Sin una eliminación explícita, la limpieza dejaría telemetría sintética sin tenant.

---

## 5. Script reversible

El procedimiento está versionado en:

`scripts/maintenance/cleanup-ui-golden-path-pre-mission.sql`

Características:

- targets explícitos, no patrón amplio de email;
- conteos esperados exactos;
- allowlist de las tres organizaciones oficiales;
- aborta si aparece una misión, `mission_event` o `knowledge_event`;
- aborta si existe referencia de tenant assurance;
- aborta ante membresía cruzada;
- inspecciona dinámicamente FKs `RESTRICT` y `NO ACTION` antes de borrar usuarios;
- compara conteos retenidos antes y después;
- termina en `ROLLBACK` por defecto.

Para una aplicación real, un operador con acceso de base debe revisar el reporte de la misma sesión y cambiar el `ROLLBACK` final por `COMMIT` únicamente después de confirmar respaldo, ventana de mantenimiento y ausencia de cambios concurrentes.

La automatización usada en este cierre no obtuvo autorización de la herramienta para ejecutar SQL destructivo en producción. No se intentó eludir esa barrera.

---

## 6. Métricas después de una eventual aplicación

Resultado esperado, todavía no aplicado:

| Métrica | Antes | Después esperado |
|---|---:|---:|
| Usuarios E2E | 10 | 6 |
| Organizaciones E2E | 9 | 6 |
| Organizaciones oficiales 3/3 | 3 | 3 |
| Organizaciones históricas inmutables | 3 | 3 |
| Workflows E2E | 7 | 6 |
| Actividades de tratamiento E2E | 5 | 5 |
| Organizaciones no E2E | 2 | 2 |

Ninguna métrica comercial debe cambiar.

---

## 7. Próxima decisión de arquitectura

Antes de intentar limpiar los tenants históricos con misión se necesita una política explícita de ledger:

1. plazo de retención de evidencia E2E;
2. exportación firmada de eventos;
3. archivo en storage separado o esquema frío;
4. tombstone de tenant sin mutar eventos;
5. relación entre derecho de eliminación y logs de auditoría;
6. mecanismo de verificación posterior al archivo;
7. aprobación de seguridad y cumplimiento.

Hasta entonces, esos tenants permanecen segregados y excluidos de métricas comerciales.
