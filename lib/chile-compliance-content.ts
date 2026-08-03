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
    relatedSlugs: ['derechos-titulares', 'evaluacion-impacto', 'modelo-prevencion'],
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
    relatedSlugs: ['principios-proteccion-datos', 'encargados-proveedores', 'modelo-prevencion'],
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
    relatedSlugs: ['principios-proteccion-datos', 'evaluacion-impacto', 'modelo-prevencion'],
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
    relatedSlugs: ['principios-proteccion-datos', 'encargados-proveedores', 'modelo-prevencion'],
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
    relatedSlugs: ['principios-proteccion-datos', 'derechos-titulares', 'evaluacion-impacto'],
  },
]

export const guideBySlug = new Map(chileComplianceGuides.map((guide) => [guide.slug, guide]))

export const officialLey21719Reference = {
  name: 'Ley 21.719 — Biblioteca del Congreso Nacional de Chile',
  url: OFFICIAL_LEY_21719_URL,
  publisher: 'Biblioteca del Congreso Nacional de Chile',
}
