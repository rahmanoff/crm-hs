import { NextResponse } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trendPeriod = parseInt(
    searchParams.get('trendPeriod') || '30',
    10
  );
  const now = Date.now();
  const periodMs = trendPeriod * 24 * 60 * 60 * 1000;
  const trendStart = now - periodMs;
  const prevTrendStart = trendStart - periodMs;
  const prevTrendEnd = trendStart;

  try {
    // Fetch all deals (no date filter)
    const allDealsData = await hubSpotService.searchObjects(
      'deals',
      [],
      [
        'createdate',
        'dealstage',
        'amount',
        'hs_is_closed',
        'hs_is_closed_won',
        'hs_is_closed_lost',
      ]
    );
    const deals = allDealsData.results;

    // All open deals (not closedwon/lost)
    const openDeals = deals.filter(
      (deal) =>
        deal.properties.dealstage !== 'closedwon' &&
        deal.properties.dealstage !== 'closedlost'
    );

    // Group all open deals by stage
    const stageMap: Record<
      string,
      {
        count: number;
        sum: number;
        trendCount: number;
        trendSum: number;
        prevTrendCount: number;
        prevTrendSum: number;
      }
    > = {};
    for (const deal of openDeals) {
      const stage = deal.properties.dealstage || 'Unknown';
      const amount = deal.properties.amount
        ? parseFloat(deal.properties.amount)
        : 0;
      if (!stageMap[stage]) {
        stageMap[stage] = {
          count: 0,
          sum: 0,
          trendCount: 0,
          trendSum: 0,
          prevTrendCount: 0,
          prevTrendSum: 0,
        };
      }
      stageMap[stage].count++;
      stageMap[stage].sum += amount;
      // Trend: open deals created in trend period
      const created = deal.properties.createdate
        ? new Date(deal.properties.createdate).getTime()
        : null;
      if (created !== null) {
        if (created >= trendStart && created <= now) {
          stageMap[stage].trendCount++;
          stageMap[stage].trendSum += amount;
        } else if (
          created >= prevTrendStart &&
          created < prevTrendEnd
        ) {
          stageMap[stage].prevTrendCount++;
          stageMap[stage].prevTrendSum += amount;
        }
      }
    }

    // Format response
    const stages = Object.entries(stageMap).map(([stage, data]) => ({
      stage,
      count: data.count,
      sum: data.sum,
      trend: {
        current: { count: data.trendCount, sum: data.trendSum },
        previous: {
          count: data.prevTrendCount,
          sum: data.prevTrendSum,
        },
      },
    }));

    return NextResponse.json({ stages });
  } catch (error) {
    console.error('Error in /api/deals/metrics/stages-metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch deals by stage',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
