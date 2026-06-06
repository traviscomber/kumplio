export const dynamic = 'force-dynamic';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowBuilder } from '@/components/agents/workflow-builder';
import { WorkflowMonitor } from '@/components/agents/workflow-monitor';
import { WorkflowHistory } from '@/components/agents/workflow-history';
import { WorkflowTemplates } from '@/components/agents/workflow-templates';
import { WorkflowAnalytics } from '@/components/agents/workflow-analytics';

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6 mt-6">
          <WorkflowBuilder />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6 mt-6">
          <WorkflowTemplates />
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6">
          <WorkflowHistory limit={20} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <WorkflowAnalytics />
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6 mt-6">
          <div className="text-muted-foreground p-8 text-center border rounded-lg bg-card">
            Execute a workflow to see real-time monitoring here
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
