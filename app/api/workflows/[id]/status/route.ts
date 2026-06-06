export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/client';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get execution status
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return Response.json({ error: 'Execution not found' }, { status: 404 });
    }

    // Calculate progress
    const totalSteps = data.steps.length;
    const completedSteps = data.steps.filter((s: any) => s.state === 'completed').length;
    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return Response.json(
      {
        execution: {
          id: data.id,
          state: data.state,
          progress,
          totalSteps,
          completedSteps,
          startTime: data.start_time,
          endTime: data.end_time,
          error: data.error,
          steps: data.steps,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Workflow status error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to get workflow status' },
      { status: 400 }
    );
  }
}
