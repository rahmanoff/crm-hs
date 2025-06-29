import { NextResponse } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Try to get activities, but handle potential errors gracefully
    let activities: any[] = [];
    try {
      activities = await hubSpotService.getRecentActivity(limit);
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Return empty activities array instead of failing completely
      activities = [];
    }
    
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error in activity API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
} 