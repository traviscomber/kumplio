# Kumplio — Acta de cierre técnico — 16 de agosto de 2026

Estado: **TECHNICAL CLOSE CANDIDATE · PRODUCT FREEZE**

Esta acta fija el estado defendible de Kumplio al cerrar el desarrollo activo. No certifica cumplimiento, no sustituye auditoría jurídica y no convierte evidencia sintética o interna en evidencia de cliente.

## 1. Decisión de cierre

Kumplio entra en **technical freeze**.

Desde este punto, el trabajo autorizado se limita a:

- seguridad P0;
- evidencia administrativa externa;
- revisión humana de evidencia ya solicitada;
- eliminación operacional final cuando los prerequisitos estén satisfechos;
- bugs críticos o regresiones;
- documentación/assurance que refleje hechos comprobados;
- preparación de piloto supervisado sin habilitar beta autoservicio.

No se autorizan nuevos módulos, rediseños amplios, cambios de arquitectura por preferencia ni avance automático a Bloques 17/18.

## 2. Anchor de código y producción

Anchor de `main` observado antes de la PR de cierre:

`128ab01ba09ffadd9a9fb418f97872f3c8274d25`

Estado Vercel observado el 16-08-2026:

- `Vercel – kumplio`: **success**;
- `Vercel – v0-normative-compliance-analysis`: **success**.

Los cambios funcionales tenant-specific ya estaban desplegados en el merge #269; el merge #268 agregó únicamente assurance/verificadores read-only y también alcanzó ambos despliegues en `success`.

## 3. Snapshot directo de Supabase

Observación read-only ejecutada el 16-08-2026 21:53 UTC sobre el proyecto:

`qhhybqfuenxojboymrsd`

PostgreSQL observado:

- versión: `17.6`;
- base: `postgres`.

Sobre las tres actividades reales N3uralia:

```text
providerTenantConfigurationStatus = verified     0/3
providerTenantConfigurationStatus = unverified   3/3
primaryDeletionOperationalStatus demonstrated    3/3
lifecycleDecision = changes_requested             3/3
```

Este snapshot prevalece sobre atributos/documentos históricos que puedan conservar texto antiguo.

## 4. Estado de evidence requests

### Tenant-specific

Las tres solicitudes reales están en `changes_requested` con evidencia parcial sometida:

1. Supabase / contactos — `6595082e-6140-43cb-b69f-ca65e74f34f2`;
2. Supabase / cuentas — `21494958-a7db-4d86-b1fa-d55549913f9d`;
3. OpenAI / expedientes IA — `b97fb811-55d5-416e-becc-b54d0d9753a0`.

La evidencia parcial no autoriza promoción a `verified`.

### Eliminación

Las tres solicitudes de evidencia de eliminación permanecen `changes_requested`:

- contactos — `1bc319f6-a2df-4b47-9c27-048a51f96548`;
- cuentas/Auth — `9bae2c78-cddd-4b62-8149-bf85c054a587`;
- expedientes/IA — `3105b82a-fbc1-4826-a896-41490ed46280`.

Esto es compatible con que la eliminación primaria controlada esté 3/3 demostrada: **primary deletion != final operational deletion**.

### Paquetes Lifecycle V2

Tres paquetes permanecen `open` y sin evidencia sometida:

- contactos — `2fceba00-20fa-4ed9-bfeb-ac1b7b5bf42c`;
- cuentas — `ec63fc76-9045-485a-a4ce-3eb63dfda4f7`;
- expedientes/IA — `c943358b-b23c-4374-97d9-fc42f7e09518`.

Vencimiento productivo observado: `2026-08-31 03:59:00+00`.

## 5. Migraciones productivas de cierre

Últimas migraciones de assurance/cierre observadas en `supabase_migrations.schema_migrations`:

| Versión | Nombre |
|---|---|
| `20260816211617` | `provider_tenant_configuration_evidence_intake_v1` |
| `20260816162336` | `provider_retention_probe_dispatch_v1` |
| `20260816162119` | `processing_provider_tenant_configuration_review_v1` |

La migración de intake instala el flujo atómico de:

`managed/contractual source → SHA-256 evidence → submission → human review → guarded promotion`.

La promoción tenant-specific requiere evidencia aceptada, íntegra, process/provider scoped y configuración efectiva observada; `changes_requested` o `rejected` nunca promocionan.

## 6. OpenAI — estado defendible

### Demostrado

- identidad/runtime productiva reconciliada a nivel organización;
- organización observada: `org-WMy0WPkUDGJIP7ZUq9cqMzQL`;
- proyecto administrativo visible: `proj_hbtpqIGo5E05JzzcjZqgKrya` (`Default project`);
- retention probe productivo ejecutado con input fijo sintético;
- `store:true` aceptado;
- Response recuperable posteriormente;
- `store=true` observado en retrieve;
- DELETE posterior HTTP 200;
- objeto de application state eliminado;
- evidencia hash/integrity registrada.

### Interpretación permitida

El resultado contradice Zero Data Retention para la request/configuración observada porque la request produjo application state recuperable con `store=true`.

### No demostrado

- que la API key productiva esté administrativamente ligada al proyecto visible;
- Standard vs Modified Abuse Monitoring;
- purga de abuse-monitoring logs;
- eliminación operacional final en todas las capas del proveedor.

Por lo tanto:

```text
OpenAI organization binding    reconciliado
OpenAI ZDR                     contradicho para request observada
OpenAI project binding         pendiente evidencia administrativa
OpenAI Standard vs MAM         pendiente evidencia administrativa
```

No debe ejecutarse otro probe conductual para intentar distinguir Standard de MAM.

