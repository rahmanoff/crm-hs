import { create } from 'zustand';

interface CrmState {
  loading: boolean;
  error: string | null;
  metrics: any;
  trends: any;
  activity: any[];
  fetchData: () => Promise<void>;
}

export const useCrmStore = create<CrmState>((set) => ({
  loading: true,
  error: null,
  metrics: {},
  trends: {},
  activity: [],
  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const [metricsRes, trendsRes, activityRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/trends'),
        fetch('/api/activity'),
      ]);

      if (!metricsRes.ok || !trendsRes.ok || !activityRes.ok) {
        throw new Error('Failed to fetch dashboard data.');
      }

      const metrics = await metricsRes.json();
      const trends = await trendsRes.json();
      const activity = await activityRes.json();

      set({ metrics, trends, activity, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred';
      set({ error: errorMessage, loading: false });
    }
  },
}));
