export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/client';
import { WorkflowStateManager, WorkflowExecutor } from '@/lib/services/workflow-engine';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Load workflow definition
    const { data: workflowData, error: workflowError } = await supabase
      .from('workflow_definitions')
      .select('definition')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (workflowError || !workflowData) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Execute workflow
    const executor = new WorkflowExecutor(workflowData.definition, user.id);
    const result = await executor.execute();

    return Response.json({ execution: result }, { status: 200 });
  } catch (error) {
    console.error('[v0] Workflow execution error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to execute workflow' },
      { status: 400 }
    );
  }
}
