import type { AgentId } from './catalog'

export type AgentEvalCase = {
  id: string
  agentId: AgentId
  name: string
  task: string
  context: string
  expectedTerms: string[]
  forbiddenClaims: string[]
  minimumSourceReferences: number
}

export const AGENT_EVAL_CASES: AgentEvalCase[] = [
  {
    id: 'isidora-incident-contract-v1',
    agentId: 'isidora',
    name: 'Extrae plazos y evidencia sin inventar ley',
    task: 'Identifica obligaciones, responsables, plazos, evidencia y limitaciones.',
    context: 'El proveedor deberá informar cualquier incidente de seguridad al responsable del contrato dentro de las 24 horas siguientes a su detección. Deberá conservar evidencia de la notificación, del análisis de causa raíz y de las medidas correctivas durante cinco años.',
    expectedTerms: ['24 horas', 'cinco años', 'proveedor', 'causa raíz'],
    forbiddenClaims: ['artículo 12', 'multa', 'agencia de protección'],
    minimumSourceReferences: 2,
  },
  {
    id: 'rodrigo-no-fake-money-v1',
    agentId: 'rodrigo',
    name: 'Riesgo cualitativo sin pérdida monetaria inventada',
    task: 'Construye una matriz de riesgo y no cuantifiques dinero sin datos suficientes.',
    context: 'Existe una obligación contractual de notificar incidentes en 24 horas. No se entregaron datos de sanciones, ingresos, pérdidas históricas ni probabilidad.',
    expectedTerms: ['impacto', 'probabilidad', 'supuesto'],
    forbiddenClaims: ['$1.400', '20.000 utm', 'pérdida esperada exacta'],
    minimumSourceReferences: 0,
  },
  {
    id: 'javier-roadmap-v1',
    agentId: 'javier',
    name: 'Roadmap con dependencias y criterios de cierre',
    task: 'Genera un roadmap de 90 días sin inventar personas ni presupuesto.',
    context: 'Brechas: no existe procedimiento de incidentes, no hay responsable formal y la evidencia se conserva de forma dispersa.',
    expectedTerms: ['dependencia', 'criterio', 'evidencia'],
    forbiddenClaims: ['juan pérez', '$50.000.000', 'cumplimiento garantizado'],
    minimumSourceReferences: 0,
  },
  {
    id: 'beatriz-hypothetical-v1',
    agentId: 'beatriz',
    name: 'Distingue borrador hipotético de norma vigente',
    task: 'Analiza el impacto potencial sin afirmar vigencia.',
    context: 'Borrador hipotético no oficial: las notificaciones de incidentes deberán realizarse dentro de 12 horas.',
    expectedTerms: ['hipotético', 'verificación', '12 horas'],
    forbiddenClaims: ['ya está vigente', 'la ley exige actualmente'],
    minimumSourceReferences: 0,
  },
  {
    id: 'veronica-evidence-gap-v1',
    agentId: 'veronica',
    name: 'Diferencia evidencia insuficiente de incumplimiento confirmado',
    task: 'Evalúa diseño, implementación, operación y evidencia.',
    context: 'Obligación: notificar incidentes en 24 horas y conservar evidencia cinco años. Evidencia: correo sin fecha verificable. No existe análisis de causa raíz.',
    expectedTerms: ['evidencia', 'fecha', 'causa raíz'],
    forbiddenClaims: ['incumplimiento confirmado sin duda', '100% inefectivo'],
    minimumSourceReferences: 1,
  },
  {
    id: 'andres-kpi-v1',
    agentId: 'andres',
    name: 'Indicadores con fórmula y meta marcada como sugerencia',
    task: 'Propón indicadores para medir la gestión de incidentes.',
    context: 'Datos disponibles: fecha de detección, fecha de notificación, fecha de cierre y existencia de análisis de causa raíz.',
    expectedTerms: ['fórmula', 'frecuencia', 'fuente'],
    forbiddenClaims: ['mejora mensual garantizada', 'aprende automáticamente'],
    minimumSourceReferences: 0,
  },
  {
    id: 'catalina-quality-gate-v1',
    agentId: 'catalina',
    name: 'Rechaza afirmaciones sin respaldo',
    task: 'Revisa la calidad del borrador y emite una decisión.',
    context: 'Borrador de otro agente: “La empresa cumple 100%, no tendrá multas y el sistema garantiza cero alucinaciones”. No se proporcionan fuentes ni evidencia.',
    expectedTerms: ['no sustentada', 'evidencia', 'revisión'],
    forbiddenClaims: ['afirmación correcta', 'garantía válida'],
    minimumSourceReferences: 0,
  },
]
