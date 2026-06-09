/**
 * Agentes KUMPLIO - Configuración centralizada
 * Mantiene consistencia en todo el sitio
 */

export interface Agent {
  id: string
  name: string
  role: string
  description: string
  icon?: string
}

export const AGENTS: Agent[] = [
  {
    id: 'isidora',
    name: 'Is1dora',
    role: 'Extracción de Documentos & Obligaciones',
    description: 'Análisis automático de documentos regulatorios y mapeo de obligaciones legales',
  },
  {
    id: 'rodrigo',
    name: 'R0drigo',
    role: 'Cuantificación de Riesgo Regulatorio',
    description: 'Evaluación cuantitativa de riesgos de compliance y exposición regulatoria',
  },
  {
    id: 'javier',
    name: 'Jav1er',
    role: 'Generación de Roadmaps Ejecutables',
    description: 'Creación de planes de acción personalizados y priorizados para cumplimiento',
  },
  {
    id: 'beatriz',
    name: 'Beat1z',
    role: 'Monitoreo 24/7 de Cambios Regulatorios',
    description: 'Seguimiento continuo de cambios legales y alertas en tiempo real',
  },
  {
    id: 'veronica',
    name: 'Verón1ca',
    role: 'Auditoría de Compliance Real',
    description: 'Auditoría integral y verificación de cumplimiento normativo',
  },
  {
    id: 'andres',
    name: 'Andr3s',
    role: 'Análisis de Datos Regulatorios',
    description: 'Análisis profundo de datos y tendencias regulatorias sectoriales',
  },
  {
    id: 'catllina',
    name: 'CatLl1na',
    role: 'Validación Legal & Generación de Reportes',
    description: 'Validación legal de decisiones y generación de reportes certificados',
  },
]

/**
 * Obtener agente por ID
 */
export function getAgentById(id: string): Agent | undefined {
  return AGENTS.find((agent) => agent.id === id)
}

/**
 * Obtener agentes por industria (para demos)
 */
export function getAgentsByIndustry(industry: 'transporte' | 'mineria'): Agent[] {
  if (industry === 'transporte') {
    // Para transporte: Is1dora, R0drigo, Beat1z (3 agentes)
    return [AGENTS[0], AGENTS[1], AGENTS[3]]
  } else if (industry === 'mineria') {
    // Para minería: todos los 7 agentes (Is1dora, R0drigo, Jav1er, Beat1z, Verón1ca, Andr3s, CatLl1na)
    return AGENTS
  }
  return AGENTS
}
