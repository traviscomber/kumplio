export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get workflow execution history
    const { data, error, count } = await supabase
      .from('workflow_executions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return Response.json(
      {
        executions: data || [],
        total: count || 0,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Workflow history error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to get workflow history' },
      { status: 400 }
    );
  }
}
