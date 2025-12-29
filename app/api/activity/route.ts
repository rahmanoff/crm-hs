import { hubSpotService } from '@/lib/hubspot';
import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams, pathname } = new URL(request.url);
  const startTs = searchParams.get('startTs');
  const endTs = searchParams.get('endTs');
  const forceRefresh = searchParams.get('forceRefresh') === 'true';
  const completedStartTs = searchParams.get('completedStartTs');
  const completedEndTs = searchParams.get('completedEndTs');
  if (startTs && endTs) {
    try {
      const filter = [
        {
          filters: [
            {
              propertyName: 'hs_createdate',
              operator: 'BETWEEN',
              value: Number(startTs),
              highValue: Number(endTs),
            },
          ],
        },
      ];
      const tasksData = await hubSpotService.searchObjects(
        'tasks',
        filter,
        [
          'hs_createdate',
          'hs_task_due_date',
          'hs_task_completion_date',
          'hs_task_subject',
          'hs_task_status',
        ],
        undefined,
        { forceRefresh }
      );
      // Return up to 100 tasks for inspection
      return NextResponse.json({
        totalTasks: tasksData.total,
        tasks: tasksData.results.slice(0, 100),
      });
    } catch (error: any) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred';
      return NextResponse.json(
        {
          error: 'Failed to fetch tasks by date range',
          details: errorMessage,
        },
        { status: 500 }
      );
    }
  }
  if (searchParams.get('totalTasks') === '1') {
    try {
      const allTasksData = await hubSpotService.searchObjects(
        'tasks',
        [],
        [
          'hs_timestamp',
          'hs_task_subject',
          'hs_task_status',
          'hs_task_completion_date',
        ],
        undefined,
        { forceRefresh }
      );
      return NextResponse.json({ totalTasks: allTasksData.total });
    } catch (error: any) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred';
      return NextResponse.json(
        {
          error: 'Failed to inspect first tasks',
          details: errorMessage,
        },
        { status: 500 }
      );
    }
  }
  if (searchParams.get('inspectFirstTasks') === '1') {
    try {
      // Fetch all relevant properties for the first 10 tasks for inspection
      const fields = [
        'hs_createdate',
        'hs_lastmodifieddate',
        'hs_task_completion_date',
        'hs_timestamp',
        'hs_task_status',
        'hs_task_subject',
      ];
      const tasksData = await hubSpotService.searchObjects(
        'tasks',
        [],
        fields,
        undefined,
        { forceRefresh }
      );
      const tasks = tasksData.results.slice(0, 10).map((task) => ({
        id: task.id,
        name: task.properties.hs_task_subject || null,
        creationDate: task.properties.hs_createdate || null,
        dueDate: task.properties.hs_timestamp || null,
        completionDate: task.properties.hs_task_completion_date || null,
        status: task.properties.hs_task_status || null,
      }));
      return NextResponse.json({
        totalTasks: tasksData.total,
        tasks,
      });
    } catch (error: any) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred';
      return NextResponse.json(
        {
          error: 'Failed to inspect first tasks',
          details: errorMessage,
        },
        { status: 500 }
      );
    }
  }
  if (completedStartTs && completedEndTs) {
    try {
      const filter = [
        {
          filters: [
            {
              propertyName: 'hs_task_completion_date',
              operator: 'BETWEEN',
              value: Number(completedStartTs),
              highValue: Number(completedEndTs),
            },
            {
              propertyName: 'hs_task_status',
              operator: 'EQ',
              value: 'COMPLETED',
            },
          ],
        },
      ];
      const tasksData = await hubSpotService.searchObjects(
        'tasks',
        filter,
        [
          'hs_task_subject',
          'hs_createdate',
          'hs_timestamp',
          'hs_task_completion_date',
          'hs_task_status',
        ],
        undefined,
        { forceRefresh }
      );
      return NextResponse.json({
        totalTasks: tasksData.total,
        tasks: tasksData.results.slice(0, 10).map((task) => ({
          id: task.id,
          name: task.properties.hs_task_subject || null,
          creationDate: task.properties.hs_createdate || null,
          dueDate: task.properties.hs_timestamp || null,
          completionDate:
            task.properties.hs_task_completion_date || null,
          status: task.properties.hs_task_status || null,
        })),
      });
    } catch (error: any) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred';
      return NextResponse.json(
        {
          error: 'Failed to fetch completed tasks by date range',
          details: errorMessage,
        },
        { status: 500 }
      );
    }
  }
  // Default: recent activity
  try {
    const activity = await hubSpotService.getRecentActivity(undefined, {
      forceRefresh,
    });
    return NextResponse.json(activity);
  } catch (error: any) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred';
    return NextResponse.json(
      {
        error: 'Failed to fetch recent activity',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
