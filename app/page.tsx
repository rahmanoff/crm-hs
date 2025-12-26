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
import TopDealsCard from '@/components/TopDealsCard';
import DealsByStageCard from '@/components/DealsByStageCard';
import SalesForecastCard from '@/components/SalesForecastCard';

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

type TodayActivityData = {
  closedTasks: number;
  newContacts: number;
  newCompanies: number;
  newDeals: {
    company?: string | null;
    contacts: string[];
    name: string;
    amount: number;
  }[];
};

type TodayActivityCardProps = {
  data: TodayActivityData | null;
  loading: boolean;
  error: string | null;
};

function TodayActivityCard({
  data,
  loading,
  error,
}: TodayActivityCardProps) {
  if (loading) {
    return <ActivityFeedSkeleton />;
  }
  if (error) {
    return (
      <div className='card text-center p-6 text-red-600'>
        <p className='font-semibold'>
          Failed to load today&apos;s activity
        </p>
        <p className='text-sm'>{error}</p>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className='card'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
        Today Activity
      </h3>
      <div className='grid grid-cols-2 gap-4 mb-4'>
        <div className='flex flex-col items-center'>
          <span className='text-2xl font-bold text-black'>
            {data.closedTasks}
          </span>
          <span className='text-xs text-gray-500'>Closed Tasks</span>
        </div>
        <div className='flex flex-col items-center'>
          <span className='text-2xl font-bold text-black'>
            {data.newContacts}
          </span>
          <span className='text-xs text-gray-500'>New Contacts</span>
        </div>
        <div className='flex flex-col items-center'>
          <span className='text-2xl font-bold text-black'>
            {data.newCompanies}
          </span>
          <span className='text-xs text-gray-500'>New Companies</span>
        </div>
        <div className='flex flex-col items-center'>
          <span className='text-2xl font-bold text-black'>
            {data.newDeals.length}
          </span>
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
                <li
                  key={idx}
                  className='py-1'>
                  <span className='text-gray-900'>
                    {deal.company && (
                      <span className='font-semibold text-black'>
                        {deal.company}
                      </span>
                    )}
                    {deal.company &&
                      (deal.contacts.length > 0 || deal.name) &&
                      ', '}
                    {deal.contacts.length > 0 && (
                      <span className='text-black'>
                        {deal.contacts.join(', ')}
                      </span>
                    )}
                    {deal.contacts.length > 0 && deal.name && ', '}
                    <span className='text-gray-900'>
                      {deal.name}
                    </span>{' '}
                    <span className='text-gray-700 font-mono font-bold'>
                      ${deal.amount.toLocaleString()}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {data.newDeals.length > 1 && (
              <div className='mt-2 text-right'>
                <span className='text-gray-800 font-semibold'>
                  Total:{' '}
                </span>
                <span className='text-black font-bold font-mono'>
                  $
                  {data.newDeals
                    .reduce((sum, d) => sum + d.amount, 0)
                    .toLocaleString()}
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
  const skeletonCardConfigs = [
    { key: 'totalContacts', span: 'xl:col-span-3' },
    { key: 'totalCompanies', span: 'xl:col-span-3' },
    { key: 'totalDeals', span: 'xl:col-span-3' },
    { key: 'activeDeals', span: 'xl:col-span-3' },
    { key: 'totalRevenue', span: 'xl:col-span-4' },
    { key: 'conversionRate', span: 'xl:col-span-4' },
    { key: 'totalTasks', span: 'xl:col-span-4' },
  ];
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
  const {
    metrics,
    trends,
    activity,
    loading,
    error,
    fetchData,
    timeRange,
    taskMetrics,
    todayActivity,
    topWonDeals,
    topNewDeals,
    topOpenDeals,
    topLostDeals,
    topPayedDeals,
    topWonEntities,
    topLostEntities,
    dealsByStage,
    topDealsLoading,
    topDealsError,
    topEntitiesLoading,
    topEntitiesError,
    dealsByStageLoading,
    dealsByStageError,
  } = useCrmStore();

  useEffect(() => {
    fetchData(timeRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const handleRefresh = async () => {
    try {
      // Trigger a fresh data load, all data fetching is now handled by the store
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

  const shouldShowMetricCards = !loading && metrics;

  if (loading || !metrics) {
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
                    className={`w-4 h-4 ${
                      loading ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <motion.div
            variants={itemVariants}
            initial='hidden'
            animate='visible'
            className='mb-8'>
            <ActivityFeedSkeleton />
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-6 mb-8'>
            {skeletonCardConfigs.map((cfg, idx) => (
              <div
                key={cfg.key}
                className={cfg.span}>
                <MetricCardSkeleton />
              </div>
            ))}
          </motion.div>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </main>
      </div>
    );
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
          value: metrics.current.newDeals,
          prev: metrics.previous.newDeals,
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
          value: metrics.allOpenDealsSum ?? 0,
          prev: undefined,
          icon: LineChartIcon,
          key: 'activeDeals',
          format: 'currency',
          subLabel: [
            `Count: ${metrics.allOpenDealsCount ?? 0}`,
            `Avg: $${(metrics.allOpenDealsAverage ?? 0).toLocaleString(
              undefined,
              { maximumFractionDigits: 0 }
            )}`,
          ],
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
          value: metrics.current.valueCloseRate,
          prev: metrics.previous.valueCloseRate,
          icon: Target,
          key: 'conversionRate',
          format: 'percentage',
          subLabel: [
            `Value: ${metrics.current.valueCloseRate.toFixed(2)}%`,
            `Count: ${metrics.current.conversionRate.toFixed(2)}%`,
          ],
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
          variants={itemVariants}
          initial='hidden'
          animate='visible'
          className='mb-8'>
          <TodayActivityCard
            data={todayActivity}
            loading={loading}
            error={error}
          />
        </motion.div>
        <motion.div
          variants={itemVariants}
          initial='hidden'
          animate='visible'
          className='mb-8'>
          <DealsByStageCard
            stages={dealsByStage}
            loading={dealsByStageLoading}
            error={dealsByStageError}
          />
        </motion.div>
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-6 mb-8'>
          {shouldShowMetricCards
            ? metricCards.map((metric) => {
                return (
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
                    {metric.key === 'totalTasks' && loading ? (
                      <MetricCardSkeleton />
                    ) : (
                      <MetricCard
                        title={metric.title}
                        value={metric.value}
                        icon={metric.icon}
                        change={
                          timeRange === 30 || timeRange === 90
                            ? metric.prev !== null &&
                              metric.prev !== undefined
                              ? getChange(metric.value, metric.prev)
                              : undefined
                            : undefined
                        }
                        format={metric.format}
                        subLabel={metric.subLabel}
                        color={metric.color}
                      />
                    )}
                  </motion.div>
                );
              })
            : null}
        </motion.div>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
          <motion.div
            variants={itemVariants}
            initial='hidden'
            animate='visible'>
            {timeRange === 0 ? (
              <div className='h-full flex items-center justify-center p-6 bg-white border border-gray-200 rounded-lg text-center text-gray-700'>
                <div>
                  <p className='font-semibold'>
                    Trend data is not available for the &quot;All
                    Time&quot; view.
                  </p>
                  <p className='text-sm text-gray-500'>
                    Please select a 30 or 90-day range to see trends.
                  </p>
                </div>
              </div>
            ) : loading || !trends || trends.length === 0 ? (
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
                    Trend data is not available for the &quot;All
                    Time&quot; view.
                  </p>
                  <p className='text-sm text-gray-500'>
                    Please select a 30 or 90-day range to see trends.
                  </p>
                </div>
              </div>
            ) : loading || !trends || trends.length === 0 ? (
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
        <motion.div
          variants={itemVariants}
          initial='hidden'
          animate='visible'
          className='mb-8 w-full'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 w-full'>
            <TopDealsCard
              title='Top 10 Won Deals'
              deals={topWonDeals}
            />
            <TopDealsCard
              title='Top 10 New Deals'
              deals={topNewDeals}
            />
          </div>
          {topDealsLoading && (
            <div className='text-center text-gray-500 mt-2'>
              Loading top deals...
            </div>
          )}
          {topDealsError && (
            <div className='text-center text-red-500 mt-2'>
              {topDealsError}
            </div>
          )}
        </motion.div>
        <motion.div
          variants={itemVariants}
          initial='hidden'
          animate='visible'
          className='mb-8 w-full'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full'>
            <TopDealsCard
              title='Top 10 Open Deals'
              deals={topOpenDeals}
            />
            <TopDealsCard
              title='Top 10 Payed Deals'
              deals={topPayedDeals}
            />
            <TopDealsCard
              title='Top 10 Lost Deals'
              deals={topLostDeals}
            />
          </div>
          {topDealsLoading && (
            <div className='text-center text-gray-500 mt-2'>
              Loading open/lost/payed deals...
            </div>
          )}
          {topDealsError && (
            <div className='text-center text-red-500 mt-2'>
              {topDealsError}
            </div>
          )}
        </motion.div>
        <motion.div
          variants={itemVariants}
          initial='hidden'
          animate='visible'
          className='mb-8 w-full'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 w-full'>
            <TopDealsCard
              title='Top 10 Won Companies/Contacts'
              deals={topWonEntities.map((e) => ({
                company: e.label,
                contacts: [],
                name: '',
                amount: e.sum,
              }))}
            />
            <TopDealsCard
              title='Top 10 Lost Companies/Contacts'
              deals={topLostEntities.map((e) => ({
                company: e.label,
                contacts: [],
                name: '',
                amount: e.sum,
              }))}
            />
          </div>
          {topEntitiesLoading && (
            <div className='text-center text-gray-500 mt-2'>
              Loading top companies/contacts...
            </div>
          )}
          {topEntitiesError && (
            <div className='text-center text-red-500 mt-2'>
              {topEntitiesError}
            </div>
          )}
        </motion.div>
        <div className='my-8'>
          <SalesForecastCard />
        </div>
      </main>
    </div>
  );
}
