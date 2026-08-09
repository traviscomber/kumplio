# Vercel — decisión de ownership para Kumplio

Fecha: 8 de agosto de 2026

## Contexto

El repositorio `traviscomber/kumplio` está conectado a dos proyectos Vercel:

1. `v0-normative-compliance-analysis`
   - team: `DespegaTuCarrera` (`team_VvIPBATpeoA0eQw8fIx4rhan`)
   - projectId: `prj_uyv6Q5nXIACfqKNkrpvWJAXzT0E1`
   - estado reciente: `Ready` para la rama del Bloque 16.

2. `kumplio`
   - ownership histórico: team `Travis' projects`
   - projectId: `prj_wrTFzldPtqMjFGItE1Bd6BoeZztm`
   - estado reciente: `Error` para commits de `jcv86`.

## Root cause confirmado

Vercel bot reporta explícitamente que `jcv86` debe ser miembro del team `Travis' projects` para desplegar el proyecto `kumplio`.

El acceso API directo al proyecto principal devuelve `403 Forbidden` desde la identidad actualmente conectada.

Existe evidencia histórica de deployments `Ready` del proyecto principal antes del bloqueo actual, por lo que no se trata de un fallo estructural del código o del proyecto Vercel.

## Decisión vigente

**No mover ni recrear el proyecto principal todavía.**

La primera opción es restaurar la autorización correcta del proyecto existente:

1. agregar `jcv86` al team `Travis' projects` o transferir ownership mediante un procedimiento administrado;
2. reejecutar el deployment/check del mismo commit;
3. confirmar que `Vercel – kumplio` pasa a `success`;
4. sólo después revisar si conviene consolidar ownership bajo `DespegaTuCarrera`.

## Por qué no migrar todavía

Mover o recrear un proyecto sin inventario previo puede alterar:

- dominios y aliases de producción;
- variables de entorno y secretos;
- integración Git;
- configuración de build;
- protection settings;
- historial de deployments y observabilidad.

## Plan B — consolidación bajo DespegaTuCarrera

Usar sólo si no es viable recuperar acceso al team actual.

Antes de transferir o recrear:

1. inventariar dominios y aliases del proyecto `kumplio`;
2. inventariar variables de entorno por `production`, `preview` y `development` sin exponer valores en documentación;
3. registrar framework, root directory, build/install commands y Node/runtime settings;
4. registrar integración Git y production branch;
5. revisar deployment protection y funciones programadas;
6. reproducir esa configuración en `DespegaTuCarrera`;
7. validar preview;
8. mover dominios sólo al final;
9. ejecutar smoke productivo y release gate;
10. retirar la integración antigua después de comprobar equivalencia.

## Criterio de cierre

El P0 Vercel se considera resuelto cuando:

- `Vercel – kumplio` está `success` para la rama de release;
- no existe un check duplicado fallando por una integración obsoleta;
- dominio productivo y variables necesarias continúan operativos;
- PR #238 y la PR apilada pueden avanzar sin bypass.
