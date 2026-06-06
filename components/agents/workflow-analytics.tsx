'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface AnalyticsData {
  totalExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  totalCost: number;
  successCount: number;
  failedCount: number;
  recentTrend: number;
}

export function WorkflowAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalExecutions: 0,
    successRate: 0,
    avgExecutionTime: 0,
    totalCost: 0,
    successCount: 0,
    failedCount: 0,
    recentTrend: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Mock analytics data
        const mockData: AnalyticsData = {
          totalExecutions: 24,
          successRate: 95.8,
          avgExecutionTime: 42,
          totalCost: 3.84,
          successCount: 23,
          failedCount: 1,
          recentTrend: 12,
        };
        setAnalytics(mockData);
      } catch (error) {
        console.error('[v0] Analytics error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const metrics = [
    {
      label: 'Total Executions',
      value: analytics.totalExecutions,
      icon: Clock,
      color: 'text-blue-600',
    },
    {
      label: 'Success Rate',
      value: `${analytics.successRate.toFixed(1)}%`,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    {
      label: 'Avg Time',
      value: `${analytics.avgExecutionTime}s`,
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      label: 'Total Cost',
      value: `$${analytics.totalCost.toFixed(2)}`,
      icon: AlertCircle,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-4">Analytics & Insights</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                      <p className="text-xl font-bold">{metric.value}</p>
                    </div>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Summary</CardTitle>
          <CardDescription>Workflow execution metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Successful Executions</span>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600">
                  {analytics.successCount}
                </Badge>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${(analytics.successCount / analytics.totalExecutions) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Failed Executions</span>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{analytics.failedCount}</Badge>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{
                      width: `${(analytics.failedCount / analytics.totalExecutions) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Recent Activity</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                {analytics.recentTrend} workflows in last 7 days
                <span className="text-green-600 ml-1">↑ 15%</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
