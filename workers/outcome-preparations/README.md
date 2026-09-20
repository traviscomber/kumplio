# Outcome preparations — Cloudflare staging

Este Worker es la frontera asíncrona de Outcome UX v4. Su configuración es deliberadamente **solo staging**:

- Worker: `kumplio-outcome-worker-staging`;
- Queue: `kumplio-outcome-preparations-staging`;
- DLQ: `kumplio-outcome-preparations-staging-dlq`;
- runner permitido: únicamente una URL HTTPS bajo `*.vercel.app` con la ruta interna canónica.

El Worker recibe mensajes autenticados en `POST /enqueue`, los publica en Queue y consume cada mensaje llamando al runner interno de una Preview de Vercel. Los mensajes que agotan cinco reintentos pasan a la DLQ. Ninguna ejecución puede marcar una acción como verificada: solo prepara contexto de evidencia para revisión humana.

## Variables y secretos

Secrets de Cloudflare:

- `KUMPLIO_INGRESS_SECRET`: compartido con `OUTCOME_EXECUTION_HTTP_SECRET` en la Preview de Vercel.
- `KUMPLIO_RUNNER_URL`: URL exacta de la Preview terminada en `/api/internal/outcomes/closure-preparations/run`.
- `KUMPLIO_RUNNER_SECRET`: compartido con `INTERNAL_RUNNER_SECRET` en la Preview de Vercel.
- `VERCEL_AUTOMATION_BYPASS_SECRET`: bypass de automatización del proyecto Vercel para que el Worker pueda alcanzar una Preview protegida mediante el header recomendado por Vercel.

Variables de la Preview de Vercel:

- `OUTCOME_EXECUTION_TRANSPORT=http`;
- `OUTCOME_EXECUTION_ENV=staging`;
- `OUTCOME_EXECUTION_HTTP_ENDPOINT=https://<worker-staging>.<cuenta>.workers.dev/enqueue`;
- `OUTCOME_EXECUTION_HTTP_SECRET=<mismo valor que KUMPLIO_INGRESS_SECRET>`;
- `INTERNAL_RUNNER_SECRET=<mismo valor que KUMPLIO_RUNNER_SECRET>`.

No guardar valores reales en Git, logs, documentación ni variables públicas `NEXT_PUBLIC_*`.

## Provisionamiento reproducible

Requiere una sesión Wrangler autenticada o `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` con permisos acotados a Workers y Queues. Desde la raíz del repositorio:

```bash
npx wrangler queues create kumplio-outcome-preparations-staging --config workers/outcome-preparations/wrangler.toml
npx wrangler queues create kumplio-outcome-preparations-staging-dlq --config workers/outcome-preparations/wrangler.toml
npx wrangler secret put KUMPLIO_INGRESS_SECRET --config workers/outcome-preparations/wrangler.toml
npx wrangler secret put KUMPLIO_RUNNER_URL --config workers/outcome-preparations/wrangler.toml
npx wrangler secret put KUMPLIO_RUNNER_SECRET --config workers/outcome-preparations/wrangler.toml
npx wrangler secret put VERCEL_AUTOMATION_BYPASS_SECRET --config workers/outcome-preparations/wrangler.toml
npx wrangler deploy --config workers/outcome-preparations/wrangler.toml
```

La configuración no contiene un ambiente ni un recurso de producción. No renombrar recursos ni introducir una URL `kumplio.app` durante esta fase.

## Validación antes de desplegar

```bash
npm run check:outcome-ux-v4
npm run check:cloudflare-outcome-staging
npm run check:cloudflare-outcome-worker-types
npm run check:cloudflare-outcome-worker-build
npm run typecheck
```

Después del despliegue de staging, validar como mínimo:

1. `GET /health` devuelve `environment: staging`;
2. ingreso sin secreto devuelve `401`;
3. payload inválido devuelve `400` o `422` y no encola;
4. payload válido devuelve `202` y la Queue consume el mensaje;
5. el runner reclama exactamente `queueId`, nunca “el siguiente” trabajo disponible;
6. un fallo controlado agota cinco reintentos y aparece en la DLQ;
7. un caso exitoso deja preparación durable y mantiene `requiresHumanVerification: true`;
8. ninguna acción cambia automáticamente a `verified`.

Producción sigue en `NO_GO` hasta registrar evidencia end-to-end de estos ocho puntos y recibir una nueva decisión explícita del owner.
