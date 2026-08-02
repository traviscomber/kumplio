# KUMPLIO — DESIGN.md

> Documento maestro de diseño, marca y experiencia de Kumplio.  
> Estado: **CANÓNICO**  
> Mercado principal: **Chile**  
> Idioma visible: **español de Chile**  
> Tipografía oficial: **Montserrat**  
> Alcance: sitio público, aplicación, expedientes, inteligencia regulatoria, agentes, informes, correos y futuras verticales.

---

## 1. Propósito

`DESIGN.md` es la fuente única de verdad para reconstruir y evolucionar Kumplio.

Define:

- identidad y posicionamiento;
- brandbook;
- voz y lenguaje;
- arquitectura de información;
- sistema visual;
- tipografía;
- color;
- espaciado y composición;
- componentes;
- patrones de interacción;
- visualización de datos, confianza, agentes y grafos;
- accesibilidad;
- comportamiento responsive;
- criterios de aceptación;
- plan de migración del frontend actual.

Toda nueva pantalla, componente, informe o comunicación visible debe cumplir este documento, `LENGUAJE_CANONICO.md`, `MODELO_CANONICO.md` y `PRINCIPIOS.md`.

---

# PARTE I — IDENTIDAD DE MARCA

## 2. Esencia de marca

### 2.1 Nombre

**Kumplio**

En textos y navegación se escribe **Kumplio**. La forma **KUMPLIO** se reserva para el logotipo, piezas institucionales y encabezados de alto impacto.

### 2.2 Categoría

Kumplio es una **plataforma chilena de conocimiento regulatorio y cumplimiento verificable**.

No se presenta como:

- repositorio de documentos;
- chatbot jurídico;
- certificadora;
- consultora automatizada;
- simple gestor de tareas;
- producto genérico de inteligencia artificial.

### 2.3 Promesa central

> **Convierte obligaciones en decisiones, controles y evidencia verificable.**

### 2.4 Misión

> Construir el sistema de conocimiento regulatorio más confiable para las organizaciones chilenas.

### 2.5 Visión

Que una organización pueda comprender qué le exige la normativa, cómo le aplica, qué debe ejecutar y cómo demostrarlo, con fuentes oficiales, memoria privada, trazabilidad y revisión humana.

### 2.6 Posicionamiento

Kumplio combina:

1. **Grafo Nacional de Conocimiento:** normativa chilena estructurada y versionada.
2. **Memoria Organizacional:** conocimiento privado y aislado de cada organización.
3. **Motor de Mapeo:** conexión entre exigencias públicas, controles y evidencia privada.
4. **Plataforma Agentic:** agentes especializados con fuentes, límites y aprobación.
5. **Sistema Operacional:** expedientes, controles, solicitudes, riesgos y acciones.

### 2.7 Diferencial

El diferencial no es “usar IA”. Es producir resultados:

- explicables;
- citables;
- versionados;
- auditables;
- revisables;
- útiles para ejecutar trabajo real.

Kumplio debe poder mostrar siempre:

```text
Fuente oficial
→ versión
→ sección o cita
→ interpretación
→ aplicabilidad
→ control
→ evidencia
→ nivel de confianza
→ revisión humana
```

---

## 3. Personalidad

Kumplio es:

- **Rigurosa:** diferencia hechos, inferencias y decisiones.
- **Clara:** traduce complejidad sin banalizarla.
- **Serena:** no usa miedo para vender.
- **Confiable:** muestra fuentes, límites y estado de revisión.
- **Operacional:** convierte análisis en acciones concretas.
- **Chilena:** usa conceptos, organismos y prácticas locales.
- **Contemporánea:** tecnológica sin parecer experimental.

Kumplio no es:

- alarmista;
- grandilocuente;
- infantil;
- futurista de ciencia ficción;
- excesivamente jurídica;
- un panel administrativo genérico;
- una colección desordenada de tarjetas.

---

## 4. Voz y tono

### 4.1 Voz permanente

- precisa;
- directa;
- profesional;
- humana;
- explicable;
- en español de Chile.

### 4.2 Tono por contexto