## 7. Supabase — estado defendible

### Demostrado

- proyecto productivo identificado: `qhhybqfuenxojboymrsd`;
- nombre observado: `kumplio`;
- región observada: `us-east-1`;
- plan Pro observado;
- tres RPC tenant-specific instalados y protegidos;
- evidencia parcial de policy/baseline registrada.

### Pendiente

- modo efectivo `daily|pitr` observado administrativamente;
- PITR enabled/disabled;
- ventana efectiva de recuperación;
- cierre de backup purge aplicable.

No se permite inferir PITR desde settings internos de PostgreSQL.

## 8. Seguridad

### Cerrado dentro del alcance técnico

- RLS/tenant boundaries forman parte de los contratos existentes;
- RPC críticos tenant-specific no son ejecutables por `anon`/`authenticated`;
- promoción requiere `service_role/postgres` y validación humana previa;
- secrets del retention probe permanecen en Vault/runtime privado;
- los probes no devuelven prompt/output ni datos de cliente.

### P0 abierto

**Supabase Auth Leaked Password Protection permanece desactivada.**

Cierre requerido antes de beta autoservicio:

1. activar el control en Supabase Auth;
2. reejecutar Security Advisor;
3. probar registro, recuperación y cambio de contraseña;
4. registrar evidencia.

Este control no se marca resuelto mientras el connector disponible no permita efectuar/verificar el cambio.

## 9. Lifecycle V2

Resultado persistido en 3/3:

```text
decision          changes_requested
basis             pending_evidence
retention         needs_changes
recipients        pending_evidence
subprocessors     pending_evidence
transfers         pending_evidence
```

Ninguna dimensión fue promovida a `validated`.

Integridad ya verificada:

- latest V2 3/3;
- `supersedes_id` → V1 3/3;
- evidencia `accepted · verified` 3/3;
- evidence hash = snapshot hash 3/3;
- process pointer → latest V2 3/3.

El próximo cambio de lifecycle solo puede ocurrir después de evidencia independiente nueva.

## 10. Eliminación

### Cerrado

Eliminación primaria controlada:

- leads: 1/1;
- account/auth/profile/membership: 1/1;
- case/workflow/run: 1/1;
- total: **3/3**.

### Abierto

Eliminación operacional final:

**0/3**.

No debe ejecutarse como cierre final hasta contar con assurance tenant-specific suficiente para la actividad/proveedor aplicable.

## 11. Agentic assurance

El flujo productivo sintético controlado 5x ya demostró:

- workflow de cinco etapas;
- Isidora, Rodrigo, Verónica, Javier y Julieta;
- 5 runs;
- 5 artifacts;
- 5 human reviews;
- provider traces 5/5;
- durable queue;
- cero tool-call failures en la corrida documentada;
- decisión final con reservas sin convertir la aprobación humana en una declaración de cumplimiento.

Referencia:

`docs/assurance/agent-flow-production-e2e-5x-2026-08-14.md`.

Esto no sustituye un piloto con organización externa.

## 12. Higiene GitHub al cierre

Merged en la secuencia final:

- #266;
- #267;
- #269;
- #268.

Cerradas sin merge por freeze/supersesión:

- #265 — Home/Demo 2.0, preservada como `DEFERRED`;
- #240 — deletion drill histórico;
- #197 — política de modelo histórica;
- #55 y #35 — lineage histórico;
- #30 — control plane histórico;
- #31 — positioning histórico.

Al crear esta acta, la búsqueda de PRs abiertas del repositorio devolvió **0 PRs abiertas** antes de abrir la PR de cierre técnico.

Las ramas históricas se preservan; cerrarlas no equivale a borrarlas.

## 13. Lo que significa “Kumplio técnicamente cerrado”

Significa:

- el producto base está operativo;
- la arquitectura crítica existe y está versionada;
- el release está gobernado por gates;
- producción está desplegada;
- unknowns y reservas se preservan;
- los pendientes reales están convertidos en requests/workflows cerrables;
- no hace falta construir nuevas features para resolver los P0 actuales.

No significa:

- cumplimiento legal certificado;
- beta autoservicio lista;
- tenant configuration 3/3;
- eliminación final 3/3;
- piloto externo completado.

## 14. Gates para salir del freeze hacia beta privada

Todos deben evaluarse explícitamente:

1. Leaked Password Protection activada y verificada;
2. Supabase tenant configuration suficiente para las actividades aplicables;
3. OpenAI project binding + Standard/MAM administrativamente observados;
4. eliminación operacional final acreditada cuando corresponda;
5. nueva revisión lifecycle basada en evidencia suficiente;
6. piloto externo supervisado;
7. revisión final de claims y release.

Salir del freeze requiere decisión explícita del owner registrada en `ROADMAP.md`.

## 15. Riesgo aceptado durante el freeze

Mientras los P0 externos sigan abiertos, Kumplio puede utilizarse para:

- desarrollo interno;
- demos acompañadas;
- pruebas sintéticas/controladas;
- preparación y ejecución de piloto supervisado cuando los datos/alcance estén aprobados.

No se habilita beta privada autoservicio ni se hacen claims que dependan de gates todavía no demostrados.

## 16. Veredicto

> **Kumplio está técnicamente listo para entrar en freeze de producto. La deuda restante de la ruta crítica es principalmente evidencia/configuración externa y validación supervisada, no falta de arquitectura o nuevas features.**

Este veredicto debe invalidarse si un release posterior rompe los gates, cambia arquitectura crítica sin assurance, o si nueva evidencia contradice el snapshot aquí documentado.
