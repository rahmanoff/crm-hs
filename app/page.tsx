'use client';

import React, { useEffect } from 'react';
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
};

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          value: metrics.current.totalTasks,
          prev: metrics.previous.totalTasks,
          icon: ClipboardCheck,
          key: 'totalTasks',
          format: 'number',
          subLabel: `Completed: ${metrics.current.tasksCompleted}  Overdue: ${metrics.current.tasksOverdue}`,
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

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-4'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                CRM Dashboard
              </h1>
              <p className='text-gray-600'>
                Your business metrics and trends at a glance
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              <TimeRangeSelector />
              <button
                onClick={handleRefresh}
                disabled={loading}
                className='btn-secondary flex items-center space-x-2'>
                <RefreshCw
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className='max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-6 mb-8'>
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <MetricCardSkeleton key={index} />
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
                  />
                </motion.div>
              ))}
        </motion.div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            className='lg:col-span-2 space-y-6'>
            {timeRange === 0 ? (
              <div className='h-full flex items-center justify-center md:col-span-2 lg:col-span-2 p-6 bg-gray-100 dark:bg-gray-800/50 rounded-lg text-center text-gray-500 dark:text-gray-400'>
                <div>
                  <p>
                    Trend data is not available for the "All Time" view.
                  </p>
                  <p className='text-sm'>
                    Please select a 30 or 90-day range to see trends.
                  </p>
                </div>
              </div>
            ) : loading ? (
              <>
                <ChartSkeleton />
                <ChartSkeleton />
              </>
            ) : (
              <>
                <motion.div variants={itemVariants}>
                  <TrendChart
                    title={`Business Growth Trends (${timeRangeLabel})`}
                    data={trends}
                    type='area'
                    dataKeys={['contacts', 'companies', 'deals']}
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <TrendChart
                    title={`Revenue Trends (${timeRangeLabel})`}
                    data={trends}
                    type='line'
                    dataKeys={['revenue']}
                  />
                </motion.div>
              </>
            )}
          </motion.div>

          <motion.div
            variants={itemVariants}
            initial='hidden'
            animate='visible'>
            {loading ? (
              <ActivityFeedSkeleton />
            ) : (
              <ActivityFeed activities={activity} />
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
