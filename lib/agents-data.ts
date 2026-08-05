import { AGENT_CATALOG, type AgentId } from './agents/catalog'

/**
 * Adaptador de compatibilidad para vistas antiguas.
 * La fuente oficial de nombres, roles y capacidades es lib/agents/catalog.ts.
 */
export interface Agent {
  id: AgentId
  name: string
  role: string
  description: string
  icon?: string
}

export const AGENTS: Agent[] = AGENT_CATALOG.map((profile) => ({
  id: profile.id,
  name: profile.name,
  role: profile.role,
  description: profile.mission,
}))

export function getAgentById(id: string): Agent | undefined {
  return AGENTS.find((agent) => agent.id === id)
}

export function getAgentsByIndustry(industry: 'transporte' | 'mineria'): Agent[] {
  if (industry === 'transporte') {
    return selectAgents(['isidora', 'rodrigo', 'beatriz', 'javier', 'catalina'])
  }

  return AGENTS
}

function selectAgents(ids: AgentId[]): Agent[] {
  const selected = new Set(ids)
  return AGENTS.filter((agent) => selected.has(agent.id))
}
