import { create } from 'zustand';
import { DashboardMetrics, TrendData } from './hubspot';

interface ActivityItem {
  type: 'contact' | 'company' | 'deal' | 'task';
  id: string;
  title: string;
  date: string;
  description: string;
}

interface CrmState {
  loading: boolean;
  error: string | null;
  metrics: DashboardMetrics | null;
  trends: TrendData[];
  activity: ActivityItem[];
  timeRange: number; // 30, 90, or 0 for 'All Time'
  isFetching: boolean;
  setTimeRange: (days: number) => void;
  fetchData: (days?: number) => Promise<void>;
}

export const useCrmStore = create<CrmState>((set, get) => ({
  loading: false,
  error: null,
  metrics: null,
  trends: [],
  activity: [],
  timeRange: 30,
  isFetching: false,
  setTimeRange: (days: number) => {
    set({ timeRange: days });
    get().fetchData(days);
  },
  fetchData: async (days) => {
    if (get().isFetching) return;

    const timeRange = days ?? get().timeRange;
    set({ loading: true, error: null, isFetching: true });
    try {
      const [metricsRes, trendsRes, activityRes] = await Promise.all([
        fetch(`/api/metrics?days=${timeRange}`),
        fetch(`/api/trends?days=${timeRange}`),
        fetch('/api/activity'),
      ]);

      if (!metricsRes.ok || !trendsRes.ok || !activityRes.ok) {
        throw new Error('Failed to fetch dashboard data.');
      }

      const metrics = await metricsRes.json();
      const trends = await trendsRes.json();
      const activity = await activityRes.json();

      set({
        metrics,
        trends,
        activity,
        loading: false,
        isFetching: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred';
      set({ error: errorMessage, loading: false, isFetching: false });
    }
  },
}));
