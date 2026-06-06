'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Play, ArrowRight, Zap, AlertCircle, Check } from 'lucide-react';

const AVAILABLE_AGENTS = [
  { 
    name: 'sofia', 
    label: 'Sofia', 
    specialty: 'Analyzer',
    description: 'Extrae obligaciones legales',
    icon: '📄',
    color: 'bg-blue-500',
    costPerRun: 0.05,
  },
  { 
    name: 'elena', 
    label: 'Elena', 
    specialty: 'Monitor',
    description: 'Monitorea regulaciones',
    icon: '👁️',
    color: 'bg-purple-500',
    costPerRun: 0.04,
  },
  { 
    name: 'bruno', 
    label: 'Bruno', 
    specialty: 'Risk',
    description: 'Evalúa riesgos',
    icon: '⚠️',
    color: 'bg-red-500',
    costPerRun: 0.06,
  },
  { 
    name: 'marco', 
    label: 'Marco', 
    specialty: 'Advisor',
    description: 'Genera recomendaciones',
    icon: '💡',
    color: 'bg-yellow-500',
    costPerRun: 0.07,
  },
  { 
    name: 'laura', 
    label: 'Laura', 
    specialty: 'Auditor',
    description: 'Verifica cumplimiento',
    icon: '✓',
    color: 'bg-green-500',
    costPerRun: 0.05,
  },
  { 
    name: 'kai', 
    label: 'Kai', 
    specialty: 'Learner',
    description: 'Mejora continua',
    icon: '🧠',
    color: 'bg-indigo-500',
    costPerRun: 0.03,
  },
];

interface WorkflowStep {
  id: string;
  agentName: string;
  label: string;
  specialty: string;
  icon: string;
  color: string;
}

interface WorkflowBuilderProps {
  onExecute?: (definition: any) => void;
  onSave?: (definition: any) => void;
}

export function WorkflowBuilder({ onExecute, onSave }: WorkflowBuilderProps) {
  const [workflowName, setWorkflowName] = useState('Mi Flujo de Análisis');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const addStep = (agentName: string) => {
    const agent = AVAILABLE_AGENTS.find((a) => a.name === agentName);
    if (agent) {
      setSteps([
        ...steps,
        {
          id: `step_${Date.now()}_${Math.random()}`,
          agentName,
          label: agent.label,
          specialty: agent.specialty,
          icon: agent.icon,
          color: agent.color,
        },
      ]);
    }
  };

  const removeStep = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId));
  };

  const totalCost = steps.reduce((sum, step) => {
    const agent = AVAILABLE_AGENTS.find((a) => a.name === step.agentName);
    return sum + (agent?.costPerRun || 0);
  }, 0);

  const estimatedTime = Math.max(steps.length * 2, 5);

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
      const createResponse = await fetch('/api/workflows/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(definition),
      });

      if (!createResponse.ok) throw new Error('Error al crear flujo de trabajo');
      const { workflow } = await createResponse.json();

      const execResponse = await fetch(`/api/workflows/${workflow.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!execResponse.ok) throw new Error('Error al ejecutar flujo de trabajo');
      const { execution } = await execResponse.json();

      onExecute?.(execution);
    } catch (error) {
      console.error('Workflow execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold mb-1">Constructor de Flujos de Trabajo</h2>
        <p className="text-muted-foreground">Diseña tu análisis de cumplimiento personalizado con agentes IA especializados</p>
      </div>

      <div className="grid grid-cols-3 gap-4 lg:grid-cols-4">
        {/* Workflow Name */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Nombre del Flujo</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Ingresa nombre del flujo"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </CardContent>
        </Card>

        {/* Cost Estimate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Costo Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{steps.length} pasos</p>
          </CardContent>
        </Card>

        {/* Time Estimate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Tiempo Estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~{estimatedTime}s</div>
            <p className="text-xs text-muted-foreground mt-1">Ejecución</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Builder Layout */}
      <div className="grid grid-cols-3 gap-6 lg:grid-cols-4">
        {/* Left Panel: Agent Library */}
        <div className="space-y-4 col-span-1">
          <div>
            <h3 className="font-semibold mb-3 text-sm">Biblioteca de Agentes</h3>
            <p className="text-xs text-muted-foreground mb-4">Arrastra o haz clic para agregar agentes</p>
          </div>

          <div className="space-y-2">
            {AVAILABLE_AGENTS.map((agent) => (
              <button
                key={agent.name}
                onClick={() => addStep(agent.name)}
                onMouseEnter={() => setSelectedAgent(agent.name)}
                onMouseLeave={() => setSelectedAgent(null)}
                className="w-full p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all text-left group"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{agent.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{agent.label}</div>
                    <div className="text-xs text-muted-foreground">{agent.specialty}</div>
                    <div className="text-xs text-muted-foreground mt-1">${agent.costPerRun.toFixed(2)}</div>
                  </div>
                  <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>

          {/* Agent Details */}
          {selectedAgent && (
            <Card className="mt-4 border-primary bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Info del Agente</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <p className="text-muted-foreground">
                  {AVAILABLE_AGENTS.find((a) => a.name === selectedAgent)?.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel: Workflow Canvas */}
        <div className="col-span-2 lg:col-span-3">
          <Card className="min-h-96">
            <CardHeader>
              <CardTitle className="text-sm">Canvas de Flujo de Trabajo</CardTitle>
              <CardDescription>
                {steps.length === 0 
                  ? 'Agrega agentes desde la biblioteca para construir tu flujo'
                  : `${steps.length} paso(s) configurado(s)`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {steps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Comienza agregando agentes desde la biblioteca para visualizar tu flujo
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.id}>
                      <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all group">
                        <div className={`${step.color} text-white rounded-lg p-2 font-bold flex-shrink-0`}>
                          {step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{step.label} - {step.specialty}</div>
                          <div className="text-xs text-muted-foreground">Paso {index + 1}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(step.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {index < steps.length - 1 && (
                        <div className="flex justify-center py-2">
                          <ArrowRight className="h-5 w-5 rotate-90 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">Flujo Válido</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tu flujo de trabajo está listo para ejecutar con {steps.length} agentes
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Execute & Save */}
          {steps.length > 0 && (
            <div className="flex gap-3 mt-4">
              <Button 
                onClick={handleExecute} 
                disabled={isExecuting} 
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <Play className="h-4 w-4 mr-2" />
                {isExecuting ? 'Ejecutando...' : 'Ejecutar Flujo'}
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
                Guardar como Plantilla
              </Button>
              <Button
                variant="outline"
                onClick={() => setSteps([])}
              >
                Limpiar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
