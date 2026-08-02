# KUMPLIO — Lenguaje Canónico

> Uso obligatorio en interfaz, agentes, correos, informes, documentación y APIs públicas.  
> Mercado: Chile.  
> Idioma visible: español.

## 1. Propósito

Kumplio debe hablar con una sola voz. El lenguaje visible no puede depender del nombre técnico de una tabla, de traducciones literales ni del proveedor de IA utilizado.

## 2. Reglas generales

1. Todo texto visible para clientes se escribe en español claro y profesional.
2. Se evita mezclar inglés y español.
3. Los nombres técnicos en inglés pueden mantenerse únicamente en código y base de datos.
4. Se prefiere lenguaje comprensible para equipos jurídicos, de cumplimiento, operaciones, tecnología y gerencia.
5. No se afirma certeza jurídica automática.
6. Se diferencia siempre entre obligación, interpretación, recomendación, evidencia y decisión humana.
7. Se utiliza terminología chilena cuando exista una denominación oficial o de uso empresarial consolidado.

## 3. Términos oficiales

| Término técnico o prohibido | Término visible oficial |
|---|---|
| dashboard | Panel de control |
| compliance case | Expediente de cumplimiento |
| workflow | Flujo de trabajo |
| pipeline | Flujo de procesamiento |
| knowledge graph | Grafo de conocimiento |
| public knowledge graph | Grafo Nacional de Conocimiento |
| enterprise memory | Memoria Organizacional |
| node | Nodo de conocimiento |
| edge | Relación |
| entity | Entidad |
| claim | Afirmación |
| citation | Cita |
| legal citation | Cita normativa |
| source | Fuente |
| evidence | Evidencia |
| control | Control |
| finding | Hallazgo |
| issue | Incidencia o hallazgo, según contexto |
| risk score | Nivel de riesgo |
| confidence score | Nivel de confianza |
| dataset | Conjunto de datos |
| chunk | Fragmento |
| parser | Analizador estructurado |
| scraper | Conector de captura, en interfaz |
| scraping | Captura automatizada de fuente |
| retry | Reintento |
| dead letter | Ejecución agotada |
| circuit breaker | Protección por fallas repetidas |
| artifact | Artefacto |
| human-in-the-loop | Revisión humana obligatoria |
| owner | Propietario de la organización |
| admin | Administrador |
| member | Integrante |
| vendor | Proveedor |
| processor | Encargado del tratamiento |
| subprocessor | Subencargado del tratamiento |
| data subject | Titular de datos |
| personal data | Datos personales |
| sensitive data | Datos personales sensibles |
| processing activity | Actividad de tratamiento |
| record of processing | Registro de actividades de tratamiento |
| DPIA | Evaluación de Impacto en Protección de Datos (EIPD) |
| privacy by design | Protección de datos desde el diseño |
| privacy by default | Protección de datos por defecto |
| breach | Vulneración de seguridad o incidente, según contexto |
| legal basis | Base de licitud |
| retention | Plazo de conservación |
| mapping | Mapeo de aplicabilidad |
| scope | Alcance |
| reviewer | Revisor |
| approval gate | Punto de aprobación |

## 4. Estados oficiales

### Afirmaciones

- Borrador.
- Pendiente de revisión.
- Sustentada.
- Parcialmente sustentada.
- No sustentada.
- Contradictoria.
- Rechazada.
- Retirada.

### Evidencias

- Pendiente.
- Recibida.
- En revisión.
- Suficiente.
- Parcial.
- Insuficiente.
- Rechazada.
- Vencida.

### Controles

- No evaluado.
- Diseño adecuado.
- Diseño parcial.
- Diseño inadecuado.
- Operación efectiva.
- Operación parcial.
- Operación inefectiva.
- Requiere mejora.

### Fuentes y conectores

- Deshabilitado.
- Manual.
- Programado.
- En pausa.
- Salud desconocida.
- Saludable.
- Degradado.
- Con falla.

## 5. Estructura de respuestas de agentes

Los agentes evitan expresiones como “creo”, “me parece” o “probablemente” sin fundamento. La salida recomendada es:

1. Conclusión o hallazgo.
2. Fuente consultada.
3. Cita o evidencia.
4. Interpretación.
5. Aplicabilidad.
6. Supuestos y limitaciones.
7. Nivel de confianza descompuesto.
8. Revisión humana requerida.
9. Acción siguiente sugerida.

## 6. Lenguaje de certeza

### Permitido

- “La fuente establece…”
- “La cita respalda…”
- “La aplicabilidad depende de…”
- “No existe evidencia suficiente para concluir…”
- “Requiere revisión jurídica.”
- “Se identificó una brecha.”

### Prohibido sin validación formal

- “Cumple 100%.”
- “Está completamente protegido.”
- “No existe riesgo.”
- “La empresa no será sancionada.”
- “Esta interpretación es definitiva.”

## 7. Convenciones chilenas

- Fechas visibles: `2 de agosto de 2026` o `02-08-2026` según contexto.
- Moneda: pesos chilenos (`$`) y UF cuando corresponda.
- Identificadores: RUT, razón social, comuna, región y organismo chileno.
- Normas: “Ley N.º 21.719”, “artículo 14”, “Diario Oficial”, “Biblioteca del Congreso Nacional”.
- Roles: responsable del tratamiento, encargado del tratamiento, subencargado y delegado de protección de datos cuando corresponda.

## 8. Gobernanza

Un término nuevo visible requiere:

1. definición;
2. sinónimos aceptados;
3. términos que reemplaza;
4. ejemplo de uso;
5. incorporación a este documento o catálogo versionado.

Travis debe revisar este documento antes de introducir nuevas etiquetas de interfaz. Los agentes deben recibir este vocabulario como parte de sus instrucciones de sistema.