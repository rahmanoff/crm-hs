import { NextResponse, NextRequest } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const trends = await hubSpotService.getTrendData(days);
    return NextResponse.json(trends);
  } catch (error: any) {
    console.error('Error in trends API route:', error.message);

    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      'An internal error occurred while fetching trends.';

    return NextResponse.json({ error: message }, { status });
  }
}
