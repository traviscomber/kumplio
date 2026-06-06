export const dynamic = 'force-dynamic';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowBuilder } from '@/components/agents/workflow-builder';
import { WorkflowMonitor } from '@/components/agents/workflow-monitor';
import { WorkflowHistory } from '@/components/agents/workflow-history';
import { WorkflowTemplates } from '@/components/agents/workflow-templates';
import { WorkflowAnalytics } from '@/components/agents/workflow-analytics';

export const metadata = {
  title: 'Gestión de Flujos de Trabajo - KUMPLIO',
  description: 'Diseña, ejecuta y monitorea flujos de análisis de cumplimiento con agentes IA de KUMPLIO',
};

export default function WorkflowsPage() {
  return (
    <main className="container mx-auto px-6 py-8 space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Gestión de Flujos de Trabajo</h1>
        <p className="text-lg text-muted-foreground">
          Diseña, ejecuta y monitorea flujos de análisis de cumplimiento con agentes IA especializados de KUMPLIO
        </p>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="builder" className="text-sm md:text-base">Constructor</TabsTrigger>
          <TabsTrigger value="templates" className="text-sm md:text-base">Plantillas</TabsTrigger>
          <TabsTrigger value="history" className="text-sm md:text-base">Historial</TabsTrigger>
          <TabsTrigger value="analytics" className="text-sm md:text-base">Análisis</TabsTrigger>
          <TabsTrigger value="monitor" className="text-sm md:text-base">Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6 mt-8">
          <WorkflowBuilder />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6 mt-8">
          <WorkflowTemplates />
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-8">
          <WorkflowHistory limit={20} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-8">
          <WorkflowAnalytics />
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6 mt-8">
          <div className="text-muted-foreground p-8 text-center border rounded-lg bg-card">
            Ejecuta un flujo de trabajo para ver el monitoreo en tiempo real aquí
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
