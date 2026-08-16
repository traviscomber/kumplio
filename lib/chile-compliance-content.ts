import { OFFICIAL_LEY_21719_URL } from '@/lib/public-site'

export type ChileComplianceGuide = {
  slug: string
  shortTitle: string
  title: string
  seoTitle: string
  description: string
  legalBasis: string
  directAnswer: string
  keyPoints: string[]
  implementationSteps: string[]
  evidenceExamples: string[]
  relatedSlugs: string[]
}

export const chileComplianceGuides: ChileComplianceGuide[] = [
  {
    slug: 'principios-proteccion-datos',
    shortTitle: 'Principios de protección de datos',
    title: 'Principios de protección de datos personales bajo la Ley 21.719',
    seoTitle: 'Principios de la Ley 21.719 en Chile: guía para empresas',
    description:
      'Guía práctica sobre licitud, finalidad, proporcionalidad, calidad, responsabilidad, seguridad, transparencia y confidencialidad bajo la Ley 21.719.',
    legalBasis: 'Artículo 3 de la Ley 19.628, según las modificaciones introducidas por la Ley 21.719.',
    directAnswer:
      'La Ley 21.719 exige que el tratamiento de datos personales sea lícito, limitado a fines definidos, proporcional, exacto, seguro, transparente y confidencial. La organización debe poder demostrar cómo aplica estos principios en sus procesos, sistemas, contratos y decisiones.',
    keyPoints: [
      'La licitud del tratamiento debe poder acreditarse.',
      'Los datos deben utilizarse para finalidades específicas, explícitas y legítimas.',
      'La recolección y conservación deben limitarse a lo necesario.',
      'El responsable debe mantener información exacta, completa y actualizada.',
      'La responsabilidad incluye adoptar medidas y conservar evidencia de cumplimiento.',
      'Seguridad, transparencia y confidencialidad deben aplicarse durante todo el ciclo de vida del dato.',
    ],
    implementationSteps: [
      'Inventariar los procesos que tratan datos personales y sus finalidades.',
      'Relacionar cada tratamiento con una base de licitud y un responsable interno.',
      'Definir plazos de conservación y reglas de supresión o anonimización.',
      'Revisar medidas técnicas y organizativas según el riesgo del tratamiento.',
      'Documentar decisiones, excepciones, revisiones y evidencia de ejecución.',
    ],
    evidenceExamples: [
      'Inventario de tratamientos y finalidades.',
      'Matriz de bases de licitud.',
      'Política de conservación y eliminación.',
      'Controles de acceso y registros de revisión.',
      'Avisos de privacidad versionados.',
    ],
    relatedSlugs: ['inventario-tratamientos', 'derechos-titulares', 'evaluacion-impacto'],
  },
  {
    slug: 'inventario-tratamientos',
    shortTitle: 'Inventario de tratamientos',
    title: 'Inventario de tratamientos de datos personales para preparar la Ley 21.719',
    seoTitle: 'Inventario de tratamientos y RAT en Chile: cómo prepararlo para la Ley 21.719',
    description:
      'Cómo construir un inventario operativo de tratamientos, finalidades, datos, titulares, sistemas, terceros, retención, base de licitud y evidencia sin presentar una planilla como prueba automática de cumplimiento.',
    legalBasis: 'Artículos 3 y 14 de la Ley 19.628, según las modificaciones introducidas por la Ley 21.719.',
    directAnswer:
      'La Ley 21.719 exige al responsable acreditar principios y obligaciones sobre sus tratamientos. Aunque la ley no convierte la expresión “RAT” en un formulario único para todas las organizaciones, un inventario operativo permite relacionar cada tratamiento con finalidad, categorías de datos, titulares, responsables, terceros, base de licitud, retención, seguridad y evidencia para poder gestionar esas obligaciones.',
    keyPoints: [
      'El inventario debe describir tratamientos reales, no sólo sistemas o bases de datos.',
      'Finalidad y base de licitud deben revisarse por tratamiento y no heredarse por defecto.',
      'Terceros, destinatarios y transferencias deben quedar relacionados con el contexto en que participan.',
      'La retención debe expresar una regla o criterio defendible, no una fecha inventada.',
      'Los campos desconocidos deben permanecer abiertos hasta obtener evidencia suficiente.',
      'El inventario sirve como mapa de trabajo; no constituye por sí solo una declaración de cumplimiento.',
    ],
    implementationSteps: [
      'Identificar procesos de negocio que recolectan, consultan, modifican, comunican, almacenan o eliminan datos personales.',
      'Definir finalidad, categorías de datos, titulares y responsable interno de cada tratamiento.',
      'Relacionar sistemas, ubicaciones, proveedores, destinatarios y transferencias involucradas.',
      'Documentar base de licitud propuesta, retención, controles y evidencia disponible, marcando unknowns expresamente.',
      'Someter los campos jurídicos, de seguridad y lifecycle a revisión antes de tratarlos como cerrados.',
    ],
    evidenceExamples: [
      'Ficha versionada de cada tratamiento.',
      'Mapa de sistemas y flujos de datos.',
      'Contratos y anexos con proveedores.',
      'Matriz de bases de licitud y finalidades.',
      'Evidencia de retención, acceso y eliminación.',
    ],
    relatedSlugs: ['principios-proteccion-datos', 'encargados-proveedores', 'retencion-eliminacion'],
  },
  {
    slug: 'derechos-titulares',
    shortTitle: 'Derechos de los titulares',
    title: 'Derechos de acceso, rectificación, supresión, oposición, portabilidad y bloqueo',
    seoTitle: 'Derechos de titulares en la Ley 21.719: proceso para empresas',
    description:
      'Cómo preparar un proceso verificable para responder solicitudes de titulares bajo la nueva ley chilena de datos personales.',
    legalBasis: 'Artículos 4 a 11 de la Ley 19.628, según las modificaciones introducidas por la Ley 21.719.',
    directAnswer:
      'Las personas pueden ejercer derechos sobre sus datos personales ante el responsable. La empresa necesita canales simples, validación de identidad, responsables, plazos, criterios de respuesta y respaldos que demuestren qué recibió, decidió y comunicó.',
    keyPoints: [
      'Los derechos son personales, intransferibles e irrenunciables.',
      'El responsable debe habilitar mecanismos tecnológicos sencillos y eficaces.',
      'Las solicitudes deben registrarse y recibir acuse de recibo.',
      'La respuesta debe conservar fundamento, fecha, destinatario y contenido íntegro.',
      'Las solicitudes de rectificación, supresión u oposición pueden incluir bloqueo temporal.',
      'La falta de respuesta o una denegación puede ser reclamada ante la Agencia.',
    ],
    implementationSteps: [
      'Definir un canal formal para solicitudes y consultas de titulares.',
      'Diseñar un flujo de autenticación proporcional al riesgo de la solicitud.',
      'Asignar responsables y suplentes para clasificación, búsqueda y respuesta.',
      'Configurar alertas de plazo y escalamiento.',
      'Mantener una bitácora de solicitudes, decisiones, comunicaciones y evidencia de cierre.',
    ],
    evidenceExamples: [
      'Formulario o canal oficial de solicitudes.',
      'Registro de identidad y legitimación del solicitante.',
      'Bitácora de plazos y responsables.',
      'Copia de la respuesta enviada.',
      'Respaldo de rectificación, supresión, oposición o bloqueo ejecutado.',
    ],
    relatedSlugs: ['transparencia-avisos-privacidad', 'inventario-tratamientos', 'modelo-prevencion'],
  },
  {
    slug: 'encargados-proveedores',
    shortTitle: 'Encargados y proveedores',
    title: 'Contratos con encargados y proveedores que tratan datos personales',
    seoTitle: 'Encargados de datos y proveedores: artículo 15 bis Ley 21.719',
    description:
      'Qué debe revisar una empresa chilena cuando un proveedor trata datos personales por su cuenta.',
    legalBasis: 'Artículo 15 bis de la Ley 19.628, incorporado por la Ley 21.719.',
    directAnswer:
      'Cuando un tercero trata datos por cuenta de la organización, el encargo debe estar regulado por contrato. El documento debe definir objeto, duración, finalidad, tipos de datos, categorías de titulares, instrucciones, seguridad, subencargados y devolución o eliminación al finalizar el servicio.',
    keyPoints: [
      'El encargado debe actuar conforme a las instrucciones del responsable.',
      'No puede utilizar los datos para una finalidad distinta ni cederlos sin autorización.',
      'El contrato debe describir el tratamiento y las obligaciones de ambas partes.',
      'La subcontratación requiere autorización específica y escrita.',
      'El encargado debe reportar vulneraciones de seguridad al responsable.',
      'Al terminar el servicio, los datos deben devolverse o eliminarse según corresponda.',
    ],
    implementationSteps: [
      'Crear un inventario de proveedores con acceso a datos personales.',
      'Clasificar criticidad, datos, finalidad, ubicación e integración de cada proveedor.',
      'Revisar contratos y anexos de tratamiento de datos.',
      'Definir controles de subencargados, incidentes, auditoría y término del servicio.',
      'Solicitar y mantener evidencia periódica del cumplimiento contractual.',
    ],
    evidenceExamples: [
      'Inventario de encargados y subencargados.',
      'Contrato o anexo de tratamiento de datos.',
      'Evaluación de riesgo del proveedor.',
      'Evidencia de medidas de seguridad.',
      'Acta de devolución o eliminación de datos al término.',
    ],
    relatedSlugs: ['inventario-tratamientos', 'transferencias-internacionales', 'vulneraciones-seguridad'],
  },
  {
    slug: 'evaluacion-impacto',
    shortTitle: 'Evaluación de impacto',
    title: 'Evaluación de impacto en protección de datos personales',
    seoTitle: 'EIPD en Chile: cuándo exige evaluación de impacto la Ley 21.719',
    description:
      'Guía sobre tratamientos de alto riesgo, decisiones automatizadas, datos sensibles, gran escala y monitoreo sistemático bajo la Ley 21.719.',
    legalBasis: 'Artículo 15 ter de la Ley 19.628, incorporado por la Ley 21.719.',
    directAnswer:
      'La evaluación de impacto debe realizarse antes de iniciar un tratamiento cuando sea probable que produzca un alto riesgo para los derechos de las personas. La ley la exige, entre otros casos, para ciertos tratamientos masivos, monitoreo sistemático, datos sensibles y decisiones automatizadas con efectos significativos.',
    keyPoints: [
      'La evaluación se realiza antes de comenzar las operaciones de tratamiento.',
      'Debe describir finalidad, necesidad, proporcionalidad, riesgos y medidas de mitigación.',
      'Las decisiones automatizadas y la elaboración de perfiles requieren especial revisión.',
      'El tratamiento masivo o a gran escala puede activar la obligación.',
      'La observación sistemática de espacios públicos es un supuesto expresamente considerado.',
      'La futura Agencia publicará orientaciones y listas de tratamientos que requieren evaluación.',
    ],
    implementationSteps: [
      'Definir criterios internos para identificar tratamientos de alto riesgo.',
      'Describir el flujo de datos, sistemas, participantes y finalidades.',
      'Evaluar necesidad, proporcionalidad y alternativas menos invasivas.',
      'Identificar riesgos para los derechos y libertades de los titulares.',
      'Aprobar medidas de mitigación y conservar la decisión antes del inicio.',
    ],
    evidenceExamples: [
      'Ficha de clasificación de riesgo del tratamiento.',
      'Mapa de flujo de datos.',
      'Documento de evaluación de impacto versionado.',
      'Registro de medidas de mitigación y responsables.',
      'Aprobación previa al inicio del tratamiento.',
    ],
    relatedSlugs: ['principios-proteccion-datos', 'vulneraciones-seguridad', 'inventario-tratamientos'],
  },
  {
    slug: 'vulneraciones-seguridad',
    shortTitle: 'Vulneraciones de seguridad',
    title: 'Qué hacer ante una vulneración de seguridad de datos personales',
    seoTitle: 'Brechas de datos en Chile: deber de reporte de la Ley 21.719',
    description:
      'Guía operativa para detectar, contener, evaluar, documentar y escalar vulneraciones de seguridad bajo el artículo 14 sexies de la nueva ley chilena.',
    legalBasis: 'Artículos 14 quinquies y 14 sexies de la Ley 19.628, incorporados por la Ley 21.719.',
    directAnswer:
      'El responsable debe reportar a la Agencia, por medios expeditos y sin dilaciones indebidas, las vulneraciones de seguridad que produzcan destrucción, filtración, pérdida, alteración, comunicación o acceso no autorizado cuando exista un riesgo razonable para los derechos y libertades de los titulares. La gestión debe conservar hechos, evaluación, decisiones, medidas de contención y comunicaciones.',
    keyPoints: [
      'No todo evento técnico es automáticamente una vulneración reportable; debe evaluarse su naturaleza y riesgo.',
      'La evaluación debe partir de hechos observados y datos afectados, no de una etiqueta genérica de severidad.',
      'El encargado debe escalar al responsable cuando detecta una vulneración que involucra los datos tratados por cuenta de éste.',
      'La organización debe poder acreditar las medidas de seguridad adoptadas y su funcionamiento.',
      'Contención, preservación de evidencia y evaluación jurídica deben coordinarse sin destruir trazabilidad.',
      'Los plazos y destinatarios de las comunicaciones deben quedar registrados.',
    ],
    implementationSteps: [
      'Abrir un expediente de incidente con fecha, descubrimiento, sistemas, datos y actores involucrados.',
      'Contener el evento preservando logs, evidencia y cadena de decisiones.',
      'Evaluar impacto y riesgo razonable para derechos y libertades de los titulares.',
      'Definir y ejecutar las comunicaciones o reportes que correspondan, conservando fundamento y hora.',
      'Cerrar acciones correctivas, lecciones aprendidas y evidencia de remediación.',
    ],
    evidenceExamples: [
      'Timeline del incidente y registro de detección.',
      'Logs, alertas y evidencia técnica preservada.',
      'Evaluación de riesgo para los titulares.',
      'Copia y constancia de reportes o comunicaciones.',
      'Plan de remediación y verificación posterior.',
    ],
    relatedSlugs: ['encargados-proveedores', 'evaluacion-impacto', 'modelo-prevencion'],
  },
  {
    slug: 'retencion-eliminacion',
    shortTitle: 'Retención y eliminación',
    title: 'Retención, supresión y anonimización de datos personales',
    seoTitle: 'Retención de datos en Chile: reglas de eliminación bajo Ley 21.719',
    description:
      'Cómo definir reglas de conservación defendibles y demostrar supresión o anonimización sin prometer eliminación que no puede acreditarse.',
    legalBasis: 'Artículo 3 letra c) y artículo 14 ter letra i) de la Ley 19.628, según las modificaciones introducidas por la Ley 21.719.',
    directAnswer:
      'Los datos personales pueden conservarse sólo durante el tiempo necesario para cumplir los fines del tratamiento; después deben suprimirse o anonimizarse, salvo una excepción legal. El responsable además debe informar el período de conservación. Una política escrita no demuestra por sí sola que la eliminación ocurrió: la operación necesita evidencia verificable.',
    keyPoints: [
      'La retención debe conectarse con finalidad, necesidad y cualquier excepción legal aplicable.',
      'Un plazo mayor requiere fundamento; no debe copiarse una duración genérica sin revisar el tratamiento.',
      'Supresión lógica, eliminación en sistemas primarios, backups y procesadores externos son capas distintas.',
      'La organización debe evitar declarar purga total cuando sólo tiene evidencia de una capa.',
      'Anonimización requiere impedir razonablemente la reidentificación, no sólo ocultar un identificador visible.',
      'Las solicitudes de titulares y el término de proveedores pueden activar trabajo específico de lifecycle.',
    ],
    implementationSteps: [
      'Definir criterio de conservación por tratamiento y documentar su fundamento.',
      'Mapear sistemas primarios, réplicas, exports, proveedores y backups relevantes.',
      'Diseñar eventos de supresión, anonimización o bloqueo y sus responsables.',
      'Ejecutar pruebas controladas que no toquen datos productivos de titulares cuando sea posible.',
      'Conservar evidencia por capa y mantener abiertas las reservas sobre aquello que todavía no puede demostrarse.',
    ],
    evidenceExamples: [
      'Matriz de retención por tratamiento.',
      'Configuración o job de eliminación versionado.',
      'Log de ejecución y conteo antes/después.',
      'Evidencia del proveedor sobre lifecycle aplicable al tenant.',
      'Hash o artefacto de la prueba de eliminación.',
    ],
    relatedSlugs: ['inventario-tratamientos', 'encargados-proveedores', 'derechos-titulares'],
  },
  {
    slug: 'transferencias-internacionales',
    shortTitle: 'Transferencias internacionales',
    title: 'Transferencias internacionales de datos personales bajo la Ley 21.719',
    seoTitle: 'Transferencias internacionales de datos: Ley 21.719 Chile',
    description:
      'Cómo identificar transferencias internacionales, revisar el mecanismo que las habilita y conservar evidencia de garantías, destinatarios y decisiones.',
    legalBasis: 'Artículos 27 a 29 de la Ley 19.628, incorporados por la Ley 21.719.',
    directAnswer:
      'La Ley 21.719 regula las transferencias internacionales y contempla, entre otras vías, países con nivel adecuado de protección y garantías mediante cláusulas, normas corporativas u otros instrumentos. El responsable que transfiere debe poder acreditar que la operación se ajusta a las reglas aplicables y debe informar la transferencia cuando corresponda.',
    keyPoints: [
      'Primero debe identificarse si existe realmente una transferencia internacional y quién recibe los datos.',
      'La licitud del tratamiento de origen no reemplaza el análisis específico de la transferencia.',
      'El mecanismo aplicable puede depender del país, receptor, garantías y regulación vigente de la Agencia.',
      'Contratos y políticas públicas del proveedor no bastan para inferir una configuración tenant específica.',
      'Subencargados y cambios de ubicación pueden alterar el mapa de transferencias.',
      'El responsable debe conservar fundamento y evidencia del mecanismo utilizado.',
    ],
    implementationSteps: [
      'Mapear proveedores, destinatarios, ubicaciones y flujos que cruzan fronteras.',
      'Identificar la operación de tratamiento y el rol de cada participante.',
      'Determinar el mecanismo de transferencia que podría resultar aplicable y sus requisitos.',
      'Reunir contratos, garantías, configuración tenant y evidencia vigente necesaria.',
      'Registrar la decisión, reservas y revisiones periódicas frente a cambios de proveedor o regulación.',
    ],
    evidenceExamples: [
      'Mapa de transferencias y destinatarios.',
      'Contrato, DPA o cláusulas aplicables.',
      'Evidencia de ubicación y configuración del servicio.',
      'Registro de subencargados.',
      'Acta o revisión del mecanismo de transferencia.',
    ],
    relatedSlugs: ['encargados-proveedores', 'inventario-tratamientos', 'transparencia-avisos-privacidad'],
  },
  {
    slug: 'transparencia-avisos-privacidad',
    shortTitle: 'Transparencia y avisos',
    title: 'Deber de información, transparencia y avisos de privacidad',
    seoTitle: 'Aviso de privacidad Ley 21.719: qué debe informar una empresa en Chile',
    description:
      'Cómo construir y mantener información de privacidad clara, accesible, coherente con los tratamientos reales y respaldada por evidencia.',
    legalBasis: 'Artículo 3 letra g) y artículo 14 ter de la Ley 19.628, según las modificaciones introducidas por la Ley 21.719.',
    directAnswer:
      'El responsable debe mantener información precisa, clara, inequívoca, gratuita y accesible sobre sus prácticas de tratamiento y facilitar el ejercicio de derechos. El deber de información incluye elementos como identidad y contacto, categorías de datos, finalidades, base de legitimidad, destinatarios, seguridad, derechos, transferencias, conservación, fuente de los datos y decisiones automatizadas cuando corresponda.',
    keyPoints: [
      'El aviso debe reflejar tratamientos reales y no transformarse en un texto genérico desconectado de la operación.',
      'Cambios de finalidades, destinatarios, proveedores o retención pueden requerir revisar la información publicada.',
      'La base de legitimidad y los intereses legítimos no deben declararse sin revisión suficiente.',
      'Transferencias, conservación y origen de los datos forman parte de la transparencia cuando resultan aplicables.',
      'La existencia de decisiones automatizadas y sus consecuencias debe informarse cuando corresponda.',
      'Versionar el aviso permite demostrar qué información estaba disponible en cada momento.',
    ],
    implementationSteps: [
      'Contrastar el aviso actual con el inventario real de tratamientos.',
      'Mapear cada afirmación relevante a tratamiento, fuente interna o decisión aprobada.',
      'Corregir contradicciones, campos desconocidos y afirmaciones que no tengan respaldo suficiente.',
      'Definir responsable de revisión y gatilladores de actualización.',
      'Versionar publicación, aprobación, fecha y evidencia de disponibilidad.',
    ],
    evidenceExamples: [
      'Aviso de privacidad versionado.',
      'Matriz aviso ↔ tratamiento ↔ evidencia.',
      'Registro de aprobación y fecha de publicación.',
      'Captura o hash de la versión publicada.',
      'Historial de cambios y fundamento.',
    ],
    relatedSlugs: ['inventario-tratamientos', 'derechos-titulares', 'transferencias-internacionales'],
  },
  {
    slug: 'modelo-prevencion',
    shortTitle: 'Modelo de prevención',
    title: 'Modelo de prevención de infracciones y programa de cumplimiento',
    seoTitle: 'Modelo de prevención Ley 21.719: programa de cumplimiento en Chile',
    description:
      'Qué contempla el modelo voluntario de prevención de infracciones de la Ley 21.719 y cómo prepararlo con evidencia.',
    legalBasis: 'Artículos 48 a 52 de la Ley 19.628, incorporados por la Ley 21.719.',
    directAnswer:
      'Los responsables deben adoptar acciones para prevenir infracciones y pueden implementar voluntariamente un modelo de prevención certificado. El programa requiere gobernanza, identificación de riesgos, protocolos, capacitación, reportes, controles y un delegado con recursos y funciones definidos.',
    keyPoints: [
      'La prevención de infracciones es una responsabilidad organizacional.',
      'El modelo certificado es voluntario, pero debe cumplir requisitos legales y reglamentarios.',
      'Debe identificar actividades donde se genera o incrementa el riesgo de infracción.',
      'Requiere protocolos, reglas, procedimientos y mecanismos de reporte.',
      'Puede incluir un delegado de protección de datos con independencia y recursos suficientes.',
      'La certificación y supervisión corresponderán a la Agencia.',
    ],
    implementationSteps: [
      'Definir gobernanza, patrocinio ejecutivo y responsables del programa.',
      'Identificar procesos y actividades con riesgo de infracción.',
      'Diseñar controles, protocolos, capacitación y mecanismos de denuncia.',
      'Establecer métricas, revisión periódica y reporte a la alta dirección.',
      'Mantener evidencia versionada de operación y mejora del modelo.',
    ],
    evidenceExamples: [
      'Mapa de riesgos de protección de datos.',
      'Políticas y procedimientos aprobados.',
      'Plan anual de trabajo y capacitación.',
      'Registro de controles, incidentes y acciones correctivas.',
      'Informes de supervisión y revisión del programa.',
    ],
    relatedSlugs: ['principios-proteccion-datos', 'vulneraciones-seguridad', 'evaluacion-impacto'],
  },
]

export const guideBySlug = new Map(chileComplianceGuides.map((guide) => [guide.slug, guide]))

export const officialLey21719Reference = {
  name: 'Ley 21.719 — Biblioteca del Congreso Nacional de Chile',
  url: OFFICIAL_LEY_21719_URL,
  publisher: 'Biblioteca del Congreso Nacional de Chile',
}
