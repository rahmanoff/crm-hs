import { NextResponse } from 'next/server';
import { hubSpotService } from '@/lib/hubspot';

// Simple in-memory cache (for demonstration; use Redis for production)
let cachedMetrics: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = Date.now();
  if (cachedMetrics && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json(cachedMetrics);
  }

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

  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const start30 = now - THIRTY_DAYS;
  const prevStart30 = start30 - THIRTY_DAYS;
  const prevEnd30 = start30;
  let totalTasks = allTasksData.total;
  let createdLast30Days = 0;
  let completedLast30Days = 0;
  let overdue = 0;
  let openTasks = 0;
  let createdPrev30Days = 0;

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
    if (created && created >= start30 && created <= now)
      createdLast30Days++;
    if (
      status === 'COMPLETED' &&
      completed &&
      completed >= start30 &&
      completed <= now
    )
      completedLast30Days++;
    if (status !== 'COMPLETED' && due && due < now) overdue++;
    if (status !== 'COMPLETED') openTasks++;
    if (created && created >= prevStart30 && created < prevEnd30)
      createdPrev30Days++;
  }

  const metrics = {
    totalTasks,
    createdLast30Days,
    completedLast30Days,
    overdue,
    openTasks,
    createdPrev30Days,
  };
  cachedMetrics = metrics;
  cacheTimestamp = now;
  return NextResponse.json(metrics);
}
