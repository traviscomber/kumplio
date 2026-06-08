'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AgentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  successRate?: number;
  error?: string;
}

interface HealthData {
  status: string;
  agents: Record<string, AgentHealth>;
  timestamp: Date;
}

export function HealthDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) throw new Error('Health check failed');
        const data = await response.json();
        setHealth(data);
        setLastCheck(new Date());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Health check failed');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-primary/5 border-primary/20';
      case 'degraded':
        return 'bg-muted/5 border-muted/20';
      case 'unhealthy':
        return 'bg-muted/5 border-muted/20';
      default:
        return 'bg-muted/5 border-muted/20';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading health status...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-sm text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return null;
  }

  const agents = [
    { name: 'sofia', label: 'Sofia (Analyzer)' },
    { name: 'elena', label: 'Elena (Monitor)' },
    { name: 'bruno', label: 'Bruno (Risk)' },
    { name: 'marco', label: 'Marco (Advisor)' },
    { name: 'laura', label: 'Laura (Auditor)' },
    { name: 'kai', label: 'Kai (Learner)' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Agent and system status monitoring</CardDescription>
            </div>
            <Badge
              className={
                health.status === 'operational'
                  ? 'bg-primary'
                  : health.status === 'degraded'
                    ? 'bg-muted'
                    : 'bg-muted'
              }
            >
              {health.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-muted-foreground">
            Last check: {lastCheck?.toLocaleTimeString()}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {agents.map((agent) => {
              const agentHealth = health.agents[agent.name];
              return (
                <div
                  key={agent.name}
                  className={`p-3 rounded-lg border ${getStatusBgColor(agentHealth?.status || 'error')}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(agentHealth?.status || 'error')}
                    <span className="text-sm font-medium">{agent.label}</span>
                  </div>
                  {agentHealth?.successRate !== undefined && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Success: </span>
                      <span className="font-semibold">{agentHealth.successRate.toFixed(1)}%</span>
                    </div>
                  )}
                  {agentHealth?.error && (
                    <div className="text-xs text-destructive mt-1">{agentHealth.error}</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
