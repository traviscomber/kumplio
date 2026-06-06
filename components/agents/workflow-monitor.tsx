'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

interface WorkflowStep {
  stepId: string;
  state: string;
  agentName: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

interface WorkflowMonitorProps {
  executionId: string;
  onStatusChange?: (status: any) => void;
}

export function WorkflowMonitor({ executionId, onStatusChange }: WorkflowMonitorProps) {
  const [execution, setExecution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/workflows/${executionId}/status`);
        if (!response.ok) throw new Error('Failed to fetch status');
        const data = await response.json();
        setExecution(data.execution);
        onStatusChange?.(data.execution);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Auto-refresh every 2 seconds if running
    const interval =
      autoRefresh && execution?.state === 'running'
        ? setInterval(fetchStatus, 2000)
        : undefined;

    return () => clearInterval(interval);
  }, [executionId, autoRefresh, execution?.state]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>{error}</CardContent>
      </Card>
    );
  }

  if (!execution) {
    return <div className="p-4 text-muted-foreground">No execution data available</div>;
  }

  const stateColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-yellow-100 text-yellow-800',
  };

  const stepStateIcons: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    running: <Loader2 className="h-4 w-4 animate-spin text-blue-600" />,
    pending: <Clock className="h-4 w-4 text-gray-400" />,
    failed: <AlertCircle className="h-4 w-4 text-red-600" />,
    skipped: <Clock className="h-4 w-4 text-gray-400" />,
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workflow Execution Monitor</CardTitle>
              <CardDescription>Real-time progress tracking</CardDescription>
            </div>
            <Badge className={stateColors[execution.state] || 'bg-gray-100'}>
              {execution.state.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">
                {execution.completedSteps}/{execution.totalSteps}
              </span>
            </div>
            <Progress value={execution.progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">{execution.progress}% Complete</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {execution.steps && execution.steps.length > 0 ? (
            execution.steps.map((step: WorkflowStep, index: number) => (
              <div key={step.stepId} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                <div className="mt-1">{stepStateIcons[step.state] || stepStateIcons.pending}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{index + 1}. {step.agentName}</span>
                    <Badge variant="outline" className="text-xs">
                      {step.state}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {step.duration && <span>{(step.duration / 1000).toFixed(2)}s</span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No steps available</p>
          )}
        </CardContent>
      </Card>

      {execution.error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-sm text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{execution.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
