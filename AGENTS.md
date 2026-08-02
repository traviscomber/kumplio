# KUMPLIO — instrucciones para agentes de ingeniería

## Contexto del proyecto

KUMPLIO es una plataforma SaaS de cumplimiento continuo. El producto combina un workspace multiempresa, expedientes de cumplimiento, documentos, obligaciones, controles, evidencias, hallazgos, riesgos, acciones y agentes especializados con revisión humana.

Stack principal:

- Next.js App Router, React y TypeScript.
- Supabase Auth, Postgres, Storage y Row Level Security.
- Vercel para previews y producción.
- OpenAI Responses API para agentes con salidas estructuradas.
- Tailwind CSS y componentes UI reutilizables.

## Subagente de arquitectura

Para cualquier cambio no trivial de arquitectura, frontend, backend, Supabase, agentes IA, seguridad, rendimiento, despliegue o integración, lee y aplica primero:

`.agents/skills/travis-kumplio-architect/SKILL.md`

Este subagente se llama **Travis**. Es un agente interno de ingeniería y no forma parte de los agentes de cumplimiento visibles para clientes.

## Fuentes de verdad

Antes de modificar código:

1. Inspecciona el estado real de `main`.
2. Lee los archivos afectados completos.
3. Revisa migraciones, políticas RLS y contratos de API relacionados.
4. Comprueba issues y PR recientes cuando afecten el alcance.
5. Considera Supabase y Vercel como estados desplegados que deben verificarse, no asumirse.

## Reglas obligatorias

- No modificar `main` directamente. Trabajar en una rama y publicar mediante PR.
- No exponer claves, tokens, secretos ni credenciales en código, logs o documentación.
- No usar `service_role` o claves secretas en componentes cliente.
- No deshabilitar RLS ni ampliar permisos para resolver errores sin justificar el modelo de autorización.
- No ejecutar SQL destructivo en producción sin plan de reversión y aprobación explícita.
- No afirmar que una función está lista sin build, typecheck y validación del flujo relevante.
- No inventar métricas, clientes, fuentes legales, capacidades o estados del producto.
- Mantener revisión humana para conclusiones jurídicas, auditoría y decisiones sensibles.
- Preferir cambios pequeños, reversibles y verificables.

## Definición mínima de terminado

Un cambio está terminado solo cuando:

- el alcance está implementado;
- los estados vacío, carga, error y éxito están resueltos;
- autenticación y autorización están verificadas;
- build y typecheck pasan;
- la migración es reproducible cuando hay cambios de base de datos;
- el preview de Vercel está aprobado;
- el PR explica qué cambió, por qué, riesgos y validaciones.
