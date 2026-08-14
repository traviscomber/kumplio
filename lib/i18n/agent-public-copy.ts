import type { AgentId } from '@/lib/agents/catalog'

export type PublicAgentCopy = {
  role: string
  mission: string
  delivers: string[]
}

export const ENGLISH_AGENT_PUBLIC_COPY: Record<AgentId, PublicAgentCopy> = {
  isidora: {
    role: 'Obligations and documentary evidence analyst',
    mission:
      'Turns regulations, contracts, policies and records into traceable obligations, links the relevant documents and identifies gaps without inventing requirements that are absent from the sources.',
    delivers: ['structured obligations', 'source citations', 'suggested owners'],
  },
  rodrigo: {
    role: 'Quantitative regulatory risk analyst',
    mission:
      'Estimates exposure, urgency and priority with explicit assumptions, separating facts, scenarios and uncertainty for people and organizations.',
    delivers: ['risk matrix', 'base/high/low scenarios', 'explicit assumptions'],
  },
  javier: {
    role: 'Guided plan architect',
    mission:
      'Turns verified objectives, gaps and risks into a simple, executable plan adapted to a person, professional or organization.',
    delivers: ['phased plan', 'prioritized backlog', 'acceptance criteria'],
  },
  beatriz: {
    role: 'Regulatory change analyst',
    mission:
      'Detects, compares and contextualizes official changes, explains when they begin to have effect and which decisions they may require.',
    delivers: ['regulatory delta', 'impact by obligation', 'official sources'],
  },
  veronica: {
    role: 'Controls and closure auditor',
    mission:
      'Evaluates whether each obligation has a designed and operated control supported by sufficient, current evidence that can demonstrate the result.',
    delivers: ['control conclusion', 'exceptions and findings', 'missing evidence'],
  },
  andres: {
    role: 'Performance and learning analyst',
    mission:
      'Detects recurring patterns, precedents and improvement opportunities while measuring user value with verifiable data.',
    delivers: ['performance diagnosis', 'trends and anomalies', 'similar precedents'],
  },
  catalina: {
    role: 'Legal, quality and communication reviewer',
    mission:
      'Reviews conclusions from other specialists, separates facts from inferences, detects unsupported statements and prepares a clear recommendation for the right audience.',
    delivers: ['quality assessment', 'supported/unsupported claims', 'open questions'],
  },
}
