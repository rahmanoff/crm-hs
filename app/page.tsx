'use client';

import React, { useState, useEffect } from 'react';
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
  Settings
} from 'lucide-react';

import MetricCard from '@/components/MetricCard';
import TrendChart from '@/components/TrendChart';
import ActivityFeed from '@/components/ActivityFeed';

interface DashboardMetrics {
  totalContacts: number;
  totalCompanies: number;
  totalDeals: number;
  totalTasks: number;
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalRevenue: number;
  averageDealSize: number;
  conversionRate: number;
  tasksCompleted: number;
  tasksOverdue: number;
}

interface TrendData {
  date: string;
  contacts: number;
  companies: number;
  deals: number;
  revenue: number;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      console.log('Fetching data from API routes...');
      
      const [metricsResponse, trendsResponse, activitiesResponse] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/trends?days=30'),
        fetch('/api/activity?limit=10'),
      ]);

      console.log('API responses:', {
        metrics: metricsResponse.status,
        trends: trendsResponse.status,
        activities: activitiesResponse.status
      });

      if (!metricsResponse.ok || !trendsResponse.ok || !activitiesResponse.ok) {
        throw new Error('Failed to fetch data from API routes');
      }

      const [metricsData, trendDataResult, activitiesData] = await Promise.all([
        metricsResponse.json(),
        trendsResponse.json(),
        activitiesResponse.json(),
      ]);

      console.log('API data received:', {
        metrics: metricsData,
        trends: trendDataResult.length,
        activities: activitiesData.length
      });

      setMetrics(metricsData);
      setTrendData(trendDataResult);
      setActivities(activitiesData);
      
      if (!loading) {
        toast.success('Data refreshed successfully!');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data. Please check your HubSpot API key and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">HubSpot CRM Dashboard</h1>
              <p className="text-gray-600">Monitor your business metrics and trends</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button className="btn-secondary flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <MetricCard
            title="Total Contacts"
            value={metrics?.totalContacts || 0}
            icon={Users}
            color="primary"
            format="number"
          />
          <MetricCard
            title="Total Companies"
            value={metrics?.totalCompanies || 0}
            icon={Building2}
            color="success"
            format="number"
          />
          <MetricCard
            title="Active Deals"
            value={metrics?.activeDeals || 0}
            icon={DollarSign}
            color="warning"
            format="number"
          />
          <MetricCard
            title="Total Tasks"
            value={metrics?.totalTasks || 0}
            icon={CheckSquare}
            color="primary"
            format="number"
          />
        </motion.div>

        {/* Revenue and Conversion Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <MetricCard
            title="Total Revenue"
            value={metrics?.totalRevenue || 0}
            icon={TrendingUp}
            color="success"
            format="currency"
          />
          <MetricCard
            title="Average Deal Size"
            value={metrics?.averageDealSize || 0}
            icon={DollarSign}
            color="primary"
            format="currency"
          />
          <MetricCard
            title="Conversion Rate"
            value={metrics?.conversionRate || 0}
            icon={TrendingUp}
            color="success"
            format="percentage"
          />
        </motion.div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trend Charts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <TrendChart
              data={trendData}
              title="Business Growth Trends (Last 30 Days)"
              type="area"
              dataKeys={['contacts', 'companies', 'deals']}
              colors={['#3b82f6', '#10b981', '#f59e0b']}
            />
            <TrendChart
              data={trendData}
              title="Revenue Trends"
              type="line"
              dataKeys={['revenue']}
              colors={['#8b5cf6']}
            />
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ActivityFeed activities={activities} />
          </motion.div>
        </div>

        {/* Alerts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-warning-600" />
              <h3 className="text-lg font-semibold text-gray-900">Alerts & Notifications</h3>
            </div>
            <div className="space-y-3">
              {metrics?.tasksOverdue && metrics.tasksOverdue > 0 && (
                <div className="flex items-center p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-warning-600 mr-3" />
                  <span className="text-sm text-warning-800">
                    {metrics.tasksOverdue} overdue tasks require attention
                  </span>
                </div>
              )}
              {metrics?.conversionRate && metrics.conversionRate < 20 && (
                <div className="flex items-center p-3 bg-danger-50 border border-danger-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-danger-600 mr-3" />
                  <span className="text-sm text-danger-800">
                    Low conversion rate ({metrics.conversionRate.toFixed(1)}%) - consider reviewing sales process
                  </span>
                </div>
              )}
              {(!metrics?.tasksOverdue || metrics.tasksOverdue === 0) && 
               (!metrics?.conversionRate || metrics.conversionRate >= 20) && (
                <div className="flex items-center p-3 bg-success-50 border border-success-200 rounded-lg">
                  <CheckSquare className="w-4 h-4 text-success-600 mr-3" />
                  <span className="text-sm text-success-800">
                    All systems running smoothly!
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
} 