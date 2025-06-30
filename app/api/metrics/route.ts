import { NextResponse } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';

export async function GET() {
  try {
    const metrics = await hubSpotService.getDashboardMetrics();
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