| Contexto | Tono |
|---|---|
| Sitio público | Claro, seguro y orientado al valor |
| Onboarding | Acompañante y progresivo |
| Expediente | Operacional y preciso |
| Riesgo crítico | Directo, sobrio y accionable |
| Respuesta de agente | Estructurada, prudente y citable |
| Error técnico | Transparente y orientado a resolver |
| Informe ejecutivo | Sintético y verificable |
| Revisión jurídica | Formal y explícita en supuestos |

### 4.3 Reglas de redacción

- Usar frases breves y verbos de acción.
- Explicar siglas la primera vez.
- Evitar anglicismos visibles.
- No afirmar “cumplimiento garantizado”.
- No usar porcentajes de cumplimiento sin metodología.
- Diferenciar claramente:
  - detectado;
  - propuesto;
  - pendiente de revisión;
  - validado;
  - rechazado;
  - reemplazado.

### 4.4 Vocabulario visible

| Evitar | Usar |
|---|---|
| Dashboard | Panel de control |
| Workflow | Flujo de trabajo |
| Evidence | Evidencia |
| Claim | Afirmación |
| Citation | Cita normativa |
| Knowledge graph | Grafo de conocimiento |
| Enterprise memory | Memoria Organizacional |
| Pipeline | Flujo |
| Dataset | Conjunto de datos |
| Chunk | Fragmento |
| Finding | Hallazgo |
| Vendor | Proveedor |
| Compliance case | Expediente |
| Confidence score | Nivel de confianza |
| Mapping | Mapeo o relación de aplicabilidad |

---

## 5. Mensajes de marca

### 5.1 Mensaje principal

> **Cumplimiento verificable para organizaciones chilenas.**

### 5.2 Mensaje de producto

> Kumplio conecta normativa, controles, evidencia y decisiones en una plataforma trazable.

### 5.3 Mensaje Ley N.º 21.719

> Prepárate para la nueva regulación de datos personales con obligaciones, responsables, controles y evidencia verificable.

### 5.4 Mensaje sobre inteligencia artificial

> La IA propone y organiza. Las decisiones críticas permanecen bajo revisión humana.

### 5.5 Frases que no deben usarse

- “Cumple automáticamente”.
- “Garantizamos cumplimiento”.
- “La IA reemplaza al abogado”.
- “Evita todas las multas”.
- “100 % seguro”.
- “La plataforma decide por ti”.

---

# PARTE II — IDENTIDAD VISUAL

## 6. Principios visuales

La interfaz debe sentirse:

- sobria;
- precisa;
- premium;
- tecnológica;
- legible;
- orientada a decisiones;
- confiable en sesiones largas de trabajo.

La composición se apoya en:

- jerarquía fuerte;
- pocas superficies por pantalla;
- contraste claro;
- datos agrupados por significado;
- acciones principales visibles;
- evidencia y procedencia siempre accesibles;
- espacio suficiente para leer información compleja.

Evitar:

- exceso de gradientes;
- neón decorativo;
- tarjetas dentro de tarjetas sin necesidad;
- iconos sin etiqueta;
- animaciones constantes;
- fondos con ruido;
- textos pequeños para información crítica;
- colores semánticos usados como decoración.

---

## 7. Logotipo

### 7.1 Logotipo principal

El logotipo vigente combina:

- símbolo circular oscuro;
- letra K;
- acento verde lima;
- denominación Kumplio;
- referencia al mercado chileno.

### 7.2 Variantes necesarias

El sistema debe mantener:

1. logotipo horizontal oscuro;
2. logotipo horizontal claro;
3. isotipo K;
4. isotipo monocromático;
5. versión compacta para barra lateral;
6. favicon;
7. versión para documentos e informes.

### 7.3 Área de protección

Alrededor del logotipo debe existir un margen mínimo equivalente al ancho de la barra vertical de la K.

### 7.4 Tamaño mínimo

- Logotipo horizontal digital: 120 px de ancho.
- Isotipo digital: 24 px.
- Impresión horizontal: 32 mm.

### 7.5 Usos incorrectos

No:

- deformar;
- rotar;
- cambiar proporciones;
- aplicar sombras fuertes;
- usar sobre fondos sin contraste;
- cambiar el verde por estados de riesgo;
- recrear el nombre con una tipografía distinta.

---

## 8. Tipografía

### 8.1 Tipografía oficial

**Montserrat** es la tipografía oficial y única de la experiencia visible de Kumplio.

