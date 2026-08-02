# KUMPLIO — Arquitectura de la Plataforma de Conocimiento

> Hito: M3  
> Trazabilidad: issue #65  
> Alcance inicial: documentos maestros, modelo físico y migraciones base.

## 1. Objetivo

Construir una plataforma común para representar conocimiento regulatorio chileno, memoria privada de organizaciones y relaciones de aplicabilidad, sin reemplazar abruptamente las entidades productivas existentes.

## 2. Vista de capas

```text
Experiencia
├── Panel de control
├── Expedientes
├── Controles y evidencias
├── Inteligencia regulatoria
└── Explorador de conocimiento (futuro)

Flujos de trabajo
├── Agentes especializados
├── Revisión humana
├── Versionado de artefactos
└── Acciones y seguimiento

Plataforma de Conocimiento
├── Grafo Nacional de Conocimiento
├── Memoria Organizacional
├── Capa de Mapeo
├── Afirmaciones y citas
├── Eventos y procedencia
└── Nivel de confianza

Plataforma de Evidencia
├── Documentos y versiones
├── Capturas regulatorias
├── Evidencias organizacionales
├── Hashes
└── Storage

Infraestructura
├── Supabase/Postgres
├── Scraper Platform
├── Vercel/Next.js
├── Modelos de IA
└── Workers y tareas programadas
```

## 3. Grafo Nacional de Conocimiento

### Responsabilidad

Representa conocimiento público compartido y revisable sobre Chile.

### Tablas iniciales

- `public_knowledge_nodes`
- `public_knowledge_node_versions`
- `public_knowledge_edges`
- `public_knowledge_edge_versions`
- `knowledge_provenance`
- `knowledge_events`

### Escritura

Solo `service_role` o procesos internos autorizados. Los usuarios autenticados pueden leer únicamente conocimiento publicado o aprobado.

### Integración inicial

- `regulatory_sources`
- `regulatory_documents`
- `regulatory_document_versions`
- `regulatory_document_sections`
- `regulatory_claims`
- `regulatory_claim_citations`
- `diario_oficial_publications` cuando el PR correspondiente sea fusionado.

La integración se realiza mediante referencias de origen; no se duplicará el texto bruto innecesariamente.

## 4. Memoria Organizacional

### Responsabilidad

Representa conocimiento privado de una organización y sus relaciones internas.

### Tablas iniciales

- `organization_memory_nodes`
- `organization_memory_node_versions`
- `organization_memory_edges`
- `organization_memory_edge_versions`

### Aislamiento

Todas las tablas incluyen `organization_id`. RLS exige `is_organization_member(organization_id)`. Las relaciones validan que ambos extremos pertenezcan a la misma organización.

### Entidades de origen

Un nodo privado puede enlazar una entidad productiva existente:

- documento;
- control;
- evidencia;
- riesgo;
- proveedor;
- caso;
- proyecto;
- incidente;
- activo sectorial.

Campos:

- `source_entity_type`
- `source_entity_id`

La referencia es lógica en esta primera etapa porque apunta a múltiples tablas. Los servicios internos deben validar la pertenencia antes de registrar el nodo.

## 5. Capa de Mapeo

### Responsabilidad

Relaciona un nodo público con un nodo privado para expresar aplicabilidad o implementación.

### Tabla inicial

- `knowledge_mappings`

### Ejemplos

- obligación pública → aplica a → tratamiento de datos;
- control de referencia → implementado por → control organizacional;
- artículo → evidenciado por → evidencia;
- sanción → exposición de → riesgo organizacional.

### Reglas

- siempre incluye `organization_id`;
- el nodo privado debe pertenecer a la organización;
- conserva estado de revisión, supuestos, alcance y confianza;
- no convierte automáticamente una relación propuesta por IA en relación validada.

## 6. Afirmaciones y citas

En esta etapa se reutilizan las afirmaciones regulatorias existentes y se prepara la proyección hacia el grafo.

Un nodo o relación puede conservar referencias a:

- `regulatory_claims`;
- `regulatory_claim_citations`;
- secciones regulatorias;
- documentos internos;
- evidencias.

La migración completa a un servicio unificado de afirmaciones se realizará en un sprint posterior.

