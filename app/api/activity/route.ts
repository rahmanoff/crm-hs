import { hubSpotService } from '@/lib/hubspot';
import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const activity = await hubSpotService.getRecentActivity();
    return NextResponse.json(activity);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch recent activity', details: errorMessage },
      { status: 500 }
    );
  }
}