Se utiliza en:

- sitio público;
- aplicación;
- navegación;
- formularios;
- paneles;
- informes;
- correos;
- presentaciones;
- piezas comerciales;
- gráficos y visualizaciones.

Geist, Arial, Inter u otras tipografías no deben utilizarse como fuente visual principal.

### 8.2 Implementación web

Usar `Montserrat` mediante `next/font/google` o archivos servidos por la infraestructura del proyecto.

Variable recomendada:

```css
--font-sans: "Montserrat", sans-serif;
```

No cargar más de los pesos necesarios.

Pesos oficiales:

- 300 — texto auxiliar excepcional;
- 400 — texto de lectura;
- 500 — controles y etiquetas;
- 600 — subtítulos y acciones;
- 700 — títulos;
- 800 — cifras y encabezados de alto impacto.

No usar peso 900 salvo una pieza de marca específica y aprobada.

### 8.3 Escala tipográfica

| Token | Escritorio | Móvil | Peso | Uso |
|---|---:|---:|---:|---|
| `display-xl` | 64/68 | 42/46 | 800 | Hero público |
| `display-lg` | 48/54 | 36/42 | 800 | Encabezado de sección |
| `heading-1` | 36/42 | 30/36 | 700 | Título de página |
| `heading-2` | 28/34 | 24/30 | 700 | Sección principal |
| `heading-3` | 22/28 | 20/26 | 600 | Panel o bloque |
| `body-lg` | 18/30 | 17/28 | 400 | Introducción |
| `body` | 15/24 | 15/24 | 400 | Texto estándar |
| `body-sm` | 13/20 | 13/20 | 400 | Metadatos |
| `label` | 12/16 | 12/16 | 600 | Etiquetas |
| `caption` | 11/16 | 11/16 | 500 | Apoyo y auditoría |

### 8.4 Reglas tipográficas

- Evitar texto de lectura en mayúsculas.
- Mayúsculas solo para etiquetas cortas o códigos.
- No usar tracking excesivo salvo kicker institucional.
- Limitar párrafos a 68–76 caracteres por línea.
- Usar números tabulares en indicadores y tablas cuando estén disponibles.
- Códigos, hashes y referencias técnicas pueden usar una fuente monoespaciada auxiliar, nunca como tipografía de marca.

---

## 9. Paleta de color

### 9.1 Decisión canónica

El verde oficial se unifica en:

```text
Kumplio Lima — #B8F542
```

Reemplaza la inconsistencia actual entre `#B1D374` y `#B8F542`.

### 9.2 Colores de marca

| Token | Hex | Uso |
|---|---|---|
| `kumplio-lima` | `#B8F542` | Acción principal, foco, marca |
| `kumplio-lima-dark` | `#88BC22` | Texto/acento sobre fondos claros |
| `kumplio-navy` | `#111723` | Fondo principal oscuro |
| `kumplio-graphite` | `#202733` | Superficie elevada |
| `kumplio-slate` | `#46525E` | Bordes y soporte |
| `kumplio-mist` | `#91A5AD` | Información secundaria |
| `kumplio-ivory` | `#F7F7F2` | Fondo principal claro |
| `kumplio-white` | `#FFFFFF` | Superficie clara |
| `kumplio-ink` | `#111318` | Texto principal claro |

### 9.3 Estados semánticos

| Estado | Color base | Regla |
|---|---|---|
| Éxito / validado | `#22A06B` | Solo resultados confirmados |
| Información | `#2F7DD1` | Contexto neutral |
| Advertencia | `#D99414` | Requiere atención |
| Error / crítico | `#D64545` | Falla o riesgo crítico |
| Pendiente | `#7B8794` | Sin decisión |
| Propuesta IA | `#7B61C9` | Inferencia no validada |

El verde de marca no debe significar automáticamente “cumplimiento aprobado”.

### 9.4 Riesgo

| Nivel | Token |
|---|---|
| Crítico | rojo intenso |
| Alto | naranja |
| Medio | ámbar |
| Bajo | verde sobrio |
| Sin evaluación | gris |

Cada nivel debe acompañarse de texto o icono; nunca depender únicamente del color.

### 9.5 Modo claro y oscuro

Ambos modos deben existir y compartir jerarquía.

