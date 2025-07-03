'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users,
  Building2,
  DollarSign,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Settings,
  Briefcase,
  ClipboardCheck,
  Target,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

import MetricCard from '@/components/MetricCard';
import TrendChart from '@/components/TrendChart';
import ActivityFeed from '@/components/ActivityFeed';
import { useCrmStore } from '@/lib/store';
import { TimeRangeSelector } from '@/components/TimeRangeSelector';

import MetricCardSkeleton from '@/components/MetricCardSkeleton';
import ChartSkeleton from '@/components/ChartSkeleton';
import ActivityFeedSkeleton from '@/components/ActivityFeedSkeleton';

type MetricCardConfig = {
  title: string;
  value: number;
  prev: number | null | undefined;
  icon: LucideIcon;
  key: string;
  format?: 'number' | 'currency' | 'percentage' | 'text';
  subLabel?: string | string[];
  color?: 'primary' | 'success' | 'warning' | 'danger';
};

function TodayActivityCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    closedTasks: number;
    newContacts: number;
    newCompanies: number;
    newDeals: { name: string; amount: number }[];
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/activity/today')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch today\'s activity');
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ActivityFeedSkeleton />;
  }
  if (error) {
    return (
      <div className='card text-center p-6 text-red-600'>
        <p className='font-semibold'>Failed to load today\'s activity</p>
        <p className='text-sm'>{error}</p>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className='card'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>Today Activity</h3>
      <div className='grid grid-cols-2 gap-4 mb-4'>
        <div className='flex flex-col items-center'>
          <span className='text-2xl font-bold text-black'>{data.closedTasks}</span>
          <span className='text-xs text-gray-500'>Closed Tasks</span>
        </div>
        <div className='flex flex-col items-center'>
          <span className='text-2xl font-bold text-black'>{data.newContacts}</span>
          <span className='text-xs text-gray-500'>New Contacts</span>
        </div>
        <div className='flex flex-col items-center'>
          <span className='text-2xl font-bold text-black'>{data.newCompanies}</span>
          <span className='text-xs text-gray-500'>New Companies</span>
        </div>
        <div className='flex flex-col items-center'>
          <span className='text-2xl font-bold text-black'>{data.newDeals.length}</span>
          <span className='text-xs text-gray-500'>New Deals</span>
        </div>
      </div>
      <div>
        <h4 className='font-semibold text-gray-800 mb-2'>New Deals</h4>
        {data.newDeals.length === 0 ? (
          <p className='text-gray-500 text-sm'>No new deals today</p>
        ) : (
          <>
            <ul className='divide-y divide-gray-200'>
              {data.newDeals.map((deal, idx) => (
                <li key={idx} className='py-1'>
                  <span className='text-gray-900'>
                    {deal.name} <span className='text-gray-700 font-mono font-bold'>${deal.amount.toLocaleString()}</span>
                  </span>
                </li>
              ))}
            </ul>
            {data.newDeals.length > 1 && (
              <div className='mt-2 text-right'>
                <span className='text-gray-800 font-semibold'>Total: </span>
                <span className='text-black font-bold font-mono'>
                  ${data.newDeals.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const {
    metrics,
    trends,
    activity,
    loading,
    error,
    fetchData,
    timeRange,
  } = useCrmStore();

  const [taskMetrics, setTaskMetrics] = useState<{
    createdLast30Days: number;
    totalTasks: number;
    completedLast30Days: number;
    overdue: number;
    openTasks?: number;
    createdPrev30Days?: number;
  } | null>(null);

  useEffect(() => {
    fetchData();
    fetch(`/api/activity/metrics?days=${timeRange}`)
      .then((res) => res.json())
      .then((data) => {
        // Map new property names to old ones for UI compatibility
        const mapped = {
          totalTasks: data.totalTasks,
          createdLast30Days: data.createdInPeriod,
          completedLast30Days: data.completedInPeriod,
          overdue: data.overdue,
          openTasks: data.openTasks,
          createdPrev30Days: data.createdPrevPeriod,
        };
        if (typeof mapped.openTasks === 'undefined') {
          mapped.openTasks =
            mapped.totalTasks - mapped.completedLast30Days;
        }
        setTaskMetrics(mapped);
        // Debug: log all task metrics if available
        if (metrics) {
          console.log('[UI] Dashboard metrics:', metrics);
        }
      });
  }, [fetchData, timeRange]);

  useEffect(() => {
    if (metrics && timeRange === 0) {
      console.log(
        'Total deals (All Time):',
        metrics.current.totalDeals
      );
    }
  }, [metrics, timeRange]);

  const handleRefresh = async () => {
    try {
      await fetchData();
      toast.success('Data refreshed successfully!');
    } catch (err) {
      toast.error('Failed to refresh data.');
    }
  };

  const timeRangeLabel =
    timeRange === 30
      ? 'Last 30d'
      : timeRange === 90
      ? 'Last 90d'
      : 'All Time';

  const metricCards: MetricCardConfig[] = metrics
    ? [
        {
          title: `New Contacts (${timeRangeLabel})`,
          value: metrics.current.totalContacts,
          prev: metrics.previous.totalContacts,
          icon: Users,
          key: 'totalContacts',
          format: 'number',
          subLabel: metrics.current.allTimeContacts
            ? `Total: ${metrics.current.allTimeContacts.toLocaleString()}`
            : undefined,
        },
        {
          title: `New Companies (${timeRangeLabel})`,
          value: metrics.current.totalCompanies,
          prev: metrics.previous.totalCompanies,
          icon: Building2,
          key: 'totalCompanies',
          format: 'number',
          subLabel: metrics.current.allTimeCompanies
            ? `Total: ${metrics.current.allTimeCompanies.toLocaleString()}`
            : undefined,
        },
        {
          title: `New Deals (${timeRangeLabel})`,
          value: metrics.current.totalDeals,
          prev: metrics.previous.totalDeals,
          icon: Briefcase,
          key: 'totalDeals',
          format: 'number',
          subLabel: metrics.current.newDealsValue
            ? ([
                `Sum: $${metrics.current.newDealsValue.toLocaleString()}`,
                metrics.current.averageDealSize
                  ? `Avg: $${metrics.current.averageDealSize.toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 }
                    )}`
                  : null,
              ].filter(Boolean) as string[])
            : undefined,
        },
        {
          title: `Active Deals`,
          value: metrics.current.activeDeals,
          prev: metrics.previous.activeDeals,
          icon: LineChartIcon,
          key: 'activeDeals',
          format: 'number',
          subLabel:
            metrics.current.activeDealsValue !== undefined &&
            metrics.current.activeDealsValue !== null
              ? `Sum: $${metrics.current.activeDealsValue.toLocaleString()}`
              : undefined,
        },
        {
          title: `Revenue (${timeRangeLabel})`,
          value: metrics.current.totalRevenue,
          prev: metrics.previous.totalRevenue,
          icon: DollarSign,
          key: 'totalRevenue',
          format: 'currency',
          subLabel: [
            `Won Deals: ${metrics.current.wonDeals}`,
            `Avg Won Deal: $${metrics.current.averageWonDealSize.toLocaleString(
              undefined,
              { maximumFractionDigits: 0 }
            )}`,
          ],
        },
        {
          title: `Close Rate (${timeRangeLabel})`,
          value: metrics.current.conversionRate,
          prev: metrics.previous.conversionRate,
          icon: Target,
          key: 'conversionRate',
          format: 'percentage',
        },
        {
          title: `New Tasks (${timeRangeLabel})`,
          value: taskMetrics ? taskMetrics.createdLast30Days : 0,
          prev: taskMetrics ? taskMetrics.createdPrev30Days : undefined,
          icon: ClipboardCheck,
          key: 'totalTasks',
          format: 'number',
          subLabel: taskMetrics
            ? [
                `Open Tasks: ${taskMetrics.openTasks}`,
                `Completed: ${taskMetrics.completedLast30Days}`,
              ]
            : undefined,
          color: 'primary',
        },
      ]
    : [];

  function getChange(current: number, prev: number | null) {
    if (prev === null || prev === undefined) return undefined;
    if (prev === 0 && current === 0) return 0;
    if (prev === 0 && current > 0) return 100;
    return ((current - prev) / Math.abs(prev)) * 100;
  }

  if (error) {
    return (
      <div className='min-h-screen bg-red-50 flex items-center justify-center'>
        <div className='text-center p-8 bg-white rounded-lg shadow-md max-w-md mx-auto'>
          <AlertTriangle className='w-12 h-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-2xl font-bold text-gray-800 mb-2'>
            Dashboard Error
          </h2>
          <p className='text-gray-600 mb-6'>{error}</p>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className='btn-primary flex items-center space-x-2 mx-auto'>
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  const skeletonCardConfigs = [
    { key: 'totalContacts', span: 'xl:col-span-3' },
    { key: 'totalCompanies', span: 'xl:col-span-3' },
    { key: 'totalDeals', span: 'xl:col-span-3' },
    { key: 'activeDeals', span: 'xl:col-span-3' },
    { key: 'totalRevenue', span: 'xl:col-span-4' },
    { key: 'conversionRate', span: 'xl:col-span-4' },
    { key: 'totalTasks', span: 'xl:col-span-4' },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4 sm:gap-0'>
            <div className='text-center sm:text-left'>
              <h1 className='text-2xl font-bold text-gray-900'>
                CRM Dashboard
              </h1>
              <p className='text-gray-600'>
                Your business metrics and trends at a glance
              </p>
            </div>
            <div className='flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 w-full sm:w-auto'>
              <TimeRangeSelector />
              <button
                onClick={handleRefresh}
                disabled={loading}
                className='btn-secondary flex items-center space-x-2 w-full sm:w-auto justify-center'>
                <RefreshCw
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-6 mb-8'>
          {loading
            ? skeletonCardConfigs.map((cfg, idx) => (
                <div
                  key={cfg.key}
                  className={cfg.span}>
                  <MetricCardSkeleton />
                </div>
              ))
            : metricCards.map((metric) => (
                <motion.div
                  key={metric.key}
                  variants={itemVariants}
                  className={
                    metric.key === 'totalTasks'
                      ? 'xl:col-span-4'
                      : ['totalRevenue', 'conversionRate'].includes(
                          metric.key
                        )
                      ? 'xl:col-span-4'
                      : [
                          'totalContacts',
                          'totalCompanies',
                          'totalDeals',
                          'activeDeals',
                        ].includes(metric.key)
                      ? 'xl:col-span-3'
                      : 'xl:col-span-3'
                  }>
                  <MetricCard
                    title={metric.title}
                    value={metric.value}
                    icon={metric.icon}
                    change={
                      metric.prev !== null && metric.prev !== undefined
                        ? getChange(metric.value, metric.prev)
                        : undefined
                    }
                    format={metric.format}
                    subLabel={metric.subLabel}
                    color={metric.color}
                  />
                </motion.div>
              ))}
        </motion.div>

        {/* Trends Row: Revenue + Business Growth */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
          <motion.div
            variants={itemVariants}
            initial='hidden'
            animate='visible'>
            {timeRange === 0 ? (
              <div className='h-full flex items-center justify-center p-6 bg-white border border-gray-200 rounded-lg text-center text-gray-700'>
                <div>
                  <p className='font-semibold'>
                    Trend data is not available for the "All Time" view.
                  </p>
                  <p className='text-sm text-gray-500'>
                    Please select a 30 or 90-day range to see trends.
                  </p>
                </div>
              </div>
            ) : loading ? (
              <ChartSkeleton />
            ) : (
              <TrendChart
                title={`Revenue Trends (${timeRangeLabel})`}
                data={trends}
                type='line'
                dataKeys={['revenue']}
                colors={['#10b981']}
              />
            )}
          </motion.div>
          <motion.div
            variants={itemVariants}
            initial='hidden'
            animate='visible'>
            {timeRange === 0 ? (
              <div className='h-full flex items-center justify-center p-6 bg-white border border-gray-200 rounded-lg text-center text-gray-700'>
                <div>
                  <p className='font-semibold'>
                    Trend data is not available for the "All Time" view.
                  </p>
                  <p className='text-sm text-gray-500'>
                    Please select a 30 or 90-day range to see trends.
                  </p>
                </div>
              </div>
            ) : loading ? (
              <ChartSkeleton />
            ) : (
              <TrendChart
                title={`Business Growth Trends (${timeRangeLabel})`}
                data={trends}
                type='area'
                dataKeys={['contacts', 'companies', 'deals']}
              />
            )}
          </motion.div>
        </div>
        {/* Recent Activity Row */}
        <motion.div
          variants={itemVariants}
          initial='hidden'
          animate='visible'>
          <TodayActivityCard />
        </motion.div>
      </main>
    </div>
  );
}
