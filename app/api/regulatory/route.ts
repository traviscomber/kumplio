// API endpoint for regulatory database queries

import { NextRequest, NextResponse } from 'next/server';
import {
  searchRegulatoryFrameworks,
  searchRegulatoryRequirements,
  getIndustries,
  getRegulatoryStats,
  matchObligationsToRegulations,
} from '@/lib/services/regulatory';

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') || 'frameworks';
    const industry = req.nextUrl.searchParams.get('industry');
    const severity = req.nextUrl.searchParams.get('severity');

    if (type === 'industries') {
      const industries = await getIndustries();
      return NextResponse.json({ industries });
    }

    if (type === 'frameworks') {
      const frameworks = await searchRegulatoryFrameworks(industry || undefined);
      return NextResponse.json({ frameworks });
    }

    if (type === 'requirements') {
      const requirements = await searchRegulatoryRequirements(
        undefined,
        industry || undefined,
        severity || undefined
      );
      return NextResponse.json({ requirements });
    }

    if (type === 'stats') {
      const stats = await getRegulatoryStats(industry || undefined);
      return NextResponse.json({ stats });
    }

    return NextResponse.json(
      { error: 'Invalid query type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[v0] Regulatory API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, obligations, industry } = body;

    if (action === 'match-obligations') {
      if (!obligations || !industry) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const mappings = await matchObligationsToRegulations(obligations, industry);
      return NextResponse.json({ mappings });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[v0] Regulatory API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
