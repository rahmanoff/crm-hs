import { create } from 'zustand';
import { DashboardMetrics, TrendData } from './hubspot';

interface ActivityItem {
  type: 'contact' | 'company' | 'deal' | 'task';
  id: string;
  title: string;
  date: string;
  description: string;
}

interface MetricsTrend {
  current: DashboardMetrics;
  previous: DashboardMetrics;
  allOpenDealsSum?: number;
  allOpenDealsCount?: number;
  allOpenDealsAverage?: number;
}

interface CrmState {
  loading: boolean;
  error: string | null;
  metrics: MetricsTrend | null;
  trends: TrendData[];
  activity: ActivityItem[];
  timeRange: number; // 30, 90, or 0 for 'All Time'
  isFetching: boolean;
  setTimeRange: (days: number) => void;
  fetchData: (days?: number) => Promise<void>;
  taskMetrics: any | null;
  todayActivity: any | null;
}

export const useCrmStore = create<CrmState & { fetchToken?: number }>(
  (set, get) => ({
    loading: false,
    error: null,
    metrics: null,
    trends: [],
    activity: [],
    timeRange: 30,
    isFetching: false,
    fetchToken: 0,
    taskMetrics: null,
    todayActivity: null,
    setTimeRange: (days: number) => {
      set({ timeRange: days });
      get().fetchData(days);
    },
    fetchData: async (days) => {
      if (get().isFetching) return;

      const timeRange = days ?? get().timeRange;
      // Increment fetchToken for each fetch
      const currentToken = (get().fetchToken || 0) + 1;
      set({
        loading: true,
        error: null,
        isFetching: true,
        fetchToken: currentToken,
      });
      try {
        const metricsUrl = `/api/metrics?days=${timeRange}&refresh=1&t=${Date.now()}`;

        const [
          metricsRes,
          trendsRes,
          activityRes,
          taskMetricsRes,
          todayActivityRes,
        ] = await Promise.all([
          fetch(metricsUrl),
          fetch(`/api/trends?days=${timeRange}`),
          fetch('/api/activity'),
          fetch(`/api/activity/metrics?days=${timeRange}`),
          fetch('/api/activity/today'),
        ]);

        if (
          !metricsRes.ok ||
          !trendsRes.ok ||
          !activityRes.ok ||
          !taskMetricsRes.ok ||
          !todayActivityRes.ok
        ) {
          throw new Error('Failed to fetch dashboard data.');
        }

        const metrics = await metricsRes.json(); // { current, previous }
        const trends = await trendsRes.json();
        const activity = await activityRes.json();
        const taskMetricsRaw = await taskMetricsRes.json();
        const taskMetrics = {
          totalTasks: taskMetricsRaw.totalTasks,
          createdLast30Days: taskMetricsRaw.createdInPeriod,
          completedLast30Days: taskMetricsRaw.completedInPeriod,
          overdue: taskMetricsRaw.overdue,
          openTasks: taskMetricsRaw.openTasks,
          createdPrev30Days: taskMetricsRaw.createdPrevPeriod,
        };
        const todayActivity = await todayActivityRes.json();

        // Only update state if this is the latest fetch
        if (get().fetchToken === currentToken) {
          set({
            metrics,
            trends,
            activity,
            taskMetrics,
            todayActivity,
            loading: false,
            isFetching: false,
            error: null,
          });
        }
      } catch (error) {
        // Only update error if this is the latest fetch
        if (get().fetchToken === currentToken) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'An unknown error occurred';
          set({
            error: errorMessage,
            loading: false,
            isFetching: false,
          });
        }
      }
    },
  })
);
