'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Loader2 } from 'lucide-react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  usage_count: number;
  definition: any;
}

interface WorkflowTemplatesProps {
  onSelectTemplate?: (template: WorkflowTemplate) => void;
}

export function WorkflowTemplates({ onSelectTemplate }: WorkflowTemplatesProps) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/workflows/templates');
        if (!response.ok) throw new Error('Failed to fetch templates');
        const data = await response.json();
        setTemplates(data.templates || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch templates');
      } finally {
        setLoading(false);
      }
    };

    // Mock templates since API may not be ready yet
    const mockTemplates: WorkflowTemplate[] = [
      {
        id: 'template_1',
        name: 'Full Compliance Analysis',
        description: 'Complete 6-agent pipeline: Extract → Monitor → Assess Risk → Recommend → Audit → Learn',
        category: 'Analysis',
        tags: ['comprehensive', 'all-agents', 'detailed'],
        usage_count: 0,
        definition: {
          name: 'Full Compliance Analysis',
          steps: [
            { id: 'extract', agentName: 'sofia', inputs: {} },
            { id: 'monitor', agentName: 'elena', inputs: {} },
            { id: 'risk', agentName: 'bruno', inputs: {} },
            { id: 'recommend', agentName: 'marco', inputs: {} },
            { id: 'audit', agentName: 'laura', inputs: {} },
            { id: 'learn', agentName: 'kai', inputs: {} },
          ],
        },
      },
      {
        id: 'template_2',
        name: 'Quick Compliance Scan',
        description: 'Fast 3-agent pipeline: Extract → Assess Risk → Prioritize',
        category: 'Analysis',
        tags: ['fast', 'quick', 'essential'],
        usage_count: 0,
        definition: {
          name: 'Quick Compliance Scan',
          steps: [
            { id: 'extract', agentName: 'sofia', inputs: {} },
            { id: 'risk', agentName: 'bruno', inputs: {} },
            { id: 'recommend', agentName: 'marco', inputs: {} },
          ],
        },
      },
      {
        id: 'template_3',
        name: 'Regulatory Monitoring',
        description: 'Monitor Ley 21.719 changes and generate alerts',
        category: 'Monitoring',
        tags: ['regulatory', 'monitoring', 'alerts'],
        usage_count: 0,
        definition: {
          name: 'Regulatory Monitoring',
          steps: [
            { id: 'monitor', agentName: 'elena', inputs: {} },
            { id: 'risk', agentName: 'bruno', inputs: {} },
            { id: 'recommend', agentName: 'marco', inputs: {} },
          ],
        },
      },
    ];

    setTemplates(mockTemplates);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
      <div>
        <h3 className="font-semibold mb-4">Workflow Templates</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="hover:border-primary transition-colors cursor-pointer"
              onClick={() => onSelectTemplate?.(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {template.category}
                    </CardDescription>
                  </div>
                  <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    {template.definition.steps.length} steps
                  </span>
                  <Button size="sm" variant="outline" className="text-xs">
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
