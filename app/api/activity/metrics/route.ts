import { NextResponse } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';
import { calculateTaskMetrics } from '@/lib/metrics/tasks';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const daysParam = searchParams.get('days');
  const days = daysParam ? parseInt(daysParam, 10) : 30;
  const forceRefresh = searchParams.get('forceRefresh') === 'true';

  try {
    const allTasksData = await hubSpotService.searchObjects(
      'tasks',
      [],
      [
        'hs_createdate',
        'hs_task_status',
        'hs_task_completion_date',
        'hs_timestamp',
      ],
      undefined,
      { forceRefresh }
    );

    const {
      createdInPeriod,
      completedInPeriod,
      overdue,
      openTasks,
      createdPrevPeriod,
    } = calculateTaskMetrics(allTasksData.results, days);

    const metrics = {
      totalTasks: allTasksData.total,
      createdInPeriod,
      completedInPeriod,
      overdue,
      openTasks,
      createdPrevPeriod,
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred';
    return NextResponse.json(
      {
        error: 'Failed to fetch task metrics',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
