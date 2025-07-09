import { NextResponse } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';
import { getDealMetrics } from '@/lib/metrics/deals';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const daysParam = searchParams.get('days');
  const days = daysParam ? parseInt(daysParam, 10) : 30;
  const now = Date.now();
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  try {
    // Fetch all deals (no date filter) for robust metrics
    const allDealsData = await hubSpotService.searchObjects(
      'deals',
      [], // No filter for all deals
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
      ]
    );

    let deals = allDealsData.results;
    // REMOVE: Filtering by createdate for start/end period
    // Always pass all deals to getDealMetrics, which will filter by closedate/createdate as needed
    // if (startParam && endParam) {
    //   const start = parseInt(startParam, 10);
    //   const end = parseInt(endParam, 10);
    //   deals = deals.filter((deal) => {
    //     const created = deal.properties.createdate
    //       ? new Date(deal.properties.createdate).getTime()
    //       : null;
    //     return created !== null && created >= start && created <= end;
    //   });
    // }

    let metrics;
    if (startParam && endParam) {
      const start = parseInt(startParam, 10);
      const end = parseInt(endParam, 10);
      const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
      metrics = getDealMetrics(deals, days, end);
    } else {
      metrics = getDealMetrics(deals, days, now);
    }
    return NextResponse.json(metrics);
  } catch (error) {
    // Log the error to the server console for debugging
    console.error('Error in /api/deals/metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deal metrics', details: String(error) },
      { status: 500 }
    );
  }
}
