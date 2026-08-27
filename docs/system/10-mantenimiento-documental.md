# Mantenimiento documental

## Cuándo actualizar

Actualizar esta carpeta cuando cambie alguno de estos contratos:

- recorrido principal o número de etapas;
- arquitectura o proveedor;
- esquema, RPC, RLS o modelo tenant;
- catálogo de agentes;
- rutas API públicas o críticas;
- crons;
- gates y criterios de GO;
- proyectos Vercel o dominio;
- política de secretos, privacidad o eliminación.

## Definition of Done documental

1. El cambio está descrito en el documento correcto.
2. No duplica estado del roadmap.
3. Enlaza código, migración o ADR relevante.
4. Distingue hecho, inferencia y decisión futura.
5. No incluye secretos, datos personales ni credenciales.
6. Conserva terminología de `LENGUAJE_CANONICO.md`.
7. Pasa build y checks que cubren el cambio.
8. La PR explica impacto documental.

## Versionado

- La fecha y SHA del índice indican el corte.
- Los documentos describen `main`, no una intención.
- Los ADR son inmutables; se superseden con otro ADR.
- Las migraciones aplicadas no se reescriben.
- La evidencia de assurance agrega nuevas entradas.
- Los planes históricos no se reciclan como documentación vigente.

## Revisión trimestral sugerida

- Verificar links y rutas.
- Comparar crons con `vercel.json`.
- Comparar scripts con `package.json`.
- Comparar workflows con `.github/workflows/`.
- Revisar migraciones recientes.
- Confirmar proyectos y dominios Vercel.
- Revalidar el Golden Path.
- Mover documentación obsoleta a archivo solo con decisión explícita.

## Owner

El owner de producto decide prioridad y cambios canónicos. Ingeniería mantiene exactitud técnica. Legal/compliance valida afirmaciones normativas. Operaciones valida runbooks y observabilidad.
