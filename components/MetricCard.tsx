import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  format?: 'number' | 'currency' | 'percentage' | 'text';
}

export default function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = 'primary',
  format = 'text',
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
    if (!change) return 'text-gray-500';
    return change > 0 ? 'text-success-600' : 'text-danger-600';
  };

  return (
    <div className='metric-card'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-gray-600'>{title}</p>
          <p className='text-2xl font-bold text-gray-900 mt-1'>
            {formatValue(value)}
          </p>
          {change !== undefined && (
            <div className='flex items-center mt-2'>
              <span
                className={`text-sm font-medium ${getChangeColor()}`}>
                {change > 0 ? '+' : ''}
                {change}%
              </span>
              {changeLabel && (
                <span className='text-sm text-gray-500 ml-1'>
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-lg ${getColorClasses()}`}
          data-testid='metric-icon'>
          <Icon className='w-6 h-6' />
        </div>
      </div>
    </div>
  );
}
