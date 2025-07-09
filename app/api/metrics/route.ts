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

    console.log('Current Range:', currentRange);
    console.log('Previous Range:', prevRange);

    if (days === 0) {
      const current = await hubSpotService.getDashboardMetrics(
        0,
        currentRange.start,
        currentRange.end,
        { forceRefresh }
      );
      // For All Time, previous should be all zeroes
      const previous = {
        totalContacts: 0,
        allTimeContacts: 0,
        totalCompanies: 0,
        allTimeCompanies: 0,
        totalDeals: 0,
        newDealsValue: 0,
        totalTasks: 0,
        activeDeals: 0,
        activeDealsValue: 0,
        wonDeals: 0,
        lostDeals: 0,
        totalRevenue: 0,
        averageDealSize: 0,
        averageWonDealSize: 0,
        conversionRate: 0,
        tasksCompleted: 0,
        tasksOverdue: 0,
      };

      return NextResponse.json({ current, previous });
    }

    const [current, previous] = await Promise.all([
      hubSpotService.getDashboardMetrics(
        days,
        currentRange.start,
        currentRange.end,
        { forceRefresh }
      ),
      hubSpotService.getDashboardMetrics(
        days,
        prevRange.start,
        prevRange.end,
        { forceRefresh }
      ),
    ]);

    return NextResponse.json({ current, previous });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      'An internal error occurred while fetching metrics.';

    return NextResponse.json({ error: message }, { status });
  }
}
