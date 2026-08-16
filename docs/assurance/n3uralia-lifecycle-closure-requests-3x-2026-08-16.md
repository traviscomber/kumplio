# Bloque 16 — Paquetes de cierre Lifecycle V2 — 16 de agosto de 2026

Estado: **TRABAJO CREADO 3/3 · EVIDENCIA PENDIENTE 3/3**

Después de versionar Lifecycle V2 de las tres actividades reales, se creó un paquete de evidencia por actividad para convertir las brechas vigentes en trabajo cerrable sin generar quince solicitudes fragmentadas ni volver a pedir evidencia que ya existe.

Los tres requests están asignados al owner de la organización y vencen el **30 de agosto de 2026 a las 23:59 -04:00** (`2026-08-31 03:59:00+00`).

## 1. Contactos comerciales

Request:

`2fceba00-20fa-4ed9-bfeb-ac1b7b5bf42c`

Título:

`Paquete de cierre lifecycle — contactos comerciales`

Debe aportar evidencia independiente para:

1. base jurídica aprobada por finalidad, incluyendo respuesta inicial, seguimiento y usos posteriores;
2. política de retención para leads convertidos, descartados, inactivos y abandonados, con trigger y plazo;
3. matriz de accesos y destinatarios internos;
4. decisión sobre el rol de Pipedrive y, si se activa, contrato/DPA/alcance;
5. DPA y lista vigente de subencargados de Supabase;
6. mecanismo y salvaguardas de transferencia internacional.

No debe duplicar:

- request Supabase PITR/configuración tenant: `6595082e-6140-43cb-b69f-ca65e74f34f2`;
- evidencia de eliminación primaria ya demostrada;
- request de eliminación operacional final existente.

## 2. Cuentas, Auth y workspace

Request:

`ec63fc76-9045-485a-a4ce-3eb63dfda4f7`

Título:

`Paquete de cierre lifecycle — cuentas y acceso`

Debe aportar evidencia para:

1. base jurídica por finalidad y categoría de dato;
2. política de retención para cuenta, sesiones, tokens, perfil y auditoría;
3. matriz de accesos, roles, destinatarios internos y revisión periódica;
4. DPA y subencargados vigentes de Supabase;
5. mecanismo y salvaguardas de transferencia internacional;
6. protección de credenciales, MFA/recuperación/exportación y cierre de cuenta.

No debe duplicar:

- request Supabase PITR/configuración tenant: `21494958-a7db-4d86-b1fa-d55549913f9d`;
- eliminación primaria de cuenta/identidad/sesión/perfil/membresía, que ya está demostrada.

**Leaked Password Protection debe quedar activado y verificado en Security Advisor antes de considerar cerrado el control de credenciales.**

## 3. Expedientes y especialistas IA

Request:

`c943358b-b23c-4374-97d9-fc42f7e09518`

Título:

`Paquete de cierre lifecycle — expedientes e IA`

Debe aportar evidencia para:

1. base jurídica, roles y tratamiento de datos de terceros por tipo de expediente;
2. clasificación y minimización antes de enviar contexto a modelos;
3. política de retención para casos, contexto, artefactos, revisiones, logs y capas del proveedor;
4. matriz de destinatarios internos y permisos de revisores;
5. DPA, residencia y lista vigente de subencargados de OpenAI;
6. mecanismo y salvaguardas de transferencia internacional;
7. project binding administrativo de la API key y modo efectivo **Standard o Modified Abuse Monitoring**.

No debe duplicar:

- request OpenAI tenant-specific: `b97fb811-55d5-416e-becc-b54d0d9753a0`;
- eliminación primaria del expediente;
- retention probe ya ejecutado.

ZDR ya quedó contradicho para la request productiva observada. Standard vs MAM requiere evidencia administrativa y no debe intentarse inferir mediante otro probe de runtime.

El E2E interno 5/5 ya demuestra revisión humana controlada. La organización externa supervisada sigue siendo un gate separado de piloto y no sustituye evidencia jurídica/contractual.

## Estado de los requests

```text
paquetes lifecycle creados        3/3
status                             open 3/3
submitted evidence                 0/3
owner asignado                     3/3
vencimiento                        2026-08-30 23:59 -04:00
```

Crear estos requests no valida ninguna dimensión. Su aceptación futura debe depender de evidencia independiente suficiente y de una nueva revisión lifecycle versionada; nunca de marcar el ticket como completado por sí solo.
