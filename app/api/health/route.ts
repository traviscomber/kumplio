export const dynamic = 'force-dynamic';

import { AgentMonitor } from '@/lib/services/monitoring';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const monitor = new AgentMonitor(user.id);
    const health = await monitor.healthCheck();

    return Response.json(health, { status: 200 });
  } catch (error) {
    console.error('[v0] Health check error:', error);
    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