- Sitio público: modo oscuro como dirección principal de marca.
- Aplicación: respetar preferencia del sistema y permitir cambio manual.
- Informes: modo claro por defecto para lectura e impresión.

---

## 10. Espaciado y geometría

### 10.1 Unidad base

Unidad de espaciado: **4 px**.

Escala:

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
```

### 10.2 Radios

El sistema actual de radio fijo de 5 px se reemplaza por una escala coherente:

| Token | Valor | Uso |
|---|---:|---|
| `radius-sm` | 6 px | Controles compactos |
| `radius-md` | 10 px | Campos y botones |
| `radius-lg` | 14 px | Tarjetas y paneles |
| `radius-xl` | 20 px | Hero y módulos destacados |
| `radius-full` | 999 px | Etiquetas y avatares |

### 10.3 Bordes

- 1 px por defecto.
- Contraste bajo para separación estructural.
- Contraste alto solo para foco, error o selección.
- No usar bordes múltiples alrededor de un mismo bloque.

### 10.4 Sombras

Sombras discretas y funcionales:

- nivel 1: tarjeta sobre fondo;
- nivel 2: menú o popover;
- nivel 3: modal.

No usar sombras de color verde o violeta como decoración permanente.

---

## 11. Iconografía

- Biblioteca principal: **Lucide**.
- Trazo coherente de 1,75–2 px.
- Tamaños estándar: 16, 20, 24 y 32 px.
- Todo icono interactivo debe tener etiqueta accesible.
- Evitar combinar varias bibliotecas.
- No usar emojis como iconografía de producto.

Los agentes pueden tener símbolos propios, pero deben compartir una construcción común y no parecer personajes infantiles.

---

## 12. Fotografía, ilustración y movimiento

### 12.1 Fotografía

Usar fotografía solo cuando aporte contexto humano o sectorial real:

- operaciones chilenas;
- transporte;
- agro;
- minería;
- oficinas;
- equipos profesionales.

Evitar fotografías de stock genéricas de apretones de manos o personas mirando gráficos falsos.

### 12.2 Ilustración

Las ilustraciones deben representar:

- relaciones;
- trazabilidad;
- capas de conocimiento;
- evidencia;
- flujos;
- redes regulatorias.

Estilo:

- geométrico;
- sobrio;
- limpio;
- con líneas y nodos;
- sin estética de caricatura.

### 12.3 Movimiento

Duraciones:

- microinteracción: 120–180 ms;
- panel o menú: 180–240 ms;
- transición compleja: máximo 320 ms.

Respetar `prefers-reduced-motion`.

No usar animaciones infinitas salvo actividad real, como un agente ejecutando una tarea.

---

# PARTE III — ARQUITECTURA DE EXPERIENCIA

## 13. Públicos principales

1. Gerencia general.
2. Responsable de cumplimiento.
3. Encargado de protección de datos.
4. Abogado interno o externo.
5. Auditor.
6. Responsable operacional.
7. Dueño de control.
8. Proveedor o colaborador que entrega evidencia.
9. Administrador de la organización.

La interfaz debe adaptar profundidad, no crear productos distintos para cada rol.

---

## 14. Arquitectura de información

### 14.1 Sitio público

```text
Inicio
Producto
  Plataforma de Conocimiento
  Expedientes
  Controles y Evidencias
  Agentes
Soluciones
  Ley N.º 21.719
  Transporte
  Agro
  Minería
Confianza
  Fuentes y metodología
  Seguridad
  Revisión humana
Recursos
Precios
Acceder
Comenzar
```

### 14.2 Aplicación

Navegación principal propuesta:

```text
Hoy
Expedientes
Obligaciones
Controles
Evidencias
Solicitudes
Riesgos y acciones
Conocimiento
  Grafo Nacional
  Memoria Organizacional
  Mapeos
