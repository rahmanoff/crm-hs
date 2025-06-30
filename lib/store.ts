import { create } from 'zustand';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';

interface CrmState {
  loading: boolean;
  error: string | null;
  metrics: any;
  trends: any;
  activity: any[];
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
  fetchData: (dateRange: DateRange) => Promise<void>;
}

export const useCrmStore = create<CrmState>((set, get) => ({
  loading: true,
  error: null,
  metrics: {},
  trends: {},
  activity: [],
  dateRange: {
    from: subDays(new Date(), 29),
    to: new Date(),
  },
  setDateRange: (dateRange: DateRange) => set({ dateRange }),
  fetchData: async (dateRange: DateRange) => {
    set({ loading: true, error: null });
    try {
      const { from, to } = dateRange;
      const fromISO = from?.toISOString();
      const toISO = to?.toISOString();

      const [metricsRes, trendsRes, activityRes] = await Promise.all([
        fetch(`/api/metrics?from=${fromISO}&to=${toISO}`),
        fetch(`/api/trends?from=${fromISO}&to=${toISO}`),
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
