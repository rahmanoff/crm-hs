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

    const metrics = await hubSpotService.getDashboardMetrics({
      from: from || undefined,
      to: to || undefined,
    });
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Error in metrics API route:', error.message);

    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      'An internal error occurred while fetching metrics.';

    return NextResponse.json({ error: message }, { status });
  }
}
