import { NextResponse, NextRequest } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Current period
    const now = new Date();
    const endCurrent = now.setHours(23, 59, 59, 999);
    const startCurrent = new Date(now);
    startCurrent.setDate(startCurrent.getDate() - days);
    const startCurrentTs = new Date(
      startCurrent.setHours(0, 0, 0, 0)
    ).getTime();
    const endCurrentTs = endCurrent;

    // Previous period
    const endPrev = new Date(startCurrentTs - 1);
    const startPrev = new Date(endPrev);
    startPrev.setDate(endPrev.getDate() - days + 1);
    const startPrevTs = new Date(
      startPrev.setHours(0, 0, 0, 0)
    ).getTime();
    const endPrevTs = new Date(
      endPrev.setHours(23, 59, 59, 999)
    ).getTime();

    const [current, previous] = await Promise.all([
      hubSpotService.getDashboardMetrics(
        days,
        startCurrentTs,
        endCurrentTs
      ),
      hubSpotService.getDashboardMetrics(days, startPrevTs, endPrevTs),
    ]);
    return NextResponse.json({ current, previous });
  } catch (error: any) {
    console.error('Error in metrics API route:', error.message);

    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      'An internal error occurred while fetching metrics.';

    return NextResponse.json({ error: message }, { status });
  }
}
