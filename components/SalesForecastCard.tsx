import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from 'recharts';
import { DollarSign } from 'lucide-react';

interface ForecastData {
  month: string;
  total: number;
}

const fetchForecast = async (): Promise<ForecastData[]> => {
  const res = await fetch('/api/deals/forecast');
  if (!res.ok) throw new Error('Failed to fetch forecast');
  return res.json();
};

// Helper to format YYYY-MM to 'Month YYYY'
function formatMonthYear(ym: string) {
  const [year, month] = ym.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
}

// Custom tick for XAxis to show month and sum below
const ForecastTick = (props: any) => {
  const { x, y, payload, data } = props;
  // Find the sum for this month
  const item = data.find((d: any) => d.month === payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor='middle'
        fill='#666'
        fontSize='15'>
        {formatMonthYear(payload.value)}
      </text>
      {item && (
        <text
          x={0}
          y={0}
          dy={42}
          textAnchor='middle'
          fill='#374151'
          fontSize='16'
          fontWeight='bold'
          fontFamily='monospace'>
          ${item.total.toLocaleString()}
        </text>
      )}
    </g>
  );
};

// Custom YAxis tick for smaller font
const SmallYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor='end'
      fill='#666'
      fontSize='11'>
      {payload.value.toLocaleString()}
    </text>
  );
};

export default function SalesForecastCard() {
  const [data, setData] = useState<ForecastData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForecast()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className='bg-white rounded-lg shadow p-6 w-full'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-semibold'>Sales Forecast</h2>
        <div className='p-2 rounded-lg text-primary-600 bg-primary-50'>
          <DollarSign className='w-5 h-5' />
        </div>
      </div>
      {loading && <div>Loading forecast...</div>}
      {error && <div className='text-red-500'>{error}</div>}
      {!loading && !error && data && data.length === 0 && (
        <div>No forecast data available.</div>
      )}
      {!loading && !error && data && data.length > 0 && (
        <ResponsiveContainer
          width='100%'
          minWidth={400}
          height={320}>
          <BarChart
            data={data}
            margin={{ top: 16, right: 24, left: 32, bottom: 40 }}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='month'
              tick={<ForecastTick data={data} />}
              interval={0}
            />
            <YAxis
              width={80}
              tick={<SmallYAxisTick />}
            />
            <Tooltip
              formatter={(value: number) =>
                `$${value.toLocaleString()}`
              }
              labelFormatter={(label: string) => formatMonthYear(label)}
            />
            <Bar
              dataKey='total'
              fill='#2563eb'
              name='Forecast'
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
