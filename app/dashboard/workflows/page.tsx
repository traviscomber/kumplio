export const dynamic = 'force-dynamic';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowBuilder } from '@/components/agents/workflow-builder';
import { WorkflowMonitor } from '@/components/agents/workflow-monitor';

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workflow Management</h1>
        <p className="text-muted-foreground mt-2">
          Design, execute, and monitor compliance analysis workflows powered by KUMPLIO agents
        </p>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6 mt-6">
          <WorkflowBuilder />
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6 mt-6">
          <div className="text-muted-foreground">
            Execute a workflow to see real-time monitoring
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
