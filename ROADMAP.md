# KUMPLIO — Roadmap Maestro de Producto y Ejecución

> **Documento canónico de producto, arquitectura, evidencia y prioridades**  
> Estado: **cierre técnico / freeze de alcance**  
> Revisión: 16 de agosto de 2026  
> Mercado principal: Chile  
> Idioma visible: español primario; superficies públicas localizadas de forma controlada  
> Repositorio: `traviscomber/kumplio`

---

## 1. Regla de este roadmap

Este archivo representa el **estado comprobable del producto y la única secuencia autorizada de trabajo**. No es un historial de ideas ni una lista de features deseables.

Prioridad de evidencia para cambiar un estado:

1. código presente en `main`;
2. migración versionada y reconciliada con producción;
3. prueba técnica, transaccional, funcional o de seguridad;
4. Release Gate, build, smoke y despliegues;
5. uso real por una persona o piloto;
6. métrica de resultado cuando corresponda.

`DEPLOYED` no equivale a `VALIDATED`. Una prueba sintética no equivale a evidencia de cliente. Una política pública del proveedor no equivale a configuración tenant observada. Un score no equivale a cumplimiento.

### Estados oficiales

| Estado | Significado |
|---|---|
| `PLANNED` | Definido, sin implementación activa. |
| `ACTIVE` | Desarrollo, prueba o cierre en curso. |
| `DEPLOYED` | Código o migración en producción. |
| `VALIDATED` | Flujo probado con evidencia suficiente dentro de su alcance. |
| `VALIDATED INICIAL` | Primer alcance comprobado; falta cobertura o evidencia externa. |
| `DONE` | Validado y sin gate técnico relevante dentro de su alcance. |
| `BLOCKED` | Requiere acción externa, permiso o evidencia que Kumplio no puede fabricar. |
| `DEFERRED` | Preservado fuera de la ruta crítica. |

---

## 2. Tesis de producto vigente

Kumplio es un **sistema operativo de cumplimiento para Chile** que transforma una situación en un expediente vivo con contexto, fuentes, evidencia, especialistas, reservas, revisión humana, acciones, responsables y trazabilidad.

```text
Situación
→ expediente
→ fuentes y evidencia
→ especialistas
→ reservas y contradicciones
→ revisión humana
→ acciones y controles
→ evidencia del avance
→ conocimiento reutilizable aprobado
```

### Principios no negociables

1. Chile primero.
2. Sin fuente no hay afirmación regulatoria.
3. Sin evidencia no hay conclusión de cumplimiento.
4. IA propone; una persona valida decisiones sensibles.
5. Toda mutación crítica deja auditoría.
6. Cada organización permanece aislada.
7. Versionar antes que sobrescribir.
8. Los unknowns se conservan hasta resolverse.
9. No se agregan módulos atractivos mientras un gate P0 siga abierto.

### Lo que Kumplio no debe afirmar

- cumplimiento global o certificación por un score;
- inexistencia porque Kumplio no tiene un dato;
- operación efectiva por un documento aislado;
- sustitución de abogado, auditor, DPO o autoridad;
- base jurídica validada cuando solo fue propuesta;
- inventario completo por registrar tres actividades;
- aviso suficiente porque un mapeo fue aceptado con brechas;
- purga de backups por una prueba primaria;
- ZDR/MAM por usar `store:false`;
- Standard o MAM por inferencia conductual;
- tenant OpenAI verificado solo por un header;
- piloto externo a partir de un tenant sintético.

---

## 3. Snapshot ejecutivo de cierre técnico — 16 de agosto de 2026

Anchor de producción previo a esta PR de cierre: `128ab01ba09ffadd9a9fb418f97872f3c8274d25`.

### Estado comprobado

| Capa | Estado |
|---|---|
| Auth, workspace y tenant isolation | `VALIDATED INTERNO` |
| Golden Path | `VALIDATED x3` |
| Especialistas y supervisor | `VALIDATED x3` |
| Cola durable, retry y recovery | `VALIDATED x3` |
| Artefactos, evidencia, integridad y revisión | `VALIDATED x3` |
| UI Golden Path | `VALIDATED x3` |
| Inventario real N3uralia | 3 actividades |
| Mapeo del aviso | `accepted_with_gaps` 3/3 |
| Eliminación primaria controlada | 3/3 |
| Assurance proveedor | 3/3 parcial |
| Lifecycle V2 | `changes_requested` 3/3 |
| Paquetes de cierre lifecycle | open 3/3 |
| Solicitudes tenant-specific | `changes_requested` 3/3 |
| Configuración tenant proveedor | 0/3 `verified` |
| Eliminación operacional final | 0/3 |
| Organización externa supervisada | 0 |
| Leaked Password Protection | `disabled` |

