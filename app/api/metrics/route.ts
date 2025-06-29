import { NextResponse } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';

export async function GET() {
  try {
    let metrics;
    try {
      metrics = await hubSpotService.getDashboardMetrics();
    } catch (error) {
      console.error('Error fetching metrics:', error);
      // Return default metrics instead of failing completely
      metrics = {
        totalContacts: 0,
        totalCompanies: 0,
        totalDeals: 0,
        totalTasks: 0,
        activeDeals: 0,
        wonDeals: 0,
        lostDeals: 0,
        totalRevenue: 0,
        averageDealSize: 0,
        conversionRate: 0,
        tasksCompleted: 0,
        tasksOverdue: 0,
      };
    }
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error in metrics API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
} 