import { NextResponse } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    let trendData: any[] = [];
    try {
      trendData = await hubSpotService.getTrendData(days);
    } catch (error) {
      console.error('Error fetching trend data:', error);
      // Return empty trend data instead of failing completely
      trendData = [];
    }
    
    return NextResponse.json(trendData);
  } catch (error) {
    console.error('Error in trends API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trend data' },
      { status: 500 }
    );
  }
} 