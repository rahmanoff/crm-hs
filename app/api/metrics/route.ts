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

    let current, previous;
    if (days === 0) {
      ({ current, previous } = await hubSpotService.getDashboardMetrics(
        0,
        currentRange.start,
        currentRange.end,
        { forceRefresh }
      ));
    } else {
      ({ current, previous } = await hubSpotService.getDashboardMetrics(
        days,
        currentRange.start,
        currentRange.end,
        { forceRefresh }
      ));
    }

    // Fetch all deals to calculate always-up-to-date open deals metrics
    const allDealsData = await hubSpotService.searchObjects(
      'deals',
      [],
      [
        'createdate',
        'closedate',
        'dealstage',
        'amount',
        'lastmodifieddate',
        'pipeline',
        'hs_is_closed',
        'hs_is_closed_won',
        'hs_is_closed_lost',
      ],
      undefined,
      { forceRefresh }
    );
    const deals = allDealsData.results;
    const allOpenDeals = deals.filter(
      (deal) =>
        deal.properties.dealstage !== 'closedwon' &&
        deal.properties.dealstage !== 'closedlost'
    );
    const allOpenDealsCount = allOpenDeals.length;
    const allOpenDealsSum = allOpenDeals.reduce((sum, deal) => {
      const amount = deal.properties.amount
        ? parseFloat(deal.properties.amount)
        : 0;
      return sum + amount;
    }, 0);
    const allOpenDealsAverage =
      allOpenDealsCount > 0 ? allOpenDealsSum / allOpenDealsCount : 0;

    return NextResponse.json({
      current,
      previous,
      allOpenDealsCount,
      allOpenDealsSum,
      allOpenDealsAverage,
    });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      'An internal error occurred while fetching metrics.';

    return NextResponse.json({ error: message }, { status });
  }
}