Inteligencia regulatoria
Agentes
Informes
Configuración
```

### 14.3 Principio “Hoy primero”

La pantalla inicial no debe ser un resumen estático. Debe responder:

- qué cambió;
- qué requiere atención;
- qué vence;
- qué está bloqueado;
- qué propone Kumplio;
- qué espera revisión humana.

---

## 15. Estructura de la aplicación

### 15.1 Barra lateral

- Ancho expandido: 264 px.
- Ancho compacto: 72 px.
- Logotipo compacto.
- Organización activa.
- Navegación agrupada.
- Estado del sistema.
- Perfil y configuración al pie.

### 15.2 Barra superior

Debe incluir:

- contexto o breadcrumb;
- búsqueda global;
- acción principal de la vista;
- notificaciones;
- ayuda;
- perfil.

### 15.3 Área de contenido

- Máximo recomendado para lectura: 1440 px.
- Tablas y grafos pueden usar ancho completo.
- Encabezado de página consistente:
  - título;
  - descripción breve;
  - estado;
  - acciones;
  - metadatos.

---

# PARTE IV — PANTALLAS CANÓNICAS

## 16. Panel “Hoy”

### Objetivo

Entregar una lectura operacional inmediata.

### Estructura

1. Saludo y organización.
2. Resumen de atención:
   - obligaciones nuevas;
   - controles por vencer;
   - evidencias pendientes;
   - cambios regulatorios;
   - revisiones humanas;
   - agentes trabajando.
3. Prioridades del día.
4. Actividad regulatoria.
5. Estado de flujos.
6. Accesos rápidos.

No mostrar un “82 % de cumplimiento” sin metodología verificable.

Usar en su lugar indicadores como:

- 18 de 24 obligaciones con control asignado;
- 11 de 18 controles con evidencia vigente;
- 4 decisiones pendientes de revisión;
- 2 controles vencidos.

---

## 17. Expediente 2.0

### Objetivo

Ser el centro de trabajo de un asunto de cumplimiento.

### Encabezado

- nombre;
- estado;
- prioridad;
- responsable;
- ámbito;
- fecha objetivo;
- última actividad;
- acciones principales.

### Navegación interna

```text
Resumen
Obligaciones
Controles
Evidencias
Mapeos
Riesgos y acciones
Agentes
Versiones
Actividad
```

### Panel resumen

Debe mostrar:

- propósito y alcance;
- progreso verificable por dimensiones;
- recursos vinculados;
- solicitudes pendientes;
- controles sin evidencia;
- propuestas de mapeo;
- flujos agentic;
- decisiones recientes;
- Memoria Organizacional relacionada.

---

## 18. Controles

Cada control debe comunicar:

- código y nombre;
- objetivo;
- obligación relacionada;
- responsable;
- frecuencia;
- próxima evaluación;
- efectividad de diseño;
- efectividad operacional;
- evidencia asociada;
- historial de evaluaciones;
- estado y ciclo de vida.

La ficha debe separar:

1. diseño del control;
2. ejecución;
3. evidencia;
4. evaluación;
5. decisiones.

---

## 19. Evidencias

Una evidencia no es solamente un archivo.

La interfaz debe mostrar:

- nombre;
- tipo;
- fuente;
- período cubierto;
- emisión;
- vencimiento;
- integridad;
- confidencialidad;
- estado de validación;
- controles respaldados;
- historial;
- solicitudes relacionadas.

La evidencia vencida no se elimina: cambia su estado y conserva historial.

---

## 20. Grafo Nacional de Conocimiento

### Vistas

1. Explorador visual.
2. Lista jerárquica.
3. Detalle de nodo.
4. Historial de versiones.
5. Fuentes y citas.

### Interacciones

- buscar;
- filtrar por tipo;
- expandir relaciones;
- fijar nodos;
- seleccionar profundidad;
- comparar versiones;
- abrir fuente;
- crear propuesta de mapeo.

### Nodos visuales

Los tipos deben distinguirse por forma, etiqueta e icono, no solo por color.

Ejemplos:

- norma;
- artículo;
- inciso;
- obligación;
- derecho;
- organismo;
- concepto;
- control de referencia;
- sanción.

---

## 21. Memoria Organizacional

### Objetivo

Mostrar cómo Kumplio entiende la organización sin exponer complejidad técnica innecesaria.

### Vistas

- resumen;
- entidades;
- relaciones;
- procedencia;
- cambios;
- sincronización.

Tipos iniciales:

- organización;
- documento;
- control;
- evidencia;
- proceso;
- sistema;
- proveedor;
- contrato;
- tratamiento de datos;
- riesgo;
- incidente.

La interfaz debe indicar siempre que la memoria es privada y aislada.

---

## 22. Motor de Mapeo

Cada propuesta debe presentar:

1. nodo público;
2. fuente y versión;
3. nodo privado;
4. relación propuesta;
5. alcance;
6. supuestos;
7. evidencia relacionada;
8. componentes de confianza;
9. origen de la propuesta;
10. decisión humana.

Estados visibles:

- Propuesto.
- Pendiente de revisión.
- Aplicable.
- Parcialmente aplicable.
- No aplicable.
- Rechazado.
- Reemplazado.

Nunca usar “Cumple” únicamente por aprobar un mapeo.

---

## 23. Agentes

### Presentación

Los agentes son especialistas funcionales, no mascotas.

Cada agente muestra:

- nombre;
- función;
- herramientas autorizadas;
- estado;
- fuentes utilizadas;
- última actividad;
- nivel de autonomía;
- revisiones pendientes.

### Estados

- En espera.
- Preparando contexto.
- Analizando.
- Generando propuesta.
- Esperando revisión.
- Aprobado.
- Requiere corrección.
- Falló.

### Respuesta canónica

```text
Conclusión propuesta
Fuente consultada
Citas
Aplicabilidad
Supuestos
Evidencia organizacional
Nivel de confianza
Revisión humana
Acciones siguientes
```

---

## 24. Inteligencia regulatoria

Debe mostrar:

- fuente;
- salud del conector;
- última captura;
- última versión;
- cambio detectado;
- publicaciones nuevas;
- revisión pendiente;
- impacto potencial.

No exponer detalles técnicos de scrapers al usuario común. Los detalles operacionales quedan en una vista administrativa.

---

## 25. Informes

Los informes deben ser:

- legibles en pantalla;
- imprimibles;
- exportables a PDF;
- versionados;
- identificables por organización, fecha y alcance;
- respaldados por citas y evidencia.

Estructura recomendada:

1. portada;
2. resumen ejecutivo;
3. alcance y metodología;
4. situación actual;
5. obligaciones;
6. controles;
7. evidencias;
8. brechas;
9. acciones;
10. anexos y fuentes.

---

# PARTE V — COMPONENTES

## 26. Botones

Variantes:

- Primario.
- Secundario.
- Terciario.
- Destructivo.
- Icono.

Reglas:

- Una acción primaria por bloque.
- Usar verbo específico: “Crear expediente”, no “Continuar”.
- Altura estándar: 40 px.
- Altura grande: 48 px.
- Estados: normal, hover, focus, loading, disabled.

---

## 27. Campos y formularios

- Etiqueta siempre visible.
- Ayuda debajo del campo.
- Error específico.
- No usar placeholder como etiqueta.
- Guardado explícito para decisiones relevantes.
- Autosave solo en borradores seguros.
- Confirmar acciones irreversibles.

---

## 28. Tarjetas

Una tarjeta debe representar una unidad real de información o acción.

No crear tarjetas solo para decorar.

Estructura:

- encabezado;
- contenido;
- metadatos;
- estado;
- acción.

Evitar tarjetas anidadas más de un nivel.

---

## 29. Tablas

- Encabezado fijo en tablas largas.
- Orden, filtros y búsqueda visibles.
- Columnas prioritarias primero.
- Acciones al final.
- Selección múltiple solo cuando exista una operación real.
- Vista móvil alternativa en tarjetas o lista compacta.

---

## 30. Etiquetas de estado

Cada estado debe incluir:

- texto;
- color;
- contraste suficiente;
- significado consistente.

No usar el mismo color para “validado” y “bajo riesgo” sin etiqueta textual.

---

## 31. Timeline

El timeline es la fuente de historia visible.

Debe registrar:

- actor;
- acción;
- fecha y hora;
- estado anterior;
- estado nuevo;
- comentario;
- recurso relacionado.

Diferenciar visualmente acciones humanas, automáticas y de agentes.

---

## 32. Modales y paneles laterales

- Modal: decisión focal o confirmación.
- Panel lateral: detalle contextual sin abandonar la tarea.
- Página completa: tareas largas o complejas.

No usar modal para formularios extensos.

---

## 33. Vacíos, carga y error

### Estado vacío

Debe explicar:

- qué es el módulo;
- por qué importa;
- cuál es la primera acción.

### Carga

- Skeleton coherente con el contenido.
- No bloquear toda la pantalla si solo carga un panel.

### Error

Debe indicar:

- qué ocurrió;
- qué se conservó;
- qué puede hacer el usuario;
- identificador técnico cuando corresponda.

---

# PARTE VI — CONFIANZA Y DATOS

## 34. Nivel de confianza

No usar una cifra única sin contexto.

Mostrar componentes:

- calidad de fuente;
- actualidad;
- precisión de cita;
- consistencia;
- evidencia organizacional;
- revisión humana.

Ejemplo:

```text
Fuente oficial: alta
Cita exacta: verificada
Aplicabilidad: pendiente
Evidencia organizacional: parcial
Revisión humana: pendiente
```

---

## 35. Procedencia

Todo conocimiento debe poder abrir una vista de procedencia con:

- fuente;
- documento;
- versión;
- sección;
- hash;
- fecha de captura;
- método de extracción;
- agente o persona;
- revisión.

---

## 36. Visualización de métricas

- Preferir cifras absolutas y denominadores.
- Evitar gráficos circulares con muchas categorías.
- Usar barras para comparación.
- Usar línea solo para series temporales.
- Usar tablas cuando el valor está en el detalle.
- Incluir fecha de actualización.
- No truncar escalas de manera engañosa.

---

# PARTE VII — RESPONSIVE Y ACCESIBILIDAD

## 37. Puntos de quiebre

- Móvil: 320–767 px.
- Tableta: 768–1023 px.
- Escritorio: 1024–1439 px.
- Escritorio amplio: 1440 px o más.

Diseñar primero el contenido y la jerarquía, no una versión reducida del escritorio.

---

## 38. Accesibilidad

Objetivo mínimo: **WCAG 2.2 AA**.

Requisitos:

- navegación completa por teclado;
- foco visible;
- contraste AA;
- etiquetas de formulario;
- estados no dependientes solo de color;
- áreas táctiles mínimas de 44 × 44 px;
- soporte para zoom al 200 %;
- texto alternativo;
- encabezados semánticos;
- reducción de movimiento;
- mensajes de error asociados al campo;
- tablas con encabezados correctos.

---

# PARTE VIII — SISTEMA TÉCNICO

## 39. Tokens

Los estilos deben implementarse mediante tokens semánticos, no colores escritos directamente en componentes.

Ejemplos:

```css
--color-brand-primary
--color-brand-primary-hover
--color-surface-base
--color-surface-raised
--color-text-primary
--color-text-secondary
--color-border-subtle
--color-status-success
--color-status-warning
--color-status-danger
--font-sans
--space-4
--radius-lg
--shadow-2
```

---

## 40. Componentes base

Kumplio debe consolidar un sistema compartido para:

- botón;
- campo;
- selector;
- fecha;
- tabla;
- tarjeta;
- panel;
- modal;
- panel lateral;
- pestañas;
- breadcrumb;
- etiqueta de estado;
- timeline;
- notificación;
- skeleton;
- empty state;
- visualización de confianza;
- fuente y cita;
- nodo y relación;
- estado de agente.

No crear variantes locales sin incorporarlas al sistema.

---

## 41. Convenciones de implementación

- Interfaz visible siempre en español.
- Montserrat como `font-sans` global.
- Componentes accesibles por defecto.
- Estados de carga, vacío y error obligatorios.
- No introducir un color nuevo sin token.
- No introducir un término nuevo sin revisar el lenguaje canónico.
- No diseñar una nueva tabla de datos sin definir su versión móvil.
- No diseñar una respuesta IA sin fuentes y revisión.

---

# PARTE IX — REDISEÑO DEL SITIO

## 42. Sitio público nuevo

### 42.1 Hero

Debe comunicar en menos de diez segundos:

- qué es Kumplio;
- para quién;
- qué problema resuelve;
- por qué es diferente;
- acción principal.

Propuesta:

**Kicker**  
Plataforma chilena de conocimiento regulatorio

**Título**  
Convierte obligaciones en controles y evidencia verificable.

**Bajada**  
Kumplio conecta normativa oficial, memoria organizacional y agentes especializados para transformar cumplimiento en trabajo demostrable.

**Acciones**  
- Comenzar evaluación.
- Ver cómo funciona.

### 42.2 Prueba visual

El hero debe mostrar un producto realista:

- cambio regulatorio;
- obligación;
- control;
- evidencia;
- estado de revisión.

No usar mockups abstractos o solo texto.

### 42.3 Secciones

1. Confianza y fuentes.
2. Cómo funciona.
3. Plataforma de Conocimiento.
4. Expedientes y operación.
5. Agentes especializados.
6. Ley N.º 21.719.
7. Verticales.
8. Seguridad y revisión humana.
9. Llamado a la acción.

---

# PARTE X — PLAN DE MIGRACIÓN

## 43. Problemas actuales identificados

1. Conviven Montserrat, Geist y tipografía del sistema.
2. El verde aparece como `#B1D374` y `#B8F542`.
3. El radio global fijo de 5 px limita jerarquía.
4. El sitio público todavía comunica principalmente “gestión de cumplimiento” y no toda la Plataforma de Conocimiento.
5. Hay estilos heredados bajo la denominación N3uralia que deben convertirse en tokens Kumplio.
6. La navegación creció por módulos y necesita reorganización por tareas.
7. La aplicación necesita una vista “Hoy”.
8. El expediente requiere navegación interna y mejor jerarquía.
9. Grafo, Memoria Organizacional y Mapeos necesitan patrones visuales propios.