## 7. Versionado

Los nodos y relaciones poseen una identidad estable. Su contenido histórico vive en tablas de versiones.

### Nodo

- identidad;
- clave canónica;
- tipo;
- estado actual;
- versión vigente.

### Versión de nodo

- número de versión;
- nombre y descripción;
- atributos JSON controlados;
- vigencia;
- hash;
- autor/proceso;
- estado de revisión.

### Relación

- identidad estable;
- origen;
- destino;
- tipo semántico;
- estado actual;
- versión vigente.

Los estados publicados o aprobados se consideran históricos y no deben actualizarse directamente.

## 8. Procedencia

`knowledge_provenance` vincula un objeto de conocimiento con su origen.

Objetos soportados:

- nodo público;
- versión de nodo público;
- relación pública;
- versión de relación pública;
- nodo privado;
- versión de nodo privado;
- relación privada;
- versión de relación privada;
- mapeo.

Orígenes soportados:

- fuente regulatoria;
- documento regulatorio;
- versión regulatoria;
- sección;
- afirmación;
- documento organizacional;
- evidencia;
- artefacto de agente;
- usuario;
- proceso automático.

Debe existir exactamente un objeto objetivo por registro de procedencia.

## 9. Eventos

`knowledge_events` es append-only y registra cambios significativos. Puede ser global o asociado a una organización.

Ejemplos:

- nodo creado;
- versión publicada;
- relación aprobada;
- mapeo rechazado;
- conocimiento reemplazado;
- fuente invalidada.

Los eventos no reemplazan las tablas de auditoría actuales; las complementan para el dominio de conocimiento.

## 10. Servicios internos

Funciones iniciales, ejecutables solo por `service_role`:

- `create_public_knowledge_node(...)`
- `create_public_knowledge_edge(...)`
- `create_organization_memory_node(...)`
- `create_organization_memory_edge(...)`
- `create_knowledge_mapping(...)`

Todas utilizan `SECURITY INVOKER`, `search_path` vacío y validaciones explícitas.

Los endpoints de aplicación autenticados podrán llamar estos servicios mediante cliente administrativo del servidor después de validar sesión, rol y organización.

## 11. Índices

Índices mínimos:

- clave canónica pública única;
- clave privada única por organización;
- tipo y estado;
- nodos origen/destino de relaciones;
- organización y fecha;
- entidad de origen;
- mapeos por nodo público y privado;
- procedencia por objeto;
- eventos por organización y fecha.

## 12. RLS

### Público

- `anon`: sin acceso.
- `authenticated`: lectura de nodos y relaciones publicados/aprobados.
- `service_role`: control total.

### Privado

- `authenticated`: lectura de datos de organizaciones a las que pertenece.
- inserciones y cambios directos quedan revocados inicialmente.
- `service_role`: escritura mediante servicios internos.

## 13. Adopción progresiva

### Etapa 1 — Fundación

Documentos, tablas, RLS, servicios y verificadores.

### Etapa 2 — Proyección regulatoria

Ley 21.719 y Diario Oficial generan nodos públicos y relaciones revisables.

### Etapa 3 — Memoria organizacional

Documentos, controles y evidencias generan nodos privados y relaciones.

### Etapa 4 — Mapeo y agentes

Los agentes consultan ambos grafos y proponen mapeos con citas.

### Etapa 5 — Explorador

Interfaz navegable, búsqueda, explicación y visualización.

## 14. Fuera de alcance de esta fundación

- visualización gráfica compleja;
- embeddings productivos;
- migración masiva de todos los datos existentes;
- inferencia automática de relaciones publicadas;
- entrenamiento de modelos;
- uso de memoria privada entre organizaciones;
- eliminación de tablas existentes.

## 15. Criterios de salida

1. Los cuatro documentos maestros están en `main`.
2. El esquema se instala de forma reproducible.
3. RLS separa conocimiento público y memoria privada.
4. Las relaciones privadas no pueden cruzar organizaciones.
5. Las funciones internas no son ejecutables por clientes.
6. Los verificadores pasan.
7. Una prueba transaccional crea nodos, relaciones y mapeos y termina con `ROLLBACK`.
8. Los advisors no muestran problemas críticos nuevos.