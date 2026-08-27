<p align="center">
  <strong>KUMPLIO</strong>
</p>

<h1 align="center">Protección de datos y privacidad para Chile, con evidencia y revisión humana.</h1>

<p align="center">
  Kumplio ayuda a organizaciones a convertir situaciones de privacidad y cumplimiento en expedientes trazables, decisiones revisadas y trabajo operativo verificable.
</p>

<p align="center">
  <a href="https://www.kumplio.app/es"><strong>Ver Kumplio</strong></a>
  ·
  <a href="./docs/system/README.md">Documentación del sistema</a>
  ·
  <a href="./ROADMAP.md">Roadmap canónico</a>
  ·
  <a href="https://www.kumplio.app/llms.txt">Contexto LLM</a>
</p>

---

## Qué es Kumplio

Kumplio es una plataforma **Chile-first de protección de datos, privacidad y gestión de cumplimiento**, con foco inicial en la **Ley 21.719**.

No es un chatbot jurídico ni una colección de checklists. Convierte una situación real en un expediente vivo:

~~~text
situación
→ contexto autorizado
→ fuentes y evidencia
→ análisis especializado
→ revisión humana
→ plan operativo
→ responsables y plazos
→ controles y solicitudes de evidencia
→ trazabilidad
~~~

La plataforma guía, organiza y demuestra. Las decisiones sensibles permanecen en manos de una persona responsable.

Kumplio es desarrollado por **n3uralia**, factoría chilena de inteligencia artificial aplicada y software.

---

## Estado verificado

Última reconciliación productiva: **27 de agosto de 2026**.

| Gate | Estado |
|---|---:|
| GitHub ↔ Vercel ↔ Supabase | Reconciliados |
| UI Golden Path #20 | Verde |
| Workflow productivo | 3/3 etapas |
| Release Gate #527 | Verde |
| Qualification #626 | Verde |
| Seguridad incorporada | Corregida y validada |
| Jobs activos al cierre | 0 |
| Dead letters al cierre | 0 |
| Decisión de release | **GO** |

La evidencia persistida del Golden Path confirmó:

- 3 etapas, 3 runs y 3 jobs completados;
- 3 artefactos y 3 revisiones;
- misión, evidencia, baseline y actividad de procesamiento verificadas;
- ningún job activo ni dead letter pendiente.

Los estados anteriores describen únicamente el alcance técnico probado. **No significan certificación, cumplimiento jurídico integral ni asesoría legal.**

---

## Flujo agentic vigente

El workflow productivo de evaluación ejecuta tres etapas con persistencia y revisión:

~~~text
análisis especializado
→ controles y evidencia
→ plan y cierre revisado
~~~

La ejecución usa una cola durable, jobs persistidos, lease, heartbeat, reintentos controlados y trazabilidad de runs, artefactos, revisiones y fuentes.

Principios operativos:

1. una etapa no avanza sin satisfacer sus condiciones de revisión;
2. hechos, inferencias, reservas y decisiones humanas se conservan por separado;
3. la evidencia mantiene procedencia, vigencia e integridad;
4. el contexto privado se aísla por organización y dominio;
5. los resultados declaran alcance, límites y unknowns;
6. solo el conocimiento aprobado puede reutilizarse.

---

## Capacidades principales

- autenticación, onboarding, organizaciones, miembros y roles;
- expedientes con situación, contexto, prioridad, owner y timeline;
- documentos, fuentes, controles, evidencia y solicitudes;
- especialistas digitales con herramientas y salidas estructuradas;
- revisión humana y artefactos versionados;
- misiones, responsables, vencimientos y criterios de cierre;
- ejecución durable mediante Supabase/Postgres y PGMQ;
- auditoría, aislamiento multiempresa y políticas RLS;
- sitio público bilingüe y superficies de discovery para buscadores y modelos.

---

## Arquitectura