---

## 44. Fases de rediseño

### Fase D0 — Fundamentos

- instalar Montserrat globalmente;
- unificar tokens;
- unificar verde oficial;
- definir modo claro y oscuro;
- consolidar radios, sombras y espaciado;
- eliminar estilos heredados inconsistentes.

### Fase D1 — Navegación y shell

- nueva barra lateral;
- barra superior;
- buscador global;
- organización activa;
- navegación responsive;
- encabezados de página.

### Fase D2 — Panel “Hoy”

- prioridades;
- cambios regulatorios;
- vencimientos;
- solicitudes;
- agentes;
- revisiones.

### Fase D3 — Expediente 2.0

- tabs internas;
- resumen verificable;
- recursos;
- mapeos;
- memoria;
- agentes;
- timeline.

### Fase D4 — Plataforma de Conocimiento

- Grafo Nacional;
- Memoria Organizacional;
- Motor de Mapeo;
- procedencia y confianza.

### Fase D5 — Sitio público

- nuevo mensaje;
- nueva arquitectura;
- prueba visual del producto;
- páginas de solución;
- confianza y seguridad.

### Fase D6 — Informes y comunicaciones

- PDF;
- correos;
- notificaciones;
- plantillas comerciales;
- centro de ayuda.

---

## 45. Criterios de aceptación del rediseño

