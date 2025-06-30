import { NextResponse, NextRequest } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const data = await hubSpotService.getDashboardMetrics(days);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in metrics API route:', error.message);

    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      'An internal error occurred while fetching metrics.';

    return NextResponse.json({ error: message }, { status });
  }
}
