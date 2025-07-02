import { NextResponse } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const daysParam = searchParams.get('days');
  const days = daysParam ? parseInt(daysParam, 10) : 30;
  const now = Date.now();

  // Fetch all tasks
  const allTasksData = await hubSpotService.searchObjects(
    'tasks',
    [],
    [
      'hs_createdate',
      'hs_task_status',
      'hs_task_completion_date',
      'hs_timestamp',
    ]
  );

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

  for (const task of allTasksData.results) {
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
    if (status !== 'COMPLETED' && due && due < now) overdue++;
    if (status !== 'COMPLETED') openTasks++;
  }

  const metrics = {
    totalTasks,
    createdInPeriod,
    completedInPeriod,
    overdue,
    openTasks,
    createdPrevPeriod,
  };
  return NextResponse.json(metrics);
}
