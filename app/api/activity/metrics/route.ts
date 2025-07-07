import { NextResponse } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';
import { getDateRange } from '@/lib/dateUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const daysParam = searchParams.get('days');
  const days = daysParam ? parseInt(daysParam, 10) : 30;
  const now = Date.now();

  try {
    // Use a simpler approach - fetch tasks with minimal properties and process in chunks

    // Fetch all tasks (no date filter) for Open Tasks calculation
    const allTasksData = await hubSpotService.searchObjects(
      'tasks',
      [], // No filter for all tasks
      [
        'hs_createdate',
        'hs_task_status',
        'hs_task_completion_date',
        'hs_timestamp',
      ]
    );

    // For period-based metrics, filter in-memory
    const PERIOD = days * 24 * 60 * 60 * 1000;
    const start = now - PERIOD;
    const prevStart = start - PERIOD;
    const prevEnd = start;

    let totalTasks = allTasksData.total;
    let createdInPeriod = 0;
    let completedInPeriod = 0;
    let overdue = 0;
    let openTasks = 0;
    let createdPrevPeriod = 0;

    const tasks = allTasksData.results;
    for (const task of tasks) {
      const created = task.properties.hs_createdate
        ? new Date(task.properties.hs_createdate).getTime()
        : null;
      const completed = task.properties.hs_task_completion_date
        ? new Date(task.properties.hs_task_completion_date).getTime()
        : null;
      const due = task.properties.hs_timestamp
        ? new Date(task.properties.hs_timestamp).getTime()
        : null;
      const status = task.properties.hs_task_status;

      // Period-based metrics
      if (days === 0) {
        if (created) createdInPeriod++;
        if (status === 'COMPLETED' && completed) completedInPeriod++;
      } else {
        if (created && created >= start && created <= now)
          createdInPeriod++;
        if (
          status === 'COMPLETED' &&
          completed &&
          completed >= start &&
          completed <= now
        )
          completedInPeriod++;
        if (created && created >= prevStart && created < prevEnd)
          createdPrevPeriod++;
      }
      // All-time open/overdue
      if (status !== 'COMPLETED' && due && due < now) overdue++;
      if (status !== 'COMPLETED') openTasks++;
    }

    const metrics = {
      totalTasks,
      createdInPeriod,
      completedInPeriod,
      overdue,
      openTasks, // This is now all-time
      createdPrevPeriod,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch task metrics', details: String(error) },
      { status: 500 }
    );
  }
}
