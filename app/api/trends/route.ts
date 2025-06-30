import { NextResponse, NextRequest } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';

export async function GET(request: NextRequest) {
  if (!process.env.HUBSPOT_API_KEY) {
    return NextResponse.json(
      { error: 'HubSpot API key not configured.' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const trendData = await hubSpotService.getTrendData({
      from: from || undefined,
      to: to || undefined,
    });
    return NextResponse.json(trendData);
  } catch (error: any) {
    console.error('Error in trends API route:', error.message);

    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      'An internal error occurred while fetching trends.';

    return NextResponse.json({ error: message }, { status });
  }
}