### OpenAI

- identidad/runtime productiva reconciliada a nivel organización;
- organización observada: `org-WMy0WPkUDGJIP7ZUq9cqMzQL`;
- retention probe productivo: `store:true` creado, recuperado y eliminado con HTTP 200;
- ZDR queda **contradicho para la request/configuración observada**;
- Standard vs Modified Abuse Monitoring sigue pendiente de evidencia administrativa;
- project binding efectivo sigue pendiente de evidencia administrativa;
- DELETE del application state no se presenta como purga de abuse-monitoring logs ni eliminación operacional final.

### Supabase

- proyecto productivo identificado;
- organización en plan Pro observada;
- configuración efectiva Daily/PITR y ventana recuperable siguen pendientes de evidencia administrativa;
- tres RPC de intake/review/promoción tenant-specific están instalados con `SECURITY INVOKER`, `search_path=''`, sin execute para `anon/authenticated`, y execute solo para `service_role/postgres`;
- Leaked Password Protection continúa desactivada.

### Migraciones de cierre relevantes

- `20260816162119_processing_provider_tenant_configuration_review_v1`;
- `20260816162336_provider_retention_probe_dispatch_v1`;
- `20260816211617_provider_tenant_configuration_evidence_intake_v1`.

### Pull requests de cierre

- #266 merged — bounded OpenAI retention probe + promotion guard;
- #267 merged — reconciliación de evidencia productiva;
- #269 merged — intake/review tenant-specific operativo;
- #268 merged — Lifecycle V2 y paquetes de cierre;
- #265 cerrada **sin merge** y preservada como `DEFERRED` por freeze;
- PRs históricas #30, #31, #35, #55, #197 y #240 cerradas como superseded.

---

## 4. Hitos validados

### A. Golden Path y expediente — `VALIDATED`

Caso → fuentes/evidencia → especialistas → revisión → plan → controles → cierre auditable.

### B. Tenant Assurance — `VALIDATED INTERNO`

Aislamiento multiempresa, jobs, artifacts, reviews, workflow y acceso tenant-scoped sin fuga cross-tenant en las pruebas controladas.

### C. Evidencia e integridad — `VALIDATED`

Versionado, SHA-256, procedencia, revisión humana, reservas y separación entre diseño, operación y suficiencia.

### D. Inventario real — `VALIDATED INICIAL`

Tres actividades reales de N3uralia con owner, propósito, titulares, categorías, sistemas, terceros, evidencia y unknowns.

### E. Lifecycle V2 — `VALIDATED INICIAL / CAMBIOS REQUERIDOS`

V2 latest 3/3, supersede V1 3/3, evidencia `accepted · verified` 3/3 y cero dimensiones promovidas artificialmente a `validated`.

### F. Eliminación primaria — `VALIDATED CONTROLADO 3/3`

Probada sobre registros sintéticos en el data plane real. No demuestra backup purge ni propagación a terceros.

### G. Provider assurance — `VALIDATED PARCIAL`

Supabase Pro observado; OpenAI organization/runtime reconciliado y ZDR contradicho para la request observada. La configuración administrativa final permanece explícitamente abierta.

### H. Release y CI — `DONE EN SU ALCANCE TÉCNICO`

Release Gate, typecheck, build, smoke, qualification y previews forman parte obligatoria del release. Vulnerabilidades npm no críticas conocidas permanecen deuda separada; no existe autorización para un `npm audit fix --force` durante el freeze.

---

## 5. Capacidades actuales

Kumplio ya posee, dentro del alcance comprobado:

- autenticación, onboarding, workspace y roles;
- expedientes y situaciones;
- especialistas digitales y supervisor;
- ejecución durable y recuperación;
- artifacts, lineage, revisiones y decisiones humanas;
- fuentes oficiales y procedencia;
- controles, evidence requests y planes operativos;
- Digital Twin e inventario de tratamientos;
- lifecycle versionado;
- mapeo de avisos;
- mecanismos controlados de eliminación;
- provider assurance;
- intake tenant-specific con revisión humana y promoción protegida;
- release gates y assurance reproducible.

No se autoriza ampliar esta lista durante el cierre.

---

## 6. Estado de bloques

