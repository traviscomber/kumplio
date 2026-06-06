'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, Copy } from 'lucide-react';

interface WorkflowExecution {
  id: string;
  state: string;
  definition: any;
  start_time: string;
  end_time?: string;
  error?: string;
  metadata?: any;
}

interface WorkflowHistoryProps {
  limit?: number;
}

export function WorkflowHistory({ limit = 20 }: WorkflowHistoryProps) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/workflows/history?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();
        setExecutions(data.executions || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [limit]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const seconds = Math.round((end - start) / 1000);
    return seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m`;
  };

  const stateColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    running: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading execution history...</div>
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>{executions.length} workflow executions</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No executions yet</p>
          ) : (
            <div className="space-y-2">
              {executions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Badge className={stateColors[execution.state] || 'bg-gray-100'}>
                        {execution.state}
                      </Badge>
                      <span className="font-medium text-sm truncate">
                        {execution.definition?.name || 'Untitled'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(execution.start_time)} • {getDuration(execution.start_time, execution.end_time)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedExecution(execution)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(execution.id);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedExecution && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{selectedExecution.definition?.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedExecution(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <span className="font-medium">Execution ID:</span>
              <p className="text-muted-foreground font-mono text-xs mt-1">{selectedExecution.id}</p>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <p className="text-muted-foreground mt-1">{selectedExecution.state}</p>
            </div>
            <div>
              <span className="font-medium">Started:</span>
              <p className="text-muted-foreground mt-1">{formatDate(selectedExecution.start_time)}</p>
            </div>
            {selectedExecution.error && (
              <div>
                <span className="font-medium text-destructive">Error:</span>
                <p className="text-destructive text-xs mt-1">{selectedExecution.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
