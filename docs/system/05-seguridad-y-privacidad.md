# Seguridad y privacidad

## Objetivo

Evitar acceso cross-tenant, exposición de secretos, mutaciones no autorizadas, evidencia engañosa y avance automático sin revisión humana.

## Controles por capa

| Capa | Controles |
|---|---|
| HTTP | Headers de seguridad, no-store y noindex en rutas privadas |
| Sesión | Refresco Supabase en proxy y verificación server-side |
| Autorización | Membresía, rol, capacidad y filtros por organización |
| Datos | RLS, RPC atómicas, grants restringidos e índices tenant |
| IA | Contexto acotado, validación estructurada y revisión humana |
| CI | Auditoría de dependencias, boundaries y contratos |
| E2E | Identidad sintética aislada, OIDC y evidencia persistida |

## Secretos

Nunca documentar valores de:

- claves Supabase;
- contraseñas Postgres;
- tokens GitHub/Vercel;
- claves OpenAI o Resend;
- credenciales de pruebas.

Variables públicas solo pueden contener valores expresamente diseñados para el cliente. Toda credencial privilegiada debe permanecer server-side.

## OIDC para assurance

Los endpoints internos de E2E verifican, entre otros:

- emisor y audiencia;
- sujeto;
- repositorio y sus IDs inmutables;
- branch/ref;
- workflow y `workflow_sha`;
- run ID e intento;
- expiración y emisión;
- entorno del runner.

La identidad E2E queda vinculada al commit y corrida. La aserción rechaza un despliegue que haya avanzado a otro SHA.

## Revisión humana

Un resultado de agente no cambia por sí solo el estado final. Las revisiones registran decisión, nota, fuentes, supuestos y desconocidos. El avance exige aprobación explícita y los cambios solicitados requieren instrucciones de reintento.

## Privacidad operacional

El inventario de actividades exige:

- propósito y base propuesta;
- titulares y categorías de datos;
- sensibilidad, retención y transferencias;
- sistemas, hosting y proveedores;
- fuente revisada;
- desconocidos abiertos;
- confirmación humana del alcance.

La base jurídica se registra como propuesta hasta validación. Las afirmaciones sobre retención o eliminación de proveedores requieren evidencia tenant-specific; una política general no prueba una purga concreta.

## Respuesta a incidentes

Tratar como P0:

- fuga cross-tenant;
- bypass de autenticación o autorización;
- pérdida/corrupción de datos;
- secreto expuesto;
- producción caída;
- facturación o cierre crítico roto.

Acciones: contener, preservar evidencia, restaurar servicio seguro, agregar prueba de regresión y registrar la decisión. No ampliar permisos ni desactivar RLS como parche.
