# Pruebas y assurance

## Pirámide real

| Nivel | Mecanismo |
|---|---|
| Modelos puros | Scripts `test-*.mjs` |
| Contratos estáticos | Scripts `check-*.mjs` |
| Integración | RPC, fixtures y runners controlados |
| Build | TypeScript y Next.js production build |
| Smoke | Servidor productivo local |
| Producción | Playwright UI Golden Path |
| Evidencia | Logs, summaries, artefactos y commit statuses |

## Cobertura por riesgo

Los checks cubren, entre otros:

- autenticación y política de contraseña;
- boundaries cliente/servidor;
- seguridad de funciones;
- onboarding y continuidad;
- casos y cierre atómico;
- cola durable y concurrencia;
- revisión de agentes;
- controles, evidencia y línea base;
- inventario de tratamiento;
- lifecycle, avisos, remediación y eliminación;
- fuentes regulatorias y fixtures;
- OpenAI trace y retención;
- aislamiento de dominios;
- descubrimiento público;
- cierre de aplicación.

## Golden Path vigente

El corte `e04427cc0132f60fb258af46ccd5254abd3b3f6e` demostró:

- Playwright 1/1 aprobado;
- 3 etapas aprobadas;
- 3 runs aprobados;
- 3 artefactos aprobados;
- 3 revisiones humanas aprobadas;
- 3 jobs succeeded;
- 0 jobs activos;
- 0 dead letters;
- misión completada;
- solicitud de evidencia aceptada;
- línea base creada y verificada;
- actividad de tratamiento revisada;
- deployment SHA coincidente.

## Interpretación de fallos

- Un fallo de build, auth, autorización, datos o core journey es bloqueante.
- Un selector ambiguo es defecto del test si la evidencia muestra el estado correcto, pero debe corregirse.
- Una aserción contra un SHA desplazado debe fallar; evita acreditar otro despliegue.
- Cancelaciones por concurrencia no son éxito ni defecto de producto.
- No declarar GO hasta reconciliar commit, Vercel, Supabase y gates.

## Evidencia

Los artefactos de GitHub Actions tienen retención limitada. Los documentos de `docs/assurance/` preservan decisiones y resultados importantes, pero no sustituyen la corrida original.

## Veredicto

Usar solo: `GO`, `CONDITIONAL_GO` o `NO_GO`. Un `CONDITIONAL_GO` requiere condición, owner y plazo. Fallos no resueltos de autenticación, pérdida de datos, autorización, build o recorrido central exigen `NO_GO`.
