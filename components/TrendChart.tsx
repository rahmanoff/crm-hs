import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format } from 'date-fns';
import { TrendData } from '@/lib/hubspot';

interface TrendChartProps {
  data: TrendData[];
  title: string;
  type?: 'line' | 'area';
  dataKeys?: string[];
  colors?: string[];
}

export default function TrendChart({
  data,
  title,
  type = 'line',
  dataKeys = ['contacts', 'companies', 'deals'],
  colors = ['#3b82f6', '#10b981', '#f59e0b'],
}: TrendChartProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd');
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-white p-3 border border-gray-200 rounded-lg shadow-lg'>
          <p className='font-medium text-gray-900'>
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              style={{ color: entry.color }}
              className='text-sm'>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render charts explicitly per type to keep TypeScript happy (avoid casting)
  const renderChart = () => {
    const commonChildren = (
      <>
        <CartesianGrid
          strokeDasharray='4 4'
          stroke='#d1d5db'
        />
        <XAxis
          dataKey='date'
          tickFormatter={formatDate}
          stroke='#6b7280'
          fontSize={12}
        />
        <YAxis
          stroke='#6b7280'
          fontSize={12}
        />
        <Tooltip content={<CustomTooltip />} />
        {dataKeys.map((key, index) =>
          // For each key, render Area or Line depending on chart type
          type === 'area' ? (
            <Area
              key={key}
              type='monotone'
              dataKey={key}
              stroke={colors[index]}
              fill={colors[index]}
              fillOpacity={0.1}
              strokeWidth={2}
              dot={{ fill: colors[index], strokeWidth: 2, r: 4 }}
              activeDot={{
                r: 6,
                stroke: colors[index],
                strokeWidth: 2,
              }}
            />
          ) : (
            <Line
              key={key}
              type='monotone'
              dataKey={key}
              stroke={colors[index]}
              strokeWidth={2}
              dot={{ fill: colors[index], strokeWidth: 2, r: 4 }}
              activeDot={{
                r: 6,
                stroke: colors[index],
                strokeWidth: 2,
              }}
            />
          )
        )}
      </>
    );

    if (type === 'area') {
      return <AreaChart data={data}>{commonChildren}</AreaChart>;
    }
    return <LineChart data={data}>{commonChildren}</LineChart>;
  };

  return (
    <div className='card'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
        {title}
      </h3>
      <div className='h-64'>
        <ResponsiveContainer
          width='100%'
          height='100%'>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
