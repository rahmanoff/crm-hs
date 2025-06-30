import { NextResponse } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';

export async function GET() {
  if (!process.env.HUBSPOT_API_KEY) {
    return NextResponse.json(
      { error: 'HubSpot API key not configured.' },
      { status: 500 }
    );
  }

  try {
    const activity = await hubSpotService.getRecentActivity(20);
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
