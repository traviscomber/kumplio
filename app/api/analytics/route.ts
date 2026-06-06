// API endpoint for analytics data

import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsData, getDashboardStats } from '@/lib/services/analytics';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const type = req.nextUrl.searchParams.get('type') || 'full';

    if (type === 'stats') {
      const stats = await getDashboardStats(user.id);
      return NextResponse.json(stats);
    }

    const analytics = await getAnalyticsData(user.id);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('[v0] Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
