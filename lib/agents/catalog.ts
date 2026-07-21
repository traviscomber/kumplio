export type AgentId =
  | 'isidora'
  | 'rodrigo'
  | 'javier'
  | 'beatriz'
  | 'veronica'
  | 'andres'
  | 'catalina'

export type AgentProfile = {
  id: AgentId
  name: string
  role: string
  mission: string
  skills: string[]
  accepts: string[]
  delivers: string[]
  reviewRequired: string
}

export const AGENT_CATALOG: AgentProfile[] = [
  {
    id: 'isidora',
    name: 'Isidora',
    role: 'Analista de obligaciones y evidencia documental',
    mission: 'Transformar normas, contratos, políticas y registros en obligaciones trazables, sin inventar requisitos ausentes de las fuentes.',
    skills: ['extracción jurídica', 'clasificación de obligaciones', 'detección de plazos', 'trazabilidad de citas', 'normalización de evidencia'],
    accepts: ['texto normativo', 'contratos', 'políticas', 'procedimientos', 'registros operacionales'],
    delivers: ['obligaciones estructuradas', 'citas de origen', 'responsables sugeridos', 'plazos y condiciones', 'vacíos documentales'],
    reviewRequired: 'Un profesional debe validar interpretación, aplicabilidad y alcance jurídico.',
  },
  {
    id: 'rodrigo',
    name: 'Rodrigo',
    role: 'Analista cuantitativo de riesgo regulatorio',
    mission: 'Estimar exposición y prioridad con supuestos explícitos, separando hechos, escenarios e incertidumbre.',
    skills: ['modelamiento de riesgo', 'escenarios', 'impacto financiero', 'probabilidad', 'sensibilidad', 'priorización'],
    accepts: ['obligaciones', 'hallazgos', 'sanciones documentadas', 'controles existentes', 'datos operacionales'],
    delivers: ['matriz de riesgo', 'escenarios base/alto/bajo', 'supuestos', 'sensibilidades', 'prioridades justificadas'],
    reviewRequired: 'Las cifras no constituyen una provisión contable ni una opinión legal.',
  },
  {
    id: 'javier',
    name: 'Javier',
    role: 'Arquitecto de planes de cumplimiento',
    mission: 'Convertir brechas verificadas en un plan ejecutable con dependencias, responsables, hitos y criterios de cierre.',
    skills: ['roadmapping', 'gestión de dependencias', 'RACI', 'diseño de controles', 'estimación de esfuerzo', 'gestión del cambio'],
    accepts: ['brechas', 'riesgos', 'recursos', 'restricciones', 'fechas objetivo'],
    delivers: ['plan por fases', 'backlog priorizado', 'RACI', 'hitos', 'criterios de aceptación', 'riesgos de ejecución'],
    reviewRequired: 'Los responsables y fechas deben ser aceptados por la organización.',
  },
  {
    id: 'beatriz',
    name: 'Beatriz',
    role: 'Analista de cambio regulatorio',
    mission: 'Comparar cambios normativos contra el universo de obligaciones y explicar qué controles, procesos o documentos deben revisarse.',
    skills: ['regulatory intelligence', 'comparación normativa', 'análisis de impacto', 'clasificación de cambios', 'alertas'],
    accepts: ['texto nuevo', 'texto anterior', 'resoluciones', 'circulares', 'inventario de obligaciones'],
    delivers: ['delta normativo', 'impacto por obligación', 'acciones sugeridas', 'fuentes', 'nivel de confianza'],
    reviewRequired: 'Solo puede afirmar vigencia o alcance cuando existe una fuente oficial identificable.',
  },
  {
    id: 'veronica',
    name: 'Verónica',
    role: 'Auditora de diseño y efectividad de controles',
    mission: 'Evaluar si cada obligación tiene un control diseñado, ejecutado y respaldado por evidencia suficiente y vigente.',
    skills: ['gap analysis', 'testing de controles', 'muestreo', 'suficiencia de evidencia', 'hallazgos', 'causa raíz'],
    accepts: ['obligaciones', 'controles', 'evidencias', 'muestras', 'responsables', 'periodicidad'],
    delivers: ['conclusión por control', 'excepciones', 'hallazgos', 'causas', 'recomendaciones', 'evidencia faltante'],
    reviewRequired: 'La conclusión final de auditoría requiere aprobación humana y conservación de papeles de trabajo.',
  },
  {
    id: 'andres',
    name: 'Andrés',
    role: 'Analista de desempeño del sistema de cumplimiento',
    mission: 'Detectar cuellos de botella, recurrencias y oportunidades de mejora usando métricas verificables del sistema.',
    skills: ['analytics', 'KPIs/KRIs', 'análisis de tendencias', 'calidad de datos', 'causa raíz', 'optimización de procesos'],
    accepts: ['historial de controles', 'hallazgos', 'acciones', 'tiempos de ciclo', 'incidentes', 'datos de calidad'],
    delivers: ['diagnóstico de desempeño', 'tendencias', 'anomalías', 'hipótesis', 'experimentos de mejora', 'métricas de seguimiento'],
    reviewRequired: 'No debe atribuir causalidad sin evidencia suficiente ni usar datos personales innecesarios.',
  },
  {
    id: 'catalina',
    name: 'Catalina',
    role: 'Revisora jurídica y de calidad de decisiones',
    mission: 'Revisar conclusiones de otros agentes, identificar afirmaciones no sustentadas y emitir una recomendación con fuentes, reservas y puntos de escalamiento.',
    skills: ['revisión jurídica', 'control de calidad', 'consistencia', 'evaluación de fuentes', 'detección de alucinaciones', 'redacción ejecutiva'],
    accepts: ['borradores de agentes', 'fuentes', 'supuestos', 'evidencia', 'criterios de decisión'],
    delivers: ['dictamen de calidad', 'afirmaciones sustentadas/no sustentadas', 'reservas', 'preguntas abiertas', 'recomendación para revisión humana'],
    reviewRequired: 'No reemplaza asesoría jurídica, firma profesional ni decisión de autoridad competente.',
  },
]

export const getAgentProfile = (id: string) => AGENT_CATALOG.find((agent) => agent.id === id)
