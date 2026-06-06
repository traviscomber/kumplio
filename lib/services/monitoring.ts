import { createClient } from '@/lib/supabase/client'

export interface MonitoringMetrics {
  timestamp: Date
  executionId: string
  agentName: string
  state: string
  duration: number
  cost: number
  error?: string
  tokenUsage?: {
    input: number
    output: number
  }
}

export class AgentMonitor {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  async recordExecution(metrics: MonitoringMetrics): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('workflow_step_results')
      .insert({
        execution_id: metrics.executionId,
        step_id: metrics.agentName,
        agent_name: metrics.agentName,
        state: metrics.state,
        duration_ms: metrics.duration,
        cost: metrics.cost,
        error: metrics.error,
        start_time: metrics.timestamp,
      })

    if (error) {
      console.error('[v0] Failed to record execution:', error)
      throw error
    }
  }

  async getExecutionMetrics(executionId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('workflow_step_results')
      .select('*')
      .eq('execution_id', executionId)
      .order('start_time', { ascending: true })

    if (error) throw error
    
    return {
      totalDuration: data?.reduce((sum, s) => sum + (s.duration_ms || 0), 0) || 0,
      totalCost: data?.reduce((sum, s) => sum + (s.cost || 0), 0) || 0,
      steps: data || [],
      successRate: data ? (data.filter((s: any) => s.state === 'completed').length / data.length) * 100 : 0,
    }
  }

  async getAgentStats(agentName: string, days: number = 7) {
    const supabase = createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('workflow_step_results')
      .select('*')
      .eq('agent_name', agentName)
      .gte('start_time', startDate.toISOString())

    if (error) throw error

    const stats = {
      totalRuns: data?.length || 0,
      successfulRuns: data?.filter((s: any) => s.state === 'completed').length || 0,
      failedRuns: data?.filter((s: any) => s.state === 'failed').length || 0,
      avgDuration: data && data.length > 0 ? data.reduce((sum: any, s: any) => sum + (s.duration_ms || 0), 0) / data.length : 0,
      totalCost: data?.reduce((sum: any, s: any) => sum + (s.cost || 0), 0) || 0,
      successRate: data && data.length > 0 ? (data.filter((s: any) => s.state === 'completed').length / data.length) * 100 : 0,
    }

    return stats
  }

  async healthCheck(): Promise<{
    status: string
    agents: Record<string, any>
    timestamp: Date
  }> {
    try {
      const agents = ['sofia', 'elena', 'bruno', 'marco', 'laura', 'kai']
      const agentHealth: Record<string, any> = {}

      for (const agent of agents) {
        try {
          const stats = await this.getAgentStats(agent, 1)
          agentHealth[agent] = {
            status: stats.successRate >= 90 ? 'healthy' : stats.successRate >= 70 ? 'degraded' : 'unhealthy',
            successRate: stats.successRate,
            lastError: null,
          }
        } catch (error) {
          agentHealth[agent] = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      }

      const overallStatus = Object.values(agentHealth).every((a: any) => a.status !== 'error') ? 'operational' : 'degraded'

      return {
        status: overallStatus,
        agents: agentHealth,
        timestamp: new Date(),
      }
    } catch (error) {
      console.error('[v0] Health check failed:', error)
      throw error
    }
  }
}

// Performance optimization utilities
export class PerformanceOptimizer {
  static cacheKey(prefix: string, ...args: any[]): string {
    return `${prefix}:${args.join(':')}`
  }

  static async withCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Simple in-memory cache (can be replaced with Redis)
    const cached = (globalThis as any).__cache?.[key]
    if (cached && cached.expiry > Date.now()) {
      return cached.value
    }

    const value = await fn()
    
    if (!(globalThis as any).__cache) {
      (globalThis as any).__cache = {}
    }

    (globalThis as any).__cache[key] = {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    }

    return value
  }

  static async measurePerformance<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start

    console.log(`[v0] Performance: ${name} took ${duration.toFixed(2)}ms`)

    return { result, duration }
  }
}
