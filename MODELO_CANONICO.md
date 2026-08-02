# KUMPLIO — Modelo Canónico del Conocimiento

> Estado: normativo para producto y arquitectura  
> Mercado: Chile  
> Idioma visible: español  
> Responsable técnico: Travis — Arquitecto IA full-stack  
> Trazabilidad: issue #65 / M3 Plataforma de Conocimiento

## 1. Propósito

Este documento define qué significa cada unidad fundamental de conocimiento dentro de Kumplio. Su objetivo es impedir silos, duplicaciones semánticas y conclusiones sin procedencia.

**Regla principal:** ningún módulo nuevo puede crear conocimiento fuera de este modelo. Todo conocimiento debe representarse como nodo, relación, versión, afirmación, cita, evidencia o evento.

## 2. Separación obligatoria

Kumplio opera tres capas físicas distintas:

1. **Grafo Nacional de Conocimiento:** información pública, compartida, versionada y revisada.
2. **Memoria Organizacional:** conocimiento privado y aislado por organización.
3. **Capa de Mapeo:** relaciones de aplicabilidad entre el grafo público y la memoria privada.

La Memoria Organizacional nunca se mezcla físicamente con el Grafo Nacional. La Capa de Mapeo conserva el `organization_id` y aplica RLS.

## 3. Entidades canónicas

### 3.1 Nodo de conocimiento público

Unidad identificable del conocimiento compartido. Ejemplos:

- norma;
- artículo;
- inciso;
- organismo público;
- concepto jurídico;
- obligación;
- derecho;
- sanción;
- control de referencia;
- riesgo de referencia;
- publicación del Diario Oficial;
- criterio interpretativo.

Un nodo no es un archivo ni una fila arbitraria. Debe tener identidad estable, tipo, nombre visible, estado, procedencia y vigencia.

### 3.2 Relación pública

Vínculo dirigido y semántico entre dos nodos públicos. Ejemplos:

- `CONTIENE`;
- `MODIFICA`;
- `DEROGA`;
- `REGLAMENTA`;
- `INTERPRETA`;
- `ESTABLECE`;
- `EXIGE`;
- `OTORGA`;
- `APLICA_A`;
- `REQUIERE_CONTROL`;
- `MITIGA`;
- `CITA`;
- `SUSTITUYE`.

Toda relación debe conservar procedencia, vigencia y nivel de revisión.

### 3.3 Nodo de memoria organizacional

Unidad privada de conocimiento de una organización. Ejemplos:

- proceso;
- sistema;
- proveedor;
- contrato;
- política;
- procedimiento;
- tratamiento de datos;
- activo;
- persona o rol;
- control implementado;
- evidencia;
- incidente;
- decisión;
- faena, predio, vehículo u otra entidad sectorial.

Siempre pertenece a una organización. Puede relacionarse con una entidad operacional existente mediante `entidad_origen_tipo` y `entidad_origen_id`, sin reemplazarla.

### 3.4 Relación de memoria

Vínculo privado entre dos nodos de una misma organización. Ejemplos:

- `USA`;
- `PERTENECE_A`;
- `PROVEE`;
- `TRATA`;
- `ALMACENA`;
- `IMPLEMENTA`;
- `GENERA`;
- `EVIDENCIA`;
- `DEPENDE_DE`;
- `RESPONSABLE_DE`;
- `AFECTA`;
- `REPORTA_A`.

No se permiten relaciones entre organizaciones distintas.

### 3.5 Mapeo de aplicabilidad

Puente explícito entre un nodo público y un nodo privado. Ejemplos:

- una obligación pública `APLICA_A` un tratamiento de datos;
- una organización `IMPLEMENTA` un control de referencia;
- una evidencia `DEMUESTRA` una obligación;
- un riesgo empresarial `DERIVA_DE` una exigencia normativa.

El mapeo tiene alcance, supuesto, estado, confianza, autor y revisión humana.

### 3.6 Afirmación