Una pantalla se considera terminada cuando:

1. usa Montserrat;
2. usa tokens canónicos;
3. está completamente en español;
4. funciona en móvil y escritorio;
5. cumple WCAG 2.2 AA;
6. tiene estados de carga, vacío y error;
7. no presenta inferencias como hechos;
8. muestra procedencia cuando corresponde;
9. conserva trazabilidad;
10. pasó revisión visual y funcional.

---

## 46. Gobierno del diseño

Toda modificación relevante debe enlazar:

```text
DESIGN.md
→ objetivo de diseño
→ issue
→ rama
→ PR
→ preview
→ revisión visual
→ prueba responsive
→ accesibilidad
→ merge
```

`DESIGN.md` debe actualizarse cuando cambie una decisión transversal de marca, navegación, componentes o experiencia.

---

## 47. Próximos tres sprints de diseño

### Sprint Diseño 1 — Fundamentos visuales

- Montserrat global;
- tokens de color;
- radio y espaciado;
- botones, campos, tarjetas y estados;
- modo claro y oscuro.

### Sprint Diseño 2 — Shell y Panel “Hoy”

- nueva navegación;
- buscador;
- contexto de organización;
- prioridades y actividad.

### Sprint Diseño 3 — Expediente 2.0

- encabezado;
- navegación interna;
- resumen;
- recursos;
- Memoria Organizacional;
- Mapeos;
- agentes;
- actividad.

---

# Decisión final

> Kumplio debe sentirse como una plataforma chilena seria, moderna y confiable. La marca no compite por verse más llamativa; compite por hacer visible la relación entre norma, decisión, control y evidencia.

> **Montserrat es la tipografía oficial de todo el sistema visible.**
