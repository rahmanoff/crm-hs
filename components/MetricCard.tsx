import React from 'react';
import {
  LucideIcon,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  format?: 'number' | 'currency' | 'percentage' | 'text';
  subLabel?: string;
}

export default function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = 'primary',
  format = 'text',
  subLabel,
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    switch (format) {
      case 'currency':
        return typeof val === 'number'
          ? `$${val.toLocaleString()}`
          : val;
      case 'percentage':
        return typeof val === 'number' ? `${val.toFixed(1)}%` : val;
      case 'number':
        return typeof val === 'number' ? val.toLocaleString() : val;
      default:
        return val;
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'text-success-600 bg-success-50';
      case 'warning':
        return 'text-warning-600 bg-warning-50';
      case 'danger':
        return 'text-danger-600 bg-danger-50';
      default:
        return 'text-primary-600 bg-primary-50';
    }
  };

  const getChangeColor = () => {
    if (change === undefined || change === 0) return 'text-gray-500';
    return change > 0 ? 'text-success-600' : 'text-danger-600';
  };

  const renderChange = () => {
    if (change === undefined) return null;
    if (change === 0) return null;
    const Arrow = change > 0 ? ArrowUpRight : ArrowDownRight;
    return (
      <span
        className={`flex items-center text-sm font-medium ${getChangeColor()}`}>
        <Arrow className='w-4 h-4 mr-1' />
        {change > 0 ? '+' : ''}
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className='card h-full'>
      <div className='flex flex-col justify-between h-full'>
        <div>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-sm font-medium text-gray-600'>{title}</p>
            <div
              className={`p-2 rounded-lg ${getColorClasses()}`}
              data-testid='metric-icon'>
              <Icon className='w-5 h-5' />
            </div>
          </div>
          <p className='text-3xl font-bold text-gray-900'>
            {formatValue(value)}
          </p>
          {subLabel && (
            <p className='text-3xl font-bold text-gray-700 mt-1'>
              {subLabel}
            </p>
          )}
        </div>
        {change !== undefined && (
          <div className='flex items-center mt-4'>
            {renderChange()}
            {changeLabel && (
              <span className='text-sm text-gray-500 ml-1.5'>
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
