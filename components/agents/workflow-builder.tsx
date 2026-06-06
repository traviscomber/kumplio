'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Play } from 'lucide-react';

const AVAILABLE_AGENTS = [
  { name: 'sofia', label: 'Sofia (Analyzer)', description: 'Extract legal obligations' },
  { name: 'elena', label: 'Elena (Monitor)', description: 'Monitor regulations' },
  { name: 'bruno', label: 'Bruno (Risk)', description: 'Assess risks' },
  { name: 'marco', label: 'Marco (Advisor)', description: 'Generate recommendations' },
  { name: 'laura', label: 'Laura (Auditor)', description: 'Verify compliance' },
  { name: 'kai', label: 'Kai (Learner)', description: 'Continuous improvement' },
];

interface WorkflowStep {
  id: string;
  agentName: string;
  label: string;
}

interface WorkflowBuilderProps {
  onExecute?: (definition: any) => void;
  onSave?: (definition: any) => void;
}

export function WorkflowBuilder({ onExecute, onSave }: WorkflowBuilderProps) {
  const [workflowName, setWorkflowName] = useState('My Workflow');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const addStep = (agentName: string) => {
    const agent = AVAILABLE_AGENTS.find((a) => a.name === agentName);
    if (agent) {
      setSteps([
        ...steps,
        {
          id: `step_${Date.now()}_${Math.random()}`,
          agentName,
          label: agent.label,
        },
      ]);
    }
  };

  const removeStep = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId));
  };

  const handleExecute = async () => {
    const definition = {
      name: workflowName,
      steps: steps.map((s) => ({
        id: s.id,
        agentName: s.agentName,
        inputs: {},
      })),
    };

    setIsExecuting(true);
    try {
      // Create workflow first
      const createResponse = await fetch('/api/workflows/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(definition),
      });

      if (!createResponse.ok) throw new Error('Failed to create workflow');
      const { workflow } = await createResponse.json();

      // Then execute
      const execResponse = await fetch(`/api/workflows/${workflow.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!execResponse.ok) throw new Error('Failed to execute workflow');
      const { execution } = await execResponse.json();

      onExecute?.(execution);
    } catch (error) {
      console.error('[v0] Workflow execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Builder</CardTitle>
          <CardDescription>Design your compliance analysis workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Workflow Name</label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Enter workflow name"
              className="w-full px-3 py-2 border rounded-md bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Add Steps</label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_AGENTS.map((agent) => (
                <Button
                  key={agent.name}
                  variant="outline"
                  size="sm"
                  onClick={() => addStep(agent.name)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {agent.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workflow Steps</CardTitle>
            <CardDescription>{steps.length} step(s) configured</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{index + 1}</Badge>
                  <span className="font-medium">{step.label}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(step.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {steps.length > 0 && (
        <div className="flex gap-3">
          <Button onClick={handleExecute} disabled={isExecuting} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            {isExecuting ? 'Executing...' : 'Execute Workflow'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onSave?.({
              name: workflowName,
              steps: steps.map((s) => ({
                id: s.id,
                agentName: s.agentName,
                inputs: {},
              })),
            })}
          >
            Save Template
          </Button>
        </div>
      )}
    </div>
  );
}