~~~mermaid
flowchart TB
  Human["Persona responsable"] --> App["Next.js"]
  App --> Data["Supabase Auth + Postgres/RLS"]
  App --> Queue["PGMQ + agent_jobs"]
  Queue --> Agents["Workflow de 3 etapas"]
  Agents --> Evidence["Runs + artefactos + fuentes"]
  Evidence --> Review["Revisión humana"]
  Review --> Work["Misiones + controles"]
~~~

### Stack

| Capa | Tecnología |
|---|---|
| Aplicación | Next.js 16, React 19 y TypeScript |
| Datos e identidad | Supabase Auth y Postgres con RLS |
| IA | OpenAI Responses API con salidas estructuradas |
| Orquestación | PGMQ, jobs durables y workflow por etapas |
| Despliegue | Vercel |
| Assurance | GitHub Actions, Release Gate, Qualification y UI Golden Path |

---

## Documentación canónica

La documentación integral vigente está en [docs/system/README.md](./docs/system/README.md):

| Documento | Alcance |
|---|---|
| [Producto y recorridos](./docs/system/01-producto-y-recorridos.md) | Usuarios, promesa y journeys |
| [Arquitectura](./docs/system/02-arquitectura.md) | Componentes y fronteras |
| [Datos y Supabase](./docs/system/03-datos-y-supabase.md) | Dominios, RLS y persistencia |
| [API e integraciones](./docs/system/04-api-e-integraciones.md) | Contratos y servicios externos |
| [Seguridad y privacidad](./docs/system/05-seguridad-y-privacidad.md) | Controles e invariantes |
| [Agentes y workflows](./docs/system/06-agentes-y-workflows.md) | Etapas, cola y revisión |
| [Operación y despliegue](./docs/system/07-operacion-y-despliegue.md) | Release, observabilidad y rollback |
| [Pruebas y assurance](./docs/system/08-pruebas-y-assurance.md) | Gates y evidencia |
| [Mapa del repositorio](./docs/system/09-mapa-del-repositorio.md) | Ubicación del código |
| [Mantenimiento documental](./docs/system/10-mantenimiento-documental.md) | Reglas de actualización |

[ROADMAP.md](./ROADMAP.md) continúa siendo la **única fuente canónica de prioridad, secuencia y estado futuro**. La documentación del sistema describe el producto existente.

---

## Mapa del repositorio

~~~text
app/                         páginas, API y metadata
components/                  experiencia y componentes UI
lib/agents/                  especialistas y runtime
lib/compliance/              expedientes, controles y evidencia
lib/privacy/                 contratos de privacidad
lib/supabase/                acceso a datos
supabase/migrations/         esquema versionado
scripts/                     guardrails y verificaciones
tests/e2e/                   Golden Path
docs/system/                 documentación canónica
docs/assurance/              evidencia técnica histórica
.github/workflows/           CI, release y qualification
ROADMAP.md                   prioridad y secuencia canónicas
~~~

---

## Desarrollo local

~~~bash
npm ci
npm run dev
~~~

Validación principal:

~~~bash
npm run typecheck
npm run check:canonical-roadmap
npm run release:check
npm run smoke
~~~

Antes de contribuir, leer [AGENTS.md](./AGENTS.md), [ROADMAP.md](./ROADMAP.md) y la [documentación canónica](./docs/system/README.md).

---

## Límites

Kumplio no debe afirmar:

- cumplimiento integral por un score o resultado aislado;
- aplicabilidad jurídica sin fuente y validación;
- operación efectiva por la sola existencia de un documento;
- eliminación final sin evidencia suficiente;
- configuración de proveedor verificada sin prueba tenant-specific;
- reemplazo de abogado, auditor, DPO o autoridad;
- éxito comercial basándose únicamente en tenants o E2E sintéticos.

---

## Contacto

**Kumplio**  
Software de protección de datos y privacidad para Chile  
[info@kumplio.app](mailto:info@kumplio.app)  
+56 9 9382 6127  
Santiago, Chile

Desarrollado por [n3uralia](https://www.n3uralia.com).
