# API e integraciones

## Convenciones

- Route Handlers bajo `app/api/`.
- JSON validado con Zod.
- Errores con HTTP semántico y `code` estable.
- `401`: falta autenticación.
- `403`: falta organización o capacidad.
- `404`: recurso inexistente dentro del tenant.
- `409`: conflicto de estado o idempotencia.
- `500/503`: fallo interno o dependencia no disponible.
- Datos sensibles y rutas operacionales usan `Cache-Control: no-store`.

## Familias de API

| Familia | Rutas base | Responsabilidad |
|---|---|---|
| Onboarding | `/api/onboarding` | Inicialización contextual del workspace |
| Casos | `/api/cases` | Crear, leer, archivar, cerrar y preparar planes |
| Agentes | `/api/agents` | Workflows, runs, revisión y herramientas |
| Evidencia | `/api/evidence` | Registro y solicitudes con revisión |
| Controles | `/api/controls` | Controles y evaluaciones |
| Privacidad | `/api/processing-activities` | Inventario, ciclo de vida, avisos, remediación y borrado |
| Regulación | `/api/regulatory` | Captura y consulta de fuentes |
| Documentos | `/api/documents` | Procesamiento documental |
| Contexto | `/api/copilot`, `/api/universal-search` | Consulta contextual y asistencia |
| Operación | `/api/autonomy`, `/api/mission-workers` | Reglas, jobs y capacidades |
| Reportes | `/api/export`, `/api/decisions/export` | Exportación controlada |
| Plataforma | `/api/health`, `/api/readiness` | Salud y disponibilidad |
| Interna | `/api/internal` | Workers, E2E y bootstrap autenticados por frontera especial |

## Integraciones externas

### Supabase

- Auth para identidad.
- Postgres y RLS para datos.
- RPC para transacciones críticas.
- Edge Functions para captura de fuentes.
- El cliente admin nunca se entrega al browser.

### OpenAI

- Responses API mediante runtime server-side.
- Salidas estructuradas y validación.
- `store: false` preservado en el runtime documentado.
- Se persisten request ID y organización de proveedor, no cuerpos completos ni headers.
- La evidencia disponible no debe reinterpretarse como acreditación automática de ZDR.

### Vercel

- Hosting de producción y previews.
- Cron para tareas diarias, autopilot y captura regulatoria.
- Dos proyectos productivos observados por el UI Golden Path:
  - `kumplio`;
  - `v0-normative-compliance-analysis`.

### Fuentes públicas chilenas

Los conectores aplican user agent controlado, snapshots, hashes, parseo determinista y fixtures. Un fetch exitoso no implica por sí solo que una interpretación jurídica esté aprobada.

### GitHub Actions

Usa OIDC para identidades E2E de corta vida. Los workflows de producción no necesitan claves Supabase privilegiadas almacenadas como secrets del repositorio.

### IndexNow

Publica cambios de descubrimiento del sitio público después de despliegues compatibles.

## Crons vigentes

| Ruta | Schedule UTC | Propósito |
|---|---:|---|
| `/api/cron/compliance-daily` | `0 12 * * *` | Resumen diario |
| `/api/cron/autopilot` | `5 12 * * *` | Procesamiento autónomo controlado |
| `/api/cron/regulatory/leychile` | `15 10 * * *` | Captura LeyChile |
| `/api/cron/regulatory/leychile-retry` | `*/30 * * * *` | Reintentos acotados |
