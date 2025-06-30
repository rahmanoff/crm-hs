import { NextResponse } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const activity = await hubSpotService.getRecentActivity(limit);
    return NextResponse.json(activity);
  } catch (error: any) {
    console.error('Error in activity API route:', error.message);

    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      'An internal error occurred while fetching recent activity.';

    return NextResponse.json({ error: message }, { status });
  }
}
