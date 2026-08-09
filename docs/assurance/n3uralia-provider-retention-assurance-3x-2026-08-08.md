# Assurance de retención y eliminación de proveedores — 3/3

Fecha de revisión: 2026-08-08 (America/Santiago)

## Resultado

Las tres actividades reales de N3uralia tienen evidencia aceptada y verificada del boundary de proveedor, sin convertir documentación pública en una afirmación de purga tenant-specific.

| Actividad | Proveedor | Assurance | Backup / retención | Propagación externa | Configuración tenant |
|---|---|---|---|---|---|
| Contactos comerciales y demos | Supabase | `partial_policy_verified` | `policy_known_configuration_unverified` | `not_applicable` | `unverified` |
| Cuentas, autenticación y workspace | Supabase | `partial_policy_verified` | `policy_known_configuration_unverified` | `not_applicable` | `unverified` |
| Expedientes y especialistas IA | OpenAI | `partial_policy_verified` | `not_demonstrated` | `application_state_minimized` | `unverified` |

## Supabase

Fuente oficial revisada: Supabase Database Backups.

La documentación oficial establece que los proyectos pueden conservar backups diarios o PITR con períodos de recuperación dependientes del plan/configuración. El hecho de eliminar una fila de Postgres no demuestra que esa fila haya desaparecido inmediatamente de todas las copias recuperables.

Hechos locales preservados:

- proyecto `qhhybqfuenxojboymrsd`;
- Postgres `17.6.1.127`;
- eliminación primaria demostrada 3/3;
- el conector actual no expone inventario/configuración de backups del tenant.

Por lo anterior, Kumplio registra política conocida pero configuración tenant no verificada. No declara purga de backup.

## OpenAI

Fuente oficial revisada: OpenAI API Data Controls.

Hecho local verificado en código:

- `lib/agents/openai-runtime.ts` usa `/v1/responses` con `store: false`;
- no se usa background mode en ese runtime.

La documentación oficial indica que `store:false` minimiza application state, pero el control de abuse-monitoring puede conservar contenido hasta 30 días por defecto salvo controles aprobados como Zero Data Retention (ZDR) o Modified Abuse Monitoring (MAM). El estado ZDR/MAM del tenant de Kumplio no está disponible mediante los conectores actuales.

Por lo anterior, Kumplio registra `application_state_minimized`, no `demonstrated`.

## Evidencia productiva

- Contactos / Supabase: `f2610518-85f7-414e-b28f-eb330dda24bf` — SHA-256 `c7381f37cee2b9c9c31aaa35145ab7d3f7a1468d5f00b6d1ef31338d0fea39bf`.
- Cuentas/Auth / Supabase: `0892194d-0d63-4394-9095-c7efb0842290` — SHA-256 `d7adadafd59021afd01afd367e15a224d7d4df0a9f8aa2c8b0f3a85372030790`.
- Expedientes/IA / OpenAI: `9261efec-c156-44a5-a6fd-632a1c514ca0` — SHA-256 `2e919550434405aa431f4e5dd454a7a3ab53d42194d28c0cda308c990aa29f4d`.

## Estado canónico

```text
mapeo del aviso                         3/3
mecanismo controlado validado           3/3
eliminación primaria operativa          3/3
assurance de proveedor revisado         3/3
configuración tenant proveedor          0/3
eliminación operacional final           0/3
lifecycle                               changes_requested 3/3
```

## Gate de cierre

El Bloque 16 no puede presentar eliminación final 3/3 mientras no exista evidencia tenant-specific suficiente para las capas aplicables:

1. Supabase: configuración/retención efectiva de backups o PITR y el criterio de expiración aplicable al proyecto.
2. OpenAI: configuración efectiva de retención del proyecto/organización (por ejemplo ZDR/MAM cuando corresponda) o evidencia equivalente que permita sostener la propagación/expiración aplicable.

La política pública del proveedor es evidencia de contexto y contrato operacional esperado; no es evidencia de que un objeto específico haya sido purgado de todas las copias del tenant.