| Bloque | Resultado | Estado |
|---:|---|---|
| 1 | Auth, workspace y tenant | `VALIDATED INICIAL / BLOCKED` solo por leaked passwords |
| 2 | Golden Path Ley N.º 21.719 | `VALIDATED x3` |
| 3 | UX operacional | `DEPLOYED` |
| 4 | Ejecución durable | `VALIDATED x3` |
| 5 | Evidencia y controles | `VALIDATED x3` |
| 6 | Release Gate | `DONE` |
| 7 | Grafo y reutilización | `DEPLOYED` |
| 8 | Timeline, confianza e impacto | `VALIDATED INICIAL` |
| 9 | Memoria y casos similares | `DEPLOYED / SIN PILOTO EXTERNO` |
| 10 | Especialización y supervisor | `VALIDATED x3` |
| 11 | Escritorio, SLA y delegación | `VALIDATED INICIAL` |
| 12 | Expediente → plan operativo | `VALIDATED x3` |
| 13 | Baseline assurance | `VALIDATED x3` |
| 14 | Inventario real | `VALIDATED INICIAL` |
| 15 | Tenant assurance | `DONE EN ALCANCE INTERNO` |
| 16 | Cierre técnico y evidencia real | `ACTIVE / EXTERNAL GATES` |
| 17 | Aprendizaje organizacional adicional | `DEFERRED` |
| 18 | Beta autoservicio / expansión | `DEFERRED` |

---

## 7. Gates P0 antes de beta privada autoservicio

### P0-A — Leaked Password Protection — `BLOCKED`

Acción externa/configuración de Supabase Auth:

1. activar protección de contraseñas filtradas;
2. verificar Security Advisor;
3. ejecutar registro, recuperación y cambio de contraseña;
4. documentar evidencia.

Hasta entonces, el producto puede permanecer en demo/piloto supervisado, pero **no se declara listo para beta autoservicio**.

### P0-B — Configuración tenant Supabase — `BLOCKED EXTERNO`

Requiere evidencia administrativa válida de:

- project reference;
- `backupModeObserved = daily|pitr`;
- PITR enabled/disabled;
- ventana efectiva de recuperación;
- fuente `management_api`, `provider_dashboard` o `provider_contract`.

No se deduce desde `wal_level`, `archive_mode` u otros settings PostgreSQL.

### P0-C — Configuración tenant OpenAI — `BLOCKED EXTERNO`

Requiere evidencia administrativa válida de:

- organization reference;
- project reference;
- `projectBindingObserved=true`;
- modo exacto `standard|modified_abuse_monitoring|zero_data_retention`.

El retention probe descarta ZDR para la request observada, pero **no distingue Standard de MAM**.

### P0-D — Lifecycle — `ACTIVE / EVIDENCIA EXTERNA`

Tres paquetes de cierre están abiertos. No se validan base, retención, destinatarios, subencargados ni transferencias sin evidencia independiente suficiente.

### P0-E — Eliminación operacional final — `BLOCKED POR P0-B/P0-C`

No ejecutar ni acreditar 3/3 hasta que el assurance tenant-specific aplicable sea suficiente. La eliminación primaria ya demostrada permanece separada.

### P0-F — Piloto externo — `DEFERRED HASTA GATES`

El protocolo puede prepararse, pero un piloto externo no se inventa ni se sustituye por un tenant sintético.

---

## 8. Backlog autorizado durante el freeze

Solo se autoriza:

1. seguridad P0;
2. evidencia administrativa tenant-specific;
3. revisión humana de evidencia ya solicitada;
4. eliminación operacional final cuando los prerequisitos estén cumplidos;
5. corrección de bugs críticos o regresiones;
6. documentación/assurance necesaria para reflejar hechos comprobados;
7. preparación de piloto supervisado sin habilitar autoservicio.

Todo lo demás queda fuera de alcance.

---

## 9. Próximos bloques de 3

### Bloque 16 — Cierre técnico y evidencia externa — `ACTIVE`

**Subbloque A — Seguridad controlable**

1. activar y verificar Leaked Password Protection cuando el proveedor/conector permita el cambio;
2. reejecutar Security Advisor;
3. probar auth básico después del cambio.

**Subbloque B — Evidencia administrativa**

1. Supabase Daily/PITR + ventana efectiva;
2. OpenAI project binding;
3. OpenAI Standard vs MAM.

**Subbloque C — Cierre operacional**

1. revisar/aceptar únicamente evidencia suficiente mediante el workflow tenant-specific;
2. ejecutar eliminación operacional final aplicable 3/3;
3. versionar lifecycle nuevamente solo cuando la nueva evidencia justifique cambiar estados.

Estos gates conservan su autoridad sobre claims, seguridad y evidencia externa. La nueva fase de experiencia autenticada no permite promover estados no demostrados ni sustituir evidencia real.

### Bloque 17 — Experiencia autenticada canónica — `NEXT`

**Subbloque A — Entrada autenticada y orientación**

