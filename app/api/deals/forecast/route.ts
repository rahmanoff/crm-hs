import { NextRequest } from 'next/server';
import { getOpenDealsForecastByMonth } from '../../../../lib/metrics/deals';

export async function GET(req: NextRequest) {
  try {
    const forecast = await getOpenDealsForecastByMonth();
    return new Response(JSON.stringify(forecast), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch sales forecast' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