Proposición verificable producida por una persona, regla o agente. No se considera conocimiento validado hasta que tenga:

- fuente;
- cita exacta o evidencia;
- versión;
- estado de revisión;
- nivel de confianza;
- autor o proceso de origen.

Estados mínimos:

- `borrador`;
- `pendiente_revision`;
- `sustentada`;
- `parcialmente_sustentada`;
- `no_sustentada`;
- `contradictoria`;
- `rechazada`;
- `retirada`.

### 3.7 Cita

Referencia exacta que sustenta una afirmación. Debe apuntar a una versión y sección identificables y conservar el texto citado, ubicación y hash.

### 3.8 Versión

Estado histórico e inmutable de un nodo o relación en un momento determinado. Nunca se sobrescribe silenciosamente una versión publicada o revisada.

### 3.9 Evento de conocimiento

Registro inmutable de un cambio relevante:

- creado;
- modificado;
- validado;
- aprobado;
- rechazado;
- reemplazado;
- derogado;
- vinculado;
- desvinculado;
- archivado.

### 3.10 Procedencia

Cadena que explica de dónde proviene un dato:

- fuente oficial o interna;
- documento y versión;
- sección;
- captura o carga;
- parser o proceso;
- agente o usuario;
- fecha;
- hash.

## 4. Identidad y claves

Cada nodo utiliza:

- UUID técnico;
- `clave_canonica` estable y legible por sistema;
- tipo canónico;
- nombre visible en español;
- estado;
- fechas de vigencia;
- versión vigente opcional.

Ejemplos de clave:

- `cl.ley.21719`;
- `cl.ley.21719.articulo.14`;
- `cl.organismo.bcn`;
- `org.<uuid>.proveedor.<uuid>`.

Las claves públicas son globales. Las claves privadas son únicas dentro de una organización.

## 5. Tipos iniciales

### Grafo Nacional

`norma`, `articulo`, `inciso`, `organismo`, `publicacion_oficial`, `concepto`, `obligacion`, `derecho`, `sancion`, `control_referencia`, `riesgo_referencia`, `criterio`, `definicion`.

### Memoria Organizacional

`organizacion`, `proceso`, `sistema`, `proveedor`, `contrato`, `documento`, `politica`, `procedimiento`, `tratamiento_datos`, `activo`, `rol`, `persona`, `control`, `evidencia`, `riesgo`, `incidente`, `decision`, `caso`, `proyecto`, `entidad_sectorial`.

Los tipos nuevos requieren actualización de este documento o de un catálogo versionado aprobado.

## 6. Confianza y revisión

Cada afirmación y mapeo debe poder descomponer su confianza en:

- autoridad de fuente;
- integridad de captura;
- exactitud de extracción;
- vigencia;
- coincidencia de cita;
- corroboración;
- aplicabilidad;
- calidad de evidencia;
- revisión humana.

No se permite mostrar un porcentaje único sin explicar sus componentes.

## 7. Integración con entidades existentes

El modelo canónico complementa, no reemplaza inmediatamente:

- documentos;
- obligaciones;
- controles;
- evidencias;
- riesgos;
- casos;
- artefactos;
- fuentes regulatorias.

La migración será gradual mediante referencias de origen. Ninguna tabla existente se elimina en este bloque.

## 8. Reglas de escritura

- El Grafo Nacional solo se escribe mediante servicios internos y procesos revisados.
- Los agentes crean afirmaciones en borrador; no validan conocimiento por sí solos.
- La Memoria Organizacional exige sesión, pertenencia y organización explícita.
- Los mapeos sensibles requieren revisión humana.
- Los nodos y relaciones publicados se versionan; no se reescriben sin evento.

## 9. Criterio de adopción

Un módulo se considera integrado cuando:

1. identifica sus entidades como nodos;
2. registra relaciones semánticas;
3. conserva procedencia;
4. aplica versionado cuando corresponde;
5. respeta aislamiento organizacional;
6. expone afirmaciones con citas o evidencia;
7. no crea un grafo paralelo.