'use client'

import { AGENTS, Agent } from '@/lib/agents-data'

interface AgentsGridProps {
  agentIds?: string[]
  showDescription?: boolean
  variant?: 'cards' | 'list' | 'grid'
}

export function AgentsGrid({
  agentIds,
  showDescription = true,
  variant = 'grid',
}: AgentsGridProps) {
  const agents = agentIds
    ? AGENTS.filter((a) => agentIds.includes(a.id))
    : AGENTS

  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="rounded-lg border border-border bg-card p-6 hover:bg-card/80 transition"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-lg">
                  {agent.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{agent.name}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {agent.role}
                </p>
                {showDescription && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {agent.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className="space-y-4">
        {agents.map((agent, idx) => (
          <div key={agent.id} className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
              {idx + 1}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{agent.name}</h4>
              <p className="text-sm text-muted-foreground">{agent.role}</p>
              {showDescription && (
                <p className="text-sm text-muted-foreground mt-1">
                  {agent.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Default grid variant
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="rounded-lg border border-border bg-card p-4 hover:bg-card/80 transition text-center"
        >
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-primary font-bold">{agent.name.charAt(0)}</span>
          </div>
          <h3 className="font-semibold text-sm mb-1">{agent.name}</h3>
          <p className="text-xs text-muted-foreground mb-2">{agent.role}</p>
          {showDescription && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {agent.description}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
