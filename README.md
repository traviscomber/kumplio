# Kumplio

**Kumplio ayuda a una empresa a descubrir qué datos personales usa, detectar qué le falta para cumplir la Ley 21.719 y convertir esas brechas en tareas concretas con responsables, plazos y evidencia.**

[Ver Kumplio](https://www.kumplio.app/es) · [Documentación completa](./docs/system/README.md) · [Roadmap](./ROADMAP.md)

---

## El problema que resuelve

La mayoría de las empresas tiene datos personales repartidos entre planillas, correos, contratos, sistemas y proveedores.

Eso hace difícil responder preguntas básicas:

- ¿Qué datos personales tenemos?
- ¿Para qué los usamos?
- ¿Quién puede acceder a ellos?
- ¿Qué proveedores los reciben?
- ¿Cuánto tiempo los conservamos?
- ¿Qué exige la Ley 21.719?
- ¿Qué nos falta corregir?
- ¿Cómo demostramos lo que hicimos?

Kumplio reúne esa información, detecta brechas y transforma el diagnóstico en trabajo ejecutable.

---

## Qué hace Kumplio

### 1. Ordena los datos de la empresa

Registra actividades de tratamiento, tipos de datos, finalidades, responsables, sistemas y proveedores.

### 2. Detecta brechas

Compara la situación de la empresa con obligaciones y fuentes aplicables. Distingue lo comprobado de lo que todavía falta confirmar.

### 3. Crea un plan de acción

Convierte cada brecha en una tarea concreta con:

- responsable;
- prioridad;
- fecha objetivo;
- evidencia requerida;
- criterio de cierre.

### 4. Acompaña la ejecución

Mantiene documentos, decisiones, controles, avances y solicitudes de evidencia dentro del mismo expediente.

### 5. Deja trazabilidad

Conserva qué se analizó, qué fuente se utilizó, qué cambió, quién revisó la conclusión y qué evidencia respalda el cierre.

---

## Un ejemplo concreto

Una empresa dice:

> “Usamos datos de clientes, trabajadores y postulantes, pero no sabemos si estamos preparados para la Ley 21.719.”

Kumplio la guía para:

1. identificar dónde se usan esos datos;
2. registrar responsables, sistemas y proveedores;
3. detectar información faltante y riesgos;
4. relacionar las brechas con obligaciones aplicables;
5. generar acciones priorizadas;
6. asignar responsables y plazos;
7. solicitar la evidencia necesaria;
8. revisar y documentar el cierre.

El resultado no es solamente un informe. Es un **plan de cumplimiento que puede ejecutarse y demostrarse**.

---

## Qué recibe el usuario

| Entrada | Resultado |
|---|---|
| Una situación o preocupación | Un expediente organizado |
| Información dispersa | Un inventario estructurado |
| Dudas sobre la Ley 21.719 | Obligaciones y brechas explicadas |
| Brechas detectadas | Acciones priorizadas |
| Acciones pendientes | Responsables, plazos y criterios de cierre |
| Documentos y controles | Evidencia revisable |
| Decisiones sensibles | Revisión humana y trazabilidad |

---

## Para quién está pensado

Kumplio está diseñado inicialmente para organizaciones en Chile que necesitan:

- prepararse para la Ley 21.719;
- ordenar sus tratamientos de datos personales;
- revisar proveedores y terceros;
- responder solicitudes o incidentes de privacidad;
- gestionar brechas, controles y evidencia;
- coordinar el trabajo entre responsables internos y asesores.

---

## Cómo usa inteligencia artificial

Kumplio utiliza especialistas digitales para analizar el contexto, revisar controles y preparar un plan.

El workflow vigente tiene tres responsabilidades:

1. **Analizar:** entiende la situación, las fuentes y las obligaciones.
2. **Resolver:** convierte las brechas en controles, acciones y evidencia esperada.
3. **Revisar:** detecta contradicciones, reservas y decisiones que necesitan criterio humano.

La inteligencia artificial organiza y propone. **No declara automáticamente que una empresa cumple ni reemplaza al abogado, auditor, DPO o responsable de la decisión.**

---

## Qué hace diferente a Kumplio

Una planilla puede guardar información. Un gestor documental puede guardar archivos. Kumplio conecta:

~~~text
datos personales
→ obligaciones
→ brechas
→ acciones
→ responsables
→ evidencia
→ revisión
→ cierre trazable
~~~

El objetivo es que la empresa no solo sepa qué está mal, sino también **qué debe hacer ahora y cómo demostrar que lo hizo**.

---

## Estado del sistema

Última reconciliación productiva: **27 de agosto de 2026**.

| Verificación | Estado |
|---|---:|
| GitHub ↔ Vercel ↔ Supabase | Reconciliados |
| Workflow productivo | 3/3 etapas |
| UI Golden Path #20 | Verde |
| Release Gate #527 | Verde |
| Qualification #626 | Verde |
| Jobs activos al cierre | 0 |
| Dead letters al cierre | 0 |
| Decisión de release | **GO** |

Estos resultados prueban el funcionamiento técnico dentro del alcance evaluado. No equivalen a una certificación jurídica o comercial.

---

## Arquitectura resumida

~~~mermaid
flowchart TB
  User["Empresa"] --> App["Kumplio"]
  App --> Data["Contexto + tratamientos"]
  App --> Flow["Análisis de 3 etapas"]
  Flow --> Gaps["Brechas + acciones"]
  Gaps --> Review["Revisión humana"]
  Review --> Evidence["Cierre + evidencia"]
~~~

| Capa | Tecnología |
|---|---|
| Aplicación | Next.js 16, React 19 y TypeScript |
| Datos e identidad | Supabase Auth y Postgres con RLS |
| IA | OpenAI Responses API |
| Ejecución durable | PGMQ y agent_jobs |
| Despliegue | Vercel |
| Verificación | GitHub Actions y pruebas E2E |

---

## Documentación

La documentación integral está en [docs/system](./docs/system/README.md):

- [Producto y recorridos](./docs/system/01-producto-y-recorridos.md)
- [Arquitectura](./docs/system/02-arquitectura.md)
- [Datos y Supabase](./docs/system/03-datos-y-supabase.md)
- [API e integraciones](./docs/system/04-api-e-integraciones.md)
- [Seguridad y privacidad](./docs/system/05-seguridad-y-privacidad.md)
- [Agentes y workflows](./docs/system/06-agentes-y-workflows.md)
- [Operación y despliegue](./docs/system/07-operacion-y-despliegue.md)
- [Pruebas y assurance](./docs/system/08-pruebas-y-assurance.md)
- [Mapa del repositorio](./docs/system/09-mapa-del-repositorio.md)

[ROADMAP.md](./ROADMAP.md) es la única fuente canónica de prioridades y trabajo futuro.

---

## Roadmap canónico: trabajar sin desviaciones

[`ROADMAP.md`](./ROADMAP.md) es la **única fuente canónica de prioridad, secuencia y estado**.

Antes de modificar el producto:

1. identifica el bloque, gate, defecto o decisión del owner que autoriza el cambio;
2. implementa el alcance mínimo y verificable;
3. conserva los límites de seguridad, evidencia y revisión humana;
4. actualiza el roadmap cuando cambie un estado o una prioridad.

Contrato vinculante: [docs/governance/canonical-roadmap-contract.md](./docs/governance/canonical-roadmap-contract.md).

Valida el contrato con:

~~~bash
npm run check:canonical-roadmap
~~~

---

## Desarrollo local

~~~bash
npm ci
npm run dev
~~~

Validaciones principales:

~~~bash
npm run typecheck
npm run check:canonical-roadmap
npm run release:check
npm run smoke
~~~

---

## Contacto

**Kumplio**  
Protección de datos y privacidad para Chile  
[info@kumplio.app](mailto:info@kumplio.app)  
+56 9 9382 6127  
Santiago, Chile

Desarrollado por [n3uralia](https://www.n3uralia.com).