1. establecer `/app/*` como superficie autenticada canónica protegida;
2. alinear Inicio, navegación y retorno al contexto de trabajo;
3. evolucionar onboarding hacia Persona, Profesional y Empresa con diagnóstico inicial persistente.

**Subbloque B — Ejecución trazable**

1. alinear expedientes, requisitos, acciones, evidencia y cierre sin duplicar el modelo existente;
2. presentar la cadena Fuente → Fragmento → Obligación → Requisito → Caso → Acción → Evidencia → Revisión → Cierre;
3. integrar resultados de especialistas en el flujo del usuario sin exponer ejecución técnica ni razonamiento interno.

**Subbloque C — Operación continua y superficie pública**

1. alinear Personas, Documentos, Alertas, Actividad y Configuración con divulgación progresiva;
2. convertir cambios regulatorios y planes guiados en acciones verificables;
3. completar páginas públicas profundas conservando la landing como capa de adquisición.

Cada subbloque se entrega en cambios pequeños, reversibles y verificables. No se autorizan migraciones destructivas, relajación de RLS, cambios de infraestructura no relacionados ni claims que excedan la evidencia vigente.

---

## 10. Claims permitidos en cierre técnico

Se puede afirmar:

- Kumplio tiene un Golden Path técnico validado x3;
- existen especialistas digitales con revisión humana;
- las decisiones y evidencias son trazables;
- el inventario real inicial contiene tres actividades revisadas;
- la eliminación primaria controlada está demostrada 3/3;
- Lifecycle V2 permanece changes_requested 3/3;
- existen workflows para resolver evidencia tenant-specific;
- OpenAI ZDR fue contradicho para una request/configuración observada mediante un probe sintético controlado;
- los unknowns permanecen visibles.

No se puede afirmar:

- cumplimiento total;
- certificación;
- eliminación final 3/3;
- PITR observado;
- OpenAI Standard o MAM confirmado;
- tenant configuration verified 3/3;
- piloto externo;
- beta autoservicio lista.

---

## 11. Mapa de evidencia de cierre

Documentos principales:

- `docs/assurance/agent-flow-production-e2e-5x-2026-08-14.md`;
- `docs/assurance/block16-tenant-configuration-progress-2026-08-16.md`;
- `docs/assurance/n3uralia-processing-lifecycle-v2-3x-2026-08-16.md`;
- `docs/assurance/n3uralia-lifecycle-closure-requests-3x-2026-08-16.md`;
- `docs/assurance/kumplio-technical-close-2026-08-16.md` cuando la PR de cierre sea fusionada.

Verificadores read-only relevantes:

- `scripts/69-verify-n3uralia-processing-lifecycle-v2-3x.sql`;
- `scripts/70-verify-n3uralia-lifecycle-closure-requests-3x.sql`.

El estado persistido en producción prevalece sobre cualquier documento histórico que haya quedado desactualizado.

---

## 12. Congelamiento de alcance

El technical freeze del 16 de agosto de 2026 queda cerrado por decisión explícita del owner del 24 de agosto de 2026. Sus guardrails de seguridad, evidencia, aislamiento y claims permanecen vigentes.

Reglas:

- no crear módulos nuevos solo porque son atractivos;
- no iniciar bloques o módulos fuera del bloque `NEXT` por iniciativa propia;
- no reabrir PRs históricas cerradas como superseded sin decisión explícita del owner;
- no fusionar la PR experimental Home/Demo 2.0 sin rebase y revalidación completa;
- no cambiar modelos, permisos, RLS o infraestructura salvo seguridad, bug crítico o gate P0;
- no usar evidencia parcial para promocionar un estado `verified`;
- no ejecutar eliminación operacional final antes de cerrar el assurance tenant aplicable;
- no convertir un test sintético en claim comercial de cliente;
- cualquier excepción debe quedar documentada en `ROADMAP.md` en la misma PR.

El freeze termina únicamente por una decisión explícita del owner registrada en este archivo.

---

## 13. Decisión vigente

**Decisión del owner — 24 de agosto de 2026:** adoptar el brief “KUMPLIO — Product Workflows + Authenticated Experience” como dirección vigente, terminar el technical freeze de alcance e iniciar el Bloque 17 sin deshacer el cierre técnico ni debilitar sus gates de seguridad, evidencia y claims.

Estado objetivo actual:

> **Kumplio técnicamente cerrado y en evolución controlada hacia una experiencia autenticada canónica; beta autoservicio todavía no habilitada.**

La ruta crítica combina la resolución honesta de gates externos con la alineación progresiva del producto. Construir experiencia no autoriza a fabricar evidencia, promover estados ni afirmar capacidades no verificadas.
