'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react'

export interface AgentStatus {
  agentId: string
  agentName: string
  status: 'idle' | 'running' | 'success' | 'error'
  lastRun?: Date
  executionTimeMs?: number
  tokensUsed?: { input: number; output: number }
}

export function AgentDashboard() {
  const [agents, setAgents] = useState<AgentStatus[]>([
    { agentId: 'isidora-analyzer', agentName: 'Isidora', status: 'idle' },
    { agentId: 'rodrigo-monitor', agentName: 'Rodrigo', status: 'idle' },
    { agentId: 'javier-risk', agentName: 'Javier', status: 'idle' },
    { agentId: 'beatriz-advisor', agentName: 'Beatriz', status: 'idle' },
    { agentId: 'veronica-auditor', agentName: 'Verónica', status: 'idle' },
    { agentId: 'andres-learner', agentName: 'Andrés', status: 'idle' },
    { agentId: 'catalina-reporter', agentName: 'Catalina', status: 'idle' },
  ])

  const [analyzing, setAnalyzing] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Zap className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Equipo de Agentes KUMPLIO
              </CardTitle>
              <CardDescription>6 agentes IA especializados para análisis de cumplimiento</CardDescription>
            </div>
            <Button onClick={() => setAnalyzing(!analyzing)} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                'Iniciar Análisis'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="agents">Agentes</TabsTrigger>
              <TabsTrigger value="metrics">Métricas</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {agents.map((agent) => (
                  <Card key={agent.agentId} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{agent.agentName}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {agent.status === 'idle' && 'Inactivo'}
                          {agent.status === 'running' && 'Ejecutando'}
                          {agent.status === 'success' && 'Exitoso'}
                          {agent.status === 'error' && 'Error'}
                        </p>
                      </div>
                      {getStatusIcon(agent.status)}
                    </div>
                    {agent.executionTimeMs && (
                      <p className="mt-2 text-xs text-muted-foreground">{agent.executionTimeMs}ms</p>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="agents" className="space-y-3">
              {agents.map((agent) => (
                <Card key={agent.agentId}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(agent.status)}
                        <div>
                          <p className="font-medium">{agent.agentName}</p>
                          <p className="text-sm text-muted-foreground">{agent.agentId}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {agent.tokensUsed && (
                          <p className="text-xs text-muted-foreground">
                            {agent.tokensUsed.input + agent.tokensUsed.output} tokens
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Métricas del Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Agentes Activos</span>
                    <span className="font-medium">{agents.filter((a) => a.status !== 'idle').length}/6</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tasa de Éxito</span>
                    <span className="font-medium">95%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tiempo Promedio de Análisis</span>
                    <span className="font-medium">2.4s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Costo por Análisis</span>
                    <span className="font-medium">$0.12</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
