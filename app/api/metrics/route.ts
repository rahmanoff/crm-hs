import { NextResponse, NextRequest } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';
import { getDateRange, getPreviousDateRange } from '@/lib/dateUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const forceRefresh = searchParams.get('refresh') === '1';

    // Use shared utils for date ranges
    const currentRange = getDateRange(days);
    const prevRange = getPreviousDateRange(days);

    if (days === 0) {
      const { current, previous } = await hubSpotService.getDashboardMetrics(
        0,
        currentRange.start,
        currentRange.end,
        { forceRefresh }
      );
      return NextResponse.json({ current, previous });
    }

    const { current, previous } = await hubSpotService.getDashboardMetrics(
      days,
      currentRange.start,
      currentRange.end,
      { forceRefresh }
    );

    return NextResponse.json({ current, previous });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      'An internal error occurred while fetching metrics.';

    return NextResponse.json({ error: message }, { status });
  }
}
