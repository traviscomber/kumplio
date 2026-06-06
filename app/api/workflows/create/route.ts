export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/client';
import { WorkflowDefinitionBuilder, WorkflowExecutor } from '@/lib/services/workflow-engine';
import { z } from 'zod';

const workflowRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(
    z.object({
      id: z.string(),
      agentName: z.string(),
      inputs: z.record(z.any()),
      condition: z.string().optional(),
      retryCount: z.number().optional(),
      timeout: z.number().optional(),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = workflowRequestSchema.parse(body);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create workflow definition
    const { data, error } = await supabase
      .from('workflow_definitions')
      .insert({
        user_id: user.id,
        name: validated.name,
        description: validated.description,
        definition: validated,
      })
      .select();

    if (error) throw error;

    return Response.json({ workflow: data[0] }, { status: 201 });
  } catch (error) {
    console.error('[v0] Workflow creation error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create workflow' },
      { status: 400 }
    );
  }
}
