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

interface TopDeal {
  company?: string | null;
  contacts: string[];
  name: string;
  amount: number;
}

interface TopEntity {
  label: string;
  sum: number;
}

interface DealsByStage {
  stage: string;
  count: number;
  sum: number;
  trend: {
    current: { count: number; sum: number };
    previous: { count: number; sum: number };
  };
}

interface CrmState {
  loading: boolean;
  error: string | null;
  metrics: MetricsTrend | null;
  trends: TrendData[];
  activity: ActivityItem[];
  timeRange: number; // 30, 90, or 0 for 'All Time'
  isFetching: boolean;
  topWonDeals: TopDeal[];
  topNewDeals: TopDeal[];
  topOpenDeals: TopDeal[];
  topLostDeals: TopDeal[];
  topPayedDeals: TopDeal[];
  topWonEntities: TopEntity[];
  topLostEntities: TopEntity[];
  dealsByStage: DealsByStage[];
  topDealsLoading: boolean;
  topDealsError: string | null;
  topEntitiesLoading: boolean;
  topEntitiesError: string | null;
  dealsByStageLoading: boolean;
  dealsByStageError: string | null;
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
    topWonDeals: [],
    topNewDeals: [],
    topOpenDeals: [],
    topLostDeals: [],
    topPayedDeals: [],
    topWonEntities: [],
    topLostEntities: [],
    dealsByStage: [],
    topDealsLoading: false,
    topDealsError: null,
    topEntitiesLoading: false,
    topEntitiesError: null,
    dealsByStageLoading: false,
    dealsByStageError: null,
    setTimeRange: (days: number) => {
      set({ timeRange: days });
      get().fetchData(days);
    },
    fetchData: async (days) => {
      if (get().isFetching) return;

      const timeRange = days ?? get().timeRange;
      const currentToken = (get().fetchToken || 0) + 1;
      set({
        loading: true,
        error: null,
        isFetching: true,
        fetchToken: currentToken,
        topDealsLoading: true,
        topDealsError: null,
        topEntitiesLoading: true,
        topEntitiesError: null,
        dealsByStageLoading: true,
        dealsByStageError: null,
      });
      try {
        const metricsUrl = `/api/metrics?days=${timeRange}&refresh=1&t=${Date.now()}`;
        const now = Date.now();
        const period = timeRange * 24 * 60 * 60 * 1000;
        const start = timeRange === 0 ? 0 : now - period;
        const end = now;

        const [
          metricsRes,
          trendsRes,
          activityRes,
          taskMetricsRes,
          todayActivityRes,
          topWonRes,
          topNewRes,
          topOpenRes,
          topLostRes,
          topPayedRes,
          topWonEntitiesRes,
          topLostEntitiesRes,
          dealsByStageRes,
        ] = await Promise.all([
          fetch(metricsUrl),
          fetch(`/api/trends?days=${timeRange}`),
          fetch('/api/activity'),
          fetch(`/api/activity/metrics?days=${timeRange}`),
          fetch('/api/activity/today'),
          fetch(`/api/deals/top-won?start=${start}&end=${end}`),
          fetch(`/api/deals/top-new?start=${start}&end=${end}`),
          fetch(`/api/deals/top-open?start=${start}&end=${end}`),
          fetch(`/api/deals/top-lost?start=${start}&end=${end}`),
          fetch(`/api/deals/top-payed?start=${start}&end=${end}`),
          fetch(
            `/api/companies/top-won-entities?start=${start}&end=${end}`
          ),
          fetch(
            `/api/companies/top-lost-entities?start=${start}&end=${end}`
          ),
          fetch(
            `/api/deals/metrics/stages-metrics?trendPeriod=${timeRange}`
          ),
        ]);

        if (
          !metricsRes.ok ||
          !trendsRes.ok ||
          !activityRes.ok ||
          !taskMetricsRes.ok ||
          !todayActivityRes.ok ||
          !topWonRes.ok ||
          !topNewRes.ok ||
          !topOpenRes.ok ||
          !topLostRes.ok ||
          !topPayedRes.ok ||
          !topWonEntitiesRes.ok ||
          !topLostEntitiesRes.ok ||
          !dealsByStageRes.ok
        ) {
          throw new Error('Failed to fetch dashboard data.');
        }

        const metrics = await metricsRes.json();
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
        const topWonDeals = await topWonRes.json();
        const topNewDeals = await topNewRes.json();
        const topOpenDeals = await topOpenRes.json();
        const topLostDeals = await topLostRes.json();
        const topPayedDeals = await topPayedRes.json();
        const topWonEntities = await topWonEntitiesRes.json();
        const topLostEntities = await topLostEntitiesRes.json();
        const dealsByStage = await dealsByStageRes.json();

        if (get().fetchToken === currentToken) {
          set({
            metrics,
            trends,
            activity,
            taskMetrics,
            todayActivity,
            topWonDeals,
            topNewDeals,
            topOpenDeals,
            topLostDeals,
            topPayedDeals,
            topWonEntities,
            topLostEntities,
            dealsByStage: dealsByStage.stages || [],
            loading: false,
            isFetching: false,
            error: null,
            topDealsLoading: false,
            topDealsError: null,
            topEntitiesLoading: false,
            topEntitiesError: null,
            dealsByStageLoading: false,
            dealsByStageError: null,
          });
        }
      } catch (error: any) {
        if (get().fetchToken === currentToken) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'An unknown error occurred';
          set({
            error: errorMessage,
            loading: false,
            isFetching: false,
            topDealsLoading: false,
            topDealsError: errorMessage,
            topEntitiesLoading: false,
            topEntitiesError: errorMessage,
            dealsByStageLoading: false,
            dealsByStageError: errorMessage,
          });
        }
      }
    },
  })
);
