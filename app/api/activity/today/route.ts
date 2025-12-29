import { hubSpotService } from '@/lib/hubspot';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get('forceRefresh') === 'true';

  try {
    const summary = await hubSpotService.getTodayActivitySummary({
      forceRefresh,
    });
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
